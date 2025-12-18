import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from '@/lib/getSession'

type Data = {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
  error?: string
}

/**
 * Example API route showing how to read session on the server side
 * GET /api/user/me - Returns the current user's session data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession()

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    return res.status(200).json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
    })
  } catch (error) {
    console.error('Error in /api/user/me:', error)
    return res.status(500).json({
      error: 'Internal server error',
    })
  }
}


