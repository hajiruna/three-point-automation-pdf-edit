/**
 * Stripe Webhook エンドポイント
 * POST /api/billing/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isBillingEnabled, isStripeServerConfigured } from '@/lib/billing/feature-flags'
import { requireStripeServer } from '@/lib/billing/stripe-server'
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoiceEvent,
  handlePaymentSucceeded,
  handlePaymentFailed,
} from '@/lib/billing/webhook-handlers'

// Webhook署名検証のためbodyをそのまま取得
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // 課金機能チェック
  if (!isBillingEnabled()) {
    return NextResponse.json(
      { error: 'Billing is not enabled' },
      { status: 403 }
    )
  }

  if (!isStripeServerConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('No stripe-signature header')
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      )
    }

    const stripe = requireStripeServer()

    // 署名検証
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      const error = err as Error
      console.error('Webhook signature verification failed:', error.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('Received webhook event:', event.type, event.id)

    // イベント処理
    switch (event.type) {
      // サブスクリプションイベント
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      // 請求書イベント
      case 'invoice.created':
      case 'invoice.finalized':
      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'invoice.payment_succeeded':
        await handleInvoiceEvent(event.data.object as Stripe.Invoice)
        break

      // 支払いイベント
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
