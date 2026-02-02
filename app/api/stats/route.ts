import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, createUnauthorizedResponse } from '@/lib/auth-helpers'

// GET /api/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const userId = user.id

    const [
      totalBookmarks,
      todoCount,
      reviewedCount,
      archivedCount,
      discardedCount,
      totalTags,
      recentBookmarks,
      topTags
    ] = await Promise.all([
      // Total bookmarks
      prisma.bookmark.count({
        where: { userId }
      }),

      // TODO count  
      prisma.bookmark.count({
        where: { 
          userId,
          status: 'TODO'
        }
      }),

      // Reviewed count
      prisma.bookmark.count({
        where: { 
          userId,
          status: 'REVIEWED'
        }
      }),

      // Archived count
      prisma.bookmark.count({
        where: { 
          userId,
          status: 'ARCHIVED'
        }
      }),

      // Discarded count
      prisma.bookmark.count({
        where: { 
          userId,
          status: 'DISCARDED'
        }
      }),

      // Total tags
      prisma.tag.count({
        where: { userId }
      }),

      // Recent bookmarks (last 5)
      prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          url: true,
          status: true,
          createdAt: true,
          faviconUrl: true
        }
      }),

      // Top tags (most used)
      prisma.tag.findMany({
        where: { userId },
        include: {
          _count: {
            select: {
              bookmarks: true
            }
          }
        },
        orderBy: {
          bookmarks: {
            _count: 'desc'
          }
        },
        take: 5
      })
    ])

    // Calculate productivity metrics
    const processedCount = reviewedCount + archivedCount + discardedCount
    const productivityRate = totalBookmarks > 0 ? 
      Math.round((processedCount / totalBookmarks) * 100) : 0

    // Calculate priority breakdown
    const priorityStats = await prisma.bookmark.groupBy({
      by: ['priority'],
      where: { 
        userId,
        status: 'TODO'
      },
      _count: {
        priority: true
      }
    })

    const priorityBreakdown = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    }

    priorityStats.forEach(stat => {
      priorityBreakdown[stat.priority as keyof typeof priorityBreakdown] = stat._count.priority
    })

    return NextResponse.json({
      overview: {
        totalBookmarks,
        todoCount,
        reviewedCount,
        archivedCount,
        discardedCount,
        totalTags,
        processedCount,
        productivityRate
      },
      breakdown: {
        status: {
          TODO: todoCount,
          REVIEWED: reviewedCount,
          ARCHIVED: archivedCount,
          DISCARDED: discardedCount
        },
        priority: priorityBreakdown
      },
      recentBookmarks,
      topTags: topTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        count: tag._count.bookmarks
      }))
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}