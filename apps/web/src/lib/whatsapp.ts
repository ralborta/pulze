const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '')

/** URL wa.me con número de Pulze y texto opcional. */
export function waMeUrl(text?: string): string {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/'
  if (!text?.trim()) return base
  return `${base}?text=${encodeURIComponent(text.trim())}`
}

export function hasWhatsAppNumber(): boolean {
  return WHATSAPP_NUMBER.length >= 10
}
