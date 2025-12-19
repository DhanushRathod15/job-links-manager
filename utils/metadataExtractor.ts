/**
 * Utility to extract job metadata (title, company) from URLs and email content
 */

export interface ExtractedMetadata {
  title: string
  company: string
  location?: string
  jobType?: string
}

export interface EmailData {
  subject?: string
  sender?: string
  snippet?: string
}

// Company name mappings for known domains
const DOMAIN_TO_COMPANY: Record<string, string> = {
  'linkedin.com': 'LinkedIn',
  'indeed.com': 'Indeed',
  'glassdoor.com': 'Glassdoor',
  'monster.com': 'Monster',
  'ziprecruiter.com': 'ZipRecruiter',
  'dice.com': 'Dice',
  'hired.com': 'Hired',
  'angel.co': 'AngelList',
  'wellfound.com': 'Wellfound',
  'lever.co': 'Lever',
  'greenhouse.io': 'Greenhouse',
  'workday.com': 'Workday',
  'google.com': 'Google',
  'amazon.com': 'Amazon',
  'microsoft.com': 'Microsoft',
  'apple.com': 'Apple',
  'meta.com': 'Meta',
  'facebook.com': 'Meta',
  'netflix.com': 'Netflix',
  'salesforce.com': 'Salesforce',
  'adobe.com': 'Adobe',
  'oracle.com': 'Oracle',
  'ibm.com': 'IBM',
  'intel.com': 'Intel',
  'nvidia.com': 'NVIDIA',
  'spotify.com': 'Spotify',
  'uber.com': 'Uber',
  'lyft.com': 'Lyft',
  'airbnb.com': 'Airbnb',
  'stripe.com': 'Stripe',
  'shopify.com': 'Shopify',
  'twitter.com': 'X (Twitter)',
  'x.com': 'X (Twitter)',
}

// Job type patterns
const JOB_TYPE_PATTERNS: { pattern: RegExp; type: string }[] = [
  { pattern: /full[- ]?time/i, type: 'Full-time' },
  { pattern: /part[- ]?time/i, type: 'Part-time' },
  { pattern: /contract/i, type: 'Contract' },
  { pattern: /freelance/i, type: 'Freelance' },
  { pattern: /intern(ship)?/i, type: 'Internship' },
  { pattern: /temporary/i, type: 'Temporary' },
  { pattern: /remote/i, type: 'Remote' },
  { pattern: /hybrid/i, type: 'Hybrid' },
  { pattern: /on[- ]?site/i, type: 'On-site' },
]

/**
 * Extract company name from URL
 */
export function extractCompanyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '')

    // Check known company domains
    for (const [domain, company] of Object.entries(DOMAIN_TO_COMPANY)) {
      if (hostname.includes(domain)) {
        return company
      }
    }

    // Handle job board URLs with company info in path
    // e.g., jobs.lever.co/company-name or boards.greenhouse.io/company
    if (hostname.includes('lever.co') || hostname.includes('greenhouse.io')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (pathParts.length > 0) {
        return formatCompanyName(pathParts[0])
      }
    }

    // Handle LinkedIn job URLs
    if (hostname.includes('linkedin.com')) {
      // LinkedIn job URLs often have company in the path or can't extract easily
      return 'LinkedIn Job'
    }

    // Extract from subdomain (e.g., careers.company.com)
    const parts = hostname.split('.')
    if (parts.length >= 2) {
      // If it's a careers/jobs subdomain, use the main domain
      if (['careers', 'jobs', 'work', 'talent', 'recruiting'].includes(parts[0])) {
        return formatCompanyName(parts[1])
      }
      // Otherwise use the first part that's not a common subdomain
      return formatCompanyName(parts[0])
    }

    return 'Unknown Company'
  } catch {
    return 'Unknown Company'
  }
}

/**
 * Format company name from URL slug
 */
function formatCompanyName(slug: string): string {
  if (!slug) return 'Unknown Company'
  
  // Replace hyphens and underscores with spaces
  const formatted = slug
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  return formatted || 'Unknown Company'
}

/**
 * Extract job title from URL
 */
export function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    
    // Try to find job title in path
    // Common patterns: /jobs/software-engineer, /positions/123-senior-developer
    const pathParts = path.split('/').filter(Boolean)
    
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i]
      
      // Skip numeric IDs
      if (/^\d+$/.test(part)) continue
      
      // Skip common non-title segments
      if (['jobs', 'job', 'careers', 'positions', 'apply', 'view'].includes(part.toLowerCase())) {
        continue
      }
      
      // Found a potential title
      // Remove leading numbers/IDs (e.g., "123-software-engineer")
      const cleaned = part.replace(/^\d+[-_]?/, '')
      if (cleaned) {
        return formatJobTitle(cleaned)
      }
    }

    return 'Job Opportunity'
  } catch {
    return 'Job Opportunity'
  }
}

/**
 * Format job title from URL slug
 */
function formatJobTitle(slug: string): string {
  if (!slug) return 'Job Opportunity'
  
  // Replace hyphens and underscores with spaces
  const formatted = slug
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => {
      // Keep certain words lowercase
      if (['and', 'or', 'of', 'the', 'in', 'at', 'for'].includes(word.toLowerCase())) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
  
  // Capitalize first letter always
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/**
 * Extract job type from text content
 */
export function extractJobType(text: string): string | undefined {
  for (const { pattern, type } of JOB_TYPE_PATTERNS) {
    if (pattern.test(text)) {
      return type
    }
  }
  return undefined
}

/**
 * Extract location from text content
 */
export function extractLocation(text: string): string | undefined {
  // Common location patterns
  const locationPatterns = [
    // City, State format
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\b/,
    // Remote patterns
    /\b(remote|work from home|wfh)\b/i,
    // US cities
    /\b(New York|San Francisco|Los Angeles|Seattle|Austin|Boston|Chicago|Denver|Atlanta|Miami|Dallas|Houston)\b/i,
    // Countries
    /\b(United States|USA|UK|Canada|Germany|India|Australia)\b/i,
  ]

  for (const pattern of locationPatterns) {
    const match = text.match(pattern)
    if (match) {
      if (pattern.toString().includes('remote')) {
        return 'Remote'
      }
      return match[0]
    }
  }

  return undefined
}

/**
 * Extract company name from email subject
 */
export function extractCompanyFromSubject(subject: string): string | undefined {
  // Pattern: "Company Name" or "at Company Name" or "from Company Name"
  const patterns = [
    /(?:at|from|with)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s+[-–—]|\s*[|:]|\s+is|\s+has|\s*$)/i,
    /^([A-Z][A-Za-z0-9\s&]+?)(?:\s+[-–—]|\s*[|:]|\s+is|\s+has)/,
    /application\s+(?:to|for|at)\s+([A-Z][A-Za-z0-9\s&]+)/i,
  ]

  for (const pattern of patterns) {
    const match = subject.match(pattern)
    if (match && match[1]) {
      const company = match[1].trim()
      // Filter out common false positives
      if (!['Your', 'New', 'The', 'Job', 'We', 'Thank'].includes(company)) {
        return company
      }
    }
  }

  return undefined
}

/**
 * Extract job title from email subject
 */
export function extractTitleFromSubject(subject: string): string | undefined {
  // Patterns to find job titles in subjects
  const patterns = [
    /(?:position|role|job|opportunity):\s*(.+?)(?:\s+at|\s+[-–—]|$)/i,
    /(?:apply for|application for|interested in)\s+(?:the\s+)?(.+?)(?:\s+position|\s+role|\s+at|$)/i,
    /^(.+?)\s+(?:position|role|job|opportunity)\b/i,
  ]

  for (const pattern of patterns) {
    const match = subject.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return undefined
}

/**
 * Extract metadata from URL and optional email context
 */
export function extractMetadata(url: string, emailData?: EmailData): ExtractedMetadata {
  let title = extractTitleFromUrl(url)
  let company = extractCompanyFromUrl(url)
  let location: string | undefined
  let jobType: string | undefined

  // Try to get better metadata from email if available
  if (emailData) {
    const combinedText = [
      emailData.subject || '',
      emailData.snippet || '',
    ].join(' ')

    // Try to extract from subject first (often more accurate)
    if (emailData.subject) {
      const subjectTitle = extractTitleFromSubject(emailData.subject)
      if (subjectTitle && subjectTitle !== 'Job Opportunity') {
        title = subjectTitle
      }

      const subjectCompany = extractCompanyFromSubject(emailData.subject)
      if (subjectCompany && company === 'Unknown Company') {
        company = subjectCompany
      }
    }

    // Extract location and job type from combined text
    location = extractLocation(combinedText)
    jobType = extractJobType(combinedText)
  }

  return {
    title,
    company,
    location,
    jobType,
  }
}

/**
 * Clean and normalize a URL for deduplication
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'source', 'fbclid', 'gclid', 'mc_cid', 'mc_eid',
      'trk', 'trackingId', 'refId', 'originalReferer',
    ]
    
    trackingParams.forEach(param => urlObj.searchParams.delete(param))
    
    // Normalize hostname
    let hostname = urlObj.hostname.toLowerCase()
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4)
    }
    
    // Rebuild URL without trailing slash
    let normalized = `${urlObj.protocol}//${hostname}${urlObj.pathname.replace(/\/$/, '')}`
    
    // Add remaining query params if any
    const remainingParams = urlObj.searchParams.toString()
    if (remainingParams) {
      normalized += `?${remainingParams}`
    }
    
    return normalized.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}
