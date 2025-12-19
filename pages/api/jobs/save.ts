import type { NextApiRequest, NextApiResponse } from 'next'
import { authenticate, AuthenticatedRequest } from '@/lib/authMiddleware'
import connectDB from '@/lib/db'
import JobLink, { JobSource } from '@/models/JobLink'
import { detectJobLink, extractSourceFromUrl } from '@/utils/jobLinkDetector'
import { extractMetadata, normalizeUrl } from '@/utils/metadataExtractor'
import { extractTags, suggestTagsFromTitle } from '@/utils/categorizer'

type EmailContext = {
  subject?: string
  sender?: string
  snippet?: string
}

type UrlInput = {
  url: string
  emailContext?: EmailContext
}

type Data = {
  saved?: number
  duplicates?: number
  filtered?: number
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  authenticate(req as AuthenticatedRequest, res, async () => {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      const { urls, urlsWithContext, source = 'gmail', filterJobLinks = true } = req.body

      // Support both simple URLs array and URLs with email context
      let urlInputs: UrlInput[] = []

      if (urlsWithContext && Array.isArray(urlsWithContext)) {
        urlInputs = urlsWithContext.filter(
          (item: any) => item && typeof item.url === 'string' && item.url.trim().length > 0
        )
      } else if (urls && Array.isArray(urls)) {
        urlInputs = urls
          .filter((url: any) => typeof url === 'string' && url.trim().length > 0)
          .map((url: string) => ({ url: url.trim() }))
      }

      if (urlInputs.length === 0) {
        return res.status(400).json({ error: 'No valid URLs provided' })
      }

      await connectDB()

      // Filter to only job-related links if enabled
      let processedUrls = urlInputs
      let filteredCount = 0

      if (filterJobLinks) {
        processedUrls = urlInputs.filter((input) => {
          const detection = detectJobLink(input.url, input.emailContext)
          return detection.isJobLink
        })
        filteredCount = urlInputs.length - processedUrls.length
      }

      if (processedUrls.length === 0) {
        return res.status(200).json({ 
          saved: 0, 
          duplicates: 0, 
          filtered: filteredCount,
          error: 'No job-related URLs found in the provided links'
        })
      }

      // Normalize URLs and check for duplicates
      const normalizedUrls = processedUrls.map(input => normalizeUrl(input.url))
      
      // Find existing job links with matching normalized URLs
      const existingLinks = await JobLink.find({
        userId,
        normalizedUrl: { $in: normalizedUrls }
      }).select('normalizedUrl')

      const existingNormalizedUrls = new Set(existingLinks.map(link => link.normalizedUrl))

      // Filter out duplicates
      const newUrlInputs = processedUrls.filter(input => {
        const normalized = normalizeUrl(input.url)
        return !existingNormalizedUrls.has(normalized)
      })

      const duplicateCount = processedUrls.length - newUrlInputs.length

      if (newUrlInputs.length === 0) {
        return res.status(200).json({ 
          saved: 0, 
          duplicates: duplicateCount,
          filtered: filteredCount 
        })
      }

      // Create job link documents with extracted metadata
      const jobLinkDocs = newUrlInputs.map((input) => {
        const detection = detectJobLink(input.url, input.emailContext)
        const metadata = extractMetadata(input.url, input.emailContext)
        const detectedSource = extractSourceFromUrl(input.url)

        // Determine the source based on detection
        let jobSource: JobSource = source as JobSource
        if (detectedSource.toLowerCase() === 'linkedin') {
          jobSource = 'linkedin'
        } else if (detectedSource.toLowerCase() === 'indeed') {
          jobSource = 'indeed'
        } else if (detectedSource.toLowerCase() === 'glassdoor') {
          jobSource = 'glassdoor'
        }

        // Extract tags from title and email content
        const combinedContent = [
          metadata.title,
          input.emailContext?.subject || '',
          input.emailContext?.snippet || '',
        ].join(' ')
        const contentTags = extractTags(combinedContent, 3)
        const titleTags = suggestTagsFromTitle(metadata.title)
        const allTags = [...new Set([...titleTags, ...contentTags])].slice(0, 5)

        return {
          userId,
          url: input.url.trim(),
          normalizedUrl: normalizeUrl(input.url),
          title: metadata.title,
          company: metadata.company,
          location: metadata.location,
          jobType: metadata.jobType,
          source: jobSource,
          status: 'saved' as const,
          confidence: detection.confidence,
          emailSubject: input.emailContext?.subject,
          emailSender: input.emailContext?.sender,
          tags: allTags,
          extractedAt: new Date(),
        }
      })

      // Insert all new job links
      await JobLink.insertMany(jobLinkDocs, { ordered: false })

      return res.status(200).json({ 
        saved: jobLinkDocs.length,
        duplicates: duplicateCount,
        filtered: filteredCount
      })
    } catch (error) {
      console.error('Error in /api/jobs/save:', error)
      
      // Handle duplicate key errors gracefully
      if ((error as any).code === 11000) {
        return res.status(200).json({ 
          saved: 0, 
          duplicates: 1,
          error: 'Some job links were already saved'
        })
      }

      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to save job links',
      })
    }
  })
}
