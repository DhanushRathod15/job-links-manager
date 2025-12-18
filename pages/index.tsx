import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [apiResponse, setApiResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleApiCall = async () => {
    setIsLoading(true)
    setApiResponse(null)
    try {
      const response = await fetch('/api/hello')
      const data = await response.json()
      setApiResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setApiResponse('Error calling API: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Job Links Manager</title>
        <meta name="description" content="Manage your job application links" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to Job Links Manager
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Organize and manage your job application links efficiently
            </p>
            <div className="flex gap-4 justify-center mb-8">
              <Link
                href="/about"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                About
              </Link>
              <button
                onClick={handleApiCall}
                disabled={isLoading}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Test API'}
              </button>
            </div>
            {apiResponse && (
              <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">API Response:</h2>
                  <pre className="bg-gray-100 p-4 rounded text-left overflow-x-auto text-sm">
                    {apiResponse}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

