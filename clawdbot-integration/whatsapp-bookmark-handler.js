#!/usr/bin/env node

/**
 * Clawdbot WhatsApp Bookmark Handler
 * 
 * Add this to your Clawdbot message processing to handle "Bookmark:" messages
 * 
 * Usage:
 * 1. Copy this code to your Clawdbot workspace
 * 2. Import and call handleWhatsAppMessage() from your message handler
 * 3. Set BOOKMARK_API_URL and BOOKMARK_API_KEY in your environment
 * 
 * Example WhatsApp message:
 * "Bookmark: Important React tutorial for work project"
 * https://react.dev/learn/hooks
 */

// Configuration - set these in your Clawdbot environment
const BOOKMARK_API_URL = process.env.BOOKMARK_API_URL || 'http://localhost:3000'
const BOOKMARK_API_KEY = process.env.BOOKMARK_API_KEY || 'bookmark-clawdbot-api-key-2026-secure'

/**
 * Main message handler for WhatsApp bookmark requests
 * Call this from your Clawdbot message processing
 */
async function handleWhatsAppMessage(messageText, from = 'whatsapp') {
  try {
    console.log('📱 Processing message:', messageText)
    
    // Check if message contains bookmark flag
    if (!messageText.toLowerCase().includes('bookmark:')) {
      return null // Not a bookmark request
    }
    
    // Extract bookmark context and URL
    const bookmarkData = parseBookmarkMessage(messageText)
    
    if (!bookmarkData.url) {
      return {
        success: false,
        message: `❌ **No URL found**\n\nPlease include a web link with your bookmark request.\n\n**Format:** Bookmark: [description] [URL]\n**Example:** Bookmark: Important React tutorial https://react.dev/learn`
      }
    }

    console.log('🔗 Creating bookmark:', bookmarkData)
    
    // Call bookmark API
    const result = await createBookmarkViaAPI(bookmarkData.url, bookmarkData.context)
    
    if (result.success) {
      console.log('✅ Bookmark created:', result.bookmark.title)
      return {
        success: true,
        message: result.whatsappMessage
      }
    } else {
      console.error('❌ Bookmark creation failed:', result.error)
      return {
        success: false,
        message: result.whatsappMessage || `❌ Failed to create bookmark: ${result.error}`
      }
    }
    
  } catch (error) {
    console.error('🚨 WhatsApp bookmark handler error:', error)
    return {
      success: false,
      message: `❌ **Bookmark creation failed**\n\nError: ${error.message}\n\nPlease try again or contact support.`
    }
  }
}

/**
 * Parse bookmark message to extract context and URL
 */
function parseBookmarkMessage(messageText) {
  // Find the "Bookmark:" part (case insensitive)
  const bookmarkIndex = messageText.toLowerCase().indexOf('bookmark:')
  
  if (bookmarkIndex === -1) {
    return { context: '', url: null }
  }
  
  // Get everything after "Bookmark:"
  const afterBookmark = messageText.slice(bookmarkIndex + 9).trim()
  
  // Extract URLs
  const urlRegex = /(https?:\/\/[^\s]+)/gi
  const urls = afterBookmark.match(urlRegex) || []
  
  if (urls.length === 0) {
    return { context: afterBookmark, url: null }
  }
  
  // Use first URL found
  const url = urls[0].replace(/[.,;!?]+$/, '') // Remove trailing punctuation
  
  // Extract context (everything except the URL)
  const context = afterBookmark.replace(urlRegex, '').trim()
  
  return { context, url }
}

/**
 * Call the bookmark API to create a new bookmark
 */
async function createBookmarkViaAPI(url, userMessage = '') {
  try {
    const response = await fetch(`${BOOKMARK_API_URL}/api/clawdbot/bookmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': BOOKMARK_API_KEY
      },
      body: JSON.stringify({
        url,
        userMessage: userMessage || undefined
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
    
  } catch (error) {
    console.error('❌ API call failed:', error)
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Connection failed',
        whatsappMessage: `❌ **Connection failed**\n\nCannot reach bookmark server at ${BOOKMARK_API_URL}\n\nPlease check:\n• VPS is running\n• Network connection\n• Firewall settings`
      }
    }
    
    return {
      success: false,
      error: error.message,
      whatsappMessage: `❌ **API Error**\n\n${error.message}\n\nPlease try again in a moment.`
    }
  }
}

/**
 * Helper function to test the bookmark handler
 */
async function testBookmarkHandler() {
  const testMessage = 'Bookmark: Important React tutorial for work project https://react.dev/learn/hooks'
  
  console.log('🧪 Testing bookmark handler...')
  console.log('📱 Test message:', testMessage)
  console.log('🔗 API URL:', BOOKMARK_API_URL)
  console.log()
  
  const result = await handleWhatsAppMessage(testMessage, 'test')
  
  console.log('📋 Result:')
  console.log('Success:', result.success)
  console.log('Message:')
  console.log(result.message)
}

// Export for use in other modules
module.exports = {
  handleWhatsAppMessage,
  parseBookmarkMessage,
  createBookmarkViaAPI,
  testBookmarkHandler
}

// CLI testing
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log(`🤖 Clawdbot WhatsApp Bookmark Handler

Usage: node whatsapp-bookmark-handler.js [message]

Examples:
  node whatsapp-bookmark-handler.js "Bookmark: React tutorial https://react.dev/learn"
  node whatsapp-bookmark-handler.js "test" # Run built-in test
  
Environment:
  BOOKMARK_API_URL=${BOOKMARK_API_URL}
  BOOKMARK_API_KEY=${BOOKMARK_API_KEY ? '[SET]' : '[NOT SET]'}
`)
    process.exit(1)
  }
  
  const message = args.join(' ')
  
  if (message === 'test') {
    testBookmarkHandler()
      .catch(error => {
        console.error('❌ Test failed:', error.message)
        process.exit(1)
      })
  } else {
    handleWhatsAppMessage(message, 'cli-test')
      .then(result => {
        console.log('\n📋 Result:')
        console.log('Success:', result?.success || false)
        console.log('Message:')
        console.log(result?.message || 'No result')
      })
      .catch(error => {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
      })
  }
}