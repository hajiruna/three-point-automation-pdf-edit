'use client'

import { useTheme } from '@/components/ui/ThemeProvider'
import { useBilling } from './BillingProvider'
import { getRemainingUsage, getUsagePercentage, shouldSuggestUpgrade } from '@/lib/billing/usage-tracker'

export function UsageDisplay() {
  const { theme } = useTheme()
  const { usage, currentPlan, isLoading } = useBilling()

  const isDark = theme === 'dark'

  if (isLoading) {
    return (
      <div
        className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-300 rounded w-full mb-2" />
          <div className="h-4 bg-gray-300 rounded w-full" />
        </div>
      </div>
    )
  }

  const limits = currentPlan?.limits || { pdfExtractionsPerMonth: 10, pdfMergesPerMonth: 5, maxPagesPerOperation: 50, maxFilesPerMerge: 3 }
  const usageData = usage || {
    extractCount: 0,
    mergeCount: 0,
    totalPages: 0,
    periodStart: '',
    periodEnd: '',
  }

  const remaining = getRemainingUsage(usageData, limits)
  const percentage = getUsagePercentage(usageData, limits)
  const showUpgradePrompt = shouldSuggestUpgrade(usageData, limits)

  // 期間表示
  const periodDisplay = usage?.periodStart
    ? `${new Date(usage.periodStart).toLocaleDateString('ja-JP')} 〜 ${new Date(
        usage.periodEnd
      ).toLocaleDateString('ja-JP')}`
    : '今月'

  return (
    <div
      className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          今月の利用状況
        </h3>
        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {periodDisplay}
        </span>
      </div>

      <div className="space-y-4">
        {/* 抽出 */}
        <UsageBar
          label="PDF抽出"
          current={usageData.extractCount}
          limit={limits.pdfExtractionsPerMonth}
          remaining={remaining.extractionsRemaining}
          percentage={percentage.extractionPercentage}
          isDark={isDark}
        />

        {/* 合体 */}
        <UsageBar
          label="PDF合体"
          current={usageData.mergeCount}
          limit={limits.pdfMergesPerMonth}
          remaining={remaining.mergesRemaining}
          percentage={percentage.mergePercentage}
          isDark={isDark}
        />

        {/* 総ページ数 */}
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          処理済みページ数: <span className="font-medium">{usageData.totalPages}</span> ページ
        </div>
      </div>

      {/* アップグレード提案 */}
      {showUpgradePrompt && currentPlan?.id !== 'enterprise' && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 利用量が上限に近づいています。
            <a href="#pricing" className="underline font-medium ml-1">
              アップグレード
            </a>
            をご検討ください。
          </p>
        </div>
      )}
    </div>
  )
}

interface UsageBarProps {
  label: string
  current: number
  limit: number
  remaining: number | null
  percentage: number | null
  isDark: boolean
}

function UsageBar({ label, current, limit, remaining, percentage, isDark }: UsageBarProps) {
  const isUnlimited = limit === -1
  const isNearLimit = percentage !== null && percentage >= 80
  const isAtLimit = percentage !== null && percentage >= 100

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </span>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {isUnlimited ? (
            <span className="text-green-500">無制限</span>
          ) : (
            <>
              {current} / {limit}
              {remaining !== null && (
                <span className="ml-2 text-xs">（残り {remaining} 回）</span>
              )}
            </>
          )}
        </span>
      </div>
      {!isUnlimited && (
        <div
          className={`h-2 rounded-full overflow-hidden ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(percentage || 0, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
