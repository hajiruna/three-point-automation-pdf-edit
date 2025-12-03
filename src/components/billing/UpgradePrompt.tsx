'use client'

import { useTheme } from '@/components/ui/ThemeProvider'
import { useBilling } from './BillingProvider'

interface UpgradePromptProps {
  message?: string
  showWhen?: 'always' | 'free-only' | 'near-limit'
}

export function UpgradePrompt({
  message = 'より多くの機能を使うには、プランをアップグレードしてください。',
  showWhen = 'free-only',
}: UpgradePromptProps) {
  const { theme } = useTheme()
  const { currentPlan, usage } = useBilling()

  const isDark = theme === 'dark'
  const isFree = currentPlan?.id === 'free'
  const isEnterprise = currentPlan?.id === 'enterprise'

  // 表示条件
  if (isEnterprise) return null

  if (showWhen === 'free-only' && !isFree) return null

  if (showWhen === 'near-limit') {
    if (!currentPlan) return null
    const limits = currentPlan.limits
    const usageData = usage || { extractCount: 0, mergeCount: 0, totalPages: 0, periodStart: '', periodEnd: '' }

    const extractPercent =
      limits.pdfExtractionsPerMonth === -1
        ? 0
        : (usageData.extractCount / limits.pdfExtractionsPerMonth) * 100
    const mergePercent =
      limits.pdfMergesPerMonth === -1
        ? 0
        : (usageData.mergeCount / limits.pdfMergesPerMonth) * 100

    if (extractPercent < 80 && mergePercent < 80) return null
  }

  return (
    <div
      className={`p-4 rounded-lg border ${
        isDark
          ? 'bg-blue-900/20 border-blue-800'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
            {message}
          </p>
          <a
            href="/billing#pricing"
            className="inline-flex items-center mt-2 text-sm font-medium text-blue-500 hover:text-blue-600"
          >
            プランを見る
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
