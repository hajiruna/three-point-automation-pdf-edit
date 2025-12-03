/**
 * 課金機能のON/OFF制御
 * 環境変数 NEXT_PUBLIC_ENABLE_BILLING で制御
 */

/**
 * 課金機能が有効かどうかをチェック
 */
export const isBillingEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_ENABLE_BILLING === 'true'
}

/**
 * Stripeが設定されているかをチェック
 */
export const isStripeConfigured = (): boolean => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  return !!publishableKey && publishableKey.startsWith('pk_')
}

/**
 * 課金機能が完全に利用可能かをチェック
 * (機能有効 かつ Stripe設定済み)
 */
export const isBillingAvailable = (): boolean => {
  return isBillingEnabled() && isStripeConfigured()
}

/**
 * サーバーサイドでStripeシークレットキーが設定されているかをチェック
 * (サーバーサイド専用)
 */
export const isStripeServerConfigured = (): boolean => {
  if (typeof window !== 'undefined') {
    console.warn('isStripeServerConfigured should only be called on server side')
    return false
  }
  const secretKey = process.env.STRIPE_SECRET_KEY
  return !!secretKey && secretKey.startsWith('sk_')
}
