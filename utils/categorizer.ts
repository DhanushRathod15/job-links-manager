/**
 * Utility to auto-categorize job links by type, source, and location
 */

import { JobType, JobSource, ConfidenceLevel } from '@/models/types'

export interface CategoryResult {
  source: JobSource
  jobType?: JobType
  location?: string
  tags: string[]
  confidence: ConfidenceLevel
}

// Source detection patterns
const SOURCE_PATTERNS: { pattern: RegExp; source: JobSource }[] = [
  { pattern: /linkedin\.com/i, source: 'linkedin' },
  { pattern: /indeed\.com/i, source: 'indeed' },
  { pattern: /glassdoor\.com/i, source: 'glassdoor' },
  { pattern: /lever\.co/i, source: 'other' },
  { pattern: /greenhouse\.io/i, source: 'other' },
  { pattern: /workday\.com/i, source: 'other' },
  { pattern: /icims\.com/i, source: 'other' },
  { pattern: /smartrecruiters\.com/i, source: 'other' },
]

// Job type detection patterns
const JOB_TYPE_PATTERNS: { patterns: RegExp[]; type: JobType }[] = [
  { 
    patterns: [/full[- ]?time/i, /\bft\b/i, /permanent/i],
    type: 'Full-time'
  },
  {
    patterns: [/part[- ]?time/i, /\bpt\b/i],
    type: 'Part-time'
  },
  {
    patterns: [/contract/i, /contractor/i, /consulting/i, /\bc2c\b/i, /corp[- ]?to[- ]?corp/i],
    type: 'Contract'
  },
  {
    patterns: [/freelance/i, /freelancer/i, /gig/i],
    type: 'Freelance'
  },
  {
    patterns: [/intern(ship)?/i, /co-op/i, /coop/i, /trainee/i],
    type: 'Internship'
  },
  {
    patterns: [/temporary/i, /temp\b/i, /seasonal/i],
    type: 'Temporary'
  },
  {
    patterns: [/\bremote\b/i, /work from home/i, /\bwfh\b/i, /telecommute/i, /distributed/i],
    type: 'Remote'
  },
  {
    patterns: [/hybrid/i, /flexible/i, /partial remote/i],
    type: 'Hybrid'
  },
  {
    patterns: [/on[- ]?site/i, /in[- ]?office/i, /in[- ]?person/i, /office[- ]?based/i],
    type: 'On-site'
  },
]

// Location patterns
const LOCATION_PATTERNS = {
  // US States (abbreviations)
  states: /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/,
  // Major US cities
  cities: /\b(New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Boston|El Paso|Nashville|Detroit|Portland|Memphis|Louisville|Baltimore|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Kansas City|Atlanta|Miami|Raleigh|Omaha|Oakland)\b/i,
  // Remote indicators
  remote: /\b(remote|anywhere|worldwide|global|distributed)\b/i,
  // Countries
  countries: /\b(United States|USA|US|UK|United Kingdom|Canada|Germany|France|Australia|India|Japan|Singapore|Netherlands|Ireland)\b/i,
  // City, State pattern
  cityState: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\b/,
}

// Tag patterns
const TAG_PATTERNS: { patterns: RegExp[]; tag: string }[] = [
  // Seniority
  { patterns: [/senior/i, /\bsr\.?\b/i, /lead/i], tag: 'Senior' },
  { patterns: [/junior/i, /\bjr\.?\b/i, /entry[- ]?level/i], tag: 'Junior' },
  { patterns: [/mid[- ]?level/i, /mid[- ]?senior/i], tag: 'Mid-level' },
  { patterns: [/principal/i, /staff/i, /architect/i], tag: 'Principal' },
  { patterns: [/manager/i, /director/i, /head of/i], tag: 'Management' },
  
  // Tech stack
  { patterns: [/react/i, /reactjs/i], tag: 'React' },
  { patterns: [/node\.?js/i, /nodejs/i], tag: 'Node.js' },
  { patterns: [/python/i], tag: 'Python' },
  { patterns: [/java\b/i], tag: 'Java' },
  { patterns: [/typescript/i, /\bts\b/i], tag: 'TypeScript' },
  { patterns: [/javascript/i, /\bjs\b/i], tag: 'JavaScript' },
  { patterns: [/aws/i, /amazon web services/i], tag: 'AWS' },
  { patterns: [/azure/i, /microsoft cloud/i], tag: 'Azure' },
  { patterns: [/google cloud/i, /\bgcp\b/i], tag: 'GCP' },
  { patterns: [/kubernetes/i, /\bk8s\b/i], tag: 'Kubernetes' },
  { patterns: [/docker/i, /container/i], tag: 'Docker' },
  
  // Role types
  { patterns: [/frontend/i, /front[- ]?end/i, /ui developer/i], tag: 'Frontend' },
  { patterns: [/backend/i, /back[- ]?end/i, /server[- ]?side/i], tag: 'Backend' },
  { patterns: [/full[- ]?stack/i, /fullstack/i], tag: 'Full Stack' },
  { patterns: [/devops/i, /site reliability/i, /\bsre\b/i], tag: 'DevOps' },
  { patterns: [/data science/i, /data scientist/i, /\bml\b/i, /machine learning/i], tag: 'Data Science' },
  { patterns: [/mobile/i, /ios/i, /android/i, /flutter/i, /react native/i], tag: 'Mobile' },
  
  // Benefits
  { patterns: [/visa sponsor/i, /h1b/i, /work authorization/i], tag: 'Visa Sponsorship' },
  { patterns: [/equity/i, /stock options/i, /\brsu\b/i], tag: 'Equity' },
  { patterns: [/startup/i, /early[- ]?stage/i], tag: 'Startup' },
]

/**
 * Detect the source platform from URL
 */
export function detectSource(url: string): JobSource {
  for (const { pattern, source } of SOURCE_PATTERNS) {
    if (pattern.test(url)) {
      return source
    }
  }
  return 'other'
}

/**
 * Detect job type from text content
 */
export function detectJobType(text: string): JobType | undefined {
  for (const { patterns, type } of JOB_TYPE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type
      }
    }
  }
  return undefined
}

/**
 * Detect location from text content
 */
export function detectLocation(text: string): string | undefined {
  // Check for remote first
  if (LOCATION_PATTERNS.remote.test(text)) {
    return 'Remote'
  }

  // Check for City, State pattern
  const cityStateMatch = text.match(LOCATION_PATTERNS.cityState)
  if (cityStateMatch) {
    return cityStateMatch[0]
  }

  // Check for major cities
  const cityMatch = text.match(LOCATION_PATTERNS.cities)
  if (cityMatch) {
    // Try to find state after city
    const afterCity = text.slice(text.indexOf(cityMatch[0]) + cityMatch[0].length)
    const stateMatch = afterCity.slice(0, 20).match(LOCATION_PATTERNS.states)
    if (stateMatch) {
      return `${cityMatch[0]}, ${stateMatch[0]}`
    }
    return cityMatch[0]
  }

  // Check for countries
  const countryMatch = text.match(LOCATION_PATTERNS.countries)
  if (countryMatch) {
    return countryMatch[0]
  }

  return undefined
}

/**
 * Extract relevant tags from text content
 */
export function extractTags(text: string, limit: number = 5): string[] {
  const tags: string[] = []
  
  for (const { patterns, tag } of TAG_PATTERNS) {
    if (tags.length >= limit) break
    
    for (const pattern of patterns) {
      if (pattern.test(text) && !tags.includes(tag)) {
        tags.push(tag)
        break
      }
    }
  }

  return tags
}

/**
 * Calculate confidence based on available data
 */
export function calculateConfidence(
  hasTitle: boolean,
  hasCompany: boolean,
  hasJobType: boolean,
  hasLocation: boolean,
  isKnownSource: boolean
): ConfidenceLevel {
  let score = 0

  if (hasTitle) score += 25
  if (hasCompany) score += 25
  if (hasJobType) score += 15
  if (hasLocation) score += 15
  if (isKnownSource) score += 20

  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/**
 * Auto-categorize a job link based on URL and text content
 */
export function categorize(
  url: string,
  title: string = '',
  content: string = ''
): CategoryResult {
  const combinedText = `${title} ${content}`.trim()

  // Detect source from URL
  const source = detectSource(url)
  const isKnownSource = source !== 'other'

  // Detect job type
  const jobType = detectJobType(combinedText)

  // Detect location
  const location = detectLocation(combinedText)

  // Extract tags
  const tags = extractTags(combinedText)

  // Calculate confidence
  const hasTitle = title.length > 0 && title !== 'Job Opportunity'
  const hasCompany = content.includes('company') || content.includes('Company')
  const confidence = calculateConfidence(
    hasTitle,
    hasCompany,
    !!jobType,
    !!location,
    isKnownSource
  )

  return {
    source,
    jobType,
    location,
    tags,
    confidence,
  }
}

/**
 * Suggest tags based on job title
 */
export function suggestTagsFromTitle(title: string): string[] {
  const tags: string[] = []
  const lowerTitle = title.toLowerCase()

  // Seniority from title
  if (/\b(senior|sr\.?|lead|principal|staff)\b/i.test(title)) {
    tags.push('Senior')
  } else if (/\b(junior|jr\.?|entry|associate)\b/i.test(title)) {
    tags.push('Junior')
  }

  // Role type from title
  if (/\b(engineer|developer|programmer)\b/i.test(title)) {
    if (/frontend|front[- ]end|ui/i.test(lowerTitle)) {
      tags.push('Frontend')
    } else if (/backend|back[- ]end|server/i.test(lowerTitle)) {
      tags.push('Backend')
    } else if (/full[- ]?stack/i.test(lowerTitle)) {
      tags.push('Full Stack')
    }
  }

  if (/\b(devops|sre|infrastructure|platform)\b/i.test(title)) {
    tags.push('DevOps')
  }

  if (/\b(data|ml|machine learning|ai|analytics)\b/i.test(title)) {
    tags.push('Data Science')
  }

  if (/\b(mobile|ios|android|flutter)\b/i.test(title)) {
    tags.push('Mobile')
  }

  if (/\b(manager|director|head|vp|chief)\b/i.test(title)) {
    tags.push('Management')
  }

  return [...new Set(tags)].slice(0, 3)
}
