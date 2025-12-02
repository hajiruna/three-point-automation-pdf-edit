'use client'

import { useTheme } from './ThemeProvider'

type TabColor = 'blue' | 'pink'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  color?: TabColor
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}

const colorClasses: Record<TabColor, string> = {
  blue: 'bg-blue-500 text-white shadow-md',
  pink: 'bg-pink-500 text-white shadow-md',
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`flex gap-2 p-1 rounded-xl transition-colors duration-300 ${
      isDark ? 'bg-gray-700' : 'bg-gray-100'
    }`}>
      {tabs.map((tab) => {
        const tabColor = tab.color || 'blue'
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2
              px-6 py-3 rounded-lg
              font-medium text-sm
              transition-all duration-200
              ${activeTab === tab.id
                ? colorClasses[tabColor]
                : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
