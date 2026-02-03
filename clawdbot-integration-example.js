#!/usr/bin/env node

/**
 * Clawdbot WhatsApp Integration Example
 * 
 * Add this to your existing Clawdbot WhatsApp message handler
 */

const { handleWhatsAppMessage } = require('./whatsapp-bookmark-handler')

/**
 * Example integration into your existing Clawdbot WhatsApp handler
 * Replace this with your actual message processing function
 */
async function processWhatsAppMessage(messageText, from = 'whatsapp') {
  console.log(`📱 Received WhatsApp message from ${from}: "${messageText}"`)
  
  // Check for bookmark requests first
  if (messageText.toLowerCase().includes('bookmark:')) {
    console.log('🔖 Detected bookmark request, processing...')
    
    try {
      const bookmarkResult = await handleWhatsAppMessage(messageText, from)
      
      if (bookmarkResult) {
        console.log('✅ Bookmark processed successfully')
        // Send the response back to WhatsApp
        return bookmarkResult.message
      } else {
        console.log('❌ Bookmark processing returned no result')
        return '❌ Failed to process bookmark request'
      }
    } catch (error) {
      console.error('❌ Bookmark processing error:', error)
      return `❌ Bookmark error: ${error.message}`
    }
  }
  
  // Handle other types of messages here
  if (messageText.toLowerCase().includes('hello')) {
    return '👋 Hi! Send me "Bookmark: [description] [URL]" to save web links!'
  }
  
  // Default response for unknown messages
  return `🤖 I received: "${messageText}"\n\nTry: "Bookmark: Important article https://example.com"`
}

/**
 * Example usage and testing
 */
async function testIntegration() {
  console.log('🧪 Testing Clawdbot integration...\n')
  
  const testMessages = [
    'Hello there!',
    'Bookmark: Important React tutorial https://react.dev/learn',
    'Just a normal message',
    'bookmark: lowercase test https://example.com'
  ]
  
  for (const message of testMessages) {
    console.log(`📝 Processing: "${message}"`)
    const response = await processWhatsAppMessage(message, 'test-user')
    console.log(`📤 Response: ${response}\n`)
  }
}

// Export for use in your Clawdbot
module.exports = {
  processWhatsAppMessage,
  handleWhatsAppMessage
}

// Run test if executed directly
if (require.main === module) {
  testIntegration().catch(console.error)
}