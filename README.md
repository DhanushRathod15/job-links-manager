# Job Links Manager

A Next.js application with TypeScript and TailwindCSS for managing job application links.

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

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**MongoDB:**
- For local MongoDB: `mongodb://localhost:27017/job-links-manager`
- For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database-name`

**NextAuth:**
- `NEXTAUTH_URL`: Your application URL (use `http://localhost:3000` for development)
- `NEXTAUTH_SECRET`: A random secret string (you can generate one using: `openssl rand -base64 32`)

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local` file

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── pages/              # Next.js pages and routing
│   ├── api/            # API routes
│   │   └── auth/       # NextAuth API routes
│   ├── auth/           # Authentication pages
│   │   └── signin.tsx  # Sign in page
│   ├── _app.tsx        # Custom App component
│   ├── index.tsx       # Home page
│   └── about.tsx       # About page
├── components/         # React components
│   └── AuthButton.tsx  # Authentication button component
├── lib/                # Library functions
│   ├── db.ts           # MongoDB connection
│   └── getSession.ts   # Server-side session helper
├── models/             # Data models
│   ├── User.ts         # User model
│   └── JobLink.ts      # JobLink model
├── types/              # TypeScript type definitions
│   └── next-auth.d.ts  # NextAuth type extensions
├── utils/              # Utility functions
└── styles/             # Global styles
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

