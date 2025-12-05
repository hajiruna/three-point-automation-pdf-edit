import NextAuth from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // 初回サインイン時にアクセストークンを保存
      if (account?.access_token) {
        token.accessToken = account.access_token

        // Microsoft Graph API からユーザー情報を取得
        try {
          const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          })
          if (response.ok) {
            const profile = await response.json()
            token.department = profile.department || null
            token.jobTitle = profile.jobTitle || null
          }
        } catch (error) {
          console.error('Failed to fetch user profile from Graph API:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      // セッションに部署情報を追加
      if (session.user) {
        (session.user as { department?: string | null }).department = token.department as string | null
        (session.user as { jobTitle?: string | null }).jobTitle = token.jobTitle as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})

export { handler as GET, handler as POST }
