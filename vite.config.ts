import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleSync } from './server/sync.mjs'

export default defineConfig(({ mode }) => ({ plugins: [react(), {
  name: 'money-bloom-sync',
  configureServer(server) {
    const env = loadEnv(mode, '.', '')
    server.middlewares.use('/api/sync', (req, res) => { void handleSync(req, res, env.DATABASE_URL) })
  },
}] }))
