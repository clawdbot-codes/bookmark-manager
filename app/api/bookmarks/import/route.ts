import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthenticatedUser, createUnauthorizedResponse } from '@/lib/auth-helpers'
import { extractDomain, generateFaviconUrl } from '@/lib/utils'

const importBookmarksSchema = z.object({
  bookmarks: z.array(z.object({
    url: z.string().url('Invalid URL'),
    title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    folder: z.string().optional(),
  })).min(1, 'At least one bookmark is required').max(1000, 'Too many bookmarks (max 1000)')
})

// POST /api/bookmarks/import - Bulk import bookmarks
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const { bookmarks } = importBookmarksSchema.parse(body)

    const userId = user.id
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
      details: [] as { url: string; status: 'imported' | 'skipped' | 'error'; reason?: string }[]
    }

    // Process bookmarks in batches to avoid overwhelming the database
    const batchSize = 50
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize)
      
      for (const bookmarkData of batch) {
        try {
          // Check if bookmark with this URL already exists for the user
          const existingBookmark = await prisma.bookmark.findFirst({
            where: {
              userId,
              url: bookmarkData.url
            }
          })

          if (existingBookmark) {
            results.skipped++
            results.details.push({
              url: bookmarkData.url,
              status: 'skipped',
              reason: 'URL already exists'
            })
            continue
          }

          // Extract metadata from URL
          const domain = extractDomain(bookmarkData.url)
          const faviconUrl = generateFaviconUrl(domain)

          // Process tags (create folder tag if folder is specified)
          const allTags = [...bookmarkData.tags]
          if (bookmarkData.folder && !allTags.includes(bookmarkData.folder.toLowerCase())) {
            allTags.push(bookmarkData.folder.toLowerCase())
          }

          // Create bookmark
          const bookmark = await prisma.bookmark.create({
            data: {
              userId,
              url: bookmarkData.url,
              title: bookmarkData.title,
              description: bookmarkData.description,
              faviconUrl,
              priority: 'MEDIUM', // Default priority for imported bookmarks
              status: 'TODO', // All imported bookmarks start as TODO
            }
          })

          // Handle tags if provided
          if (allTags.length > 0) {
            const uniqueTags = Array.from(new Set(allTags.map(tag => tag.toLowerCase())))
            
            // Create or find tags
            const tagPromises = uniqueTags.map(async (tagName) => {
              return prisma.tag.upsert({
                where: {
                  userId_name: {
                    userId,
                    name: tagName
                  }
                },
                update: {},
                create: {
                  userId,
                  name: tagName,
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
          }

          results.imported++
          results.details.push({
            url: bookmarkData.url,
            status: 'imported'
          })

        } catch (error) {
          console.error(`Error importing bookmark ${bookmarkData.url}:`, error)
          results.errors.push(`${bookmarkData.title}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          results.details.push({
            url: bookmarkData.url,
            status: 'error',
            reason: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: `Imported ${results.imported} bookmark(s), skipped ${results.skipped}, ${results.errors.length} error(s)`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors,
          summary: 'Invalid bookmark data format'
        },
        { status: 400 }
      )
    }

    console.error('Error in bulk import:', error)
    return NextResponse.json(
      { 
        error: 'Failed to import bookmarks',
        summary: 'Internal server error during import'
      },
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