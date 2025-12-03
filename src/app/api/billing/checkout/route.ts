/**
 * Stripe Checkout セッション作成 API
 * POST /api/billing/checkout
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { isBillingEnabled, isStripeServerConfigured } from '@/lib/billing/feature-flags'
import { requireStripeServer } from '@/lib/billing/stripe-server'
import { getCustomerByUserId, createCustomer } from '@/lib/supabase/billing'
import { getPlanByPriceId } from '@/lib/billing/plans'

interface CheckoutRequest {
  priceId: string
  successUrl?: string
  cancelUrl?: string
}

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
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: CheckoutRequest = await request.json()
    const { priceId, successUrl, cancelUrl } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // 価格IDからプラン情報を取得
    const planInfo = getPlanByPriceId(priceId)
    if (!planInfo) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      )
    }

    const stripe = requireStripeServer()
    const userId = session.user.email // NextAuthのユーザー識別子

    // 顧客を取得または作成
    let customer = await getCustomerByUserId(userId)
    let stripeCustomerId = customer?.stripeCustomerId

    if (!stripeCustomerId) {
      // Stripe顧客を作成
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId,
        },
      })
      stripeCustomerId = stripeCustomer.id

      // DB顧客レコードを作成または更新
      if (customer) {
        // 既存顧客にStripe IDを紐付け
        // updateCustomer で対応
      } else {
        customer = await createCustomer(
          userId,
          session.user.email,
          stripeCustomerId,
          planInfo.currency
        )
      }
    }

    // ベースURL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    // Checkout セッション作成
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${baseUrl}/billing?success=true`,
      cancel_url: cancelUrl || `${baseUrl}/billing?canceled=true`,
      metadata: {
        userId,
        planType: planInfo.plan.id,
        billingInterval: planInfo.interval,
      },
      subscription_data: {
        metadata: {
          userId,
          planType: planInfo.plan.id,
        },
      },
      // 日本円の場合は税金設定
      ...(planInfo.currency === 'JPY' && {
        automatic_tax: { enabled: false },
      }),
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
