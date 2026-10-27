import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import dotenv from 'dotenv'
import { handleSync } from './sync.mjs'

dotenv.config({ path: '.env.local', quiet: true })
dotenv.config({ quiet: true })
const root = resolve('dist')
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }
createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  if (pathname === '/api/sync') return handleSync(req, res, process.env.DATABASE_URL)
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return }
  const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
  if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return }
  try {
    const content = await readFile(path)
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' })
    res.end(req.method === 'HEAD' ? undefined : content)
  } catch { res.writeHead(404).end('Not found') }
}).listen(Number(process.env.PORT || 4173), () => console.log(`Money Bloom running on port ${process.env.PORT || 4173}`))
