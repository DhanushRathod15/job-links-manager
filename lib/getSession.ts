import { getServerSession as getNextAuthServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

/**
 * Get the current session on the server side (for API routes and server components)
 * Usage: const session = await getServerSession()
 */
export async function getServerSession() {
  return await getNextAuthServerSession(authOptions)
}


