'use client'

import { useState } from 'react'
import { useTheme } from '@/components/ui/ThemeProvider'
import { useBilling } from './BillingProvider'
import { formatPrice, isUnlimited, getYearlyDiscount } from '@/lib/billing/plans'
import type { PlanDefinition, Currency, BillingInterval } from '@/types/billing'

interface PricingCardProps {
  plan: PlanDefinition
  currency: Currency
  interval: BillingInterval
  isCurrentPlan?: boolean
  onSelect?: (priceId: string) => void
}

export function PricingCard({
  plan,
  currency,
  interval,
  isCurrentPlan = false,
  onSelect,
}: PricingCardProps) {
  const { theme } = useTheme()
  const { createCheckoutSession, isLoading: billingLoading } = useBilling()
  const [isLoading, setIsLoading] = useState(false)

  const isDark = theme === 'dark'
  const isFree = plan.id === 'free'
  const isPro = plan.id === 'pro'

  // 価格取得 (interval: 'month'|'year' を 'monthly'|'yearly' に変換)
  const pricingKey = interval === 'month' ? 'monthly' : 'yearly'
  const price = plan.pricing?.[pricingKey]?.[currency] ?? 0
  const yearlyDiscount = getYearlyDiscount(plan)

  // 価格ID取得
  const priceId = plan.stripePriceIds?.[pricingKey]?.[currency]

  const handleSelect = async () => {
    if (isFree || isCurrentPlan || !priceId) return

    setIsLoading(true)
    try {
      if (onSelect) {
        onSelect(priceId)
      } else {
        await createCheckoutSession(priceId)
      }
    } catch (error) {
      console.error('Error selecting plan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`
        relative rounded-2xl p-6 flex flex-col
        ${isPro ? 'ring-2 ring-blue-500' : ''}
        ${isDark ? 'bg-gray-800' : 'bg-white'}
        shadow-lg
      `}
    >
      {/* おすすめバッジ */}
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            おすすめ
          </span>
        </div>
      )}

      {/* プラン名 */}
      <h3
        className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        {plan.nameJa}
      </h3>

      {/* 説明 */}
      <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {plan.descriptionJa}
      </p>

      {/* 価格 */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span
            className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {isFree ? '無料' : formatPrice(price, currency)}
          </span>
          {!isFree && (
            <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              /{interval === 'month' ? '月' : '年'}
            </span>
          )}
        </div>
        {interval === 'year' && yearlyDiscount > 0 && (
          <p className="text-green-500 text-sm mt-1">
            年払いで{yearlyDiscount}%お得
          </p>
        )}
      </div>

      {/* 機能一覧 */}
      <ul className="flex-1 space-y-3 mb-6">
        {plan.featuresJa.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* 制限情報 */}
      <div
        className={`text-xs space-y-1 mb-4 p-3 rounded-lg ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}
      >
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          抽出:{' '}
          {isUnlimited(plan.limits.pdfExtractionsPerMonth)
            ? '無制限'
            : `${plan.limits.pdfExtractionsPerMonth}回/月`}
        </p>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          合体:{' '}
          {isUnlimited(plan.limits.pdfMergesPerMonth)
            ? '無制限'
            : `${plan.limits.pdfMergesPerMonth}回/月`}
        </p>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          ページ上限:{' '}
          {isUnlimited(plan.limits.maxPagesPerOperation)
            ? '無制限'
            : `${plan.limits.maxPagesPerOperation}ページ`}
        </p>
      </div>

      {/* ボタン */}
      <button
        onClick={handleSelect}
        disabled={isFree || isCurrentPlan || isLoading || billingLoading}
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-colors
          ${
            isCurrentPlan
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : isFree
              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
              : isPro
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }
          disabled:opacity-50
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            処理中...
          </span>
        ) : isCurrentPlan ? (
          '現在のプラン'
        ) : isFree ? (
          '無料プラン'
        ) : (
          'このプランを選択'
        )}
      </button>
    </div>
  )
}
