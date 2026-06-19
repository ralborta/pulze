#!/usr/bin/env node
/**
 * Agrega cadena onboarding (pending-onboarding → nudge → WA) con trigger Diario 12:00.
 * Uso: N8N_API_KEY=... node scripts/patch-n8n-onboarding-12.mjs
 */
import https from 'https'

const WORKFLOW_ID = 'M8y7aSqe9PShSFXm'
const HOST = 'pulze-n8n.wd75db.easypanel.host'
const API_KEY = process.env.N8N_API_KEY
const BOT_KEY =
  process.env.PULZE_BOT_API_KEY ||
  '31abb735b990bcde9f41ff1b3a3076d8269b92a7676ceecc07d3fa52ae577b62'

if (!API_KEY) {
  console.error('Falta N8N_API_KEY (n8n → Settings → n8n API)')
  process.exit(1)
}

function request(method, path, body) {
  const payload = body ? JSON.stringify(body) : null
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: HOST,
        path,
        method,
        headers: {
          'X-N8N-API-KEY': API_KEY,
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

const ONBOARDING_NODES = [
  {
    parameters: {
      rule: { interval: [{ field: 'cronExpression', expression: '0 12 * * *' }] },
    },
    id: 'b1c2d3e4-f5a6-4789-b012-3456789abcde',
    name: 'Diario 12:00',
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.2,
    position: [-640, 640],
    webhookId: '',
  },
  {
    parameters: {
      url: 'https://pulze-pulze.wd75db.easypanel.host/api/n8n/users/pending-onboarding',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'X-API-Key', value: BOT_KEY }] },
      options: {},
    },
    id: 'c2d3e4f5-a6b7-4890-c123-456789abcdef',
    name: 'GET pending-onboarding',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [-416, 640],
  },
  {
    parameters: {
      jsCode:
        'const body = $input.first().json;\nreturn (body.users || []).map(u => ({ json: u }));',
    },
    id: 'd3e4f5a6-b7c8-4901-d234-56789abcdef0',
    name: 'Un ítem por usuario5',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [-208, 640],
  },
  {
    parameters: {
      method: 'POST',
      url: 'https://pulze-pulze.wd75db.easypanel.host/api/n8n/openai/generate-onboarding-nudge',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'X-API-Key', value: BOT_KEY },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify({ userId: $json.id }) }}',
      options: {},
    },
    id: 'e4f5a6b7-c8d9-4012-e345-6789abcdef01',
    name: 'POST generate-onboarding-nudge',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [32, 640],
  },
  {
    parameters: {
      method: 'POST',
      url: 'https://pulze-pulze.wd75db.easypanel.host/api/n8n/proactive-messages',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'X-API-Key', value: BOT_KEY },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody:
        "={{ JSON.stringify({ userId: $('Un ítem por usuario5').item.json.id, content: $json.content, messageType: 'onboarding_nudge' }) }}",
      options: {},
    },
    id: 'f5a6b7c8-d9e0-4123-f456-789abcdef012',
    name: 'POST proactive-messages5',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [240, 640],
  },
]

const ONBOARDING_CONNECTIONS = {
  'Diario 12:00': { main: [[{ node: 'GET pending-onboarding', type: 'main', index: 0 }]] },
  'GET pending-onboarding': {
    main: [[{ node: 'Un ítem por usuario5', type: 'main', index: 0 }]],
  },
  'Un ítem por usuario5': {
    main: [[{ node: 'POST generate-onboarding-nudge', type: 'main', index: 0 }]],
  },
  'POST generate-onboarding-nudge': {
    main: [[{ node: 'POST proactive-messages5', type: 'main', index: 0 }]],
  },
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

const get = await request('GET', `/api/v1/workflows/${WORKFLOW_ID}`)
if (get.status !== 200) {
  console.error('GET falló', get.status, get.data.slice(0, 300))
  process.exit(1)
}

const current = JSON.parse(get.data)
const names = new Set(current.nodes.map((n) => n.name))
const nodes = [...current.nodes]
for (const n of ONBOARDING_NODES) {
  const idx = nodes.findIndex((x) => x.id === n.id || x.name === n.name)
  if (idx >= 0) nodes[idx] = n
  else nodes.push(n)
}

const connections = { ...current.connections, ...ONBOARDING_CONNECTIONS }
const settings = Object.fromEntries(
  Object.entries(current.settings || {}).filter(([k]) => ALLOWED_SETTINGS.includes(k)),
)
if (!settings.timezone) settings.timezone = 'America/Argentina/Buenos_Aires'

const body = {
  name: current.name,
  nodes,
  connections,
  settings,
}

const put = await request('PUT', `/api/v1/workflows/${WORKFLOW_ID}`, body)
console.log('PUT', put.status, put.data.slice(0, 400))
if (put.status < 200 || put.status >= 300) process.exit(1)

const triggers = nodes
  .filter((n) => n.type?.includes('scheduleTrigger'))
  .map((n) => n.name)
console.log('OK — triggers:', triggers.join(', '))
if (!names.has('Diario 12:00') && triggers.includes('Diario 12:00')) {
  console.log('Cadena onboarding agregada. Próximo disparo: 12:00 Argentina.')
}
