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
import { checkoutRequestSchema, formatZodError } from '@/lib/validations/billing'
import { applyRateLimit, AUTH_RATE_LIMIT } from '@/lib/security/rate-limit'

export async function POST(request: NextRequest) {
  // レート制限チェック（決済APIは厳しめに制限）
  const { response: rateLimitResponse } = applyRateLimit(request, AUTH_RATE_LIMIT)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

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
    const userName = session?.user?.name

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parseResult = checkoutRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: formatZodError(parseResult.error) },
        { status: 400 }
      )
    }

    const { priceId, successUrl, cancelUrl } = parseResult.data

    // 価格IDからプラン情報を取得
    const planInfo = getPlanByPriceId(priceId)
    if (!planInfo) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      )
    }

    const stripe = requireStripeServer()
    const userId = userEmail // NextAuthのユーザー識別子

    // 顧客を取得または作成
    let customer = await getCustomerByUserId(userId)
    let stripeCustomerId = customer?.stripeCustomerId

    if (!stripeCustomerId) {
      // Stripe顧客を作成
      const stripeCustomer = await stripe.customers.create({
        email: userEmail,
        name: userName || undefined,
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
          userEmail,
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
