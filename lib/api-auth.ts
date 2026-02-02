// API Key authentication for Clawdbot integration

import { NextRequest } from 'next/server'

// Generate this once and add to your .env
const CLAWDBOT_API_KEY = process.env.CLAWDBOT_API_KEY || 'bookmark-api-key-change-this-in-production'

export function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return false
  }
  
  // Support both "Bearer TOKEN" and "TOKEN" formats
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7)
    : authHeader
  
  return token === CLAWDBOT_API_KEY
}

export function createApiUnauthorizedResponse() {
  return new Response(
    JSON.stringify({ 
      error: 'Unauthorized', 
      message: 'Invalid or missing API key' 
    }), 
    { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}

export function getApiKey(): string {
  return CLAWDBOT_API_KEY
}