/**
 * 課金関連のSupabase CRUD操作
 */

import { supabase, isSupabaseConfigured } from './client'
import type {
  Customer,
  Subscription,
  UsageRecord,
  UsageSummary,
  Invoice,
  Payment,
  PlanType,
  BillingInterval,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus,
  OperationType,
  Currency,
} from '@/types/billing'

// ===========================================
// 顧客 (Customers)
// ===========================================

/**
 * ユーザーIDで顧客を取得
 */
export async function getCustomerByUserId(userId: string): Promise<Customer | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('customers')
    .select('id, user_id, email, stripe_customer_id, default_currency, created_at, updated_at')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching customer:', error)
    return null
  }

  return mapCustomerFromDb(data)
}

/**
 * Stripe顧客IDで顧客を取得
 */
export async function getCustomerByStripeId(stripeCustomerId: string): Promise<Customer | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('customers')
    .select('id, user_id, email, stripe_customer_id, default_currency, created_at, updated_at')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching customer by Stripe ID:', error)
    return null
  }

  return mapCustomerFromDb(data)
}

/**
 * 顧客を作成
 */
export async function createCustomer(
  userId: string,
  email: string,
  stripeCustomerId?: string,
  defaultCurrency: Currency = 'JPY'
): Promise<Customer | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('customers')
    .insert({
      user_id: userId,
      email,
      stripe_customer_id: stripeCustomerId || null,
      default_currency: defaultCurrency,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    return null
  }

  return mapCustomerFromDb(data)
}

/**
 * 顧客を更新
 */
export async function updateCustomer(
  customerId: string,
  updates: Partial<{
    email: string
    stripeCustomerId: string
    defaultCurrency: Currency
  }>
): Promise<Customer | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('customers')
    .update({
      email: updates.email,
      stripe_customer_id: updates.stripeCustomerId,
      default_currency: updates.defaultCurrency,
    })
    .eq('id', customerId)
    .select()
    .single()

  if (error) {
    console.error('Error updating customer:', error)
    return null
  }

  return mapCustomerFromDb(data)
}

// ===========================================
// サブスクリプション (Subscriptions)
// ===========================================

/**
 * 顧客のアクティブなサブスクリプションを取得
 */
export async function getActiveSubscription(customerId: string): Promise<Subscription | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, customer_id, stripe_subscription_id, stripe_price_id, plan_type, billing_interval, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at')
    .eq('customer_id', customerId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching subscription:', error)
    return null
  }

  return mapSubscriptionFromDb(data)
}

/**
 * Stripeサブスクリプション IDでサブスクリプションを取得
 */
export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, customer_id, stripe_subscription_id, stripe_price_id, plan_type, billing_interval, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at, updated_at')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching subscription by Stripe ID:', error)
    return null
  }

  return mapSubscriptionFromDb(data)
}

/**
 * サブスクリプションを作成
 */
export async function createSubscription(params: {
  customerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  planType: PlanType
  billingInterval: BillingInterval
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
}): Promise<Subscription | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      customer_id: params.customerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      stripe_price_id: params.stripePriceId,
      plan_type: params.planType,
      billing_interval: params.billingInterval,
      status: params.status,
      current_period_start: params.currentPeriodStart.toISOString(),
      current_period_end: params.currentPeriodEnd.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating subscription:', error)
    return null
  }

  return mapSubscriptionFromDb(data)
}

/**
 * サブスクリプションを更新
 */
export async function updateSubscription(
  stripeSubscriptionId: string,
  updates: Partial<{
    stripePriceId: string
    planType: PlanType
    billingInterval: BillingInterval
    status: SubscriptionStatus
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
    canceledAt: Date | null
  }>
): Promise<Subscription | null> {
  if (!isSupabaseConfigured()) return null

  const updateData: Record<string, unknown> = {}
  if (updates.stripePriceId !== undefined) updateData.stripe_price_id = updates.stripePriceId
  if (updates.planType !== undefined) updateData.plan_type = updates.planType
  if (updates.billingInterval !== undefined) updateData.billing_interval = updates.billingInterval
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.currentPeriodStart !== undefined) updateData.current_period_start = updates.currentPeriodStart.toISOString()
  if (updates.currentPeriodEnd !== undefined) updateData.current_period_end = updates.currentPeriodEnd.toISOString()
  if (updates.cancelAtPeriodEnd !== undefined) updateData.cancel_at_period_end = updates.cancelAtPeriodEnd
  if (updates.canceledAt !== undefined) updateData.canceled_at = updates.canceledAt?.toISOString() || null

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating subscription:', error)
    return null
  }

  return mapSubscriptionFromDb(data)
}

// ===========================================
// 利用量記録 (Usage Records)
// ===========================================

/**
 * 利用量を記録
 */
export async function recordUsage(params: {
  customerId: string
  operationType: OperationType
  pageCount: number
  billingPeriodStart: Date
  billingPeriodEnd: Date
}): Promise<UsageRecord | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('usage_records')
    .insert({
      customer_id: params.customerId,
      operation_type: params.operationType,
      page_count: params.pageCount,
      billing_period_start: params.billingPeriodStart.toISOString(),
      billing_period_end: params.billingPeriodEnd.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error recording usage:', error)
    return null
  }

  return mapUsageRecordFromDb(data)
}

/**
 * 期間内の利用量サマリーを取得
 */
export async function getUsageSummary(
  customerId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<UsageSummary> {
  const defaultSummary: UsageSummary = {
    extractCount: 0,
    mergeCount: 0,
    totalPages: 0,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  }

  if (!isSupabaseConfigured()) return defaultSummary

  const { data, error } = await supabase
    .from('usage_records')
    .select('operation_type, page_count')
    .eq('customer_id', customerId)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString())

  if (error) {
    console.error('Error fetching usage summary:', error)
    return defaultSummary
  }

  let extractCount = 0
  let mergeCount = 0
  let totalPages = 0

  for (const record of data || []) {
    if (record.operation_type === 'extract') extractCount++
    if (record.operation_type === 'merge') mergeCount++
    totalPages += record.page_count || 0
  }

  return {
    extractCount,
    mergeCount,
    totalPages,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  }
}

/**
 * Stripeに報告していない利用量を取得
 */
export async function getUnreportedUsage(customerId: string): Promise<UsageRecord[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('usage_records')
    .select('id, customer_id, operation_type, page_count, billing_period_start, billing_period_end, stripe_usage_record_id, reported_to_stripe, created_at')
    .eq('customer_id', customerId)
    .eq('reported_to_stripe', false)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching unreported usage:', error)
    return []
  }

  return (data || []).map(mapUsageRecordFromDb)
}

/**
 * 利用量をStripe報告済みとしてマーク
 */
export async function markUsageAsReported(usageRecordId: string, stripeUsageRecordId: string): Promise<void> {
  if (!isSupabaseConfigured()) return

  const { error } = await supabase
    .from('usage_records')
    .update({
      reported_to_stripe: true,
      stripe_usage_record_id: stripeUsageRecordId,
    })
    .eq('id', usageRecordId)

  if (error) {
    console.error('Error marking usage as reported:', error)
  }
}

// ===========================================
// 請求書 (Invoices)
// ===========================================

/**
 * 顧客の請求書一覧を取得
 */
export async function getInvoices(customerId: string, limit = 10): Promise<Invoice[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('invoices')
    .select('id, customer_id, stripe_invoice_id, amount_due, amount_paid, currency, status, invoice_pdf_url, hosted_invoice_url, period_start, period_end, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching invoices:', error)
    return []
  }

  return (data || []).map(mapInvoiceFromDb)
}

/**
 * 請求書を作成または更新
 */
export async function upsertInvoice(params: {
  customerId: string
  stripeInvoiceId: string
  amountDue: number
  amountPaid: number
  currency: Currency
  status: InvoiceStatus
  invoicePdfUrl?: string
  hostedInvoiceUrl?: string
  periodStart?: Date
  periodEnd?: Date
}): Promise<Invoice | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('invoices')
    .upsert(
      {
        customer_id: params.customerId,
        stripe_invoice_id: params.stripeInvoiceId,
        amount_due: params.amountDue,
        amount_paid: params.amountPaid,
        currency: params.currency,
        status: params.status,
        invoice_pdf_url: params.invoicePdfUrl || null,
        hosted_invoice_url: params.hostedInvoiceUrl || null,
        period_start: params.periodStart?.toISOString() || null,
        period_end: params.periodEnd?.toISOString() || null,
      },
      { onConflict: 'stripe_invoice_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting invoice:', error)
    return null
  }

  return mapInvoiceFromDb(data)
}

// ===========================================
// 支払い (Payments)
// ===========================================

/**
 * 顧客の支払い履歴を取得
 */
export async function getPayments(customerId: string, limit = 10): Promise<Payment[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('payments')
    .select('id, customer_id, stripe_payment_intent_id, invoice_id, amount, currency, status, failure_message, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching payments:', error)
    return []
  }

  return (data || []).map(mapPaymentFromDb)
}

/**
 * 支払いを記録
 */
export async function recordPayment(params: {
  customerId: string
  stripePaymentIntentId: string
  invoiceId?: string
  amount: number
  currency: Currency
  status: PaymentStatus
  failureMessage?: string
}): Promise<Payment | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('payments')
    .upsert(
      {
        customer_id: params.customerId,
        stripe_payment_intent_id: params.stripePaymentIntentId,
        invoice_id: params.invoiceId || null,
        amount: params.amount,
        currency: params.currency,
        status: params.status,
        failure_message: params.failureMessage || null,
      },
      { onConflict: 'stripe_payment_intent_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error recording payment:', error)
    return null
  }

  return mapPaymentFromDb(data)
}

// ===========================================
// マッピングヘルパー (DB → TypeScript)
// ===========================================

type DbRecord = Record<string, unknown>

function mapCustomerFromDb(data: DbRecord): Customer {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    email: data.email as string,
    stripeCustomerId: data.stripe_customer_id as string | null,
    defaultCurrency: data.default_currency as Currency,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

function mapSubscriptionFromDb(data: DbRecord): Subscription {
  return {
    id: data.id as string,
    customerId: data.customer_id as string,
    stripeSubscriptionId: data.stripe_subscription_id as string,
    stripePriceId: data.stripe_price_id as string,
    planType: data.plan_type as PlanType,
    billingInterval: data.billing_interval as BillingInterval,
    status: data.status as SubscriptionStatus,
    currentPeriodStart: data.current_period_start as string,
    currentPeriodEnd: data.current_period_end as string,
    cancelAtPeriodEnd: data.cancel_at_period_end as boolean,
    canceledAt: data.canceled_at as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  }
}

function mapUsageRecordFromDb(data: DbRecord): UsageRecord {
  return {
    id: data.id as string,
    customerId: data.customer_id as string,
    operationType: data.operation_type as OperationType,
    pageCount: data.page_count as number,
    billingPeriodStart: data.billing_period_start as string,
    billingPeriodEnd: data.billing_period_end as string,
    stripeUsageRecordId: data.stripe_usage_record_id as string | null,
    reportedToStripe: data.reported_to_stripe as boolean,
    createdAt: data.created_at as string,
  }
}

function mapInvoiceFromDb(data: DbRecord): Invoice {
  return {
    id: data.id as string,
    customerId: data.customer_id as string,
    stripeInvoiceId: data.stripe_invoice_id as string,
    amountDue: data.amount_due as number,
    amountPaid: data.amount_paid as number,
    currency: data.currency as Currency,
    status: data.status as InvoiceStatus,
    invoicePdfUrl: data.invoice_pdf_url as string | null,
    hostedInvoiceUrl: data.hosted_invoice_url as string | null,
    periodStart: data.period_start as string | null,
    periodEnd: data.period_end as string | null,
    createdAt: data.created_at as string,
  }
}

function mapPaymentFromDb(data: DbRecord): Payment {
  return {
    id: data.id as string,
    customerId: data.customer_id as string,
    stripePaymentIntentId: data.stripe_payment_intent_id as string,
    invoiceId: data.invoice_id as string | null,
    amount: data.amount as number,
    currency: data.currency as Currency,
    status: data.status as PaymentStatus,
    failureMessage: data.failure_message as string | null,
    createdAt: data.created_at as string,
  }
}
