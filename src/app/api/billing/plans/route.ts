/**
 * プラン一覧取得 API
 * GET /api/billing/plans
 */

import { NextResponse } from 'next/server'
import { isBillingEnabled } from '@/lib/billing/feature-flags'
import { getPlanList } from '@/lib/billing/plans'

export async function GET() {
  // 課金機能が無効の場合
  if (!isBillingEnabled()) {
    return NextResponse.json(
      { error: 'Billing is not enabled' },
      { status: 403 }
    )
  }

  try {
    const plans = getPlanList()

    // サーバーサイドの価格IDは除外して返す
    const safePlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      nameJa: plan.nameJa,
      description: plan.description,
      descriptionJa: plan.descriptionJa,
      limits: plan.limits,
      features: plan.features,
      featuresJa: plan.featuresJa,
      pricing: plan.pricing,
    }))

    return NextResponse.json({
      success: true,
      data: safePlans,
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}
