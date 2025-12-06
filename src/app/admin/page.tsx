'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { useTheme } from '@/components/ui'

interface KPI {
  totalOperations: number
  uniqueUsers: number
  totalExtractions: number
  totalMerges: number
  totalPagesProcessed: number
}

interface DailyUsage {
  date: string
  operations: number
  uniqueUsers: number
}

interface UserRanking {
  email: string
  name: string | null
  operations: number
  extractions: number
  merges: number
  lastActivity: string
}

interface RecentActivity {
  id: string
  actionType: string
  fileName: string
  pagesExtracted: number
  userEmail: string | null
  userName: string | null
  createdAt: string
}

interface Stats {
  kpi: KPI
  dailyUsage: DailyUsage[]
  userRanking: UserRanking[]
  recentActivity: RecentActivity[]
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      // 管理者チェック（セッションに含まれるisAdminフラグを使用）
      const user = session?.user as { isAdmin?: boolean } | undefined
      if (!user?.isAdmin) {
        setUnauthorized(true)
        setLoading(false)
        return
      }
      fetchStats()
    }
  }, [status, router, session])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">エラー: {error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchStats() }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            アクセス権限がありません
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            このページは管理者のみアクセス可能です。
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('ja-JP')
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            管理ダッシュボード
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            PDF Page Selector の利用状況
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KpiCard
            title="総操作数"
            value={stats.kpi.totalOperations}
            icon="📊"
            isDark={isDark}
          />
          <KpiCard
            title="ユニークユーザー"
            value={stats.kpi.uniqueUsers}
            icon="👥"
            isDark={isDark}
          />
          <KpiCard
            title="抽出回数"
            value={stats.kpi.totalExtractions}
            icon="📄"
            isDark={isDark}
          />
          <KpiCard
            title="合体回数"
            value={stats.kpi.totalMerges}
            icon="📑"
            isDark={isDark}
          />
          <KpiCard
            title="処理ページ数"
            value={stats.kpi.totalPagesProcessed}
            icon="📃"
            isDark={isDark}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Usage Line Chart */}
          <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              日別利用状況
            </h2>
            {stats.dailyUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                  />
                  <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="operations"
                    name="操作数"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="uniqueUsers"
                    name="ユーザー数"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-[300px] flex items-center justify-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                データがありません
              </div>
            )}
          </div>

          {/* User Ranking Bar Chart */}
          <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ユーザー別利用回数
            </h2>
            {stats.userRanking.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.userRanking.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis type="number" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                    tickFormatter={(value) => value || 'Unknown'}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="extractions" name="抽出" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="merges" name="合体" fill="#10b981" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-[300px] flex items-center justify-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                ユーザーデータがありません
              </div>
            )}
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Ranking Table */}
          <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ユーザーランキング
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                    <th className={`text-left py-2 px-3 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      ユーザー
                    </th>
                    <th className={`text-right py-2 px-3 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      操作数
                    </th>
                    <th className={`text-right py-2 px-3 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      最終利用
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.userRanking.length > 0 ? (
                    stats.userRanking.map((user, index) => (
                      <tr
                        key={user.email}
                        className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-100'}
                      >
                        <td className={`py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-amber-600 text-white' :
                              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium">{user.name || 'Unknown'}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={`text-right py-2 px-3 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                          {user.operations}
                        </td>
                        <td className={`text-right py-2 px-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {formatDate(user.lastActivity)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className={`py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        データがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              最近のアクティビティ
            </h2>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          activity.actionType === 'extract'
                            ? 'bg-blue-100 text-blue-700'
                            : activity.actionType === 'merge'
                            ? 'bg-green-100 text-green-700'
                            : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {activity.actionType === 'extract' ? '抽出' :
                           activity.actionType === 'merge' ? '合体' : '不明'}
                        </span>
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {activity.pagesExtracted}ページ
                        </span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatDateTime(activity.createdAt)}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {activity.fileName}
                    </p>
                    {activity.userEmail && (
                      <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        by {activity.userName || activity.userEmail}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className={`py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  アクティビティがありません
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// KPI Card Component
function KpiCard({
  title,
  value,
  icon,
  isDark,
}: {
  title: string
  value: number
  icon: string
  isDark: boolean
}) {
  return (
    <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value.toLocaleString()}
          </p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}
