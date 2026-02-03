import { NextRequest, NextResponse } from 'next/server'

// DEBUG endpoint to check environment variables (remove after debugging)
export async function GET(request: NextRequest) {
  // Basic security - only show first/last few characters of sensitive values
  const maskValue = (value?: string) => {
    if (!value) return 'NOT_SET'
    if (value.length <= 8) return '***'
    return value.slice(0, 4) + '***' + value.slice(-4)
  }

  const envCheck = {
    CLAWDBOT_API_KEY: maskValue(process.env.CLAWDBOT_API_KEY),
    DEFAULT_USER_ID: process.env.DEFAULT_USER_ID || 'NOT_SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
    NEXTAUTH_SECRET: maskValue(process.env.NEXTAUTH_SECRET),
    DATABASE_URL: maskValue(process.env.DATABASE_URL),
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    timestamp: new Date().toISOString()
  }

  return NextResponse.json({
    message: 'Environment variables check',
    env: envCheck,
    note: 'This debug endpoint should be removed in production'
  })
}