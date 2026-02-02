import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser, createUnauthorizedResponse } from '@/lib/auth-helpers'

const extractBookmarkSchema = z.object({
  url: z.string().url('Invalid URL'),
  source: z.enum(['whatsapp', 'telegram', 'manual']).default('manual'),
  userMessage: z.string().optional()
})

// POST /api/ai/extract-bookmark - AI-powered bookmark extraction
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    const { url, source, userMessage } = extractBookmarkSchema.parse(body)

    // Extract metadata from URL
    const metadata = await extractUrlMetadata(url)
    
    // Generate AI-enhanced bookmark data
    const aiEnhanced = await enhanceBookmarkWithAI(metadata, userMessage)

    // Create the bookmark automatically
    const bookmarkResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Forward the authorization header
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        url: metadata.url,
        title: aiEnhanced.title,
        description: aiEnhanced.description,
        priority: aiEnhanced.priority,
        tags: aiEnhanced.tags
      })
    })

    if (!bookmarkResponse.ok) {
      throw new Error('Failed to create bookmark')
    }

    const bookmark = await bookmarkResponse.json()

    return NextResponse.json({
      success: true,
      bookmark,
      aiInsights: {
        extractedMetadata: metadata,
        aiEnhancements: aiEnhanced,
        source,
        processingTime: Date.now()
      },
      message: `✅ Bookmark created: "${aiEnhanced.title}"\n🏷️ Tags: ${aiEnhanced.tags.join(', ')}\n📝 Added to your todo list for review`
    })

  } catch (error) {
    console.error('Error in AI bookmark extraction:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid URL format', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process bookmark', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function extractUrlMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0; +https://bookmark-manager.vercel.app)'
      },
      timeout: 10000
    })

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
    // Simple AI enhancement based on patterns and domain analysis
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
      tags,
      aiReasoning: {
        domainAnalysis: analyzeDomain(domain),
        contentType: determineContentType(content, domain),
        userContext: userMessage ? analyzeUserMessage(userMessage) : null
      }
    }
  } catch (error) {
    console.error('AI enhancement error:', error)
    
    // Fallback to basic enhancement
    return {
      title: metadata.title || metadata.domain,
      description: metadata.description || 'Added via AI bookmark assistant',
      priority: 'MEDIUM' as const,
      tags: [metadata.domain.split('.')[0]],
      aiReasoning: null
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
  return [...new Set(tags)].slice(0, 6) // Limit to 6 tags
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
  
  return `Bookmark saved from ${domain || 'web'} via AI assistant`
}

function analyzeDomain(domain: string) {
  const categories = {
    social: ['twitter.com', 'reddit.com', 'linkedin.com', 'facebook.com'],
    development: ['github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com'],
    documentation: ['docs.', 'documentation', 'wiki'],
    media: ['youtube.com', 'vimeo.com', 'twitch.tv'],
    news: ['news.', 'techcrunch.com', 'ycombinator.com', 'theverge.com'],
    blog: ['medium.com', 'dev.to', 'blog.', 'substack.com']
  }
  
  for (const [category, domains] of Object.entries(categories)) {
    if (domains.some(d => domain.includes(d))) {
      return category
    }
  }
  
  return 'general'
}

function determineContentType(content: string, domain: string) {
  if (content.includes('tutorial') || content.includes('guide') || content.includes('how to')) {
    return 'tutorial'
  }
  if (content.includes('news') || content.includes('update') || content.includes('release')) {
    return 'news'
  }
  if (content.includes('documentation') || content.includes('docs') || content.includes('reference')) {
    return 'documentation'
  }
  if (domain.includes('github.com')) {
    return 'code'
  }
  
  return 'article'
}

function analyzeUserMessage(message: string) {
  const sentiment = message.toLowerCase()
  
  return {
    urgency: sentiment.includes('urgent') || sentiment.includes('asap') ? 'high' : 'normal',
    category: sentiment.includes('work') ? 'work' : sentiment.includes('personal') ? 'personal' : 'general',
    action: sentiment.includes('read later') ? 'read-later' : sentiment.includes('review') ? 'review' : 'save'
  }
}