import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticate, AuthenticatedRequest } from '@/lib/authMiddleware'
import connectDB from '@/lib/db'
import User from '@/models/User'

type Email = {
  subject: string
  snippet: string
  sender: string
  timestamp: number
  messageId: string
}

type Data = {
  emails?: Email[]
  total?: number
  error?: string
}

// Gmail search query to find job-related emails
// Uses Gmail search operators to filter relevant emails
const JOB_SEARCH_QUERIES = [
  // Job opportunity keywords in subject
  'subject:(job OR career OR position OR opportunity OR hiring OR opening OR vacancy OR recruit)',
  // Common job platform senders
  'from:(linkedin.com OR indeed.com OR glassdoor.com OR ziprecruiter.com OR dice.com OR hired.com OR wellfound.com OR angel.co)',
  // Application-related emails
  'subject:(application OR applied OR interview OR offer)',
  // Recruiter emails
  'from:(recruiter OR talent OR hr OR hiring OR careers)',
]

// Build the Gmail search query
function buildJobSearchQuery(): string {
  // Combine all queries with OR
  const combinedQuery = `(${JOB_SEARCH_QUERIES.join(' OR ')})`
  // Only search in inbox, last 30 days for efficiency
  return `in:inbox newer_than:30d ${combinedQuery}`
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
    const errorData = await response.json().catch(() => ({}))
    console.error('Token refresh error:', errorData)
    throw new Error('Failed to refresh access token. Please sign in again.')
  }

  const data = await response.json()
  return data.access_token
}

async function fetchGmailMessages(
  accessToken: string,
  useJobFilter: boolean = true,
  maxResults: number = 50
): Promise<Email[]> {
  // Build the search query
  const query = useJobFilter ? buildJobSearchQuery() : 'in:inbox'
  const encodedQuery = encodeURIComponent(query)

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodedQuery}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Gmail messages fetch error:', errorData)
    throw new Error('Failed to fetch Gmail messages')
  }

  const data = await response.json()
  const messageIds = data.messages?.map((msg: { id: string }) => msg.id) || []

  if (messageIds.length === 0) {
    return []
  }

  // Fetch message details in parallel with rate limiting
  const batchSize = 10
  const allEmails: Email[] = []

  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize)
    const emailPromises = batch.map(async (messageId: string) => {
      try {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
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
        const headers = msgData.payload?.headers || []

        const subjectHeader = headers.find(
          (h: { name: string }) => h.name.toLowerCase() === 'subject'
        )
        const fromHeader = headers.find(
          (h: { name: string }) => h.name.toLowerCase() === 'from'
        )

        const subject = subjectHeader?.value || '(No Subject)'
        const sender = fromHeader?.value || ''
        const snippet = msgData.snippet || ''
        const timestamp = parseInt(msgData.internalDate || '0')

        return {
          subject,
          snippet,
          sender,
          timestamp,
          messageId,
        }
      } catch (error) {
        console.error(`Error fetching message ${messageId}:`, error)
        return null
      }
    })

    const batchResults = await Promise.all(emailPromises)
    allEmails.push(...batchResults.filter((email): email is Email => email !== null))
  }

  // Sort by timestamp (newest first)
  allEmails.sort((a, b) => b.timestamp - a.timestamp)

  return allEmails
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  authenticate(req as AuthenticatedRequest, res, async () => {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      // Get query parameters
      const { filter = 'true', maxResults = '50' } = req.query
      const useJobFilter = filter !== 'false'
      const limit = Math.min(parseInt(maxResults as string, 10) || 50, 100)

      await connectDB()

      const user = await User.findById(userId)

      if (!user || !user.refreshToken) {
        return res.status(400).json({
          error: 'Gmail not connected. Please sign in again to grant Gmail access.',
        })
      }

      const accessToken = await getAccessToken(user.refreshToken)
      const emails = await fetchGmailMessages(accessToken, useJobFilter, limit)

      return res.status(200).json({ 
        emails,
        total: emails.length,
      })
    } catch (error) {
      console.error('Error in /api/gmail/fetch:', error)
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch Gmail messages',
      })
    }
  })
}
