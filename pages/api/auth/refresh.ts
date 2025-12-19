import type { NextApiRequest, NextApiResponse } from 'next'
import connectDB from '@/lib/db'
import User from '@/models/User'
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/jwt'

type Data = {
  accessToken?: string
  refreshToken?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }

    const payload = verifyRefreshToken(refreshToken)

    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    await connectDB()

    const user = await User.findById(payload.userId)

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    }

    const newAccessToken = generateAccessToken(tokenPayload)
    const newRefreshToken = generateRefreshToken(tokenPayload)

    await User.updateOne({ _id: user._id }, { refreshToken: newRefreshToken })

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    console.error('Error in /api/auth/refresh:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to refresh token',
    })
  }
}
