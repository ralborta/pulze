'use client'

import type { ModelTab } from '../types'

interface ModelTabsProps {
  value: ModelTab
  onChange: (tab: ModelTab) => void
}

const tabs: { id: ModelTab; label: string }[] = [
  { id: 'consolidado', label: 'Consolidado' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'gemini', label: 'Gemini' },
]

export function ModelTabs({ value, onChange }: ModelTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">Ver datos por modelo:</span>
      <div className="flex rounded-xl bg-slate-100 p-1 gap-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === tab.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
