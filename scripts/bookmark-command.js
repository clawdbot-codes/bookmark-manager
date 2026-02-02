#!/usr/bin/env node

/**
 * Clawdbot Bookmark Command Integration
 * 
 * This script can be used directly in Clawdbot to process WhatsApp messages
 * and create AI-powered bookmarks.
 * 
 * Usage in Clawdbot:
 * 1. Save this file in your Clawdbot workspace
 * 2. Import in your command handler
 * 3. Send URLs via WhatsApp and get smart bookmarks!
 */

const BOOKMARK_API_BASE = process.env.BOOKMARK_APP_URL || 'http://localhost:3000'

/**
 * Main bookmark command handler
 * Call this from your Clawdbot message processing
 */
async function processBookmarkMessage(messageText, source = 'whatsapp') {
  try {
    console.log('📱 Processing bookmark message:', messageText)
    
    // Extract URLs from the message
    const urls = extractUrls(messageText)
    
    if (urls.length === 0) {
      return {
        success: false,
        message: `🤖 **AI Bookmark Assistant**

Send me web links and I'll convert them to smart bookmarks!

**Examples:**
• "Important work docs" + https://stripe.com/docs
• "React tutorial for later" + https://react.dev/learn
• Just the URL: https://github.com/awesome/project

**What I do:**
🧠 Extract title, description, metadata
🏷️ Generate smart tags automatically
📊 Set priority based on content type
💾 Save to your bookmark collection

Try sending me any web link! 🚀`
      }
    }

    console.log(`🔗 Found ${urls.length} URLs to process`)
    
    // Process each URL with AI
    const results = []
    for (const url of urls) {
      try {
        const result = await processUrlWithAI(url, messageText, source)
        results.push(result)
        console.log('✅ Processed:', url)
      } catch (error) {
        console.error('❌ Failed to process:', url, error.message)
        results.push({
          url,
          success: false,
          error: error.message
        })
      }
    }
    
    const successfulBookmarks = results.filter(r => r.success)
    const failedBookmarks = results.filter(r => !r.success)
    
    let replyMessage = ''
    
    if (successfulBookmarks.length > 0) {
      replyMessage += `✅ **Created ${successfulBookmarks.length} smart bookmark${successfulBookmarks.length > 1 ? 's' : ''}!**\n\n`
      
      successfulBookmarks.forEach((result, index) => {
        const bookmark = result.bookmark
        replyMessage += `📚 **${bookmark.title}**\n`
        
        if (bookmark.tags && bookmark.tags.length > 0) {
          replyMessage += `🏷️ ${bookmark.tags.map(tag => `#${tag}`).join(' ')}\n`
        }
        
        if (bookmark.priority === 'HIGH') {
          replyMessage += `🔥 High Priority\n`
        }
        
        if (bookmark.description && bookmark.description !== bookmark.title) {
          replyMessage += `📝 ${bookmark.description.substring(0, 100)}${bookmark.description.length > 100 ? '...' : ''}\n`
        }
        
        replyMessage += `🔗 ${result.url}\n\n`
      })
      
      replyMessage += `📱 **Quick Links:**\n`
      replyMessage += `📚 View All: ${BOOKMARK_API_BASE}/bookmarks\n`
      replyMessage += `📋 Todo List: ${BOOKMARK_API_BASE}/todo\n\n`
    }
    
    if (failedBookmarks.length > 0) {
      replyMessage += `❌ **Failed to process ${failedBookmarks.length} link${failedBookmarks.length > 1 ? 's' : ''}:**\n`
      failedBookmarks.forEach(result => {
        replyMessage += `• ${result.url} - ${result.error}\n`
      })
      replyMessage += '\n'
    }
    
    replyMessage += `💡 **Pro tip:** Add context for smarter AI tagging!\n`
    replyMessage += `Example: "Important work API docs" + [your link]`
    
    return {
      success: true,
      processedUrls: urls.length,
      successfulBookmarks: successfulBookmarks.length,
      message: replyMessage
    }
    
  } catch (error) {
    console.error('🚨 Bookmark processing error:', error)
    return {
      success: false,
      message: `❌ **Error processing bookmarks**\n\n${error.message}\n\nPlease try again or contact support.`
    }
  }
}

/**
 * Extract URLs from text message
 */
function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi
  const matches = text.match(urlRegex) || []
  return matches.map(url => url.replace(/[.,;!?]+$/, ''))
}

/**
 * Process single URL with AI
 */
async function processUrlWithAI(url, messageText, source) {
  // Extract user context (remove URLs to get the message context)
  const userContext = messageText.replace(/(https?:\/\/[^\s]+)/gi, '').trim()
  
  console.log(`🤖 AI processing: ${url}`)
  if (userContext) {
    console.log(`💬 User context: "${userContext}"`)
  }
  
  const response = await fetch(`${BOOKMARK_API_BASE}/api/ai/extract-bookmark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      source,
      userMessage: userContext || undefined
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }
  
  return await response.json()
}

// Export for use in other modules
module.exports = {
  processBookmarkMessage,
  extractUrls,
  processUrlWithAI
}

// CLI usage for testing
if (require.main === module) {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log(`🤖 Clawdbot Bookmark Command Tester

Usage: node bookmark-command.js "message with URLs"

Examples:
  node bookmark-command.js "Important React tutorial https://react.dev/learn"
  node bookmark-command.js "https://github.com/awesome/project"
  
Environment:
  BOOKMARK_APP_URL=${BOOKMARK_API_BASE}
`)
    process.exit(1)
  }
  
  const message = args.join(' ')
  console.log('🧪 Testing bookmark processing...\n')
  
  processBookmarkMessage(message, 'cli-test')
    .then(result => {
      console.log('\n📋 Result:')
      console.log('Success:', result.success)
      console.log('Message:\n' + result.message)
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message)
      process.exit(1)
    })
}