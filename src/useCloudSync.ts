import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppData } from './model'

const CODE_KEY = 'money-bloom-sync-code'
const BASE_KEY = 'money-bloom-sync-base'
type Snapshot = { data: AppData; revision: number }
// Postgres JSONB does not preserve object key order.
const serialize = (value: AppData) => JSON.stringify(value, (_key, item: unknown) =>
  item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
    : item)

async function request(code: string, method = 'GET', body?: unknown): Promise<Snapshot> {
  const response = await fetch('/api/sync', { method, headers: { 'Content-Type': 'application/json', 'X-Recovery-Code': code }, body: body === undefined ? undefined : JSON.stringify(body) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Cloud sync is unavailable.')
  return result as Snapshot
}

export function useCloudSync(data: AppData, setData: (data: AppData) => void) {
  const [code, setCode] = useState(() => localStorage.getItem(CODE_KEY) || '')
  const [status, setStatus] = useState(code ? 'Connecting…' : 'Not connected')
  const dataRef = useRef(data), baseRef = useRef(localStorage.getItem(BASE_KEY) || ''), revisionRef = useRef(0), busy = useRef(false), conflict = useRef(false)
  dataRef.current = data

  const remember = useCallback((nextCode: string, next: AppData, revision: number) => {
    const base = serialize(next)
    localStorage.setItem(CODE_KEY, nextCode); localStorage.setItem(BASE_KEY, base)
    baseRef.current = base; revisionRef.current = revision; conflict.current = false
    setCode(nextCode); setStatus('Synced')
  }, [])

  const create = async () => {
    if (busy.current) { setStatus('Sync is in progress. Try again in a moment.'); return }
    busy.current = true
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    const nextCode = Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('')
    try { setStatus('Creating…'); const snapshot = dataRef.current; const result = await request(nextCode, 'POST', { data: snapshot }); remember(nextCode, snapshot, result.revision) }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not create sync.') }
    finally { busy.current = false }
  }

  const connect = async (value: string) => {
    const nextCode = value.trim().toLowerCase()
    if (!/^[a-f0-9]{64}$/.test(nextCode)) { setStatus('Enter a valid recovery code.'); return }
    if (busy.current) { setStatus('Sync is in progress. Try again in a moment.'); return }
    busy.current = true
    try {
      setStatus('Connecting…')
      const remote = await request(nextCode)
      if (!window.confirm('Replace the data on this device with the saved cloud dashboard? Export a backup first if you need the current data.')) { setStatus(code ? 'Connected' : 'Not connected'); return }
      remember(nextCode, remote.data, remote.revision); dataRef.current = remote.data; setData(remote.data)
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not connect.') }
    finally { busy.current = false }
  }

  useEffect(() => {
    if (!code) return
    let cancelled = false
    const sync = async () => {
      if (busy.current || conflict.current) return
      busy.current = true
      try {
        const remote = await request(code)
        if (cancelled) return
        const current = serialize(dataRef.current), remoteData = serialize(remote.data)
        if (!baseRef.current) { conflict.current = true; setStatus('Local sync history is missing. Reconnect with your recovery code.'); return }
        if (remoteData !== baseRef.current && current !== baseRef.current && remoteData !== current) {
          conflict.current = true; setStatus('Changes on two devices conflict. Your local data is safe; export a backup before reconnecting.'); return
        }
        if (remoteData !== baseRef.current && current === baseRef.current) {
          remember(code, remote.data, remote.revision); dataRef.current = remote.data; setData(remote.data)
        } else if (current !== remoteData) {
          const result = await request(code, 'PUT', { data: dataRef.current, revision: remote.revision })
          if (!cancelled) remember(code, JSON.parse(current) as AppData, result.revision)
        } else { remember(code, remote.data, remote.revision) }
      } catch (error) { if (!cancelled) setStatus(error instanceof Error ? error.message : 'Offline. Changes stay on this device.') }
      finally { busy.current = false }
    }
    void sync()
    const interval = window.setInterval(() => { void sync() }, 5000)
    return () => { cancelled = true; window.clearInterval(interval) }
  }, [code, remember, setData])

  return { code, status, create, connect }
}
