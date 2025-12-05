/**
 * 利用量 API
 * GET /api/billing/usage - 利用量サマリー取得
 * POST /api/billing/usage - 利用量記録
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { isBillingEnabled } from '@/lib/billing/feature-flags'
import {
  getCustomerByUserId,
  getUsageSummary,
  recordUsage,
  getActiveSubscription,
} from '@/lib/supabase/billing'
import { getCurrentBillingPeriod, getRemainingUsage, getUsagePercentage } from '@/lib/billing/usage-tracker'
import { PLANS } from '@/lib/billing/plans'
import { usageRecordRequestSchema, formatZodError } from '@/lib/validations/billing'

/**
 * GET: 利用量サマリー取得
 */
export async function GET() {
  if (!isBillingEnabled()) {
    return NextResponse.json(
      { error: 'Billing is not enabled' },
      { status: 403 }
    )
  }

  try {
    const session = await getServerSession()

    const userEmail = session?.user?.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = userEmail
    const customer = await getCustomerByUserId(userId)

    // 課金期間
    const { start, end } = getCurrentBillingPeriod()

    if (!customer) {
      // 顧客未登録の場合はFreeプランとして0使用量を返す
      const freeLimits = PLANS.free.limits
      return NextResponse.json({
        success: true,
        data: {
          usage: {
            extractCount: 0,
            mergeCount: 0,
            totalPages: 0,
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
          },
          limits: freeLimits,
          remaining: getRemainingUsage(
            { extractCount: 0, mergeCount: 0, totalPages: 0, periodStart: '', periodEnd: '' },
            freeLimits
          ),
          percentage: getUsagePercentage(
            { extractCount: 0, mergeCount: 0, totalPages: 0, periodStart: '', periodEnd: '' },
            freeLimits
          ),
          planType: 'free',
        },
      })
    }

    // サブスクリプション取得
    const subscription = await getActiveSubscription(customer.id)
    const planType = subscription?.planType || 'free'
    const limits = PLANS[planType]?.limits || PLANS.free.limits

    // 利用量サマリー取得
    const usage = await getUsageSummary(customer.id, start, end)

    return NextResponse.json({
      success: true,
      data: {
        usage,
        limits,
        remaining: getRemainingUsage(usage, limits),
        percentage: getUsagePercentage(usage, limits),
        planType,
      },
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    )
  }
}

/**
 * POST: 利用量記録
 */
export async function POST(request: NextRequest) {
  if (!isBillingEnabled()) {
    return NextResponse.json(
      { error: 'Billing is not enabled' },
      { status: 403 }
    )
  }

  try {
    const session = await getServerSession()

    const userEmail = session?.user?.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parseResult = usageRecordRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      )
    }

    const { operationType, pageCount } = parseResult.data

    const userId = userEmail
    const customer = await getCustomerByUserId(userId)

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const { start, end } = getCurrentBillingPeriod()

    const record = await recordUsage({
      customerId: customer.id,
      operationType,
      pageCount,
      billingPeriodStart: start,
      billingPeriodEnd: end,
    })

    if (!record) {
      return NextResponse.json(
        { error: 'Failed to record usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: record,
    })
  } catch (error) {
    console.error('Error recording usage:', error)
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    )
  }
}
