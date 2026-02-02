import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateApiKey, createApiUnauthorizedResponse } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

const clawdbotBookmarkSchema = z.object({
  url: z.string().url('Invalid URL'),
  userMessage: z.string().optional()
})

// POST /api/clawdbot/bookmark - Create bookmark via Clawdbot with API key auth
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return createApiUnauthorizedResponse()
    }

    const body = await request.json()
    const { url, userMessage } = clawdbotBookmarkSchema.parse(body)

    // Get the default user ID for Clawdbot bookmarks
    const defaultUserId = process.env.DEFAULT_USER_ID || 'default-user'
    
    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { id: defaultUserId }
    })
    
    if (!user) {
      // Create default user for Clawdbot bookmarks
      user = await prisma.user.create({
        data: {
          id: defaultUserId,
          email: 'clawdbot@bookmark.local',
          name: 'Clawdbot User'
        }
      })
    }

    // Extract metadata from URL
    const metadata = await extractUrlMetadata(url)
    
    // Generate AI-enhanced bookmark data
    const aiEnhanced = await enhanceBookmarkWithAI(metadata, userMessage)

    // Create tags first
    const tags = await Promise.all(
      aiEnhanced.tags.map(async (tagName: string) => {
        // Try to find existing tag
        let tag = await prisma.tag.findUnique({
          where: {
            userId_name: {
              userId: user.id,
              name: tagName.toLowerCase()
            }
          }
        })

        // Create tag if it doesn't exist
        if (!tag) {
          const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
          tag = await prisma.tag.create({
            data: {
              userId: user.id,
              name: tagName.toLowerCase(),
              color: colors[Math.floor(Math.random() * colors.length)]
            }
          })
        }

        return tag
      })
    )

    // Create the bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        url: metadata.url,
        title: aiEnhanced.title,
        description: aiEnhanced.description,
        priority: aiEnhanced.priority,
        status: 'TODO', // New bookmarks go to TODO list
        faviconUrl: metadata.image || null,
        tags: {
          create: tags.map(tag => ({
            tagId: tag.id
          }))
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    // Format response for WhatsApp
    const response = {
      success: true,
      bookmark: {
        id: bookmark.id,
        title: bookmark.title,
        description: bookmark.description,
        url: bookmark.url,
        priority: bookmark.priority,
        tags: bookmark.tags.map(bt => bt.tag.name)
      },
      whatsappMessage: generateWhatsAppMessage(bookmark, aiEnhanced)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Clawdbot bookmark creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid URL format', 
          whatsappMessage: `❌ Error: Invalid URL format\n\nPlease send a valid web link starting with https://`
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create bookmark',
        whatsappMessage: `❌ Failed to create bookmark\n\n${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}

async function extractUrlMetadata(url: string) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0; +https://bookmark-manager.vercel.app)'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    
    // Extract basic metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descMatch = html.match(/<meta[^>]*name=['"](description|og:description)[^>]*content=['"]([^'"]*)['"]/i)
    const imageMatch = html.match(/<meta[^>]*property=['"]og:image['"][^>]*content=['"]([^'"]*)['"]/i)
    
    const domain = new URL(url).hostname.replace('www.', '')
    
    return {
      url,
      title: titleMatch?.[1]?.trim() || domain,
      description: descMatch?.[2]?.trim() || '',
      image: imageMatch?.[1] || '',
      domain,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error extracting metadata:', error)
    
    // Fallback metadata
    const domain = new URL(url).hostname.replace('www.', '')
    return {
      url,
      title: domain,
      description: '',
      image: '',
      domain,
      timestamp: new Date().toISOString()
    }
  }
}

async function enhanceBookmarkWithAI(metadata: any, userMessage?: string) {
  try {
    const domain = metadata.domain.toLowerCase()
    const title = metadata.title.toLowerCase()
    const description = metadata.description.toLowerCase()
    const content = `${title} ${description}`.toLowerCase()
    
    // Smart tagging based on domain and content
    const tags = generateSmartTags(domain, content, userMessage)
    
    // Smart priority based on content type
    const priority = determinePriority(domain, content, userMessage)
    
    // Enhanced title (clean up and improve)
    const enhancedTitle = enhanceTitle(metadata.title, domain)
    
    // Enhanced description
    const enhancedDescription = enhanceDescription(metadata.description, userMessage, domain)

    return {
      title: enhancedTitle,
      description: enhancedDescription,
      priority,
      tags
    }
  } catch (error) {
    console.error('AI enhancement error:', error)
    
    // Fallback to basic enhancement
    return {
      title: metadata.title || metadata.domain,
      description: metadata.description || 'Added via Clawdbot',
      priority: 'MEDIUM' as const,
      tags: [metadata.domain.split('.')[0]]
    }
  }
}

function generateSmartTags(domain: string, content: string, userMessage?: string): string[] {
  const tags: string[] = []
  
  // Domain-based tags
  const domainTags: { [key: string]: string[] } = {
    'github.com': ['code', 'development', 'opensource'],
    'stackoverflow.com': ['programming', 'question', 'help'],
    'medium.com': ['article', 'blog', 'reading'],
    'dev.to': ['development', 'blog', 'community'],
    'youtube.com': ['video', 'tutorial', 'media'],
    'twitter.com': ['social', 'tweet', 'news'],
    'reddit.com': ['discussion', 'community', 'social'],
    'docs.google.com': ['document', 'collaboration'],
    'notion.so': ['productivity', 'notes'],
    'figma.com': ['design', 'ui', 'collaboration'],
    'vercel.com': ['deployment', 'hosting', 'frontend'],
    'netlify.com': ['deployment', 'hosting', 'jamstack']
  }
  
  // Add domain-specific tags
  for (const [domainPattern, domainTagList] of Object.entries(domainTags)) {
    if (domain.includes(domainPattern.replace('.com', ''))) {
      tags.push(...domainTagList)
      break
    }
  }
  
  // Content-based tags
  const contentTags: { [key: string]: string[] } = {
    'react': ['react', 'frontend', 'javascript'],
    'vue': ['vue', 'frontend', 'javascript'],
    'angular': ['angular', 'frontend', 'typescript'],
    'node': ['nodejs', 'backend', 'javascript'],
    'python': ['python', 'programming'],
    'javascript': ['javascript', 'programming'],
    'typescript': ['typescript', 'programming'],
    'css': ['css', 'styling', 'frontend'],
    'html': ['html', 'frontend', 'markup'],
    'api': ['api', 'backend', 'integration'],
    'database': ['database', 'data', 'backend'],
    'tutorial': ['tutorial', 'learning'],
    'guide': ['guide', 'documentation'],
    'documentation': ['docs', 'reference'],
    'news': ['news', 'updates'],
    'tool': ['tools', 'productivity'],
    'design': ['design', 'ui', 'ux']
  }
  
  // Add content-based tags
  for (const [keyword, keywordTags] of Object.entries(contentTags)) {
    if (content.includes(keyword)) {
      tags.push(...keywordTags)
    }
  }
  
  // User message analysis
  if (userMessage) {
    const messageLower = userMessage.toLowerCase()
    
    if (messageLower.includes('important') || messageLower.includes('urgent')) {
      tags.push('important')
    }
    if (messageLower.includes('read later') || messageLower.includes('todo')) {
      tags.push('read-later')
    }
    if (messageLower.includes('work') || messageLower.includes('project')) {
      tags.push('work')
    }
    if (messageLower.includes('personal')) {
      tags.push('personal')
    }
  }
  
  // Add base domain tag
  const baseDomain = domain.split('.')[0]
  if (baseDomain && baseDomain !== 'www') {
    tags.push(baseDomain)
  }
  
  // Remove duplicates and return
  return Array.from(new Set(tags)).slice(0, 6) // Limit to 6 tags
}

function determinePriority(domain: string, content: string, userMessage?: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  // High priority domains
  const highPriorityDomains = ['docs.', 'documentation', 'github.com', 'stackoverflow.com']
  const mediumPriorityDomains = ['medium.com', 'dev.to', 'blog.']
  
  // Check user message for priority hints
  if (userMessage) {
    const messageLower = userMessage.toLowerCase()
    if (messageLower.includes('urgent') || messageLower.includes('important') || messageLower.includes('asap')) {
      return 'HIGH'
    }
    if (messageLower.includes('later') || messageLower.includes('someday')) {
      return 'LOW'
    }
  }
  
  // Domain-based priority
  if (highPriorityDomains.some(d => domain.includes(d))) {
    return 'HIGH'
  }
  if (mediumPriorityDomains.some(d => domain.includes(d))) {
    return 'MEDIUM'
  }
  
  // Content-based priority
  if (content.includes('tutorial') || content.includes('guide') || content.includes('documentation')) {
    return 'HIGH'
  }
  
  return 'MEDIUM'
}

function enhanceTitle(originalTitle: string, domain: string): string {
  if (!originalTitle || originalTitle === domain) {
    return `Content from ${domain}`
  }
  
  // Clean up common title suffixes
  let enhanced = originalTitle
    .replace(/\s*\|\s*[^|]*$/, '') // Remove site name after pipe
    .replace(/\s*-\s*[^-]*$/, '')  // Remove site name after dash
    .replace(/\s*•\s*[^•]*$/, '')  // Remove site name after bullet
    .trim()
  
  // Capitalize properly
  if (enhanced.length > 0) {
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1)
  }
  
  return enhanced || originalTitle
}

function enhanceDescription(originalDesc: string, userMessage?: string, domain?: string): string {
  if (userMessage && userMessage.trim()) {
    return `${userMessage.trim()}${originalDesc ? `\n\n${originalDesc}` : ''}`
  }
  
  if (originalDesc) {
    return originalDesc
  }
  
  return `Bookmark saved from ${domain || 'web'} via Clawdbot WhatsApp`
}

function generateWhatsAppMessage(bookmark: any, aiEnhanced: any): string {
  let message = `✅ **Smart bookmark created!**\n\n`
  
  message += `📚 **${bookmark.title}**\n`
  
  if (bookmark.tags && bookmark.tags.length > 0) {
    message += `🏷️ ${bookmark.tags.map((tag: string) => `#${tag}`).join(' ')}\n`
  }
  
  if (bookmark.priority === 'HIGH') {
    message += `🔥 High Priority\n`
  } else if (bookmark.priority === 'LOW') {
    message += `📅 Low Priority\n`
  }
  
  if (bookmark.description && bookmark.description !== bookmark.title) {
    const desc = bookmark.description.length > 100 
      ? bookmark.description.substring(0, 100) + '...'
      : bookmark.description
    message += `📝 ${desc}\n`
  }
  
  message += `🔗 ${bookmark.url}\n\n`
  
  message += `📱 **Quick Links:**\n`
  message += `📚 View All: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/bookmarks\n`
  message += `📋 Todo List: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/todo\n\n`
  
  message += `💡 **Tip:** Add more context for smarter AI tagging!\n`
  message += `Example: "Bookmark: Important work docs" + [link]`
  
  return message
}