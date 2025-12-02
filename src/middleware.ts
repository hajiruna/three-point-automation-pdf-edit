import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
})

export const config = {
  // 認証が必要なパスを指定（APIルートと静的ファイルは除外）
  matcher: [
    '/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico).*)',
  ],
}
