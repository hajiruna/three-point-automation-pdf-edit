'use client'

import { useState } from 'react'
import { useTheme } from '@/components/ui/ThemeProvider'
import { useBilling } from './BillingProvider'
import { PricingCard } from './PricingCard'
import { getPlanList } from '@/lib/billing/plans'
import type { Currency, BillingInterval } from '@/types/billing'

export function PricingTable() {
  const { theme } = useTheme()
  const { subscription } = useBilling()
  const [interval, setInterval] = useState<BillingInterval>('month')
  const [currency, setCurrency] = useState<Currency>('JPY')

  const isDark = theme === 'dark'
  const plans = getPlanList()
  const currentPlanType = subscription?.planType || 'free'

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* 切り替えコントロール */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        {/* 支払いサイクル切り替え */}
        <div
          className={`inline-flex rounded-lg p-1 ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}
        >
          <button
            onClick={() => setInterval('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              interval === 'month'
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            月払い
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              interval === 'year'
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            年払い
            <span className="ml-1 text-xs text-green-500">お得</span>
          </button>
        </div>

        {/* 通貨切り替え */}
        <div
          className={`inline-flex rounded-lg p-1 ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}
        >
          <button
            onClick={() => setCurrency('JPY')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currency === 'JPY'
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ¥ JPY
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currency === 'USD'
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            $ USD
          </button>
        </div>
      </div>

      {/* プランカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currency={currency}
            interval={interval}
            isCurrentPlan={currentPlanType === plan.id}
          />
        ))}
      </div>
    </div>
  )
}
