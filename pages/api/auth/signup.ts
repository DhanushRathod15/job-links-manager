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
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    await connectDB()

    const normalizedEmail = normalizeEmail(email)
    const existingUser = await User.findOne({ email: normalizedEmail })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    })

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    await User.updateOne({ _id: user._id }, { refreshToken })

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Error in /api/auth/signup:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create user',
    })
  }
}
