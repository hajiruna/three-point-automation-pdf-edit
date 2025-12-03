/**
 * ブラウザ用 Stripe.js インスタンス
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'
import { isStripeConfigured } from './feature-flags'

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Stripe.js インスタンスを取得（シングルトン）
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!isStripeConfigured()) {
    console.warn('Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.')
    return Promise.resolve(null)
  }

  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }

  return stripePromise
}

/**
 * Checkoutページにリダイレクト
 * 最新のStripe.jsではURLリダイレクト方式を使用
 * @param _sessionId - 使用されなくなったパラメータ（互換性のため維持）
 */
export const redirectToCheckout = async (_sessionId: string): Promise<void> => {
  // このメソッドは互換性のために維持されていますが、
  // 実際のリダイレクトは checkout API から返された url を使用してください
  console.warn('redirectToCheckout is deprecated. Use window.location.href with session.url instead.')
  throw new Error('Use checkout session URL for redirect instead of sessionId')
}
