/**
 * Webhook冪等性（リプレイ攻撃防止）ユーティリティ
 *
 * 注意: この実装はインメモリベースのため、サーバーレス環境（Vercel等）では
 * インスタンス間で状態が共有されません。完全なリプレイ攻撃防止には
 * データベースまたはRedisでの永続化が必要です。
 *
 * 現在の実装でも、同一インスタンス内での即座のリプレイは防止できます。
 * Stripeの署名検証と組み合わせることで、基本的なセキュリティは確保されます。
 */

interface ProcessedEvent {
  processedAt: number
}

// 処理済みイベントIDを保持（インスタンスごとに独立）
const processedEvents = new Map<string, ProcessedEvent>()

// イベントIDの保持期間（24時間）
const EVENT_TTL_MS = 24 * 60 * 60 * 1000

// クリーンアップ間隔（1時間）
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000
let lastCleanup = Date.now()

/**
 * 古いイベントをクリーンアップ
 */
function cleanupExpiredEvents() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return

  const expiredTime = now - EVENT_TTL_MS
  const entries = Array.from(processedEvents.entries())
  for (const [eventId, event] of entries) {
    if (event.processedAt < expiredTime) {
      processedEvents.delete(eventId)
    }
  }
  lastCleanup = now
}

/**
 * イベントが既に処理済みかどうかをチェックし、未処理なら処理済みとしてマーク
 * @param eventId Webhook イベントID
 * @returns true = 新規イベント（処理可能）, false = 処理済みイベント（スキップすべき）
 */
export function markEventProcessed(eventId: string): boolean {
  // クリーンアップ実行
  cleanupExpiredEvents()

  // 既に処理済みの場合
  if (processedEvents.has(eventId)) {
    console.warn(`Duplicate webhook event detected: ${eventId}`)
    return false
  }

  // 新規イベントとして記録
  processedEvents.set(eventId, {
    processedAt: Date.now(),
  })

  return true
}

/**
 * イベントが処理済みかどうかをチェック（マークしない）
 * @param eventId Webhook イベントID
 * @returns true = 処理済み, false = 未処理
 */
export function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId)
}

/**
 * 処理済みイベント数を取得（デバッグ用）
 */
export function getProcessedEventCount(): number {
  return processedEvents.size
}
