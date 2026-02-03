#!/usr/bin/env node

/**
 * Test script for WhatsApp bookmark integration
 * This tests the complete workflow: message parsing → API call → bookmark creation
 */

const { handleWhatsAppMessage } = require('./whatsapp-bookmark-handler')

// Set environment variables
process.env.BOOKMARK_API_URL = "https://bookmark-manager-beryl.vercel.app"
process.env.BOOKMARK_API_KEY = "bookmark-clawdbot-api-key-2026-secure1757"

async function testWhatsAppIntegration() {
  console.log('🧪 Testing WhatsApp Bookmark Integration...')
  console.log('📱 API URL:', process.env.BOOKMARK_API_URL)
  console.log('🔑 API Key:', process.env.BOOKMARK_API_KEY ? '[SET]' : '[NOT SET]')
  console.log()

  // Test different message formats
  const testMessages = [
    'Bookmark: Important React tutorial for work project https://react.dev/learn/hooks',
    'bookmark: Quick save https://example.com',
    'Bookmark: AI article https://openai.com/blog',
    'Just a regular message without bookmark flag',
    'Bookmark: Missing URL test message'
  ]

  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i]
    console.log(`📝 Test ${i + 1}: "${message}"`)
    
    try {
      const result = await handleWhatsAppMessage(message, 'test')
      
      if (result) {
        console.log(`✅ Success: ${result.success}`)
        console.log(`📋 Response:\n${result.message}\n`)
      } else {
        console.log('ℹ️  Not a bookmark request (no result returned)\n')
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`)
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('🎉 Testing complete!')
}

// Run the test
if (require.main === module) {
  testWhatsAppIntegration().catch(error => {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  })
}

module.exports = { testWhatsAppIntegration }