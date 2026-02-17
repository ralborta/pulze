'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutDashboard, CalendarCheck, BookOpen, Settings } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/check-ins', icon: CalendarCheck, label: 'Check-ins' },
  { href: '/contenidos', icon: BookOpen, label: 'Contenidos' },
  { href: '/preferencias', icon: Settings, label: 'Ajustes' },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass backdrop-blur-xl border-t border-cyan-500/20 safe-area-pb z-50">
      <div className="container mx-auto px-2 max-w-md">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl min-w-[64px] transition-all ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-gray-400 hover:text-cyan-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
