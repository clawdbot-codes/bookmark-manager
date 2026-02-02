import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser, createUnauthorizedResponse } from '@/lib/auth-helpers'

const bulkUpdateSchema = z.object({
  bookmarkIds: z.array(z.string()).min(1, 'At least one bookmark ID is required'),
  action: z.enum(['archive', 'discard', 'mark_reviewed', 'delete', 'add_tag', 'remove_tag', 'set_priority']),
  value: z.string().optional(), // For tag name or priority level
})

// POST /api/bookmarks/bulk - Bulk operations on bookmarks
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const { bookmarkIds, action, value } = bulkUpdateSchema.parse(body)

    const userId = user.id

    let result: any

    switch (action) {
      case 'archive':
        result = await prisma.bookmark.updateMany({
          where: {
            id: { in: bookmarkIds },
            userId
          },
          data: {
            status: 'ARCHIVED',
            reviewedAt: new Date()
          }
        })
        break

      case 'discard':
        result = await prisma.bookmark.updateMany({
          where: {
            id: { in: bookmarkIds },
            userId
          },
          data: {
            status: 'DISCARDED',
            reviewedAt: new Date()
          }
        })
        break

      case 'mark_reviewed':
        result = await prisma.bookmark.updateMany({
          where: {
            id: { in: bookmarkIds },
            userId
          },
          data: {
            status: 'REVIEWED',
            reviewedAt: new Date()
          }
        })
        break

      case 'delete':
        result = await prisma.bookmark.deleteMany({
          where: {
            id: { in: bookmarkIds },
            userId
          }
        })
        break

      case 'set_priority':
        if (!value || !['HIGH', 'MEDIUM', 'LOW'].includes(value.toUpperCase())) {
          return NextResponse.json(
            { error: 'Valid priority value required (HIGH, MEDIUM, LOW)' },
            { status: 400 }
          )
        }

        result = await prisma.bookmark.updateMany({
          where: {
            id: { in: bookmarkIds },
            userId
          },
          data: {
            priority: value.toUpperCase() as any
          }
        })
        break

      case 'add_tag':
        if (!value) {
          return NextResponse.json(
            { error: 'Tag name is required' },
            { status: 400 }
          )
        }

        // First ensure the tag exists
        const tag = await prisma.tag.upsert({
          where: {
            userId_name: {
              userId,
              name: value.toLowerCase()
            }
          },
          update: {},
          create: {
            userId,
            name: value.toLowerCase(),
            color: generateRandomColor()
          }
        })

        // Add tag to all specified bookmarks (ignore duplicates)
        const tagPromises = bookmarkIds.map(bookmarkId =>
          prisma.bookmarkTag.upsert({
            where: {
              bookmarkId_tagId: {
                bookmarkId,
                tagId: tag.id
              }
            },
            update: {},
            create: {
              bookmarkId,
              tagId: tag.id
            }
          }).catch(() => {
            // Ignore constraint errors for existing relationships
          })
        )

        await Promise.all(tagPromises)
        result = { count: bookmarkIds.length }
        break

      case 'remove_tag':
        if (!value) {
          return NextResponse.json(
            { error: 'Tag name is required' },
            { status: 400 }
          )
        }

        // Find the tag
        const tagToRemove = await prisma.tag.findUnique({
          where: {
            userId_name: {
              userId,
              name: value.toLowerCase()
            }
          }
        })

        if (tagToRemove) {
          result = await prisma.bookmarkTag.deleteMany({
            where: {
              bookmarkId: { in: bookmarkIds },
              tagId: tagToRemove.id
            }
          })
        } else {
          result = { count: 0 }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      affected: result.count || result.length || 0,
      action
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
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