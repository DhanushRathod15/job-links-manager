import mongoose, { Schema, Document, Model } from 'mongoose'

export type JobStatus = 'saved' | 'applied' | 'interview' | 'rejected' | 'offer'
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Freelance' | 'Internship' | 'Temporary' | 'Remote' | 'Hybrid' | 'On-site'
export type JobSource = 'gmail' | 'manual' | 'linkedin' | 'indeed' | 'glassdoor' | 'other'

export interface IJobLink extends Document {
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
  confidence: 'high' | 'medium' | 'low'
  notes?: string
  userId: mongoose.Types.ObjectId
  extractedAt: Date
  createdAt: Date
  updatedAt: Date
}

const JobLinkSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      default: 'Job Opportunity',
    },
    url: {
      type: String,
      required: true,
    },
    normalizedUrl: {
      type: String,
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      default: 'Unknown Company',
    },
    status: {
      type: String,
      enum: ['saved', 'applied', 'interview', 'rejected', 'offer'],
      default: 'saved',
      required: true,
    },
    source: {
      type: String,
      enum: ['gmail', 'manual', 'linkedin', 'indeed', 'glassdoor', 'other'],
      default: 'gmail',
      required: true,
    },
    location: {
      type: String,
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary', 'Remote', 'Hybrid', 'On-site'],
    },
    tags: {
      type: [String],
      default: [],
    },
    emailSubject: {
      type: String,
    },
    emailSender: {
      type: String,
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    notes: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    extractedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient duplicate checking
JobLinkSchema.index({ userId: 1, normalizedUrl: 1 }, { unique: true })

// Text index for full-text search
JobLinkSchema.index({ title: 'text', company: 'text', url: 'text', notes: 'text' })

const JobLink: Model<IJobLink> =
  mongoose.models.JobLink || mongoose.model<IJobLink>('JobLink', JobLinkSchema)

export default JobLink

