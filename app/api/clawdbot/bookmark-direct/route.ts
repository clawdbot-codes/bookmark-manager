import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateApiKey, createApiUnauthorizedResponse } from '@/lib/api-auth';
import { z } from 'zod';

// Initialize Prisma client
const prisma = new PrismaClient();

// API key for authorization
const CLAWDBOT_API_KEY = process.env.CLAWDBOT_API_KEY || 'bookmark-api-key-change-this-in-production';
const WHATSAPP_API_KEY = 'bookmark-clawdbot-api-key-2026-secure1757';

// Request schema validation
const bookmarkSchema = z.object({
  url: z.string().url(),
  userMessage: z.string().optional(),
  userEmail: z.string().email().optional()
});

// Function to extract metadata from a URL
async function extractMetadata(url: string) {
  try {
    // Basic metadata extraction
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    return {
      url,
      title: domain, // Simple title based on domain
      domain,
      description: '',
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      url,
      title: url.split('/').pop() || 'Bookmark',
      domain: 'unknown',
      description: '',
    };
  }
}

// Generate tags based on context and URL
function generateTags(url: string, context?: string): string[] {
  const tags: string[] = [];
  const lowercaseContext = (context || '').toLowerCase();
  
  // Extract domain-based tags
  try {
    const domain = new URL(url).hostname;
    const mainDomain = domain.split('.')[0];
    if (mainDomain && !['www', 'web', 'site', 'app'].includes(mainDomain)) {
      tags.push(mainDomain);
    }
    
    // Domain-specific tags
    if (domain.includes('github')) tags.push('github', 'code');
    if (domain.includes('react')) tags.push('react', 'javascript');
    if (domain.includes('medium')) tags.push('article', 'blog');
    if (domain.includes('youtube')) tags.push('video');
    if (domain.includes('vercel')) tags.push('vercel', 'deployment');
  } catch (e) {
    // Ignore URL parsing errors
  }
  
  // Context-based tags
  const contextKeywords = [
    'work', 'important', 'urgent', 'later', 'read', 'watch', 'tutorial',
    'reference', 'doc', 'documentation', 'guide', 'example', 'code',
    'frontend', 'backend', 'database', 'api', 'design', 'ui', 'ux'
  ];
  
  contextKeywords.forEach(keyword => {
    if (lowercaseContext.includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  // Priority indicators
  if (lowercaseContext.includes('important') || lowercaseContext.includes('urgent')) {
    tags.push('important');
  }
  
  // Make tags unique and clean
  return [...new Set(tags)].map(tag => tag.trim()).filter(Boolean);
}

// Main API handler
export async function POST(request: NextRequest) {
  // Check authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || (authHeader !== CLAWDBOT_API_KEY && authHeader !== WHATSAPP_API_KEY)) {
    return createApiUnauthorizedResponse();
  }

  try {
    // Parse request body
    const body = await request.json();
    const { url, userMessage, userEmail } = bookmarkSchema.parse(body);

    // Extract metadata
    const metadata = await extractMetadata(url);
    
    // Generate tags
    const tags = generateTags(url, userMessage);
    
    // Determine priority based on context
    let priority = 'MEDIUM';
    if (userMessage) {
      const lowercaseMessage = userMessage.toLowerCase();
      if (lowercaseMessage.includes('urgent') || lowercaseMessage.includes('important')) {
        priority = 'HIGH';
      } else if (lowercaseMessage.includes('later') || lowercaseMessage.includes('someday')) {
        priority = 'LOW';
      }
    }

    // Enhanced bookmark data
    const aiEnhanced = {
      title: metadata.title || url.split('/').pop() || 'Bookmark',
      description: userMessage || metadata.description || `Bookmark from ${metadata.domain}`,
      priority,
      tags
    };

    // Find user
    let user = null;
    
    // First try to find by email if provided
    if (userEmail) {
      user = await prisma.user.findFirst({
        where: {
          email: userEmail
        }
      });
      console.log(`Found user by email ${userEmail}:`, user ? 'Yes' : 'No');
    }
    
    // If no user found by email, try the default user ID
    if (!user) {
      const defaultUserId = process.env.DEFAULT_USER_ID || 'clawdbot-default-user';
      user = await prisma.user.findFirst({
        where: {
          id: defaultUserId
        }
      });
      console.log(`Found user by ID ${defaultUserId}:`, user ? 'Yes' : 'No');
    }
    
    // If still no user, try to find any user
    if (!user) {
      user = await prisma.user.findFirst();
      console.log('Found first available user:', user ? 'Yes' : 'No');
    }
    
    // If still no user, try to create a default user
    if (!user) {
      try {
        const defaultUserId = process.env.DEFAULT_USER_ID || 'clawdbot-default-user';
        user = await prisma.user.create({
          data: {
            id: defaultUserId,
            name: 'Clawdbot Default User',
            email: userEmail || `whatsapp-bookmarks-${defaultUserId}@example.com`,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log('Created new user:', user.id);
      } catch (userCreateError) {
        console.error('Error creating user:', userCreateError);
        
        // If we still don't have a user, return an error
        return NextResponse.json({
          success: false,
          error: 'Failed to find or create user',
          whatsappMessage: `❌ Failed to find or create user\n\n${userCreateError}`
        }, { status: 500 });
      }
    }
    
    // Create tags in database
    const tagObjects = await Promise.all(
      tags.map(async (tagName) => {
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
        faviconUrl: null,
        tags: {
          create: tagObjects.map(tag => ({
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
    
    console.log('Created bookmark:', bookmark.id);
    
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

// Generate WhatsApp message
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