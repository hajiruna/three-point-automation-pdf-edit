'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { isBillingEnabled } from '@/lib/billing/feature-flags'
import { PLANS } from '@/lib/billing/plans'
import { checkOperationLimit } from '@/lib/billing/usage-tracker'
import type {
  BillingContextType,
  Customer,
  Subscription,
  UsageSummary,
  PlanDefinition,
  OperationType,
} from '@/types/billing'

const defaultContext: BillingContextType = {
  isLoading: true,
  customer: null,
  subscription: null,
  usage: null,
  currentPlan: PLANS.free,
  error: null,
  refreshSubscription: async () => {},
  refreshUsage: async () => {},
  createCheckoutSession: async () => '',
  openCustomerPortal: async () => {},
  checkLimit: () => true,
}

const BillingContext = createContext<BillingContextType>(defaultContext)

interface BillingProviderProps {
  children: React.ReactNode
}

export function BillingProvider({ children }: BillingProviderProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 現在のプラン
  const currentPlan = useMemo<PlanDefinition>(() => {
    if (!subscription) return PLANS.free
    return PLANS[subscription.planType] || PLANS.free
  }, [subscription])

  // サブスクリプション情報を取得
  const refreshSubscription = useCallback(async () => {
    if (!isBillingEnabled() || status !== 'authenticated') return

    try {
      const res = await fetch('/api/billing/subscription')
      if (!res.ok) throw new Error('Failed to fetch subscription')

      const data = await res.json()
      if (data.success) {
        setCustomer(data.data.customer)
        setSubscription(data.data.subscription)
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError('サブスクリプション情報の取得に失敗しました')
    }
  }, [status])

  // 利用量情報を取得
  const refreshUsage = useCallback(async () => {
    if (!isBillingEnabled() || status !== 'authenticated') return

    try {
      const res = await fetch('/api/billing/usage')
      if (!res.ok) throw new Error('Failed to fetch usage')

      const data = await res.json()
      if (data.success) {
        setUsage(data.data.usage)
      }
    } catch (err) {
      console.error('Error fetching usage:', err)
    }
  }, [status])

  // Checkoutセッション作成
  const createCheckoutSession = useCallback(async (priceId: string): Promise<string> => {
    if (!isBillingEnabled()) {
      throw new Error('Billing is not enabled')
    }

    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to create checkout session')
    }

    const data = await res.json()
    if (data.success && data.data.url) {
      // Checkoutページにリダイレクト (URLリダイレクト方式)
      window.location.href = data.data.url
      return data.data.url
    }

    throw new Error('Failed to get checkout URL')
  }, [])

  // カスタマーポータルを開く
  const openCustomerPortal = useCallback(async () => {
    if (!isBillingEnabled()) {
      throw new Error('Billing is not enabled')
    }

    const res = await fetch('/api/billing/portal', {
      method: 'POST',
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to create portal session')
    }

    const data = await res.json()
    if (data.success && data.data.url) {
      window.location.href = data.data.url
    }
  }, [])

  // 操作制限チェック
  const checkLimit = useCallback(
    (operation: OperationType, pageCount?: number): boolean => {
      if (!isBillingEnabled()) return true
      if (!usage) return true // 利用量未取得時は許可

      const planType = subscription?.planType || 'free'
      const result = checkOperationLimit(operation, usage, planType, pageCount)
      return result.allowed
    },
    [subscription, usage]
  )

  // 初期読み込み
  useEffect(() => {
    if (!isBillingEnabled()) {
      setIsLoading(false)
      return
    }

    if (status === 'loading') return

    if (status === 'authenticated' && session) {
      setIsLoading(true)
      Promise.all([refreshSubscription(), refreshUsage()])
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [status, session, refreshSubscription, refreshUsage])

  const value = useMemo<BillingContextType>(
    () => ({
      isLoading,
      customer,
      subscription,
      usage,
      currentPlan,
      error,
      refreshSubscription,
      refreshUsage,
      createCheckoutSession,
      openCustomerPortal,
      checkLimit,
    }),
    [
      isLoading,
      customer,
      subscription,
      usage,
      currentPlan,
      error,
      refreshSubscription,
      refreshUsage,
      createCheckoutSession,
      openCustomerPortal,
      checkLimit,
    ]
  )

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  )
}

export function useBilling() {
  const context = useContext(BillingContext)
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider')
  }
  return context
}
