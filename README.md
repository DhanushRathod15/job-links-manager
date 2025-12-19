# Job Links Manager

A Next.js application that automatically collects, organizes, and displays job-related links sourced from emails. The system intelligently extracts job postings, categorizes them, and presents them in a searchable, structured interface to simplify your job hunting process.

## Features

- **Intelligent Job Link Extraction**: Automatically identifies job-related URLs from emails using pattern matching and heuristics
- **Metadata Extraction**: Extracts job titles and company names from URLs and email content
- **Auto-Categorization**: Automatically categorizes jobs by type (Full-time, Contract, Remote, etc.), source (LinkedIn, Indeed, etc.), and extracts relevant tags
- **Deduplication**: Prevents saving duplicate job links using URL normalization
- **Advanced Filtering & Search**: Filter by status, source, and search across titles, companies, and URLs
- **Status Tracking**: Track job applications through stages (Saved, Applied, Interview, Rejected, Offer)
- **Gmail Integration**: Fetches job-related emails using intelligent Gmail search operators
- **Modern Dashboard**: Clean, responsive UI with sorting and filtering capabilities

## Getting Started

First, install the dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# MongoDB Connection String
MONGODB_URI=your_mongodb_connection_string_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Google OAuth (for Gmail integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**MongoDB:**
- For local MongoDB: `mongodb://localhost:27017/job-links-manager`
- For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database-name`

**JWT:**
- `JWT_SECRET`: A random secret string for access tokens (generate using: `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET`: A random secret string for refresh tokens (generate using: `openssl rand -base64 32`)

**Google OAuth:**
- See `docs/GOOGLE_OAUTH_SETUP.md` for setup instructions

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── pages/                  # Next.js pages and routing
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication API routes
│   │   ├── gmail/          # Gmail integration
│   │   │   └── fetch.ts    # Fetch job-related emails
│   │   └── jobs/           # Job links CRUD operations
│   │       ├── list.ts     # List job links with filtering
│   │       ├── save.ts     # Save new job links
│   │       └── update.ts   # Update/delete job links
│   ├── auth/               # Authentication pages
│   ├── dashboard.tsx       # Main job links dashboard
│   ├── index.tsx           # Home page
│   └── about.tsx           # About page
├── components/             # React components
│   ├── AuthButton.tsx      # Authentication button
│   └── JobLinkCard.tsx     # Job link display card
├── lib/                    # Library functions
│   ├── db.ts               # MongoDB connection
│   ├── auth.ts             # Authentication helpers
│   └── authMiddleware.ts   # API auth middleware
├── models/                 # Data models
│   ├── User.ts             # User model
│   ├── JobLink.ts          # JobLink model with enhanced fields
│   └── types.ts            # TypeScript types
├── utils/                  # Utility functions
│   ├── helpers.ts          # General helpers
│   ├── jobLinkDetector.ts  # Intelligent job URL detection
│   ├── metadataExtractor.ts # Extract title/company from URLs
│   └── categorizer.ts      # Auto-categorization logic
├── types/                  # TypeScript type definitions
└── styles/                 # Global styles
```

## Key Features Explained

### Job Link Detection
The application uses intelligent pattern matching to identify job-related URLs:
- Recognizes 40+ job board domains (LinkedIn, Indeed, Glassdoor, etc.)
- Detects job-related URL paths (/jobs/, /careers/, /positions/, etc.)
- Analyzes email subject lines for job-related keywords
- Assigns confidence levels (high, medium, low) to detected links

### Metadata Extraction
Automatically extracts:
- Job title from URL paths and email subjects
- Company name from domain or email content
- Location (Remote, city names, states)
- Job type (Full-time, Contract, Internship, etc.)

### Gmail Integration
Uses Gmail API with smart search queries to find job-related emails:
- Filters by subject keywords (job, career, position, opportunity)
- Recognizes job platform sender domains
- Searches for application-related emails

### Dashboard Features
- **Stats Overview**: Quick view of total jobs, applied, interviews, offers
- **Advanced Filtering**: Filter by status, source, or search text
- **Sorting**: Sort by date, title, company, or status
- **Status Management**: Update job status with one click
- **Expandable Cards**: View full details including email context and tags

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
