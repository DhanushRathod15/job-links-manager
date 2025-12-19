import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => void
  refreshAccessToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setAccessToken(storedToken)
      setUser(JSON.parse(storedUser))
    } else if (storedRefreshToken) {
      refreshAccessToken()
    }
    setIsLoading(false)
  }, [])

  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return false

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()

      if (response.ok && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken)
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken)
        }
        setAccessToken(data.accessToken)
        return true
      }
    } catch (error) {
      console.error('Failed to refresh token:', error)
    }

    logout()
    return false
  }

  const login = (newAccessToken: string, refreshToken: string, newUser: User) => {
    localStorage.setItem('accessToken', newAccessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setAccessToken(newAccessToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setAccessToken(null)
    setUser(null)
    router.push('/auth/signin')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
