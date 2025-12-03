/**
 * 利用量追跡ユーティリティ
 */

import { isBillingEnabled } from './feature-flags'
import { PLANS } from './plans'
import type { OperationType, PlanType, UsageSummary, PlanLimits } from '@/types/billing'

/**
 * 現在の課金期間を取得
 */
export function getCurrentBillingPeriod(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

/**
 * 操作が制限内かチェック
 */
export function checkOperationLimit(
  operation: OperationType,
  usage: UsageSummary,
  planType: PlanType,
  pageCount?: number
): { allowed: boolean; reason?: string } {
  if (!isBillingEnabled()) {
    // 課金無効時は制限なし
    return { allowed: true }
  }

  const plan = PLANS[planType]
  if (!plan) {
    return { allowed: false, reason: 'Invalid plan' }
  }

  const limits = plan.limits

  // 無制限チェック（-1 = 無制限）
  if (operation === 'extract') {
    if (limits.pdfExtractionsPerMonth !== -1 && usage.extractCount >= limits.pdfExtractionsPerMonth) {
      return {
        allowed: false,
        reason: `月間の抽出回数上限（${limits.pdfExtractionsPerMonth}回）に達しました`,
      }
    }
  }

  if (operation === 'merge') {
    if (limits.pdfMergesPerMonth !== -1 && usage.mergeCount >= limits.pdfMergesPerMonth) {
      return {
        allowed: false,
        reason: `月間の合体回数上限（${limits.pdfMergesPerMonth}回）に達しました`,
      }
    }
  }

  // ページ数制限チェック
  if (pageCount && limits.maxPagesPerOperation !== -1) {
    if (pageCount > limits.maxPagesPerOperation) {
      return {
        allowed: false,
        reason: `1操作あたりのページ数上限（${limits.maxPagesPerOperation}ページ）を超えています`,
      }
    }
  }

  return { allowed: true }
}

/**
 * ファイル数制限チェック（合体用）
 */
export function checkFileLimit(
  fileCount: number,
  planType: PlanType
): { allowed: boolean; reason?: string } {
  if (!isBillingEnabled()) {
    return { allowed: true }
  }

  const plan = PLANS[planType]
  if (!plan) {
    return { allowed: false, reason: 'Invalid plan' }
  }

  const maxFiles = plan.limits.maxFilesPerMerge

  if (maxFiles !== -1 && fileCount > maxFiles) {
    return {
      allowed: false,
      reason: `1回の合体あたりのファイル数上限（${maxFiles}ファイル）を超えています`,
    }
  }

  return { allowed: true }
}

/**
 * 利用量の残り回数を計算
 */
export function getRemainingUsage(
  usage: UsageSummary,
  limits: PlanLimits
): {
  extractionsRemaining: number | null
  mergesRemaining: number | null
} {
  return {
    extractionsRemaining:
      limits.pdfExtractionsPerMonth === -1
        ? null // 無制限
        : Math.max(0, limits.pdfExtractionsPerMonth - usage.extractCount),
    mergesRemaining:
      limits.pdfMergesPerMonth === -1
        ? null
        : Math.max(0, limits.pdfMergesPerMonth - usage.mergeCount),
  }
}

/**
 * 利用率を計算（パーセント）
 */
export function getUsagePercentage(
  usage: UsageSummary,
  limits: PlanLimits
): {
  extractionPercentage: number | null
  mergePercentage: number | null
} {
  return {
    extractionPercentage:
      limits.pdfExtractionsPerMonth === -1
        ? null
        : Math.min(100, Math.round((usage.extractCount / limits.pdfExtractionsPerMonth) * 100)),
    mergePercentage:
      limits.pdfMergesPerMonth === -1
        ? null
        : Math.min(100, Math.round((usage.mergeCount / limits.pdfMergesPerMonth) * 100)),
  }
}

/**
 * アップグレードが必要かチェック
 */
export function shouldSuggestUpgrade(
  usage: UsageSummary,
  limits: PlanLimits,
  threshold = 80
): boolean {
  const percentages = getUsagePercentage(usage, limits)

  if (percentages.extractionPercentage !== null && percentages.extractionPercentage >= threshold) {
    return true
  }

  if (percentages.mergePercentage !== null && percentages.mergePercentage >= threshold) {
    return true
  }

  return false
}
