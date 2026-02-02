import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser, createUnauthorizedResponse } from '@/lib/auth-helpers'

const updateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long').toLowerCase().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format').optional()
})

// GET /api/tags/[id] - Get single tag
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

    const tag = await prisma.tag.findUnique({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        _count: {
          select: {
            bookmarks: true
          }
        }
      }
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error fetching tag:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tag' },
      { status: 500 }
    )
  }
}

// PUT /api/tags/[id] - Update tag
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
    const validatedData = updateTagSchema.parse(body)

    // Check if tag exists and belongs to user
    const existingTag = await prisma.tag.findUnique({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingTag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with existing tag (if name is being changed)
    if (validatedData.name && validatedData.name !== existingTag.name) {
      const conflictingTag = await prisma.tag.findUnique({
        where: {
          userId_name: {
            userId: user.id,
            name: validatedData.name
          }
        }
      })

      if (conflictingTag) {
        return NextResponse.json(
          { error: 'A tag with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update tag
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.color !== undefined) updateData.color = validatedData.color

    const updatedTag = await prisma.tag.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            bookmarks: true
          }
        }
      }
    })

    return NextResponse.json(updatedTag)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating tag:', error)
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/[id] - Delete tag
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

    // Check if tag exists and belongs to user
    const existingTag = await prisma.tag.findUnique({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        _count: {
          select: {
            bookmarks: true
          }
        }
      }
    })

    if (!existingTag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Delete tag (cascade will handle bookmark relationships)
    await prisma.tag.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      success: true,
      deletedTag: existingTag.name,
      affectedBookmarks: existingTag._count.bookmarks
    })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}