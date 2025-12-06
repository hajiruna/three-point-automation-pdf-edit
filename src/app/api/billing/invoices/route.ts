/**
 * 請求書一覧取得 API
 * GET /api/billing/invoices
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { isBillingEnabled } from '@/lib/billing/feature-flags'
import { getCustomerByUserId, getInvoices } from '@/lib/supabase/billing'

export async function GET(request: NextRequest) {
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

    if (!customer) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // クエリパラメータから limit を取得
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const invoices = await getInvoices(customer.id, Math.min(limit, 50))

    return NextResponse.json({
      success: true,
      data: invoices,
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
