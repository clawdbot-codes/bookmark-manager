#!/usr/bin/env node

/**
 * Quick test to verify WhatsApp integration is ready
 */

const VERCEL_URL = 'https://bookmark-manager-beryl.vercel.app'
const API_KEY = 'bookmark-clawdbot-api-key-2026-secure1757'

async function quickWhatsAppTest() {
  console.log('🚀 Quick WhatsApp Integration Test')
  console.log('=' .repeat(50))
  console.log(`📱 Vercel App: ${VERCEL_URL}`)
  console.log(`🔑 API Key: ${API_KEY}`)
  console.log()

  // Simulate a WhatsApp message
  const testMessage = 'Bookmark: Important React tutorial for work project https://react.dev/learn/hooks'
  console.log(`📝 Test Message: "${testMessage}"`)
  console.log()

  try {
    console.log('🔍 Testing API endpoint...')
    
    // Extract URL and context from message (like the WhatsApp handler would)
    const urlMatch = testMessage.match(/(https?:\/\/[^\s]+)/i)
    const url = urlMatch ? urlMatch[0] : null
    const userMessage = testMessage.replace(/(bookmark:|https?:\/\/[^\s]+)/gi, '').trim()
    
    console.log(`🔗 Extracted URL: ${url}`)
    console.log(`💬 Extracted Context: "${userMessage}"`)
    console.log()

    if (!url) {
      console.log('❌ No URL found in message')
      return
    }

    // Test API call
    const response = await fetch(`${VERCEL_URL}/api/clawdbot/bookmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY
      },
      body: JSON.stringify({
        url: url,
        userMessage: userMessage
      })
    })

    console.log(`📊 API Response: HTTP ${response.status}`)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ SUCCESS! Your WhatsApp integration is ready!')
      console.log()
      console.log('📋 API Response:')
      console.log(`   Success: ${result.success}`)
      console.log(`   Title: ${result.bookmark?.title || 'N/A'}`)
      console.log(`   Tags: ${result.bookmark?.tags?.join(', ') || 'None'}`)
      console.log(`   Priority: ${result.bookmark?.priority || 'N/A'}`)
      console.log()
      console.log('📱 WhatsApp Response Preview:')
      console.log('─'.repeat(40))
      console.log(result.whatsappMessage || 'No message preview')
      console.log('─'.repeat(40))
      console.log()
      console.log('🎉 Your Vercel app is ready for WhatsApp!')
      console.log('📋 Next step: Add the handler to your Clawdbot')
      
    } else {
      const errorText = await response.text()
      console.log('❌ API Error:')
      console.log(errorText.substring(0, 500))
      console.log()
      console.log('🔧 Possible fixes:')
      console.log('   1. Check environment variables in Vercel dashboard')
      console.log('   2. Verify DATABASE_URL is set')
      console.log('   3. Ensure NEXTAUTH_SECRET is configured')
    }

  } catch (error) {
    console.log('❌ Connection failed:', error.message)
    console.log()
    console.log('🔧 This could be due to:')
    console.log('   1. Network connectivity issues')
    console.log('   2. Vercel app is not fully deployed')
    console.log('   3. Environment variables missing')
  }

  console.log()
  console.log('📱 To test with real WhatsApp:')
  console.log('   1. Add handler to your Clawdbot')
  console.log('   2. Send: "Bookmark: Test https://example.com"')
  console.log('   3. You should get a smart bookmark response!')
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  try {
    const { default: fetch } = require('node-fetch')
    global.fetch = fetch
  } catch (e) {
    console.log('📦 Install node-fetch: npm install node-fetch')
    process.exit(1)
  }
}

quickWhatsAppTest().catch(error => {
  console.error('❌ Test failed:', error.message)
  process.exit(1)
})