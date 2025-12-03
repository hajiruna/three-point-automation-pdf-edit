'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/components/ui/ThemeProvider'
import { formatPrice } from '@/lib/billing/plans'
import type { Invoice, Currency } from '@/types/billing'

export function InvoiceList() {
  const { theme } = useTheme()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isDark = theme === 'dark'

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/billing/invoices?limit=10')
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setInvoices(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching invoices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  if (isLoading) {
    return (
      <div
        className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4" />
          <div className="h-12 bg-gray-300 rounded" />
          <div className="h-12 bg-gray-300 rounded" />
          <div className="h-12 bg-gray-300 rounded" />
        </div>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div
        className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}
      >
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          請求履歴
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          請求履歴はありません
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}
    >
      <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        請求履歴
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`text-left text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <th className="pb-3 font-medium">日付</th>
              <th className="pb-3 font-medium">金額</th>
              <th className="pb-3 font-medium">ステータス</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} isDark={isDark} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface InvoiceRowProps {
  invoice: Invoice
  isDark: boolean
}

function InvoiceRow({ invoice, isDark }: InvoiceRowProps) {
  const date = new Date(invoice.createdAt).toLocaleDateString('ja-JP')
  const amount = formatPrice(invoice.amountPaid || invoice.amountDue, invoice.currency as Currency)

  const statusMap: Record<string, { label: string; color: string }> = {
    paid: { label: '支払済', color: 'text-green-500' },
    open: { label: '未払い', color: 'text-yellow-500' },
    draft: { label: '下書き', color: 'text-gray-500' },
    void: { label: '無効', color: 'text-gray-500' },
    uncollectible: { label: '回収不能', color: 'text-red-500' },
  }

  const status = statusMap[invoice.status] || { label: invoice.status, color: 'text-gray-500' }

  return (
    <tr className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      <td className="py-3">{date}</td>
      <td className="py-3 font-medium">{amount}</td>
      <td className="py-3">
        <span className={status.color}>{status.label}</span>
      </td>
      <td className="py-3 text-right">
        {invoice.invoicePdfUrl && (
          <a
            href={invoice.invoicePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            PDF
          </a>
        )}
        {invoice.hostedInvoiceUrl && (
          <a
            href={invoice.hostedInvoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 ml-3"
          >
            詳細
          </a>
        )}
      </td>
    </tr>
  )
}
