import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser, createUnauthorizedResponse } from '@/lib/auth-helpers'

const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long').toLowerCase(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format').optional()
})

// GET /api/tags - List all tags for the user with bookmark counts
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: any = { userId: user.id }

    if (search) {
      where.name = {
        contains: search.toLowerCase()
      }
    }

    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: {
            bookmarks: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const { name, color } = createTagSchema.parse(body)

    // Check if tag already exists for this user
    const existingTag = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name
        }
      }
    })

    if (existingTag) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 400 }
      )
    }

    // Create tag
    const tag = await prisma.tag.create({
      data: {
        userId: user.id,
        name,
        color: color || generateRandomColor()
      },
      include: {
        _count: {
          select: {
            bookmarks: true
          }
        }
      }
    })

    return NextResponse.json(tag)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}

function generateRandomColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', 
    '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#84cc16',
    '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}