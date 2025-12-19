/**
 * Utility to intelligently identify job-related URLs from extracted URLs
 */

// Known job board domains
const JOB_BOARD_DOMAINS = [
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'ziprecruiter.com',
  'careerbuilder.com',
  'dice.com',
  'simplyhired.com',
  'lever.co',
  'greenhouse.io',
  'workday.com',
  'icims.com',
  'smartrecruiters.com',
  'jobvite.com',
  'breezy.hr',
  'ashbyhq.com',
  'jobs.lever.co',
  'boards.greenhouse.io',
  'angel.co',
  'wellfound.com',
  'hired.com',
  'stackoverflow.com/jobs',
  'weworkremotely.com',
  'remoteok.com',
  'flexjobs.com',
  'remote.co',
  'builtin.com',
  'themuse.com',
  'idealist.org',
  'usajobs.gov',
  'governmentjobs.com',
  'naukri.com',
  'seek.com.au',
  'reed.co.uk',
  'totaljobs.com',
  'cwjobs.co.uk',
  'stepstone.de',
  'xing.com',
  'hh.ru',
]

// URL path patterns that indicate job postings
const JOB_PATH_PATTERNS = [
  /\/jobs?\//i,
  /\/careers?\//i,
  /\/positions?\//i,
  /\/openings?\//i,
  /\/opportunities?\//i,
  /\/vacancies?\//i,
  /\/hiring\//i,
  /\/apply\//i,
  /\/job-/i,
  /\/career-/i,
  /-job\//i,
  /-jobs\//i,
  /\/job_/i,
  /\/join-us/i,
  /\/join-our-team/i,
  /\/work-with-us/i,
  /\/employment/i,
  /\/recruiting/i,
]

// Keywords in URLs that suggest job-related content
const JOB_URL_KEYWORDS = [
  'job',
  'career',
  'position',
  'opening',
  'opportunity',
  'vacancy',
  'hiring',
  'apply',
  'employment',
  'recruit',
  'talent',
  'work-with-us',
  'join-us',
  'join-our-team',
]

// Email subject patterns that indicate job-related content
const JOB_EMAIL_SUBJECT_PATTERNS = [
  /job\s*(opportunity|opening|position|alert|posting)/i,
  /career\s*(opportunity|opening|position)/i,
  /we('re|are)\s*hiring/i,
  /invitation\s*to\s*(apply|interview)/i,
  /application\s*(received|status|update)/i,
  /thank\s*you\s*for\s*(applying|your\s*application)/i,
  /interview\s*(invitation|request|schedule)/i,
  /new\s*job\s*(match|alert|recommendation)/i,
  /position\s*(available|open)/i,
  /join\s*(our\s*team|us)/i,
  /talent\s*(network|community)/i,
  /recruiter/i,
  /hiring\s*manager/i,
]

// Known recruiter/job board sender domains
const JOB_SENDER_DOMAINS = [
  'linkedin.com',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'ziprecruiter.com',
  'dice.com',
  'hired.com',
  'angel.co',
  'wellfound.com',
  'lever.co',
  'greenhouse.io',
  'workday.com',
  'icims.com',
  'smartrecruiters.com',
  'jobvite.com',
  'ashbyhq.com',
  'breezy.hr',
]

export interface EmailContext {
  subject?: string
  sender?: string
  snippet?: string
}

export interface JobLinkDetectionResult {
  url: string
  isJobLink: boolean
  confidence: 'high' | 'medium' | 'low'
  source?: string
  reasons: string[]
}

/**
 * Check if a domain is a known job board
 */
function isJobBoardDomain(url: string): { isJobBoard: boolean; domain?: string } {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    for (const domain of JOB_BOARD_DOMAINS) {
      if (hostname.includes(domain) || hostname.endsWith(domain)) {
        return { isJobBoard: true, domain }
      }
    }
    return { isJobBoard: false }
  } catch {
    return { isJobBoard: false }
  }
}

/**
 * Check if URL path matches job-related patterns
 */
function hasJobPathPattern(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const pathAndQuery = urlObj.pathname + urlObj.search
    
    return JOB_PATH_PATTERNS.some(pattern => pattern.test(pathAndQuery))
  } catch {
    return false
  }
}

/**
 * Check if URL contains job-related keywords
 */
function hasJobKeywords(url: string): boolean {
  const lowerUrl = url.toLowerCase()
  return JOB_URL_KEYWORDS.some(keyword => lowerUrl.includes(keyword))
}

/**
 * Check if email subject indicates job-related content
 */
function isJobRelatedSubject(subject: string): boolean {
  return JOB_EMAIL_SUBJECT_PATTERNS.some(pattern => pattern.test(subject))
}

/**
 * Check if sender is from a known job platform
 */
function isJobSender(sender: string): boolean {
  const lowerSender = sender.toLowerCase()
  return JOB_SENDER_DOMAINS.some(domain => lowerSender.includes(domain))
}

/**
 * Detect if a URL is a job-related link
 */
export function detectJobLink(url: string, emailContext?: EmailContext): JobLinkDetectionResult {
  const reasons: string[] = []
  let confidenceScore = 0

  // Check job board domain
  const { isJobBoard, domain } = isJobBoardDomain(url)
  if (isJobBoard) {
    reasons.push(`URL is from known job board: ${domain}`)
    confidenceScore += 40
  }

  // Check URL path patterns
  if (hasJobPathPattern(url)) {
    reasons.push('URL path matches job-related patterns')
    confidenceScore += 30
  }

  // Check URL keywords
  if (hasJobKeywords(url)) {
    reasons.push('URL contains job-related keywords')
    confidenceScore += 20
  }

  // Check email context if provided
  if (emailContext) {
    if (emailContext.subject && isJobRelatedSubject(emailContext.subject)) {
      reasons.push('Email subject indicates job-related content')
      confidenceScore += 25
    }

    if (emailContext.sender && isJobSender(emailContext.sender)) {
      reasons.push('Email sender is from known job platform')
      confidenceScore += 20
    }

    // Check if snippet contains job-related terms
    if (emailContext.snippet) {
      const lowerSnippet = emailContext.snippet.toLowerCase()
      const jobTerms = ['job', 'position', 'role', 'opportunity', 'career', 'apply', 'hiring']
      const foundTerms = jobTerms.filter(term => lowerSnippet.includes(term))
      if (foundTerms.length >= 2) {
        reasons.push(`Email snippet contains job terms: ${foundTerms.join(', ')}`)
        confidenceScore += 15
      }
    }
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low'
  if (confidenceScore >= 50) {
    confidence = 'high'
  } else if (confidenceScore >= 30) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  const isJobLink = confidenceScore >= 30

  return {
    url,
    isJobLink,
    confidence,
    source: domain,
    reasons,
  }
}

/**
 * Filter an array of URLs to only include job-related links
 */
export function filterJobLinks(
  urls: string[],
  emailContext?: EmailContext,
  minConfidence: 'high' | 'medium' | 'low' = 'medium'
): JobLinkDetectionResult[] {
  const confidenceLevels = { high: 3, medium: 2, low: 1 }
  const minLevel = confidenceLevels[minConfidence]

  return urls
    .map(url => detectJobLink(url, emailContext))
    .filter(result => {
      if (!result.isJobLink) return false
      return confidenceLevels[result.confidence] >= minLevel
    })
}

/**
 * Extract source/platform name from URL
 */
export function extractSourceFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Check known job boards first
    for (const domain of JOB_BOARD_DOMAINS) {
      if (hostname.includes(domain)) {
        // Extract the main domain name
        const parts = domain.split('.')
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
      }
    }

    // Extract domain name for unknown sources
    const parts = hostname.replace('www.', '').split('.')
    if (parts.length >= 2) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    }
    return 'Unknown'
  } catch {
    return 'Unknown'
  }
}
