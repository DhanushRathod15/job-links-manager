import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import connectDB from '@/lib/db'
import User from '@/models/User'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          if (!user.email) {
            return false
          }

          await connectDB()

          const existingUser = await User.findOne({ email: user.email })

          const updateData: any = {}
          if (user.image && existingUser?.image !== user.image) {
            updateData.image = user.image
          }
          if (account.refresh_token) {
            updateData.refreshToken = account.refresh_token
          }

          if (!existingUser) {
            await User.create({
              name: user.name || 'User',
              email: user.email,
              image: user.image,
              refreshToken: account.refresh_token,
            })
          } else if (Object.keys(updateData).length > 0) {
            await User.updateOne(
              { email: user.email },
              updateData
            )
          }

          return true
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }
      return true
    },
    async session({ session }) {
      if (session.user?.email) {
        try {
          await connectDB()
          const user = await User.findOne({ email: session.user.email })
          if (user) {
            session.user.id = user._id.toString()
            session.user.image = user.image || session.user.image
          }
        } catch (error) {
          console.error('Error in session callback:', error)
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
