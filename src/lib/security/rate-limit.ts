/**
 * レート制限ユーティリティ
 *
 * 注意: この実装はインメモリベースのため、サーバーレス環境（Vercel等）では
 * インスタンス間で状態が共有されません。より堅牢な実装が必要な場合は
 * Upstash Redisなどの分散キャッシュを使用してください。
 *
 * 現在の実装でも、単一インスタンス内での基本的なDoS保護は可能です。
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  /** ウィンドウあたりの最大リクエスト数 */
  maxRequests: number
  /** ウィンドウサイズ（ミリ秒） */
  windowMs: number
}

// インメモリストア（インスタンスごとに独立）
const rateLimitStore = new Map<string, RateLimitEntry>()

// 定期的に古いエントリをクリーンアップ
const CLEANUP_INTERVAL_MS = 60 * 1000 // 1分
let lastCleanup = Date.now()

function cleanupExpiredEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return

  const entries = Array.from(rateLimitStore.entries())
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
  lastCleanup = now
}

/**
 * デフォルトのレート制限設定
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60, // 1分あたり60リクエスト
  windowMs: 60 * 1000,
}

/**
 * 認証系エンドポイント用のより厳しいレート制限
 */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10, // 1分あたり10リクエスト
  windowMs: 60 * 1000,
}

/**
 * 管理者API用のレート制限
 */
export const ADMIN_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30, // 1分あたり30リクエスト
  windowMs: 60 * 1000,
}

/**
 * Webhook用のレート制限
 */
export const WEBHOOK_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100, // 1分あたり100リクエスト
  windowMs: 60 * 1000,
}

/**
 * レート制限をチェック
 * @param identifier ユーザー識別子（IP、メール、またはその他の一意のキー）
 * @param config レート制限設定
 * @returns レート制限超過の場合はfalse、許可の場合はtrue
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; remaining: number; resetTime: number } {
  // クリーンアップ実行
  cleanupExpiredEntries()

  const now = Date.now()
  const key = identifier
  const entry = rateLimitStore.get(key)

  // 新規エントリまたは期限切れ
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, newEntry)
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    }
  }

  // 既存エントリの更新
  entry.count++
  const allowed = entry.count <= config.maxRequests

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  }
}

/**
 * リクエストからクライアントIPを取得
 * Vercel/Cloudflare等のプロキシを考慮
 */
export function getClientIP(request: Request): string {
  // Vercel
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // デフォルト
  return 'unknown'
}

/**
 * レート制限ヘッダーを生成
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
  }
}

/**
 * APIルート用のレート制限チェックユーティリティ
 * 制限超過時はNextResponseを返し、許可時はnullを返す
 */
export function applyRateLimit(
  request: Request,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { response: Response | null; headers: Record<string, string> } {
  const ip = getClientIP(request)
  const { allowed, remaining, resetTime } = checkRateLimit(ip, config)
  const headers = getRateLimitHeaders(remaining, resetTime, config.maxRequests)

  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
    return {
      response: new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'レート制限を超過しました。しばらくお待ちください。',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            ...headers,
          },
        }
      ),
      headers,
    }
  }

  return { response: null, headers }
}
