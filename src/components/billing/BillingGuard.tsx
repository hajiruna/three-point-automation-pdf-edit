'use client'

import { isBillingEnabled } from '@/lib/billing/feature-flags'

interface BillingGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * 課金機能が有効な場合のみ children を表示
 * 無効な場合は fallback を表示（デフォルトは null）
 */
export function BillingGuard({ children, fallback = null }: BillingGuardProps) {
  if (!isBillingEnabled()) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * 課金機能が無効な場合のみ children を表示
 */
export function BillingDisabledGuard({ children, fallback = null }: BillingGuardProps) {
  if (isBillingEnabled()) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
