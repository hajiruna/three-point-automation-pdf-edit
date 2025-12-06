import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { isAdminServer } from '@/lib/auth/admin'
import { applyRateLimit, ADMIN_RATE_LIMIT } from '@/lib/security/rate-limit'

export async function GET(request: Request) {
  // レート制限チェック
  const { response: rateLimitResponse, headers: rateLimitHeaders } = applyRateLimit(
    request,
    ADMIN_RATE_LIMIT
  )
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // 認証チェック
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: rateLimitHeaders })
  }

  // 管理者チェック
  if (!isAdminServer(session?.user?.email)) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403, headers: rateLimitHeaders }
    )
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    // 基本KPI
    const { data: kpiData, error: kpiError } = await supabase
      .from('usage_logs')
      .select('id, action_type, pages_extracted, user_email, user_name, created_at, file_name')

    if (kpiError) throw kpiError

    const logs = kpiData || []

    const kpi = {
      totalOperations: logs.length,
      uniqueUsers: new Set(logs.filter(l => l.user_email).map(l => l.user_email)).size,
      totalExtractions: logs.filter(l => l.action_type === 'extract').length,
      totalMerges: logs.filter(l => l.action_type === 'merge').length,
      totalPagesProcessed: logs.reduce((sum, l) => sum + (l.pages_extracted || 0), 0),
    }

    // 日別利用状況（過去30日）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyMap = new Map<string, { operations: number; users: Set<string> }>()

    logs.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { operations: 0, users: new Set() })
      }
      const day = dailyMap.get(date)!
      day.operations++
      if (log.user_email) {
        day.users.add(log.user_email)
      }
    })

    const dailyUsage = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        operations: data.operations,
        uniqueUsers: data.users.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)

    // ユーザー別ランキング
    const userMap = new Map<string, {
      email: string
      name: string | null
      operations: number
      extractions: number
      merges: number
      lastActivity: string
    }>()

    logs.forEach(log => {
      if (!log.user_email) return

      if (!userMap.has(log.user_email)) {
        userMap.set(log.user_email, {
          email: log.user_email,
          name: log.user_name,
          operations: 0,
          extractions: 0,
          merges: 0,
          lastActivity: log.created_at,
        })
      }

      const user = userMap.get(log.user_email)!
      user.operations++
      if (log.action_type === 'extract') user.extractions++
      if (log.action_type === 'merge') user.merges++
      if (new Date(log.created_at) > new Date(user.lastActivity)) {
        user.lastActivity = log.created_at
      }
    })

    const userRanking = Array.from(userMap.values())
      .sort((a, b) => b.operations - a.operations)
      .slice(0, 20)

    // 最近のアクティビティ
    const recentActivity = logs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(log => ({
        id: log.id,
        actionType: log.action_type,
        fileName: log.file_name,
        pagesExtracted: log.pages_extracted,
        userEmail: log.user_email,
        userName: log.user_name,
        createdAt: log.created_at,
      }))

    return NextResponse.json({
      kpi,
      dailyUsage,
      userRanking,
      recentActivity,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
