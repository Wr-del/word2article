import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'

const providers = []

// 邮箱验证码登录
providers.push(
  Credentials({
    name: '邮箱验证码',
    credentials: {
      email: { label: '邮箱', type: 'email' },
      code: { label: '验证码', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.code) {
        throw new Error('请输入邮箱和验证码')
      }

      const email = (credentials.email as string).toLowerCase().trim()
      const code = credentials.code as string

      // 查找验证码
      const token = await prisma.verificationToken.findFirst({
        where: {
          identifier: email,
          token: code,
          expires: { gt: new Date() },
        },
      })

      if (!token) {
        throw new Error('验证码无效或已过期')
      }

      // 删除已使用的验证码
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: code,
          },
        },
      })

      // 查找或创建用户
      let user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            emailVerified: new Date(),
            name: email.split('@')[0],
          },
        })
      } else if (!user.emailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        })
      }

      return { id: user.id, email: user.email, name: user.name }
    },
  })
)

// GitHub 登录（可选）
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(GitHub({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }))
}

// Google 登录（可选）
if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
  providers.push(Google({
    clientId: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
  }))
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: providers as any,
  callbacks: {
    session({ session, user }: any) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
