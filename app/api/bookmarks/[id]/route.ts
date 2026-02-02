import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser, createUnauthorizedResponse } from '@/lib/auth-helpers'

const updateBookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long').optional(),
  description: z.string().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['TODO', 'REVIEWED', 'ARCHIVED', 'DISCARDED']).optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/bookmarks/[id] - Get single bookmark
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { 
        id: params.id,
        userId: user.id // Ensure user owns this bookmark
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...bookmark,
      tags: bookmark.tags.map(bt => bt.tag)
    })
  } catch (error) {
    console.error('Error fetching bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmark' },
      { status: 500 }
    )
  }
}

// PUT /api/bookmarks/[id] - Update bookmark
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const validatedData = updateBookmarkSchema.parse(body)

    // Check if bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!existingBookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }

    const userId = user.id

    // Update bookmark data
    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      // Set reviewedAt when status changes to REVIEWED, ARCHIVED, or DISCARDED
      if (['REVIEWED', 'ARCHIVED', 'DISCARDED'].includes(validatedData.status)) {
        updateData.reviewedAt = new Date()
      }
    }

    // Update the bookmark
    const bookmark = await prisma.bookmark.update({
      where: { id: params.id },
      data: updateData,
    })

    // Handle tags update if provided
    if (validatedData.tags !== undefined) {
      // Remove existing tag relationships
      await prisma.bookmarkTag.deleteMany({
        where: { bookmarkId: params.id }
      })

      if (validatedData.tags.length > 0) {
        // Create or find tags
        const tagPromises = validatedData.tags.map(async (tagName) => {
          return prisma.tag.upsert({
            where: {
              userId_name: {
                userId,
                name: tagName.toLowerCase()
              }
            },
            update: {},
            create: {
              userId,
              name: tagName.toLowerCase(),
              color: generateRandomColor()
            }
          })
        })

        const tags = await Promise.all(tagPromises)

        // Create new tag relationships
        await Promise.all(
          tags.map(tag => 
            prisma.bookmarkTag.create({
              data: {
                bookmarkId: params.id,
                tagId: tag.id
              }
            })
          )
        )
      }
    }

    // Fetch updated bookmark with tags
    const updatedBookmark = await prisma.bookmark.findUnique({
      where: { id: params.id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json({
      ...updatedBookmark,
      tags: updatedBookmark?.tags.map(bt => bt.tag) || []
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    )
  }
}

// DELETE /api/bookmarks/[id] - Delete bookmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    // Check if bookmark exists and belongs to user
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!existingBookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }

    // Delete bookmark (cascade will handle tag relationships)
    await prisma.bookmark.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    )
  }
}

function generateRandomColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}