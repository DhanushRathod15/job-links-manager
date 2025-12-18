/**
 * Type definitions and interfaces
 */

export interface JobLink {
  id: string
  title: string
  url: string
  company: string
  status: 'applied' | 'interview' | 'rejected' | 'offer'
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

