import { auth } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db'

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id ?? null
}
