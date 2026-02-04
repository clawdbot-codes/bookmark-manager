import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Initialize Prisma client
const prisma = new PrismaClient();

// API key for WhatsApp integration
const WHATSAPP_API_KEY = 'bookmark-clawdbot-api-key-2026-secure1757';

// Schema for bookmark request
const whatsappBookmarkSchema = z.object({
  url: z.string().url(),
  userMessage: z.string().optional(),
});

/**
 * Dedicated API endpoint for WhatsApp integration
 * This uses a hardcoded API key specifically for WhatsApp integration
 */
export async function POST(request: NextRequest) {
  // Check authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || authHeader !== WHATSAPP_API_KEY) {
    return NextResponse.json({ 
      error: 'Unauthorized', 
      message: 'Invalid or missing API key' 
    }, { status: 401 });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { url, userMessage } = whatsappBookmarkSchema.parse(body);

    // Get the default user ID for WhatsApp bookmarks
    const defaultUserId = process.env.DEFAULT_USER_ID || 'clawdbot-default-user';
    
    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { id: defaultUserId }
    });
    
    if (!user) {
      // Try to find any user if the specific one doesn't exist
      user = await prisma.user.findFirst();
      
      if (!user) {
        // Create default user for WhatsApp bookmarks
        user = await prisma.user.create({
          data: {
            id: defaultUserId,
            email: `whatsapp-${defaultUserId}@bookmark.local`,
            name: 'WhatsApp User'
          }
        });
      }
    }

    // Extract metadata from URL
    const metadata = await extractUrlMetadata(url);
    
    // Generate AI-enhanced bookmark data
    const aiEnhanced = await enhanceBookmarkWithAI(metadata, userMessage);

    // Create tags first
    const tags = await Promise.all(
      aiEnhanced.tags.map(async (tagName: string) => {
        // Find or create tag
        let tag = await prisma.tag.findFirst({
          where: {
            userId: user!.id,
            name: tagName.toLowerCase()
          }
        });
        
        // Create tag if it doesn't exist
        if (!tag) {
          const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
          tag = await prisma.tag.create({
            data: {
              userId: user!.id,
              name: tagName.toLowerCase(),
              color: colors[Math.floor(Math.random() * colors.length)]
            }
          });
        }
        
        return tag;
      })
    );

    // Create the bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user!.id,
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
    });
    
    // Format response for WhatsApp
    const formattedBookmark = {
      id: bookmark.id,
      title: bookmark.title,
      description: bookmark.description,
      url: bookmark.url,
      priority: bookmark.priority,
      tags: bookmark.tags.map(bt => bt.tag.name)
    };
    
    // Generate WhatsApp message
    const whatsappMessage = generateWhatsAppMessage(formattedBookmark, aiEnhanced);
    
    // Return success response
    return NextResponse.json({
      success: true,
      bookmark: formattedBookmark,
      whatsappMessage
    });
    
  } catch (error: any) {
    console.error('Error creating bookmark:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create bookmark',
      whatsappMessage: `❌ Failed to create bookmark\n\n${error.message}`
    }, { status: 500 });
  }
}

// Function to extract metadata from a URL
async function extractUrlMetadata(url: string) {
  try {
    // Default metadata
    let metadata = {
      url,
      title: url.split('/').pop() || 'Bookmark',
      domain: new URL(url).hostname,
      description: '',
      image: null as string | null
    };
    
    // For simplicity, we're using basic metadata extraction
    // A more advanced implementation would use a library like metascraper
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Extract title
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          metadata.title = titleMatch[1].trim();
        }
        
        // Extract description
        const descMatch = html.match(/<meta name="description" content="(.*?)">/i);
        if (descMatch && descMatch[1]) {
          metadata.description = descMatch[1].trim();
        }
        
        // Extract image
        const ogImageMatch = html.match(/<meta property="og:image" content="(.*?)">/i);
        if (ogImageMatch && ogImageMatch[1]) {
          metadata.image = ogImageMatch[1].trim();
        }
      }
    } catch (error) {
      console.error('Error fetching URL metadata:', error);
      // Continue with default metadata
    }
    
    return metadata;
  } catch (error) {
    console.error('Error extracting URL metadata:', error);
    
    // Return basic metadata for invalid URLs
    return {
      url,
      title: url.split('/').pop() || 'Bookmark',
      domain: 'unknown',
      description: '',
      image: null
    };
  }
}

// Function to enhance bookmark with AI
async function enhanceBookmarkWithAI(metadata: any, userMessage?: string) {
  // For this example, we'll use a simple rule-based approach
  // A more advanced implementation would use a real AI model
  
  try {
    // Basic metadata enhancement
    let title = metadata.title;
    let description = userMessage || metadata.description || '';
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    
    // Generate tags from domain and context
    const tags = generateTags(metadata.domain, userMessage || '');
    
    // Determine priority based on context
    if (userMessage) {
      const lowercaseMessage = userMessage.toLowerCase();
      if (lowercaseMessage.includes('urgent') || lowercaseMessage.includes('important')) {
        priority = 'HIGH';
      } else if (lowercaseMessage.includes('later') || lowercaseMessage.includes('someday')) {
        priority = 'LOW';
      }
    }
    
    return {
      title,
      description,
      priority,
      tags
    };
  } catch (error) {
    console.error('Error enhancing bookmark with AI:', error);
    
    // Fallback to basic enhancement
    return {
      title: metadata.title || metadata.domain,
      description: metadata.description || 'Added via WhatsApp',
      priority: 'MEDIUM' as const,
      tags: [metadata.domain.split('.')[0]]
    }
  }
}

// Function to generate tags from domain and context
function generateTags(domain: string, context: string): string[] {
  const tags: string[] = [];
  
  // Extract domain-based tags
  try {
    tags.push(domain.split('.')[0]); // e.g., 'github' from github.com
    
    // Domain-specific tags
    if (domain.includes('github')) tags.push('code', 'development');
    if (domain.includes('stackoverflow')) tags.push('programming', 'question');
    if (domain.includes('medium')) tags.push('article', 'blog');
    if (domain.includes('dev.to')) tags.push('development', 'blog');
    if (domain.includes('react')) tags.push('react', 'frontend', 'javascript');
    if (domain.includes('youtube')) tags.push('video');
    if (domain.includes('vercel')) tags.push('vercel', 'deployment');
    if (domain.includes('openai')) tags.push('ai', 'openai');
  } catch (e) {
    // Ignore URL parsing errors
  }
  
  // Context-based tags
  const lowercaseContext = context.toLowerCase();
  
  // Keywords to look for
  const keywords = [
    'work', 'important', 'urgent', 'later', 'read', 'watch', 'learn',
    'tutorial', 'guide', 'reference', 'documentation', 'api',
    'frontend', 'backend', 'database', 'design', 'ui', 'ux'
  ];
  
  keywords.forEach(keyword => {
    if (lowercaseContext.includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  // Make tags unique and clean
  return [...new Set(tags)].map(tag => tag.trim()).filter(Boolean);
}

// Function to generate WhatsApp message
function generateWhatsAppMessage(bookmark: any, aiEnhanced: any): string {
  let message = `✅ **Smart bookmark created!**\n\n`;
  
  message += `📚 **${bookmark.title}**\n`;
  
  if (bookmark.tags && bookmark.tags.length > 0) {
    message += `🏷️ ${bookmark.tags.map((tag: string) => `#${tag}`).join(' ')}\n`;
  }
  
  if (bookmark.priority === 'HIGH') {
    message += `🔥 High Priority\n`;
  } else if (bookmark.priority === 'LOW') {
    message += `📅 Low Priority\n`;
  }
  
  if (bookmark.description && bookmark.description !== bookmark.title) {
    const desc = bookmark.description.length > 100 
      ? bookmark.description.substring(0, 100) + '...'
      : bookmark.description;
    message += `📝 ${desc}\n`;
  }
  
  message += `🔗 ${bookmark.url}\n\n`;
  
  message += `📱 **Quick Links:**\n`;
  message += `📚 View All: https://bookmark-manager-beryl.vercel.app/bookmarks\n`;
  message += `📋 Todo List: https://bookmark-manager-beryl.vercel.app/todo\n\n`;
  
  message += `💡 **Tip:** Add more context for smarter AI tagging!\nExample: "Bookmark: Important work docs" + [link]`;
  
  return message;
}