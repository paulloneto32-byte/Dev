import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DEMO_USER_ID } from '@/lib/demo-user'

export async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions)
  return session?.user?.id || DEMO_USER_ID
}
