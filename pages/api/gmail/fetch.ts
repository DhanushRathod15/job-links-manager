import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from '@/lib/getSession'
import connectDB from '@/lib/db'
import User from '@/models/User'

type Email = {
  subject: string
  snippet: string
  timestamp: number
}

type Data = {
  emails?: Email[]
  error?: string
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  const data = await response.json()
  return data.access_token
}

async function fetchGmailMessages(accessToken: string): Promise<Email[]> {
  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:inbox',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Gmail messages')
  }

  const data = await response.json()
  const messageIds = data.messages?.map((msg: { id: string }) => msg.id) || []

  const emailPromises = messageIds.map(async (messageId: string) => {
    const msgResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!msgResponse.ok) {
      return null
    }

    const msgData = await msgResponse.json()
    const subjectHeader = msgData.payload?.headers?.find(
      (h: { name: string }) => h.name === 'Subject'
    )
    const subject = subjectHeader?.value || '(No Subject)'
    const snippet = msgData.snippet || ''
    const timestamp = parseInt(msgData.internalDate || '0')

    return {
      subject,
      snippet,
      timestamp,
    }
  })

  const emails = await Promise.all(emailPromises)
  return emails.filter((email): email is Email => email !== null)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession()

    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })

    if (!user || !user.refreshToken) {
      return res.status(400).json({
        error: 'Gmail not connected. Please sign in again to grant Gmail access.',
      })
    }

    const accessToken = await getAccessToken(user.refreshToken)
    const emails = await fetchGmailMessages(accessToken)

    return res.status(200).json({ emails })
  } catch (error) {
    console.error('Error in /api/gmail/fetch:', error)
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Failed to fetch Gmail messages',
    })
  }
}
