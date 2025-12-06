/**
 * 管理者権限チェック
 *
 * 重要: クライアントサイドでは session.user.isAdmin を使用してください。
 * このファイルの関数はサーバーサイドでのみ使用されます。
 */

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
