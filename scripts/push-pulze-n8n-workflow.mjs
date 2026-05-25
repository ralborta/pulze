#!/usr/bin/env node
/**
 * Lee PULZE por REST, aplica el JSON corregido y hace PUT.
 * N8N_API_KEY=... node scripts/push-pulze-n8n-workflow.mjs
 */
import fs from 'fs'
import https from 'https'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKFLOW_ID = 'M8y7aSqe9PShSFXm'
const HOST = 'pulze-n8n.wd75db.easypanel.host'
const FIXED = path.join(__dirname, '../docs/n8n-flows/00-PULZE-combined.json')

const apiKey = process.env.N8N_API_KEY
if (!apiKey) {
  console.error('Definí N8N_API_KEY (n8n → Settings → n8n API)')
  process.exit(1)
}

function request(method, p, body) {
  const payload = body ? JSON.stringify(body) : null
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: HOST,
        path: p,
        method,
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => resolve({ status: res.statusCode, data }))
      },
    )
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

const ALLOWED_SETTINGS = [
  'saveDataErrorExecution',
  'saveDataSuccessExecution',
  'saveManualExecutions',
  'saveExecutionProgress',
  'executionTimeout',
  'errorWorkflow',
  'timezone',
  'executionOrder',
]

const workflowRaw = fs.readFileSync(FIXED, 'utf8')
const botApiKey = process.env.PULZE_BOT_API_KEY
if (workflowRaw.includes('__PULZE_BOT_API_KEY__') && !botApiKey) {
  console.error('Definí PULZE_BOT_API_KEY para reemplazar el placeholder del workflow')
  process.exit(1)
}
const fixed = JSON.parse(workflowRaw.replaceAll('__PULZE_BOT_API_KEY__', botApiKey ?? ''))
const get = await request('GET', `/api/v1/workflows/${WORKFLOW_ID}`)
if (get.status !== 200) {
  console.error('GET error', get.status, get.data.slice(0, 300))
  process.exit(1)
}
const current = JSON.parse(get.data)

const merged = { ...current.settings, ...fixed.settings }
const settings = Object.fromEntries(
  Object.entries(merged).filter(([k]) => ALLOWED_SETTINGS.includes(k)),
)

const body = {
  name: current.name || fixed.name,
  nodes: fixed.nodes,
  connections: fixed.connections,
  settings,
}

const put = await request('PUT', `/api/v1/workflows/${WORKFLOW_ID}`, body)
console.log('PUT', put.status, put.data.slice(0, 200))
if (put.status < 200 || put.status >= 300) process.exit(1)

const verify = await request('GET', `/api/v1/workflows/${WORKFLOW_ID}`)
const v = JSON.parse(verify.data)
const triggers = v.nodes.filter((n) => n.type.includes('scheduleTrigger')).map((n) => n.name)
console.log(`OK → ${v.nodes.length} nodos, ${triggers.length} triggers:`, triggers)
