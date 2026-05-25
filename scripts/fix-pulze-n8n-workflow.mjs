#!/usr/bin/env node
/**
 * Arma el workflow PULZE corregido (4 cadenas, sin duplicado, nodos HTTP bien configurados).
 * Uso:
 *   node scripts/fix-pulze-n8n-workflow.mjs              # escribe docs/n8n-flows/00-PULZE-combined.json
 *   N8N_API_KEY=... node scripts/fix-pulze-n8n-workflow.mjs --push
 */

import fs from 'fs'
import https from 'https'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKFLOW_ID = 'M8y7aSqe9PShSFXm'
const OUT = path.join(__dirname, '../docs/n8n-flows/00-PULZE-combined.json')

const API_HEADERS = {
  sendHeaders: true,
  headerParameters: {
    parameters: [
      { name: 'X-API-Key', value: '={{ $env.API_KEY }}' },
      { name: 'Content-Type', value: 'application/json' },
    ],
  },
}

const GET_HEADERS = {
  sendHeaders: true,
  headerParameters: {
    parameters: [{ name: 'X-API-Key', value: '={{ $env.API_KEY }}' }],
  },
}

function schedule(id, name, cron, x, y) {
  return {
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: cron }] } },
    id,
    name,
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.2,
    position: [x, y],
    webhookId: '',
  }
}

function code(id, name, x, y) {
  return {
    parameters: {
      jsCode:
        'const body = $input.first().json;\nreturn (body.users || []).map(u => ({ json: u }));',
    },
    id,
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [x, y],
  }
}

function httpGet(id, name, pathSuffix, x, y) {
  return {
    parameters: {
      url: `={{ $env.API_URL || 'https://pulze-pulze.wd75db.easypanel.host' }}${pathSuffix}`,
      ...GET_HEADERS,
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [x, y],
  }
}

function httpPostJson(id, name, pathSuffix, jsonBody, x, y) {
  return {
    parameters: {
      method: 'POST',
      url: `={{ $env.API_URL || 'https://pulze-pulze.wd75db.easypanel.host' }}${pathSuffix}`,
      ...API_HEADERS,
      sendBody: true,
      specifyBody: 'json',
      jsonBody,
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [x, y],
  }
}

const nodes = [
  schedule('e04cf293-77f0-469f-a46d-78f7120bb330', 'Cada hora 8-22', '0 8-22 * * *', -640, -400),
  httpGet('18c1a727-096a-4287-9158-e51397678243', 'GET pending-checkin', '/api/n8n/users/pending-checkin', -416, -400),
  code('8be1131d-48c0-4760-9615-ec0a1e87ef47', 'Un ítem por usuario', -208, -400),
  httpPostJson(
    '09135360-9cb4-4cab-8a47-eb6f59b61191',
    'POST generate-reminder',
    '/api/n8n/openai/generate-reminder',
    '={\n  "userId": "{{ $json.id }}"\n}',
    32,
    -400,
  ),
  httpPostJson(
    'c466ed73-a7d7-4432-acea-f489277567f2',
    'POST proactive-messages',
    '/api/n8n/proactive-messages',
    '={\n  "userId": "{{ $(\'Un ítem por usuario\').item.json.id }}",\n  "content": "{{ $json.content }}",\n  "messageType": "checkin_reminder"\n}',
    240,
    -400,
  ),

  schedule('7d277377-c429-4cf2-9db4-0b85c67c18da', 'Diario 10:00', '0 10 * * *', -640, 32),
  httpGet('686968a4-d7f4-4d9d-b84c-021f06b8811f', 'GET inactive', '/api/n8n/users/inactive?days=2', -416, 32),
  code('a35c278a-d5a7-426f-af6b-e38b9c072584', 'Un ítem por usuario2', -208, 32),
  httpPostJson(
    '7c4d8f08-409b-49f6-8b93-ca6a88844391',
    'POST generate-reactivation',
    '/api/n8n/openai/generate-reactivation',
    '={\n  "userId": "{{ $json.id }}",\n  "daysSinceLastCheckIn": {{ $json.daysSinceLastCheckIn ?? 2 }}\n}',
    32,
    32,
  ),
  httpPostJson(
    'd9954a9d-9f6f-44ce-b9c2-725b45887219',
    'POST proactive-messages2',
    '/api/n8n/proactive-messages',
    '={\n  "userId": "{{ $(\'Un ítem por usuario2\').item.json.id }}",\n  "content": "{{ $json.content }}",\n  "messageType": "reactivation"\n}',
    240,
    32,
  ),

  schedule('f87e7c1a-47c7-4972-8b3d-a0fa3b43a9f3', 'Diario 18:00', '0 18 * * *', -640, 256),
  httpGet('e9730cc4-83dc-440a-9a33-c553d2e0a543', 'GET milestones', '/api/n8n/users/milestones', -416, 256),
  code('dc46821f-f490-4a28-8af2-426b95c71c46', 'Un ítem por usuario3', -208, 256),
  httpPostJson(
    '478fcc9c-0c3a-466c-b091-052bb8304346',
    'POST generate-celebration',
    '/api/n8n/openai/generate-celebration',
    '={\n  "userId": "{{ $json.id }}",\n  "milestone": "{{ $json.milestone || \'streak_\' + $json.currentStreak }}"\n}',
    32,
    256,
  ),
  httpPostJson(
    '1167a10f-70bf-41b0-8a7c-de6e2ddf6780',
    'POST proactive-messages3',
    '/api/n8n/proactive-messages',
    '={\n  "userId": "{{ $(\'Un ítem por usuario3\').item.json.id }}",\n  "content": "{{ $json.content }}",\n  "messageType": "celebration"\n}',
    240,
    256,
  ),

  schedule('894d19de-c89a-44a1-82e4-64e3b827bf5c', 'Lunes 9:00', '0 9 * * 1', -624, 448),
  httpGet('2e84dc4a-2bec-4527-97bc-9ea9357e13ad', 'GET active', '/api/n8n/users/active', -400, 448),
  code('18204535-0777-4fe6-a4b3-f8102e5c521f', 'Un ítem por usuario4', -192, 448),
  httpPostJson(
    '83a1f149-a3e7-4144-89d6-7b7af46b4da3',
    'POST generate-weekly-report',
    '/api/n8n/openai/generate-weekly-report',
    '={\n  "userId": "{{ $json.id }}"\n}',
    48,
    448,
  ),
  httpPostJson(
    'f2fc0f5e-9abb-4dfa-8f5d-670559a91de4',
    'POST proactive-messages4',
    '/api/n8n/proactive-messages',
    '={\n  "userId": "{{ $(\'Un ítem por usuario4\').item.json.id }}",\n  "content": "{{ $json.content }}",\n  "messageType": "weekly_report"\n}',
    256,
    448,
  ),
]

const connections = {
  'Cada hora 8-22': { main: [[{ node: 'GET pending-checkin', type: 'main', index: 0 }]] },
  'GET pending-checkin': { main: [[{ node: 'Un ítem por usuario', type: 'main', index: 0 }]] },
  'Un ítem por usuario': { main: [[{ node: 'POST generate-reminder', type: 'main', index: 0 }]] },
  'POST generate-reminder': { main: [[{ node: 'POST proactive-messages', type: 'main', index: 0 }]] },
  'Diario 10:00': { main: [[{ node: 'GET inactive', type: 'main', index: 0 }]] },
  'GET inactive': { main: [[{ node: 'Un ítem por usuario2', type: 'main', index: 0 }]] },
  'Un ítem por usuario2': { main: [[{ node: 'POST generate-reactivation', type: 'main', index: 0 }]] },
  'POST generate-reactivation': { main: [[{ node: 'POST proactive-messages2', type: 'main', index: 0 }]] },
  'Diario 18:00': { main: [[{ node: 'GET milestones', type: 'main', index: 0 }]] },
  'GET milestones': { main: [[{ node: 'Un ítem por usuario3', type: 'main', index: 0 }]] },
  'Un ítem por usuario3': { main: [[{ node: 'POST generate-celebration', type: 'main', index: 0 }]] },
  'POST generate-celebration': { main: [[{ node: 'POST proactive-messages3', type: 'main', index: 0 }]] },
  'Lunes 9:00': { main: [[{ node: 'GET active', type: 'main', index: 0 }]] },
  'GET active': { main: [[{ node: 'Un ítem por usuario4', type: 'main', index: 0 }]] },
  'Un ítem por usuario4': { main: [[{ node: 'POST generate-weekly-report', type: 'main', index: 0 }]] },
  'POST generate-weekly-report': { main: [[{ node: 'POST proactive-messages4', type: 'main', index: 0 }]] },
}

const workflow = {
  name: 'PULZE',
  nodes,
  connections,
  active: true,
  settings: {
    executionOrder: 'v1',
    binaryMode: 'separate',
    availableInMCP: true,
    timezone: 'America/Argentina/Buenos_Aires',
  },
  meta: { templateCredsSetupCompleted: true },
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(workflow, null, 2))
console.log('Written', OUT, `(${nodes.length} nodes, 4 triggers)`)

if (!process.argv.includes('--push')) {
  console.log('Importá en n8n: ··· → Import from File →', OUT)
  console.log('O: N8N_API_KEY=... node scripts/fix-pulze-n8n-workflow.mjs --push')
  process.exit(0)
}

const apiKey = process.env.N8N_API_KEY
if (!apiKey) {
  console.error('N8N_API_KEY requerido para --push')
  process.exit(1)
}

const body = JSON.stringify({ ...workflow, id: WORKFLOW_ID })
const req = https.request(
  {
    hostname: 'pulze-n8n.wd75db.easypanel.host',
    path: `/api/v1/workflows/${WORKFLOW_ID}`,
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  },
  (res) => {
    let data = ''
    res.on('data', (c) => (data += c))
    res.on('end', () => {
      console.log('PUT status', res.statusCode)
      console.log(data.slice(0, 500))
      process.exit(res.statusCode >= 200 && res.statusCode < 300 ? 0 : 1)
    })
  },
)
req.on('error', (e) => {
  console.error(e)
  process.exit(1)
})
req.write(body)
req.end()
