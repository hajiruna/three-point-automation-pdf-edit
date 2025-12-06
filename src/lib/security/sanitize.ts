/**
 * セキュリティサニタイズユーティリティ
 *
 * エラーメッセージのサニタイズとPII（個人識別情報）のマスキング
 */

/**
 * エラーメッセージをユーザーに安全に表示できるようサニタイズ
 * 内部実装の詳細やスタックトレースを除去
 */
export function sanitizeErrorMessage(error: unknown): string {
  // 安全なエラーメッセージのマッピング
  const safeMessages: Record<string, string> = {
    // 認証エラー
    'Unauthorized': '認証が必要です',
    'Forbidden': 'アクセス権限がありません',
    'Invalid signature': 'リクエストの検証に失敗しました',

    // バリデーションエラー
    'Invalid request': 'リクエストが無効です',
    'Bad Request': 'リクエストが無効です',
    'Validation failed': '入力内容に問題があります',

    // レート制限
    'Too Many Requests': 'リクエスト数の上限に達しました',

    // サーバーエラー
    'Internal Server Error': 'サーバーエラーが発生しました',
    'Service Unavailable': 'サービスが一時的に利用できません',
  }

  // 既知のエラーメッセージの場合はマッピング
  if (typeof error === 'string') {
    return safeMessages[error] || 'エラーが発生しました'
  }

  if (error instanceof Error) {
    const message = error.message

    // 既知のパターンをチェック
    for (const [key, safeMessage] of Object.entries(safeMessages)) {
      if (message.includes(key)) {
        return safeMessage
      }
    }

    // 機密情報を含む可能性のあるパターンを検出
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /api[_-]?key/i,
      /database/i,
      /connection/i,
      /sql/i,
      /file[_-]?path/i,
      /stack/i,
    ]

    for (const pattern of sensitivePatterns) {
      if (pattern.test(message)) {
        return 'エラーが発生しました'
      }
    }
  }

  return 'エラーが発生しました'
}

/**
 * メールアドレスをマスク
 * example@domain.com → e***@d***.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***'

  const [local, domain] = email.split('@')
  const [domainName, ...tld] = domain.split('.')

  const maskedLocal = local.length > 1 ? local[0] + '***' : '***'
  const maskedDomain = domainName.length > 1 ? domainName[0] + '***' : '***'

  return `${maskedLocal}@${maskedDomain}.${tld.join('.')}`
}

/**
 * 氏名をマスク
 * 山田 太郎 → 山* **
 */
export function maskName(name: string): string {
  if (!name) return '***'

  // 空白で分割（日本語名・英語名両対応）
  const parts = name.trim().split(/\s+/)

  if (parts.length === 1) {
    // 単一の名前
    return name.length > 1 ? name[0] + '*'.repeat(name.length - 1) : '***'
  }

  // 複数部分の名前
  return parts
    .map((part, index) => {
      if (index === 0) {
        return part.length > 1 ? part[0] + '*'.repeat(part.length - 1) : '*'
      }
      return '*'.repeat(Math.max(2, part.length))
    })
    .join(' ')
}

/**
 * IPアドレスをマスク
 * 192.168.1.100 → 192.168.*.***
 */
export function maskIP(ip: string): string {
  if (!ip) return '***'

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.**`
    }
  }

  // IPv6 (簡易マスク)
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 4) {
      return `${parts[0]}:${parts[1]}:****:****`
    }
  }

  return '***'
}

/**
 * ファイル名をマスク（拡張子は保持）
 * document.pdf → d***.pdf
 */
export function maskFileName(fileName: string): string {
  if (!fileName) return '***'

  const lastDot = fileName.lastIndexOf('.')
  if (lastDot === -1) {
    // 拡張子なし
    return fileName.length > 1 ? fileName[0] + '*'.repeat(Math.min(3, fileName.length - 1)) : '***'
  }

  const name = fileName.substring(0, lastDot)
  const ext = fileName.substring(lastDot)

  const maskedName = name.length > 1 ? name[0] + '*'.repeat(Math.min(3, name.length - 1)) : '***'
  return maskedName + ext
}

/**
 * オブジェクト内のPII（個人識別情報）をマスク
 * ログ出力用
 */
export function maskPII<T extends Record<string, unknown>>(obj: T): T {
  const masked = { ...obj }

  for (const [key, value] of Object.entries(masked)) {
    const lowerKey = key.toLowerCase()

    if (typeof value === 'string') {
      // メールアドレスフィールド
      if (lowerKey.includes('email') || lowerKey.includes('mail')) {
        (masked as Record<string, unknown>)[key] = maskEmail(value)
      }
      // 名前フィールド
      else if (lowerKey.includes('name') && !lowerKey.includes('file')) {
        (masked as Record<string, unknown>)[key] = maskName(value)
      }
      // IPアドレスフィールド
      else if (lowerKey.includes('ip') || lowerKey.includes('address')) {
        (masked as Record<string, unknown>)[key] = maskIP(value)
      }
      // ファイル名フィールド
      else if (lowerKey.includes('file') || lowerKey.includes('filename')) {
        (masked as Record<string, unknown>)[key] = maskFileName(value)
      }
    }
    // ネストされたオブジェクト
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (masked as Record<string, unknown>)[key] = maskPII(value as Record<string, unknown>)
    }
  }

  return masked
}

/**
 * 安全なログ出力
 * PIIをマスクした状態でログ出力
 */
export function safeLog(
  level: 'log' | 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>
): void {
  const maskedData = data ? maskPII(data) : undefined

  if (maskedData) {
    console[level](message, maskedData)
  } else {
    console[level](message)
  }
}
