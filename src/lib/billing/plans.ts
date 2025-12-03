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
      pdfExtractionsPerMonth: 10,
      pdfMergesPerMonth: 5,
      maxPagesPerOperation: 50,
      maxFilesPerMerge: 3,
    },
    features: [
      'PDF page extraction (10/month)',
      'PDF merging (5/month, up to 3 files)',
      'Up to 50 pages per operation',
      'Basic support',
    ],
    featuresJa: [
      'PDFページ抽出（月10回）',
      'PDF合体（月5回、最大3ファイル）',
      '1操作あたり最大50ページ',
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
      pdfExtractionsPerMonth: 100,
      pdfMergesPerMonth: 50,
      maxPagesPerOperation: 500,
      maxFilesPerMerge: 10,
    },
    features: [
      'PDF page extraction (100/month)',
      'PDF merging (50/month, up to 10 files)',
      'Up to 500 pages per operation',
      'Priority support',
      'Usage analytics',
    ],
    featuresJa: [
      'PDFページ抽出（月100回）',
      'PDF合体（月50回、最大10ファイル）',
      '1操作あたり最大500ページ',
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
