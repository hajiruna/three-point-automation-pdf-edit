/**
 * 課金システム型定義
 */

// プランタイプ
export type PlanType = 'free' | 'pro' | 'enterprise'

// 課金間隔
export type BillingInterval = 'month' | 'year'

// 通貨
export type Currency = 'JPY' | 'USD'

// サブスクリプションステータス
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
  | 'paused'

// 請求書ステータス
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'

// 支払いステータス
export type PaymentStatus = 'succeeded' | 'failed' | 'pending'

// 操作タイプ
export type OperationType = 'extract' | 'merge'

// プラン制限
export interface PlanLimits {
  pdfExtractionsPerMonth: number // -1 = 無制限
  pdfMergesPerMonth: number // -1 = 無制限
  maxPagesPerOperation: number // -1 = 無制限
  maxFilesPerMerge: number // -1 = 無制限
}

// プラン価格
export interface PlanPricing {
  monthly: Record<Currency, number>
  yearly: Record<Currency, number>
}

// プラン定義
export interface PlanDefinition {
  id: PlanType
  name: string
  nameJa: string
  description: string
  descriptionJa: string
  limits: PlanLimits
  features: string[]
  featuresJa: string[]
  pricing?: PlanPricing
  stripePriceIds?: {
    monthly: Record<Currency, string>
    yearly: Record<Currency, string>
  }
}

// 顧客
export interface Customer {
  id: string
  userId: string
  email: string
  stripeCustomerId: string | null
  defaultCurrency: Currency
  createdAt: string
  updatedAt: string
}

// サブスクリプション
export interface Subscription {
  id: string
  customerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  planType: PlanType
  billingInterval: BillingInterval
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  createdAt: string
  updatedAt: string
}

// 利用量記録
export interface UsageRecord {
  id: string
  customerId: string
  operationType: OperationType
  pageCount: number
  billingPeriodStart: string
  billingPeriodEnd: string
  stripeUsageRecordId: string | null
  reportedToStripe: boolean
  createdAt: string
}

// 利用量サマリー
export interface UsageSummary {
  extractCount: number
  mergeCount: number
  totalPages: number
  periodStart: string
  periodEnd: string
}

// 請求書
export interface Invoice {
  id: string
  customerId: string
  stripeInvoiceId: string
  amountDue: number
  amountPaid: number
  currency: Currency
  status: InvoiceStatus
  invoicePdfUrl: string | null
  hostedInvoiceUrl: string | null
  periodStart: string | null
  periodEnd: string | null
  createdAt: string
}

// 支払い
export interface Payment {
  id: string
  customerId: string
  stripePaymentIntentId: string
  invoiceId: string | null
  amount: number
  currency: Currency
  status: PaymentStatus
  failureMessage: string | null
  createdAt: string
}

// Checkout セッション作成リクエスト
export interface CreateCheckoutRequest {
  priceId: string
  successUrl?: string
  cancelUrl?: string
}

// Checkout セッションレスポンス
export interface CheckoutSession {
  sessionId: string
  url: string
}

// カスタマーポータルレスポンス
export interface PortalSession {
  url: string
}

// 課金コンテキスト状態
export interface BillingState {
  isLoading: boolean
  customer: Customer | null
  subscription: Subscription | null
  usage: UsageSummary | null
  currentPlan: PlanDefinition | null
  error: string | null
}

// 課金コンテキストアクション
export interface BillingActions {
  refreshSubscription: () => Promise<void>
  refreshUsage: () => Promise<void>
  createCheckoutSession: (priceId: string) => Promise<string>
  openCustomerPortal: () => Promise<void>
  checkLimit: (operation: OperationType, pageCount?: number) => boolean
}

// 課金コンテキスト
export interface BillingContextType extends BillingState, BillingActions {}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Stripe Webhook イベントデータ
export interface WebhookEventData {
  type: string
  data: {
    object: unknown
  }
}
