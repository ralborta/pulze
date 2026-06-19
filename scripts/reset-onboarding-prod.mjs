#!/usr/bin/env node
/**
 * Resetea onboarding en prod vía API del bot (requiere deploy con reset-onboarding).
 * Uso: node scripts/reset-onboarding-prod.mjs 5491130370101 5491131778253
 */
import https from 'https'

const HOST = 'pulze-pulze.wd75db.easypanel.host'
const API_KEY =
  process.env.PULZE_BOT_API_KEY ||
  process.env.API_KEY ||
  '31abb735b990bcde9f41ff1b3a3076d8269b92a7676ceecc07d3fa52ae577b62'

const phones = process.argv.slice(2).filter(Boolean)
if (!phones.length) {
  console.error('Uso: node scripts/reset-onboarding-prod.mjs <tel> [<tel> ...]')
  process.exit(1)
}

const body = JSON.stringify({ phones, clearBuilderBot: true })

const req = https.request(
  {
    hostname: HOST,
    path: '/api/n8n/admin/reset-onboarding',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'X-API-Key': API_KEY,
    },
  },
  (res) => {
    let data = ''
    res.on('data', (c) => (data += c))
    res.on('end', () => {
      console.log('HTTP', res.statusCode)
      console.log(data)
      process.exit(res.statusCode === 200 ? 0 : 1)
    })
  },
)
req.on('error', (e) => {
  console.error(e)
  process.exit(1)
})
req.write(body)
req.end()
