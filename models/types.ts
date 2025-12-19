/**
 * Type definitions and interfaces
 */

export type JobStatus = 'saved' | 'applied' | 'interview' | 'rejected' | 'offer'
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Freelance' | 'Internship' | 'Temporary' | 'Remote' | 'Hybrid' | 'On-site'
export type JobSource = 'gmail' | 'manual' | 'linkedin' | 'indeed' | 'glassdoor' | 'other'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface JobLink {
  id: string
  title: string
  url: string
  normalizedUrl: string
  company: string
  status: JobStatus
  source: JobSource
  location?: string
  jobType?: JobType
  tags: string[]
  emailSubject?: string
  emailSender?: string
  confidence: ConfidenceLevel
  notes?: string
  extractedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface JobLinkCreateInput {
  url: string
  title?: string
  company?: string
  source?: JobSource
  location?: string
  jobType?: JobType
  tags?: string[]
  emailSubject?: string
  emailSender?: string
  confidence?: ConfidenceLevel
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

