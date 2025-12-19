import { useState } from 'react'
import { JobStatus, JobSource, JobType, ConfidenceLevel } from '@/models/types'

export interface JobLinkData {
  id: string
  title: string
  url: string
  company: string
  status: JobStatus
  source: JobSource
  location?: string
  jobType?: JobType
  tags: string[]
  confidence: ConfidenceLevel
  emailSubject?: string
  notes?: string
  extractedAt: string
  createdAt: string
  updatedAt: string
}

interface JobLinkCardProps {
  jobLink: JobLinkData
  onStatusChange?: (id: string, status: JobStatus) => void
  onDelete?: (id: string) => void
}

const STATUS_COLORS: Record<JobStatus, { bg: string; text: string; border: string }> = {
  saved: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  applied: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  interview: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  offer: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
}

const SOURCE_ICONS: Record<JobSource, string> = {
  gmail: '📧',
  manual: '✏️',
  linkedin: '💼',
  indeed: '🔍',
  glassdoor: '🚪',
  other: '🔗',
}

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: 'text-green-600',
  medium: 'text-yellow-600',
  low: 'text-red-600',
}

export default function JobLinkCard({ jobLink, onStatusChange, onDelete }: JobLinkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusColors = STATUS_COLORS[jobLink.status]
  const sourceIcon = SOURCE_ICONS[jobLink.source] || '🔗'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const handleStatusClick = () => {
    setShowStatusMenu(!showStatusMenu)
  }

  const handleStatusSelect = (status: JobStatus) => {
    if (onStatusChange) {
      onStatusChange(jobLink.id, status)
    }
    setShowStatusMenu(false)
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Main Card Content */}
      <div className="p-4">
        <div className="flex justify-between items-start gap-4">
          {/* Left: Main Info */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-semibold text-gray-900 text-lg truncate mb-1">
              {jobLink.title}
            </h3>

            {/* Company and Location */}
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <span className="font-medium">{jobLink.company}</span>
              {jobLink.location && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm">{jobLink.location}</span>
                </>
              )}
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Status Badge */}
              <div className="relative">
                <button
                  onClick={handleStatusClick}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border} hover:opacity-80 transition-opacity`}
                >
                  {jobLink.status.charAt(0).toUpperCase() + jobLink.status.slice(1)}
                  <span className="ml-1 text-xs">▼</span>
                </button>

                {/* Status Dropdown */}
                {showStatusMenu && (
                  <div className="absolute z-10 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200">
                    {(['saved', 'applied', 'interview', 'rejected', 'offer'] as JobStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusSelect(status)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                          jobLink.status === status ? 'font-medium bg-gray-50' : ''
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Source Badge */}
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                {sourceIcon} {jobLink.source}
              </span>

              {/* Job Type Badge */}
              {jobLink.jobType && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  {jobLink.jobType}
                </span>
              )}

              {/* Confidence Indicator */}
              <span className={`text-xs ${CONFIDENCE_COLORS[jobLink.confidence]}`}>
                ● {jobLink.confidence}
              </span>
            </div>

            {/* URL */}
            <a
              href={jobLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline truncate block"
            >
              {getDomainFromUrl(jobLink.url)}
            </a>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col items-end gap-2">
            <a
              href={jobLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Open →
            </a>
            <span className="text-xs text-gray-500">
              {formatDate(jobLink.createdAt)}
            </span>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {isExpanded ? 'Hide details ▲' : 'Show details ▼'}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Full URL:</span>
              <a
                href={jobLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-indigo-600 hover:underline break-all mt-1"
              >
                {jobLink.url}
              </a>
            </div>

            {jobLink.emailSubject && (
              <div>
                <span className="text-gray-500">Email Subject:</span>
                <p className="text-gray-700 mt-1">{jobLink.emailSubject}</p>
              </div>
            )}

            {jobLink.notes && (
              <div className="col-span-2">
                <span className="text-gray-500">Notes:</span>
                <p className="text-gray-700 mt-1">{jobLink.notes}</p>
              </div>
            )}

            {jobLink.tags.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {jobLink.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-gray-500">Extracted:</span>
              <p className="text-gray-700 mt-1">{formatDate(jobLink.extractedAt)}</p>
            </div>

            <div>
              <span className="text-gray-500">Last Updated:</span>
              <p className="text-gray-700 mt-1">{formatDate(jobLink.updatedAt)}</p>
            </div>
          </div>

          {onDelete && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => onDelete(jobLink.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete this job link
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
