/**
 * Utility helper functions
 */

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Normalize email to match User schema normalization (lowercase + trim)
 * This ensures queries match emails stored in the database
 */
export const normalizeEmail = (email: string | null | undefined): string => {
  if (!email) return ''
  return email.toLowerCase().trim()
}

/**
 * Extract URLs from email content
 * Removes duplicates and returns clean URL list
 */
export const extractUrls = (emailText: string | null | undefined): string[] => {
  if (!emailText) return []

  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
  const urls = emailText.match(urlRegex) || []

  const cleanUrls = urls
    .map((url) => url.trim().replace(/[.,;!?]+$/, ''))
    .filter((url) => url.length > 0)

  return [...new Set(cleanUrls)]
}

