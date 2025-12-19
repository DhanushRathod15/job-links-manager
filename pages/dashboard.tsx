import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/router'
import AuthButton from '@/components/AuthButton'
import JobLinkCard, { JobLinkData } from '@/components/JobLinkCard'
import { JobStatus, JobSource } from '@/models/types'

type Stats = {
  total: number
  byStatus: Record<JobStatus, number>
  bySource: Record<string, number>
}

type SortOption = 'createdAt' | 'title' | 'company' | 'status'
type SortOrder = 'asc' | 'desc'

export default function Dashboard() {
  const { user, accessToken, isLoading: authLoading, refreshAccessToken } = useAuth()
  const router = useRouter()
  const [jobLinks, setJobLinks] = useState<JobLinkData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<JobSource | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Filter and sort job links
  const filteredJobLinks = useMemo(() => {
    let filtered = [...jobLinks]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (link) =>
          link.title.toLowerCase().includes(query) ||
          link.company.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query) ||
          (link.location && link.location.toLowerCase().includes(query))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((link) => link.status === statusFilter)
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((link) => link.source === sourceFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'company':
          comparison = a.company.localeCompare(b.company)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [jobLinks, searchQuery, statusFilter, sourceFilter, sortBy, sortOrder])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    } else if (user) {
      fetchJobLinks()
    }
  }, [user, authLoading, router])

  const fetchJobLinks = async () => {
    try {
      setIsLoading(true)
      const token = accessToken || localStorage.getItem('accessToken')
      const response = await fetch('/api/jobs/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          const newToken = localStorage.getItem('accessToken')
          const retryResponse = await fetch('/api/jobs/list', {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          })
          const retryData = await retryResponse.json()
          if (retryResponse.ok && retryData.jobLinks) {
            setJobLinks(retryData.jobLinks)
            setStats(retryData.stats)
            setError(null)
          } else {
            setError(retryData.error || 'Failed to fetch job links')
          }
          return
        }
      }

      const data = await response.json()

      if (response.ok && data.jobLinks) {
        setJobLinks(data.jobLinks)
        setStats(data.stats)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch job links')
      }
    } catch (err) {
      setError('Failed to fetch job links')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshGmail = async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      setSuccessMessage(null)

      const token = accessToken || localStorage.getItem('accessToken')
      const gmailResponse = await fetch('/api/gmail/fetch', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const gmailData = await gmailResponse.json()

      if (!gmailResponse.ok) {
        throw new Error(gmailData.error || 'Failed to fetch Gmail')
      }

      if (!gmailData.emails || gmailData.emails.length === 0) {
        setError('No emails found')
        return
      }

      // Send URLs with email context for better extraction
      const urlsWithContext = gmailData.emails.flatMap((email: { subject: string; snippet: string; sender?: string }) => {
        const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
        const urls = email.snippet.match(urlRegex) || []
        return urls.map(url => ({
          url: url.trim().replace(/[.,;!?]+$/, ''),
          emailContext: {
            subject: email.subject,
            snippet: email.snippet,
            sender: email.sender,
          }
        }))
      })

      if (urlsWithContext.length === 0) {
        setError('No URLs found in emails')
        return
      }

      const saveResponse = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          urlsWithContext,
          source: 'gmail',
          filterJobLinks: true
        }),
      })

      const saveData = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save job links')
      }

      // Show success message with details
      const messages = []
      if (saveData.saved > 0) messages.push(`${saveData.saved} new job links saved`)
      if (saveData.duplicates > 0) messages.push(`${saveData.duplicates} duplicates skipped`)
      if (saveData.filtered > 0) messages.push(`${saveData.filtered} non-job URLs filtered`)
      
      if (messages.length > 0) {
        setSuccessMessage(messages.join(', '))
      } else {
        setSuccessMessage('Gmail checked - no new job links found')
      }

      await fetchJobLinks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh Gmail')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleStatusChange = async (id: string, status: JobStatus) => {
    try {
      const token = accessToken || localStorage.getItem('accessToken')
      const response = await fetch('/api/jobs/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        // Update local state
        setJobLinks(prev =>
          prev.map(link =>
            link.id === id ? { ...link, status } : link
          )
        )
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update status')
      }
    } catch (err) {
      setError('Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job link?')) return

    try {
      const token = accessToken || localStorage.getItem('accessToken')
      const response = await fetch(`/api/jobs/update?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setJobLinks(prev => prev.filter(link => link.id !== id))
        setSuccessMessage('Job link deleted successfully')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete job link')
      }
    } catch (err) {
      setError('Failed to delete job link')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setSourceFilter('all')
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading your job links...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Head>
        <title>Dashboard - Job Links Manager</title>
        <meta name="description" content="Manage your job application links" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              ← Back to Home
            </Link>
            <AuthButton />
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total Jobs</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.byStatus.applied}</p>
                  <p className="text-sm text-gray-500">Applied</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{stats.byStatus.interview}</p>
                  <p className="text-sm text-gray-500">Interview</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.byStatus.offer}</p>
                  <p className="text-sm text-gray-500">Offers</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-gray-600">{stats.byStatus.saved}</p>
                  <p className="text-sm text-gray-500">Saved</p>
                </div>
              </div>
            )}

            {/* Main Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              {/* Title and Refresh Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                  Job Links Dashboard
                </h1>
                <button
                  onClick={handleRefreshGmail}
                  disabled={isRefreshing}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isRefreshing ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Refreshing...
                    </>
                  ) : (
                    '📧 Refresh Gmail'
                  )}
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {/* Search */}
                <div className="lg:col-span-2">
                  <input
                    type="text"
                    placeholder="Search jobs, companies, URLs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="rejected">Rejected</option>
                  <option value="offer">Offer</option>
                </select>

                {/* Source Filter */}
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as JobSource | 'all')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">All Sources</option>
                  <option value="gmail">Gmail</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="indeed">Indeed</option>
                  <option value="glassdoor">Glassdoor</option>
                  <option value="manual">Manual</option>
                  <option value="other">Other</option>
                </select>

                {/* Sort */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                  >
                    <option value="createdAt">Date</option>
                    <option value="title">Title</option>
                    <option value="company">Company</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all') && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500">Active filters:</span>
                  {searchQuery && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">
                      "{searchQuery}"
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">
                      Status: {statusFilter}
                    </span>
                  )}
                  {sourceFilter !== 'all' && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">
                      Source: {sourceFilter}
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Messages */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                  <p className="text-green-800">{successMessage}</p>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Results Count */}
              <div className="mb-4 text-sm text-gray-500">
                Showing {filteredJobLinks.length} of {jobLinks.length} job links
              </div>

              {/* Job Links List */}
              {jobLinks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600 mb-4 text-lg">No job links found yet.</p>
                  <p className="text-gray-500">
                    Click "Refresh Gmail" to automatically find job links from your inbox.
                  </p>
                </div>
              ) : filteredJobLinks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 mb-4">No job links match your filters.</p>
                  <button
                    onClick={clearFilters}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobLinks.map((link) => (
                    <JobLinkCard
                      key={link.id}
                      jobLink={link}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
