'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-lg">
        {/* Logo / Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            PDF Page Selector
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            社内専用ツールです。<br />
            Microsoft アカウントでサインインしてください。
          </p>
        </div>

        {/* Sign In Button */}
        <div>
          <button
            onClick={() => signIn('azure-ad', { callbackUrl })}
            className="group relative w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {/* Microsoft Logo */}
            <svg className="h-5 w-5" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Microsoft でサインイン
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          ※ 社内ネットワークからのみアクセス可能です
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
