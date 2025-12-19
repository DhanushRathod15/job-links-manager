import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticate, AuthenticatedRequest } from '@/lib/authMiddleware'
import connectDB from '@/lib/db'
import JobLink, { JobStatus, JobSource, JobType } from '@/models/JobLink'

type JobLinkData = {
  id: string
  title: string
  url: string
  company: string
  status: JobStatus
  source: JobSource
  location?: string
  jobType?: JobType
  tags: string[]
  confidence: 'high' | 'medium' | 'low'
  emailSubject?: string
  notes?: string
  extractedAt: string
  createdAt: string
  updatedAt: string
}

type Stats = {
  total: number
  byStatus: Record<JobStatus, number>
  bySource: Record<string, number>
}

type Data = {
  jobLinks?: JobLinkData[]
  stats?: Stats
  error?: string
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

      await connectDB()

      // Get query parameters for filtering
      const { 
        status, 
        source, 
        search, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        limit,
        offset
      } = req.query

      // Build query
      const query: Record<string, any> = { userId }

      if (status && typeof status === 'string') {
        query.status = status
      }

      if (source && typeof source === 'string') {
        query.source = source
      }

      if (search && typeof search === 'string') {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { url: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ]
      }

      // Build sort
      const sortField = typeof sortBy === 'string' ? sortBy : 'createdAt'
      const sortDirection = sortOrder === 'asc' ? 1 : -1
      const sort: Record<string, 1 | -1> = { [sortField]: sortDirection }

      // Execute query with optional pagination
      let queryBuilder = JobLink.find(query).sort(sort)

      if (offset && typeof offset === 'string') {
        queryBuilder = queryBuilder.skip(parseInt(offset, 10))
      }

      if (limit && typeof limit === 'string') {
        queryBuilder = queryBuilder.limit(parseInt(limit, 10))
      }

      const jobLinks = await queryBuilder

      // Calculate stats
      const allJobLinks = await JobLink.find({ userId })
      const stats: Stats = {
        total: allJobLinks.length,
        byStatus: {
          saved: 0,
          applied: 0,
          interview: 0,
          rejected: 0,
          offer: 0,
        },
        bySource: {},
      }

      allJobLinks.forEach((link) => {
        stats.byStatus[link.status]++
        stats.bySource[link.source] = (stats.bySource[link.source] || 0) + 1
      })

      // Map to response format
      const jobLinksData: JobLinkData[] = jobLinks.map((link) => ({
        id: link._id.toString(),
        title: link.title,
        url: link.url,
        company: link.company,
        status: link.status,
        source: link.source,
        location: link.location,
        jobType: link.jobType,
        tags: link.tags || [],
        confidence: link.confidence,
        emailSubject: link.emailSubject,
        notes: link.notes,
        extractedAt: link.extractedAt?.toISOString() || link.createdAt.toISOString(),
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
      }))

      return res.status(200).json({ jobLinks: jobLinksData, stats })
    } catch (error) {
      console.error('Error in /api/jobs/list:', error)
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch job links',
      })
    }
  })
}
