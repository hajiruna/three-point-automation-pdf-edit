/**
 * 課金API用バリデーションスキーマ
 */

import { z } from 'zod/v4'

/**
 * 許可されたホストのリスト
 * オープンリダイレクト脆弱性を防ぐため、自サイトのドメインのみ許可
 */
const ALLOWED_HOSTS = [
  'localhost',
  '127.0.0.1',
  // Vercelのデプロイ先ドメイン（環境変数から取得も可能）
  'three-point-automation-pdf-edit.vercel.app',
]

/**
 * 環境変数で追加の許可ホストを設定可能
 */
function getAllowedHosts(): string[] {
  const additionalHosts = process.env.ALLOWED_REDIRECT_HOSTS?.split(',').map(h => h.trim()) || []
  return [...ALLOWED_HOSTS, ...additionalHosts]
}

/**
 * URLが許可されたホストかどうかを検証
 */
function isAllowedRedirectUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    const allowedHosts = getAllowedHosts()
    return allowedHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

/**
 * リダイレクトURLのカスタムバリデーション
 */
const safeRedirectUrl = z
  .string()
  .url('Invalid URL format')
  .refine(isAllowedRedirectUrl, {
    message: 'Redirect URL must be on an allowed domain',
  })

/**
 * Checkout APIリクエストスキーマ
 */
export const checkoutRequestSchema = z.object({
  priceId: z
    .string()
    .min(1, 'Price ID is required')
    .regex(/^price_/, 'Invalid price ID format'),
  successUrl: safeRedirectUrl.optional(),
  cancelUrl: safeRedirectUrl.optional(),
})

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>

/**
 * Usage記録APIリクエストスキーマ
 */
export const usageRecordRequestSchema = z.object({
  operationType: z.enum(['extract', 'merge'], {
    message: 'Operation type must be "extract" or "merge"',
  }),
  pageCount: z
    .number()
    .int({ message: 'Page count must be an integer' })
    .min(0, 'Page count must be non-negative'),
})

export type UsageRecordRequest = z.infer<typeof usageRecordRequestSchema>

/**
 * バリデーションエラーをフォーマット
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map(e => e.message).join(', ')
}
