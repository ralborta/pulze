'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare, 
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/usuarios', icon: Users, label: 'Usuarios' },
  { href: '/contenidos', icon: FileText, label: 'Contenidos' },
  { href: '/plantillas', icon: MessageSquare, label: 'Plantillas' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/settings', icon: Settings, label: 'Configuración' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-cyan-500/20 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 animate-pulse-glow">
            <Image
              src="/pulze-logo.png"
              alt="PULZE"
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">PULZE</h1>
            <p className="text-xs text-cyan-400">Backoffice</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-cyan-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-cyan-500/20">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-xs text-gray-400">admin@pulze.com</p>
          </div>
          <button className="text-gray-400 hover:text-red-400 transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
