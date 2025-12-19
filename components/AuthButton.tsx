import { useAuth } from '@/lib/authContext'
import Link from 'next/link'

export default function AuthButton() {
  const { user, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        <span className="text-gray-600">Loading...</span>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{user.name}</span>
          <span className="text-xs text-gray-500">{user.email}</span>
        </div>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/auth/signin"
      className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
    >
      Sign In
    </Link>
  )
}


