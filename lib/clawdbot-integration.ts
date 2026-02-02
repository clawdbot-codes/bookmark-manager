// Integration with Clawdbot's messaging system for WhatsApp bookmark processing

export async function processWhatsAppMessage(messageText: string, source: string = 'whatsapp') {
  // Extract URLs from the message
  const urls = extractUrls(messageText)
  
  if (urls.length === 0) {
    return {
      hasUrls: false,
      reply: '👋 Hi! Send me web links and I\'ll convert them to smart bookmarks with AI!\n\n💡 Tip: Add context like "work project" or "read later" for better organization.'
    }
  }

  const results = []
  
  for (const url of urls) {
    try {
      // Process with AI bookmark extraction
      const result = await processUrlWithAI(url, messageText, source)
      results.push(result)
    } catch (error) {
      results.push({
        url,
        status: 'error',
        error: 'Failed to process this link'
      })
    }
  }

  return {
    hasUrls: true,
    results,
    reply: generateSuccessReply(results)
  }
}

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/gi
  const matches = text.match(urlRegex) || []
  return matches.map(url => url.replace(/[.,;!?]+$/, ''))
}

async function processUrlWithAI(url: string, messageText: string, source: string) {
  // Extract user context (remove URLs from message)
  const userContext = messageText.replace(/(https?:\/\/[^\s]+)/gi, '').trim()
  
  // Call our AI extraction API
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/extract-bookmark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Note: In production, you'd need proper authentication here
    },
    body: JSON.stringify({
      url,
      source,
      userMessage: userContext || undefined
    })
  })

  if (!response.ok) {
    throw new Error(`AI processing failed: ${response.status}`)
  }

  return await response.json()
}

function generateSuccessReply(results: any[]): string {
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  let reply = ''
  
  if (successful.length > 0) {
    reply += `✅ Created ${successful.length} smart bookmark${successful.length !== 1 ? 's' : ''}!\n\n`
    
    successful.forEach((result) => {
      const bookmark = result.bookmark
      reply += `📚 **${bookmark.title}**\n`
      
      if (bookmark.tags?.length > 0) {
        reply += `🏷️ ${bookmark.tags.map((tag: any) => `#${tag}`).join(' ')}\n`
      }
      
      if (bookmark.priority === 'HIGH') {
        reply += `🔥 High Priority\n`
      }
      
      reply += `🔗 ${bookmark.url}\n\n`
    })
    
    reply += `📝 View your bookmarks: ${process.env.NEXTAUTH_URL || 'your-app'}/bookmarks\n`
    reply += `📋 Review todo list: ${process.env.NEXTAUTH_URL || 'your-app'}/todo\n\n`
  }
  
  if (failed.length > 0) {
    reply += `❌ ${failed.length} link${failed.length !== 1 ? 's' : ''} couldn't be processed\n\n`
  }
  
  reply += '💡 Add context for better AI tagging:\n'
  reply += '"Important work docs" + [link] = work + important tags!'
  
  return reply
}

// Command handler for Clawdbot
export async function handleBookmarkCommand(args: string[], messageText: string) {
  if (args.length === 0 && !messageText.includes('http')) {
    return `🤖 **AI Bookmark Assistant**

**Usage:**
• Send any web link and I'll create a smart bookmark
• Add context for better AI categorization
• Multiple links in one message = multiple bookmarks

**Examples:**
\`bookmark https://react.dev/learn\`
\`"Important tutorial" https://react.dev/learn\`

**Features:**
🧠 AI extracts title, description, metadata
🏷️ Smart tags based on content analysis  
📊 Auto-priority detection (HIGH/MEDIUM/LOW)
💬 Context-aware from your message
📱 Works from WhatsApp, Telegram, anywhere!

**Quick Links:**
📚 View Bookmarks: ${process.env.NEXTAUTH_URL || 'your-app'}/bookmarks
📋 Todo Review: ${process.env.NEXTAUTH_URL || 'your-app'}/todo
🤖 AI Assistant: ${process.env.NEXTAUTH_URL || 'your-app'}/bookmarks (click AI Assistant)

Try it: Send me any web link! 🚀`
  }

  // Process the message for URLs
  const fullMessage = args.length > 0 ? args.join(' ') : messageText
  const result = await processWhatsAppMessage(fullMessage, 'clawdbot')
  
  return result.reply
}