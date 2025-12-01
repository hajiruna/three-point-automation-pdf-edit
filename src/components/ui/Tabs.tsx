'use client'

import { useTheme } from './ThemeProvider'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`flex gap-2 p-1 rounded-xl transition-colors duration-300 ${
      isDark ? 'bg-gray-700' : 'bg-gray-100'
    }`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-2
            px-6 py-3 rounded-lg
            font-medium text-sm
            transition-all duration-200
            ${activeTab === tab.id
              ? 'bg-blue-500 text-white shadow-md'
              : isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
