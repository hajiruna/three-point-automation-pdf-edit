/**
 * Stripe カスタマーポータル セッション作成 API
 * POST /api/billing/portal
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { isBillingEnabled, isStripeServerConfigured } from '@/lib/billing/feature-flags'
import { requireStripeServer } from '@/lib/billing/stripe-server'
import { getCustomerByUserId } from '@/lib/supabase/billing'

export async function POST(request: NextRequest) {
  // 課金機能チェック
  if (!isBillingEnabled()) {
    return NextResponse.json(
      { error: 'Billing is not enabled' },
      { status: 403 }
    )
  }

  if (!isStripeServerConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    )
  }

  try {
    // セッション確認
    const session = await getServerSession()

    const userEmail = session?.user?.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = userEmail

    // 顧客を取得
    const customer = await getCustomerByUserId(userId)
    if (!customer?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const stripe = requireStripeServer()

    // ベースURL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    // カスタマーポータルセッション作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    })

    return NextResponse.json({
      success: true,
      data: {
        url: portalSession.url,
      },
    })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
