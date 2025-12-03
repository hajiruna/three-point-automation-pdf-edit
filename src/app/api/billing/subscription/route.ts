/**
 * サブスクリプション状態取得 API
 * GET /api/billing/subscription
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { isBillingEnabled } from '@/lib/billing/feature-flags'
import { getCustomerByUserId, getActiveSubscription } from '@/lib/supabase/billing'
import { getPlanById, PLANS } from '@/lib/billing/plans'

export async function GET() {
  // 課金機能チェック
  if (!isBillingEnabled()) {
    return NextResponse.json(
      { error: 'Billing is not enabled' },
      { status: 403 }
    )
  }

  try {
    // セッション確認
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.email

    // 顧客を取得
    const customer = await getCustomerByUserId(userId)

    if (!customer) {
      // 顧客が存在しない場合はFreeプラン
      const freePlan = getPlanById('free')
      return NextResponse.json({
        success: true,
        data: {
          customer: null,
          subscription: null,
          plan: freePlan,
          isActive: false,
        },
      })
    }

    // アクティブなサブスクリプションを取得
    const subscription = await getActiveSubscription(customer.id)

    if (!subscription) {
      // サブスクリプションがない場合はFreeプラン
      const freePlan = getPlanById('free')
      return NextResponse.json({
        success: true,
        data: {
          customer,
          subscription: null,
          plan: freePlan,
          isActive: false,
        },
      })
    }

    // プラン情報を取得
    const plan = PLANS[subscription.planType] || PLANS.free

    return NextResponse.json({
      success: true,
      data: {
        customer,
        subscription,
        plan: {
          id: plan.id,
          name: plan.name,
          nameJa: plan.nameJa,
          limits: plan.limits,
        },
        isActive: subscription.status === 'active' || subscription.status === 'trialing',
      },
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
