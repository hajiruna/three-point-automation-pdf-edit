/**
 * 管理者権限チェック
 */

/**
 * 管理者メールアドレスリストを取得
 */
export function getAdminEmails(): string[] {
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || ''
  return adminEmails
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0)
}

/**
 * 指定されたメールアドレスが管理者かどうかをチェック
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false

  const adminEmails = getAdminEmails()

  // 管理者リストが空の場合、アクセスを拒否（セキュリティ強化）
  if (adminEmails.length === 0) {
    return false
  }

  return adminEmails.includes(email.toLowerCase())
}

/**
 * サーバーサイド用: 管理者チェック（環境変数を直接参照）
 */
export function isAdminServer(email: string | null | undefined): boolean {
  if (!email) return false

  const adminEmails = process.env.ADMIN_EMAILS || ''
  const emailList = adminEmails
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0)

  // 管理者リストが空の場合、アクセスを拒否（セキュリティ強化）
  if (emailList.length === 0) {
    return false
  }

  return emailList.includes(email.toLowerCase())
}
