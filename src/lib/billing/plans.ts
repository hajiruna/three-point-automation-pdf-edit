/**
 * プラン定義
 */

import type { PlanDefinition, PlanType, Currency, BillingInterval } from '@/types/billing'

/**
 * プラン一覧
 */
export const PLANS: Record<PlanType, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    nameJa: '無料',
    description: 'Get started with basic PDF operations',
    descriptionJa: '基本的なPDF操作を無料で開始',
    limits: {
      pdfExtractionsPerMonth: 1000,
      pdfMergesPerMonth: 1000,
      maxPagesPerOperation: 1000,
      maxFilesPerMerge: 100,
    },
    features: [
      'PDF page extraction (1,000/month)',
      'PDF merging (1,000/month, up to 100 files)',
      'Up to 1,000 pages per operation',
      'Basic support',
    ],
    featuresJa: [
      'PDFページ抽出（月1,000回）',
      'PDF合体（月1,000回、最大100ファイル）',
      '1操作あたり最大1,000ページ',
      '基本サポート',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameJa: 'プロ',
    description: 'For power users who need more capacity',
    descriptionJa: 'より多くの処理が必要なパワーユーザー向け',
    limits: {
      pdfExtractionsPerMonth: 2000,
      pdfMergesPerMonth: 2000,
      maxPagesPerOperation: 2000,
      maxFilesPerMerge: 200,
    },
    features: [
      'PDF page extraction (2,000/month)',
      'PDF merging (2,000/month, up to 200 files)',
      'Up to 2,000 pages per operation',
      'Priority support',
      'Usage analytics',
    ],
    featuresJa: [
      'PDFページ抽出（月2,000回）',
      'PDF合体（月2,000回、最大200ファイル）',
      '1操作あたり最大2,000ページ',
      '優先サポート',
      '使用状況分析',
    ],
    pricing: {
      monthly: { JPY: 980, USD: 9 },
      yearly: { JPY: 9800, USD: 90 },
    },
    stripePriceIds: {
      monthly: {
        JPY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_JPY || '',
        USD: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY_USD || '',
      },
      yearly: {
        JPY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY_JPY || '',
        USD: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY_USD || '',
      },
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    nameJa: 'エンタープライズ',
    description: 'Unlimited access for teams and businesses',
    descriptionJa: 'チームやビジネス向けの無制限アクセス',
    limits: {
      pdfExtractionsPerMonth: -1, // 無制限
      pdfMergesPerMonth: -1,
      maxPagesPerOperation: -1,
      maxFilesPerMerge: -1,
    },
    features: [
      'Unlimited PDF extractions',
      'Unlimited PDF merging',
      'No page limits',
      'Dedicated support',
      'API access',
      'Custom integrations',
      'SLA guarantee',
    ],
    featuresJa: [
      '無制限のPDF抽出',
      '無制限のPDF合体',
      'ページ数制限なし',
      '専用サポート',
      'APIアクセス',
      'カスタム統合',
      'SLA保証',
    ],
    pricing: {
      monthly: { JPY: 4980, USD: 49 },
      yearly: { JPY: 49800, USD: 490 },
    },
    stripePriceIds: {
      monthly: {
        JPY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY_JPY || '',
        USD: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY_USD || '',
      },
      yearly: {
        JPY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY_JPY || '',
        USD: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY_USD || '',
      },
    },
  },
}

/**
 * プラン一覧を配列で取得
 */
export const getPlanList = (): PlanDefinition[] => {
  return Object.values(PLANS)
}

/**
 * プランIDからプラン定義を取得
 */
export const getPlanById = (planId: PlanType): PlanDefinition | undefined => {
  return PLANS[planId]
}

/**
 * 価格IDからプラン情報を取得
 */
export const getPlanByPriceId = (
  priceId: string
): { plan: PlanDefinition; interval: BillingInterval; currency: Currency } | undefined => {
  for (const plan of Object.values(PLANS)) {
    if (!plan.stripePriceIds) continue

    for (const pricingKey of ['monthly', 'yearly'] as const) {
      for (const currency of ['JPY', 'USD'] as const) {
        if (plan.stripePriceIds[pricingKey][currency] === priceId) {
          // 'monthly' -> 'month', 'yearly' -> 'year' に変換
          const interval: BillingInterval = pricingKey === 'monthly' ? 'month' : 'year'
          return { plan, interval, currency }
        }
      }
    }
  }
  return undefined
}

/**
 * 価格を通貨に応じてフォーマット
 */
export const formatPrice = (amount: number, currency: Currency): string => {
  if (currency === 'JPY') {
    return `¥${amount.toLocaleString()}`
  }
  return `$${amount}`
}

/**
 * 制限値が無制限かどうかをチェック
 */
export const isUnlimited = (value: number): boolean => {
  return value === -1
}

/**
 * プランの年額割引率を計算
 */
export const getYearlyDiscount = (plan: PlanDefinition): number => {
  if (!plan.pricing) return 0

  const monthlyTotal = plan.pricing.monthly.JPY * 12
  const yearlyPrice = plan.pricing.yearly.JPY

  return Math.round((1 - yearlyPrice / monthlyTotal) * 100)
}
