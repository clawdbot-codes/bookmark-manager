// API Authentication for Clawdbot, WhatsApp, and Telegram integration

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Generate this once and add to your .env
const CLAWDBOT_API_KEY = process.env.CLAWDBOT_API_KEY || 'bookmark-api-key-change-this-in-production'

// Hardcoded WhatsApp API key for direct integration
const WHATSAPP_API_KEY = 'bookmark-clawdbot-api-key-2026-secure1757'

// Telegram bot token from environment
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

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

    // Check against all API keys (Clawdbot, WhatsApp, Telegram)
    if (token === CLAWDBOT_API_KEY || token === WHATSAPP_API_KEY || (!!TELEGRAM_BOT_TOKEN && token === TELEGRAM_BOT_TOKEN)) {
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

  // Check against all API keys (Clawdbot, WhatsApp, Telegram)
  return token === CLAWDBOT_API_KEY || token === WHATSAPP_API_KEY || (!!TELEGRAM_BOT_TOKEN && token === TELEGRAM_BOT_TOKEN)
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

export function getTelegramBotToken(): string {
  return TELEGRAM_BOT_TOKEN
}