import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const whatsappMessageSchema = z.object({
  from: z.string(),
  body: z.string(),
  timestamp: z.number().optional(),
  messageId: z.string().optional()
})

// POST /api/webhooks/whatsapp - Handle incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('WhatsApp webhook received:', body)
    
    // Extract message data (format may vary based on WhatsApp provider)
    const message = extractMessageData(body)
    
    if (!message) {
      return NextResponse.json({ status: 'no_message' })
    }
    
    // Check if message contains URLs
    const urls = extractUrls(message.body)
    
    if (urls.length === 0) {
      // No URLs found, send help message
      return NextResponse.json({
        status: 'no_urls',
        reply: {
          to: message.from,
          message: '👋 Hi! Send me any web links and I\'ll automatically convert them to organized bookmarks with AI-powered tagging and descriptions.\n\n📝 You can also add a note with your link for better context!\n\nExample: "Read this later for work" + [your link]'
        }
      })
    }
    
    // Process each URL
    const results = []
    
    for (const url of urls) {
      try {
        // Create a temporary user session for the phone number
        const userContext = await getOrCreateUserFromPhone(message.from)
        
        if (!userContext) {
          console.error('Could not create user context for:', message.from)
          continue
        }
        
        // Process the bookmark with AI
        const bookmarkResult = await processBookmarkAI(url, message.body, userContext)
        results.push(bookmarkResult)
        
      } catch (error) {
        console.error('Error processing URL:', url, error)
        results.push({
          url,
          error: 'Failed to process this link',
          status: 'error'
        })
      }
    }
    
    // Generate reply message
    const replyMessage = generateReplyMessage(results, message.from)
    
    return NextResponse.json({
      status: 'processed',
      processedUrls: results.length,
      reply: {
        to: message.from,
        message: replyMessage
      }
    })
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// GET /api/webhooks/whatsapp - Webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  // Verify webhook (WhatsApp Business API standard)
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

function extractMessageData(webhookBody: any) {
  // Handle different WhatsApp API formats
  
  // WhatsApp Business API format
  if (webhookBody.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
    const msg = webhookBody.entry[0].changes[0].value.messages[0]
    return {
      from: msg.from,
      body: msg.text?.body || msg.body || '',
      timestamp: msg.timestamp,
      messageId: msg.id
    }
  }
  
  // Clawdbot format (if integrated)
  if (webhookBody.from && webhookBody.message) {
    return {
      from: webhookBody.from,
      body: webhookBody.message,
      timestamp: Date.now(),
      messageId: webhookBody.id
    }
  }
  
  // Generic format
  if (webhookBody.from && webhookBody.body) {
    return {
      from: webhookBody.from,
      body: webhookBody.body,
      timestamp: webhookBody.timestamp || Date.now(),
      messageId: webhookBody.messageId
    }
  }
  
  return null
}

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/gi
  const matches = text.match(urlRegex) || []
  
  // Clean up URLs (remove trailing punctuation)
  return matches.map(url => url.replace(/[.,;!?]+$/, ''))
}

async function getOrCreateUserFromPhone(phoneNumber: string) {
  // This would integrate with your user management system
  // For now, we'll use a demo approach
  
  // In a real implementation, you'd:
  // 1. Look up user by phone number
  // 2. Create account if doesn't exist
  // 3. Return authentication context
  
  // Demo implementation - you'd replace this with real user lookup
  const demoUserId = `whatsapp-${phoneNumber.replace(/\D/g, '')}`
  
  return {
    userId: demoUserId,
    phone: phoneNumber,
    authToken: 'demo-token' // In real implementation, generate proper JWT
  }
}

async function processBookmarkAI(url: string, messageBody: string, userContext: any) {
  try {
    // Extract the user's message (remove the URL to get context)
    const userMessage = messageBody.replace(/(https?:\/\/[^\s]+)/gi, '').trim()
    
    // Call the AI extraction API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/extract-bookmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In real implementation, use proper authentication
        'Authorization': `Bearer ${userContext.authToken}`
      },
      body: JSON.stringify({
        url,
        source: 'whatsapp',
        userMessage: userMessage || undefined
      })
    })
    
    if (!response.ok) {
      throw new Error(`AI processing failed: ${response.status}`)
    }
    
    const result = await response.json()
    return {
      url,
      status: 'success',
      bookmark: result.bookmark,
      message: result.message,
      aiInsights: result.aiInsights
    }
    
  } catch (error) {
    console.error('AI processing error:', error)
    return {
      url,
      status: 'error',
      error: error instanceof Error ? error.message : 'AI processing failed'
    }
  }
}

function generateReplyMessage(results: any[], from: string): string {
  if (results.length === 0) {
    return '❌ No links could be processed. Please check your URLs and try again.'
  }
  
  const successful = results.filter(r => r.status === 'success')
  const failed = results.filter(r => r.status === 'error')
  
  let reply = ''
  
  if (successful.length > 0) {
    reply += `✅ Successfully saved ${successful.length} bookmark${successful.length !== 1 ? 's' : ''}:\n\n`
    
    successful.forEach((result, index) => {
      const bookmark = result.bookmark
      const insights = result.aiInsights
      
      reply += `📚 **${bookmark.title}**\n`
      reply += `🏷️ Tags: ${bookmark.tags?.join(', ') || 'none'}\n`
      if (insights?.aiEnhancements?.priority === 'HIGH') {
        reply += `🔥 Priority: HIGH\n`
      }
      reply += `🔗 ${result.url}\n\n`
    })
    
    reply += `📝 All bookmarks added to your todo list for review!\n`
    reply += `🌐 View them at: ${process.env.NEXTAUTH_URL}/todo\n\n`
  }
  
  if (failed.length > 0) {
    reply += `❌ Failed to process ${failed.length} link${failed.length !== 1 ? 's' : ''}:\n`
    failed.forEach(result => {
      reply += `• ${result.url} - ${result.error}\n`
    })
  }
  
  reply += '\n💡 Pro tip: Add a note with your link for better AI categorization!\n'
  reply += 'Example: "Important tutorial for work project" + [your link]'
  
  return reply
}