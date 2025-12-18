import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IJobLink extends Document {
  title: string
  url: string
  company: string
  status: 'applied' | 'interview' | 'rejected' | 'offer'
  userId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const JobLinkSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'interview', 'rejected', 'offer'],
      default: 'applied',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const JobLink: Model<IJobLink> =
  mongoose.models.JobLink || mongoose.model<IJobLink>('JobLink', JobLinkSchema)

export default JobLink

