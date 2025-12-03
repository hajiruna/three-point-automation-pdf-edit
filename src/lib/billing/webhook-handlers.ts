/**
 * Stripe Webhook イベントハンドラー
 */

import type Stripe from 'stripe'
import {
  getCustomerByStripeId,
  createCustomer,
  createSubscription,
  updateSubscription,
  upsertInvoice,
  recordPayment,
} from '@/lib/supabase/billing'
import { getPlanByPriceId } from '@/lib/billing/plans'
import type { Currency, InvoiceStatus, PaymentStatus } from '@/types/billing'

/**
 * customer.subscription.created イベント処理
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('Processing subscription.created:', subscription.id)

  const stripeCustomerId = subscription.customer as string
  let customer = await getCustomerByStripeId(stripeCustomerId)

  // 顧客がDBに存在しない場合は作成
  if (!customer) {
    const userId = subscription.metadata?.userId
    if (!userId) {
      console.error('No userId in subscription metadata')
      return
    }

    customer = await createCustomer(userId, userId, stripeCustomerId)
    if (!customer) {
      console.error('Failed to create customer')
      return
    }
  }

  // 価格IDからプラン情報を取得
  const priceId = subscription.items.data[0]?.price.id
  const planInfo = getPlanByPriceId(priceId)

  if (!planInfo) {
    console.error('Unknown price ID:', priceId)
    return
  }

  // サブスクリプションをDBに保存
  // Stripe SDK v20+ の型変更に対応
  const subData = subscription as unknown as {
    current_period_start: number
    current_period_end: number
  }

  await createSubscription({
    customerId: customer.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    planType: planInfo.plan.id,
    billingInterval: planInfo.interval,
    status: subscription.status as 'active' | 'trialing',
    currentPeriodStart: new Date(subData.current_period_start * 1000),
    currentPeriodEnd: new Date(subData.current_period_end * 1000),
  })

  console.log('Subscription created in DB:', subscription.id)
}

/**
 * customer.subscription.updated イベント処理
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('Processing subscription.updated:', subscription.id)

  const priceId = subscription.items.data[0]?.price.id
  const planInfo = getPlanByPriceId(priceId)

  // Stripe SDK v20+ の型変更に対応
  const subData = subscription as unknown as {
    current_period_start: number
    current_period_end: number
    cancel_at_period_end: boolean
    canceled_at: number | null
  }

  await updateSubscription(subscription.id, {
    stripePriceId: priceId,
    planType: planInfo?.plan.id,
    billingInterval: planInfo?.interval,
    status: subscription.status as 'active' | 'canceled' | 'past_due',
    currentPeriodStart: new Date(subData.current_period_start * 1000),
    currentPeriodEnd: new Date(subData.current_period_end * 1000),
    cancelAtPeriodEnd: subData.cancel_at_period_end,
    canceledAt: subData.canceled_at
      ? new Date(subData.canceled_at * 1000)
      : null,
  })

  console.log('Subscription updated in DB:', subscription.id)
}

/**
 * customer.subscription.deleted イベント処理
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  console.log('Processing subscription.deleted:', subscription.id)

  await updateSubscription(subscription.id, {
    status: 'canceled',
    canceledAt: new Date(),
  })

  console.log('Subscription marked as canceled:', subscription.id)
}

/**
 * invoice.* イベント処理
 */
export async function handleInvoiceEvent(invoice: Stripe.Invoice): Promise<void> {
  console.log('Processing invoice event:', invoice.id, invoice.status)

  const stripeCustomerId = invoice.customer as string
  const customer = await getCustomerByStripeId(stripeCustomerId)

  if (!customer) {
    console.error('Customer not found for invoice:', invoice.id)
    return
  }

  // ステータスマッピング
  const statusMap: Record<string, InvoiceStatus> = {
    draft: 'draft',
    open: 'open',
    paid: 'paid',
    void: 'void',
    uncollectible: 'uncollectible',
  }

  const status = statusMap[invoice.status || 'draft'] || 'draft'
  const currency = (invoice.currency?.toUpperCase() || 'JPY') as Currency

  await upsertInvoice({
    customerId: customer.id,
    stripeInvoiceId: invoice.id!,
    amountDue: invoice.amount_due,
    amountPaid: invoice.amount_paid,
    currency,
    status,
    invoicePdfUrl: invoice.invoice_pdf || undefined,
    hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
    periodStart: invoice.period_start
      ? new Date(invoice.period_start * 1000)
      : undefined,
    periodEnd: invoice.period_end
      ? new Date(invoice.period_end * 1000)
      : undefined,
  })

  console.log('Invoice upserted:', invoice.id)
}

/**
 * payment_intent.succeeded イベント処理
 */
export async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  console.log('Processing payment_intent.succeeded:', paymentIntent.id)

  const stripeCustomerId = paymentIntent.customer as string
  if (!stripeCustomerId) {
    console.log('No customer on payment intent, skipping')
    return
  }

  const customer = await getCustomerByStripeId(stripeCustomerId)
  if (!customer) {
    console.error('Customer not found for payment:', paymentIntent.id)
    return
  }

  const currency = (paymentIntent.currency?.toUpperCase() || 'JPY') as Currency

  await recordPayment({
    customerId: customer.id,
    stripePaymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency,
    status: 'succeeded' as PaymentStatus,
  })

  console.log('Payment recorded:', paymentIntent.id)
}

/**
 * payment_intent.payment_failed イベント処理
 */
export async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  console.log('Processing payment_intent.payment_failed:', paymentIntent.id)

  const stripeCustomerId = paymentIntent.customer as string
  if (!stripeCustomerId) {
    console.log('No customer on payment intent, skipping')
    return
  }

  const customer = await getCustomerByStripeId(stripeCustomerId)
  if (!customer) {
    console.error('Customer not found for payment:', paymentIntent.id)
    return
  }

  const currency = (paymentIntent.currency?.toUpperCase() || 'JPY') as Currency
  const failureMessage =
    paymentIntent.last_payment_error?.message || 'Payment failed'

  await recordPayment({
    customerId: customer.id,
    stripePaymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency,
    status: 'failed' as PaymentStatus,
    failureMessage,
  })

  console.log('Failed payment recorded:', paymentIntent.id)
}
