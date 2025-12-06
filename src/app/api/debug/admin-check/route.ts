import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { isAdminServer, getAdminEmails } from '@/lib/auth/admin'

export async function GET() {
  const session = await getServerSession()

  const adminEmails = getAdminEmails()
  const envAdminEmails = process.env.ADMIN_EMAILS || '(not set)'
  const envNextPublicAdminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '(not set)'

  const userEmail = session?.user?.email || null
  const isAdmin = isAdminServer(userEmail)

  return NextResponse.json({
    userEmail,
    isAdmin,
    adminEmailsFromFunction: adminEmails,
    envAdminEmails,
    envNextPublicAdminEmails,
    emailMatch: userEmail ? adminEmails.includes(userEmail.toLowerCase()) : false,
  })
}
