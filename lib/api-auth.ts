// API Authentication for Clawdbot and WhatsApp integration

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Generate this once and add to your .env
const CLAWDBOT_API_KEY = process.env.CLAWDBOT_API_KEY || 'bookmark-api-key-change-this-in-production'

// Hardcoded WhatsApp API key for direct integration
const WHATSAPP_API_KEY = 'bookmark-clawdbot-api-key-2026-secure1757'

/**
 * Validate API key with support for multiple authentication methods:
 * 1. API key authentication (for automation)
 * 2. Session-based authentication (for frontend users)
 */
export async function validateAuthentication(request: NextRequest): Promise<boolean> {
  // First try API key authentication
  const authHeader = request.headers.get('authorization')
  
  if (authHeader) {
    // Support both "Bearer TOKEN" and "TOKEN" formats
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7)
      : authHeader
    
    // Check against both API keys
    if (token === CLAWDBOT_API_KEY || token === WHATSAPP_API_KEY) {
      return true
    }
  }
  
  // If API key check failed, try session authentication
  try {
    const session = await getServerSession(authOptions)
    return !!session
  } catch (error) {
    console.error('Error validating session:', error)
    return false
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use validateAuthentication instead
 */
export function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return false
  }
  
  // Support both "Bearer TOKEN" and "TOKEN" formats
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7)
    : authHeader
  
  // Check against both API keys
  return token === CLAWDBOT_API_KEY || token === WHATSAPP_API_KEY
}

export function createApiUnauthorizedResponse() {
  return new Response(
    JSON.stringify({ 
      error: 'Unauthorized', 
      message: 'Invalid or missing API key or user session' 
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

export function getWhatsAppApiKey(): string {
  return WHATSAPP_API_KEY
}