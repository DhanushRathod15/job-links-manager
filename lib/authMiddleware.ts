import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyAccessToken, TokenPayload } from '@/lib/jwt'

export interface AuthenticatedRequest extends NextApiRequest {
  user?: TokenPayload
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.substring(7)
  const payload = verifyAccessToken(token)

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = payload
  next()
}
