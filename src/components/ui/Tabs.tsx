'use client'

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
  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
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
              ? 'bg-white text-gray-900 shadow-md'
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
