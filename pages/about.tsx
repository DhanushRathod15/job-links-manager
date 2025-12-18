import Head from 'next/head'
import Link from 'next/link'

export default function About() {
  return (
    <>
      <Head>
        <title>About - Job Links Manager</title>
        <meta name="description" content="About Job Links Manager" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">About</h1>
            <p className="text-lg text-gray-700 mb-4">
              This is a Next.js application with TypeScript and TailwindCSS.
            </p>
            <p className="text-lg text-gray-700 mb-8">
              The project includes a clean folder structure with pages, API routes,
              components, utilities, models, and library functions.
            </p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

