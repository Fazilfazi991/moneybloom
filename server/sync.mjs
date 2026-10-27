import { createHash } from 'node:crypto'
import { neon } from '@neondatabase/serverless'

// The recovery code is a bearer credential. Only its hash is stored in Postgres.
export async function handleSync(req, res, databaseUrl) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  const reply = (status, value) => { res.statusCode = status; res.end(JSON.stringify(value)) }
  if (!databaseUrl) return reply(503, { error: 'Cloud sync is not configured.' })
  const code = req.headers['x-recovery-code']
  if (typeof code !== 'string' || !/^[a-f0-9]{64}$/.test(code)) return reply(401, { error: 'Invalid recovery code.' })
  const key = createHash('sha256').update(code).digest('hex')
  try {
    const sql = neon(databaseUrl)
    if (req.method === 'GET') {
      const rows = await sql`SELECT data, revision FROM money_bloom_sync WHERE key_hash = ${key}`
      return rows.length ? reply(200, rows[0]) : reply(404, { error: 'Recovery code not found.' })
    }
    if (req.method !== 'POST' && req.method !== 'PUT') return reply(405, { error: 'Method not allowed.' })
    let body = ''
    for await (const chunk of req) { body += chunk; if (body.length > 2_000_000) return reply(413, { error: 'Backup is too large.' }) }
    const parsed = JSON.parse(body)
    if (!parsed.data || !Array.isArray(parsed.data.transactions) || !Array.isArray(parsed.data.debts) || !parsed.data.goal) return reply(400, { error: 'Invalid dashboard data.' })
    const data = JSON.stringify(parsed.data)
    if (req.method === 'POST') {
      const rows = await sql`INSERT INTO money_bloom_sync (key_hash, data) VALUES (${key}, ${data}::jsonb) ON CONFLICT DO NOTHING RETURNING revision`
      return rows.length ? reply(201, rows[0]) : reply(409, { error: 'Recovery code already exists.' })
    }
    if (!Number.isSafeInteger(parsed.revision) || parsed.revision < 1) return reply(400, { error: 'Invalid revision.' })
    const rows = await sql`UPDATE money_bloom_sync SET data = ${data}::jsonb, revision = revision + 1, updated_at = now() WHERE key_hash = ${key} AND revision = ${parsed.revision} RETURNING revision`
    return rows.length ? reply(200, rows[0]) : reply(409, { error: 'Cloud data changed on another device.' })
  } catch (error) {
    console.error('Sync request failed:', error.message)
    return reply(500, { error: 'Cloud sync failed. Please try again.' })
  }
}
