import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local', quiet: true })
dotenv.config({ quiet: true })
if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('DATABASE_URL_UNPOOLED is missing')
await neon(process.env.DATABASE_URL_UNPOOLED).query(readFileSync(new URL('./migration.sql', import.meta.url), 'utf8'))
console.log('Money Bloom sync schema is ready.')
