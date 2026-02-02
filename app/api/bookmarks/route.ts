import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { extractDomain, generateFaviconUrl } from '@/lib/utils'
import { getAuthenticatedUser, createUnauthorizedResponse } from '@/lib/auth-helpers'

const createBookmarkSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  tags: z.array(z.string()).optional().default([]),
})

// GET /api/bookmarks - List bookmarks with filters
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const userId = user.id

    const where: any = { userId }

    if (status) {
      where.status = status.toUpperCase()
    }

    if (priority) {
      where.priority = priority.toUpperCase()
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: { equals: tag, mode: 'insensitive' }
          }
        }
      }
    }

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // TODO items first
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
      }),
      prisma.bookmark.count({ where })
    ])

    return NextResponse.json({
      bookmarks: bookmarks.map(bookmark => ({
        ...bookmark,
        tags: bookmark.tags.map(bt => bt.tag)
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}

// POST /api/bookmarks - Create new bookmark
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const { url, title, description, priority, tags } = createBookmarkSchema.parse(body)

    const userId = user.id

    // Extract metadata from URL
    const domain = extractDomain(url)
    const faviconUrl = generateFaviconUrl(domain)

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        url,
        title,
        description,
        faviconUrl,
        priority: priority as any,
        status: 'TODO', // All new bookmarks start as TODO
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    // Handle tags if provided
    if (tags && tags.length > 0) {
      // Create or find tags
      const tagPromises = tags.map(async (tagName) => {
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

      const createdTags = await Promise.all(tagPromises)

      // Link tags to bookmark
      await Promise.all(
        createdTags.map(tag => 
          prisma.bookmarkTag.create({
            data: {
              bookmarkId: bookmark.id,
              tagId: tag.id
            }
          })
        )
      )

      // Fetch updated bookmark with tags
      const updatedBookmark = await prisma.bookmark.findUnique({
        where: { id: bookmark.id },
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
    }

    return NextResponse.json({
      ...bookmark,
      tags: []
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
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