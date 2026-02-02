import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function getAuthenticatedUser(request?: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  return session.user
}

export function createUnauthorizedResponse() {
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  )
}