'use client'

import { ReactNode } from 'react'

interface CardWrapperProps {
  children: ReactNode
  accentColor: 'teal' | 'violet' | 'amber' | 'emerald' | 'blue'
  className?: string
}

const barColors: Record<CardWrapperProps['accentColor'], string> = {
  teal: 'bg-teal-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
}

export function CardWrapper({ children, accentColor, className = '' }: CardWrapperProps) {
  return (
    <div
      className={`relative rounded-2xl bg-white shadow-sm border border-slate-200/80 overflow-hidden ${className}`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColors[accentColor]}`}
        aria-hidden
      />
      <div className="pl-5 pr-4 py-4 sm:pl-6 sm:pr-5 sm:py-5">{children}</div>
    </div>
  )
}
