'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTheme } from '@/components/ui/ThemeProvider'
import { useToast } from '@/components/ui/Toast'
import {
  BillingGuard,
  SubscriptionStatus,
  UsageDisplay,
  PricingTable,
  InvoiceList,
} from '@/components/billing'

function BillingContent() {
  const { theme } = useTheme()
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()

  const isDark = theme === 'dark'

  // URLパラメータからCheckout結果を処理
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      showToast('プランの購入が完了しました', 'success')
      // パラメータをクリア
      router.replace('/billing')
    } else if (canceled === 'true') {
      showToast('購入がキャンセルされました', 'info')
      router.replace('/billing')
    }
  }, [searchParams, showToast, router])

  return (
    <BillingGuard
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">課金機能は現在無効です</h1>
            <p className="text-gray-600 dark:text-gray-400">
              管理者にお問い合わせください
            </p>
          </div>
        </div>
      }
    >
      <div
        className={`min-h-screen py-8 px-4 ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <h1
              className={`text-3xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              プラン & 請求
            </h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ご利用状況の確認とプランの管理
            </p>
          </div>

          {/* 現在のプランと利用状況 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <SubscriptionStatus />
            <UsageDisplay />
          </div>

          {/* 料金プラン */}
          <section id="pricing" className="mb-12">
            <h2
              className={`text-2xl font-bold text-center mb-8 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              料金プラン
            </h2>
            <PricingTable />
          </section>

          {/* 請求履歴 */}
          <section className="mb-12">
            <InvoiceList />
          </section>

          {/* FAQ */}
          <section
            className={`rounded-lg p-6 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } shadow`}
          >
            <h2
              className={`text-xl font-bold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              よくある質問
            </h2>

            <div className="space-y-4">
              <FaqItem
                question="プランはいつでも変更できますか？"
                answer="はい、いつでもプランのアップグレード・ダウングレードが可能です。「プラン管理」ボタンからStripeのカスタマーポータルで変更できます。"
                isDark={isDark}
              />
              <FaqItem
                question="解約するとどうなりますか？"
                answer="解約しても、現在の請求期間が終了するまでは引き続きご利用いただけます。期間終了後は無料プランに移行します。"
                isDark={isDark}
              />
              <FaqItem
                question="利用回数の上限に達したらどうなりますか？"
                answer="上限に達すると、その月はその機能をご利用いただけなくなります。上位プランにアップグレードするか、翌月まで待つ必要があります。"
                isDark={isDark}
              />
              <FaqItem
                question="請求書はどこで確認できますか？"
                answer="このページの「請求履歴」セクション、またはStripeのカスタマーポータルで過去の請求書を確認・ダウンロードできます。"
                isDark={isDark}
              />
            </div>
          </section>
        </div>
      </div>
    </BillingGuard>
  )
}

interface FaqItemProps {
  question: string
  answer: string
  isDark: boolean
}

function FaqItem({ question, answer, isDark }: FaqItemProps) {
  return (
    <div
      className={`border-b pb-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
    >
      <h3
        className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        {question}
      </h3>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {answer}
      </p>
    </div>
  )
}

function BillingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-500">読み込み中...</div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingLoading />}>
      <BillingContent />
    </Suspense>
  )
}
