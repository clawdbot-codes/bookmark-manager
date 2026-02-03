#!/usr/bin/env node

/**
 * Debug Vercel API to identify bookmark creation issues
 */

const API_URL = 'https://bookmark-manager-beryl.vercel.app'
const API_KEY = 'bookmark-clawdbot-api-key-2026-secure1757'

async function debugVercelAPI() {
  console.log('🔍 Debugging Vercel Bookmark API...')
  console.log(`📱 API URL: ${API_URL}`)
  console.log(`🔑 API Key: ${API_KEY}`)
  console.log()

  try {
    // Test 1: Basic API connectivity
    console.log('🌐 Test 1: Checking API connectivity...')
    const healthResponse = await fetch(`${API_URL}`)
    console.log(`✅ Main app: HTTP ${healthResponse.status}`)

    // Test 2: Test bookmark creation with detailed logging
    console.log('\n📚 Test 2: Testing bookmark creation...')
    const testData = {
      url: 'https://react.dev/learn/hooks',
      userMessage: 'Debug test bookmark creation'
    }

    console.log('📤 Sending request:', JSON.stringify(testData, null, 2))

    const response = await fetch(`${API_URL}/api/clawdbot/bookmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY
      },
      body: JSON.stringify(testData)
    })

    console.log(`📊 Response Status: HTTP ${response.status}`)
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const result = await response.json()
      console.log('\n✅ SUCCESS! Bookmark API is working')
      console.log('📋 Full Response:')
      console.log(JSON.stringify(result, null, 2))

      console.log('\n📱 Formatted WhatsApp Message:')
      console.log('─'.repeat(50))
      console.log(result.whatsappMessage)
      console.log('─'.repeat(50))

      console.log('\n📊 Bookmark Details:')
      console.log(`   ID: ${result.bookmark?.id}`)
      console.log(`   Title: ${result.bookmark?.title}`)
      console.log(`   Tags: ${result.bookmark?.tags?.join(', ')}`)
      console.log(`   Priority: ${result.bookmark?.priority}`)
      console.log(`   URL: ${result.bookmark?.url}`)

    } else {
      const errorText = await response.text()
      console.log('\n❌ API Error:')
      console.log(`Status: ${response.status} ${response.statusText}`)
      console.log('Error details:')
      
      try {
        const errorJson = JSON.parse(errorText)
        console.log(JSON.stringify(errorJson, null, 2))
      } catch {
        console.log(errorText.substring(0, 1000))
      }

      console.log('\n🔧 Possible issues:')
      console.log('   1. Environment variables missing on Vercel')
      console.log('   2. Database connection issues')
      console.log('   3. Authentication problems')
      console.log('   4. User creation failing')
    }

    // Test 3: Check environment variables (indirect test)
    console.log('\n⚙️  Test 3: Testing authentication...')
    const authTestResponse = await fetch(`${API_URL}/api/clawdbot/bookmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'invalid-key'
      },
      body: JSON.stringify({ url: 'https://example.com' })
    })

    console.log(`🔐 Auth test: HTTP ${authTestResponse.status}`)
    if (authTestResponse.status === 401) {
      console.log('✅ Authentication is working (invalid key rejected)')
    } else {
      console.log('⚠️  Authentication may not be working properly')
    }

  } catch (error) {
    console.log('\n❌ Connection Error:', error.message)
    console.log('\n🔧 This suggests:')
    console.log('   1. Network connectivity issues')
    console.log('   2. Vercel app is down or not deployed')
    console.log('   3. DNS resolution problems')
  }

  console.log('\n🎯 Next Steps:')
  console.log('   1. Check Vercel dashboard for deployment status')
  console.log('   2. Verify environment variables are set')
  console.log('   3. Check Vercel function logs for errors')
  console.log('   4. Test the web interface manually')
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

debugVercelAPI().catch(error => {
  console.error('❌ Debug failed:', error.message)
  process.exit(1)
})