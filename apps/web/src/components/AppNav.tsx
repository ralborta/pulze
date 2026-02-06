'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutDashboard, CalendarCheck, BookOpen, Settings } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Inicio' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/check-ins', icon: CalendarCheck, label: 'Check-ins' },
  { href: '/contenidos', icon: BookOpen, label: 'Contenidos' },
  { href: '/preferencias', icon: Settings, label: 'Preferencias' },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 safe-area-pb z-50">
      <div className="container mx-auto px-2 max-w-md">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl min-w-[64px] transition ${
                  isActive ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:text-green-600'
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
