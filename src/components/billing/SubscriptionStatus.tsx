'use client'

import { useTheme } from '@/components/ui/ThemeProvider'
import { useBilling } from './BillingProvider'
import { formatPrice } from '@/lib/billing/plans'

export function SubscriptionStatus() {
  const { theme } = useTheme()
  const { subscription, currentPlan, customer, openCustomerPortal, isLoading } = useBilling()

  const isDark = theme === 'dark'

  if (isLoading) {
    return (
      <div
        className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-300 rounded w-2/3 mb-2" />
          <div className="h-4 bg-gray-300 rounded w-1/2" />
        </div>
      </div>
    )
  }

  const isFree = !subscription || currentPlan?.id === 'free'
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const willCancel = subscription?.cancelAtPeriodEnd

  // 次回請求日
  const nextBillingDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')
    : null

  return (
    <div
      className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          現在のプラン
        </h3>
        {!isFree && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {isActive ? 'アクティブ' : subscription?.status}
          </span>
        )}
      </div>

      {/* プラン情報 */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            {currentPlan?.nameJa || '無料'}
          </span>
          {subscription && currentPlan?.pricing && (
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatPrice(
                currentPlan.pricing[subscription.billingInterval === 'month' ? 'monthly' : 'yearly'][
                  customer?.defaultCurrency || 'JPY'
                ],
                customer?.defaultCurrency || 'JPY'
              )}
              /{subscription.billingInterval === 'month' ? '月' : '年'}
            </span>
          )}
        </div>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {currentPlan?.descriptionJa || ''}
        </p>
      </div>

      {/* 請求情報 */}
      {!isFree && (
        <div
          className={`border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          {willCancel ? (
            <p className="text-yellow-500 text-sm">
              ⚠️ {nextBillingDate} に解約されます
            </p>
          ) : nextBillingDate ? (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              次回請求日: {nextBillingDate}
            </p>
          ) : null}
        </div>
      )}

      {/* アクション */}
      <div className="mt-4 flex gap-3">
        {!isFree && (
          <button
            onClick={openCustomerPortal}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            プラン管理
          </button>
        )}
        {isFree && (
          <a
            href="#pricing"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            アップグレード
          </a>
        )}
      </div>
    </div>
  )
}
