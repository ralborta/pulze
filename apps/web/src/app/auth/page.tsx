'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { verifyMagicToken } from '@/lib/api'
import { sanitizeRedirect } from '@/lib/redirect'

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const redirect = sanitizeRedirect(searchParams.get('redirect'))

    if (!token) {
      setStatus('error')
      setError('Falta el token de acceso. Abrí el link que te enviamos por WhatsApp.')
      return
    }

    let cancelled = false

    verifyMagicToken(token)
      .then(() => {
        if (!cancelled) router.replace(redirect)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setStatus('error')
        setError(e instanceof Error ? e.message : 'No pudimos validar tu acceso')
      })

    return () => {
      cancelled = true
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-pulze-gradient text-white flex flex-col items-center justify-center px-6">
      <div className="relative w-24 h-24 mb-6 animate-pulse-glow">
        <Image src="/pulze-logo-new.png" alt="PULZE" width={96} height={96} className="w-full h-full object-contain" />
      </div>

      {status === 'loading' ? (
        <>
          <h1 className="text-xl font-bold text-gradient mb-2">Entrando a PULZE</h1>
          <p className="text-gray-400 text-sm text-center">Validando tu acceso…</p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-red-300 mb-2">No pudimos entrar</h1>
          <p className="text-gray-300 text-sm text-center mb-6">{error}</p>
          <p className="text-gray-500 text-xs text-center mb-6">
            El link vence a los 15 minutos. Pedí uno nuevo escribiendo <strong>mi progreso</strong> por WhatsApp.
          </p>
          <Link href="/" className="text-cyan-400 text-sm hover:text-cyan-300">
            Volver al inicio →
          </Link>
        </>
      )}
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-pulze-gradient text-white flex items-center justify-center">
          <p className="text-gray-400 text-sm">Cargando…</p>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  )
}
