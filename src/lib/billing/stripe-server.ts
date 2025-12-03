/**
 * サーバー用 Stripe SDK インスタンス
 */

import Stripe from 'stripe'
import { isStripeServerConfigured } from './feature-flags'

let stripeInstance: Stripe | null = null

/**
 * Stripe SDK インスタンスを取得（シングルトン）
 */
export const getStripeServer = (): Stripe | null => {
  if (!isStripeServerConfigured()) {
    console.warn('Stripe server is not configured. Set STRIPE_SECRET_KEY.')
    return null
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  }

  return stripeInstance
}

/**
 * Stripe SDK インスタンスを取得（必須版 - エラーをスロー）
 */
export const requireStripeServer = (): Stripe => {
  const stripe = getStripeServer()

  if (!stripe) {
    throw new Error('Stripe is not configured on server')
  }

  return stripe
}
