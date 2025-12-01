'use client'

import { useTheme } from '@/components/ui'

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {children}
    </div>
  )
}
