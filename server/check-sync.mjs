// End-to-end check with a disposable, randomly keyed record.
import { randomBytes, createHash } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local', quiet: true })
const code = randomBytes(32).toString('hex')
const hash = createHash('sha256').update(code).digest('hex')
const url = process.env.SYNC_TEST_URL || 'http://localhost:5184/api/sync'
const data = { transactions: [], debts: [], goal: { target: 1 }, marker: 'test' }
const call = (method, body, key = code) => fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-Recovery-Code': key }, body: body && JSON.stringify(body) })
const check = (condition, message) => { if (!condition) throw new Error(message) }
try {
  let res = await call('POST', { data }); check(res.status === 201, `create: ${res.status}`)
  res = await call('GET'); let result = await res.json(); check(res.ok && result.data.marker === 'test' && result.revision === 1, 'read failed')
  res = await call('PUT', { data: { ...data, marker: 'updated' }, revision: 1 }); check(res.ok, 'update failed')
  res = await call('PUT', { data, revision: 1 }); check(res.status === 409, 'conflict was not rejected')
  res = await call('GET'); result = await res.json(); check(result.data.marker === 'updated' && result.revision === 2, 'updated data missing')
  res = await call('GET', undefined, randomBytes(32).toString('hex')); check(res.status === 404, 'unrelated code accessed data')
  console.log('Sync end-to-end passed: create, read, update, conflict protection, and isolation.')
} finally {
  if (process.env.DATABASE_URL_UNPOOLED) await neon(process.env.DATABASE_URL_UNPOOLED)`DELETE FROM money_bloom_sync WHERE key_hash = ${hash}`
}
