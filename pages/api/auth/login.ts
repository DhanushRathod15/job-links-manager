import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/db'
import User from '@/models/User'
import { normalizeEmail } from '@/utils/helpers'
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt'

type Data = {
  accessToken?: string
  refreshToken?: string
  user?: {
    id: string
    name: string
    email: string
  }
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
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    await connectDB()

    const normalizedEmail = normalizeEmail(email)
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    await User.updateOne({ _id: user._id }, { refreshToken })

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Error in /api/auth/login:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to login',
    })
  }
}
