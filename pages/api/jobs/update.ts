import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticate, AuthenticatedRequest } from '@/lib/authMiddleware'
import connectDB from '@/lib/db'
import JobLink, { JobStatus, JobType } from '@/models/JobLink'

type Data = {
  success?: boolean
  jobLink?: {
    id: string
    status: JobStatus
    updatedAt: string
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Handle DELETE method
  if (req.method === 'DELETE') {
    return handleDelete(req, res)
  }

  // Handle PATCH method for updates
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  authenticate(req as AuthenticatedRequest, res, async () => {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      const { id, status, title, company, location, jobType, notes, tags } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Job link ID is required' })
      }

      await connectDB()

      // Find the job link and verify ownership
      const jobLink = await JobLink.findOne({ _id: id, userId })

      if (!jobLink) {
        return res.status(404).json({ error: 'Job link not found' })
      }

      // Build update object with only provided fields
      const updateFields: Record<string, any> = {}

      if (status !== undefined) {
        const validStatuses: JobStatus[] = ['saved', 'applied', 'interview', 'rejected', 'offer']
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: 'Invalid status value' })
        }
        updateFields.status = status
      }

      if (title !== undefined) {
        updateFields.title = title.trim()
      }

      if (company !== undefined) {
        updateFields.company = company.trim()
      }

      if (location !== undefined) {
        updateFields.location = location.trim() || undefined
      }

      if (jobType !== undefined) {
        const validJobTypes: (JobType | '')[] = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary', 'Remote', 'Hybrid', 'On-site', '']
        if (!validJobTypes.includes(jobType)) {
          return res.status(400).json({ error: 'Invalid job type value' })
        }
        updateFields.jobType = jobType || undefined
      }

      if (notes !== undefined) {
        updateFields.notes = notes.trim() || undefined
      }

      if (tags !== undefined) {
        if (!Array.isArray(tags)) {
          return res.status(400).json({ error: 'Tags must be an array' })
        }
        updateFields.tags = tags.filter((tag: any) => typeof tag === 'string' && tag.trim())
      }

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }

      // Update the job link
      const updatedJobLink = await JobLink.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
      )

      if (!updatedJobLink) {
        return res.status(500).json({ error: 'Failed to update job link' })
      }

      return res.status(200).json({
        success: true,
        jobLink: {
          id: updatedJobLink._id.toString(),
          status: updatedJobLink.status,
          updatedAt: updatedJobLink.updatedAt.toISOString(),
        },
      })
    } catch (error) {
      console.error('Error in /api/jobs/update:', error)
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to update job link',
      })
    }
  })
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse<Data>) {
  authenticate(req as AuthenticatedRequest, res, async () => {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      const { id } = req.query

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Job link ID is required' })
      }

      await connectDB()

      // Find and delete the job link, verifying ownership
      const result = await JobLink.findOneAndDelete({ _id: id, userId })

      if (!result) {
        return res.status(404).json({ error: 'Job link not found' })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error in /api/jobs/update (DELETE):', error)
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete job link',
      })
    }
  })
}
