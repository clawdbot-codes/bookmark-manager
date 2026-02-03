#!/usr/bin/env node

/**
 * Quick status check for WhatsApp bookmark integration
 */

const fs = require('fs')

function checkIntegrationStatus() {
  console.log('🔍 Checking WhatsApp Bookmark Integration Status...\n')
  
  // Check environment variables
  console.log('📊 Environment Configuration:')
  console.log('✅ BOOKMARK_API_URL:', process.env.BOOKMARK_API_URL || 'Not set')
  console.log('✅ BOOKMARK_API_KEY:', process.env.BOOKMARK_API_KEY ? '[SET]' : 'Not set')
  console.log()
  
  // Check required files
  console.log('📁 Required Files:')
  const requiredFiles = [
    'whatsapp-bookmark-handler.js',
    'test-whatsapp-bookmark.js', 
    'clawdbot-integration-example.js',
    '.env'
  ]
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(file)
    console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'Found' : 'Missing'}`)
  })
  
  console.log()
  
  // Check .env file content
  if (fs.existsSync('.env')) {
    console.log('📋 Environment File Content:')
    const envContent = fs.readFileSync('.env', 'utf8')
    console.log(envContent)
  }
  
  console.log('🎯 Integration Status:')
  
  if (process.env.BOOKMARK_API_URL && process.env.BOOKMARK_API_KEY) {
    console.log('✅ Environment variables configured')
    console.log('✅ Vercel deployment URL set')
    console.log('✅ API key configured')
    console.log()
    console.log('🚀 Ready for integration!')
    console.log('📝 Next step: Run "node test-whatsapp-bookmark.js"')
  } else {
    console.log('❌ Environment variables missing')
    console.log('📝 Run: source .env && node check-integration-status.js')
  }
  
  console.log()
  console.log('📱 Test command: node test-whatsapp-bookmark.js')
  console.log('🔗 Vercel app: https://bookmark-manager-beryl.vercel.app')
}

checkIntegrationStatus()