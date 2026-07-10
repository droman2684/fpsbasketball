import { app } from 'electron'
import { join } from 'node:path'
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import type { PersistedSave } from '@shared/types'

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface AppData {
  version: 1
  saves: PersistedSave[]
  windowBounds: WindowBounds | null
}

function defaults(): AppData {
  return { version: 1, saves: [], windowBounds: null }
}

function filePath(): string {
  return join(app.getPath('userData'), 'empire-hoops-data.json')
}

let data: AppData | null = null
let writeTimer: ReturnType<typeof setTimeout> | null = null

function load(): AppData {
  const path = filePath()
  if (!existsSync(path)) return defaults()
  try {
    const raw = readFileSync(path, 'utf-8')
    // Old single-slot shape had a `save: PersistedSave | null` field instead of
    // `saves: PersistedSave[]` — migrate it in place so an existing install's
    // one save isn't lost when this version first runs.
    const parsed = JSON.parse(raw) as AppData & { save?: PersistedSave | null }
    const merged = { ...defaults(), ...parsed }
    if (!Array.isArray(parsed.saves) && parsed.save) {
      merged.saves = [{ ...parsed.save, id: parsed.save.id ?? randomUUID() }]
    }
    return merged
  } catch (err) {
    console.error('Failed to read persisted data, starting fresh:', err)
    return defaults()
  }
}

export function getSnapshot(): AppData {
  if (!data) data = load()
  return data
}

function writeNow(): void {
  const path = filePath()
  const tmpPath = `${path}.tmp`
  writeFileSync(tmpPath, JSON.stringify(getSnapshot(), null, 2), 'utf-8')
  renameSync(tmpPath, path)
}

export function persist(): void {
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    writeTimer = null
    writeNow()
  }, 250)
}

export function persistNow(): void {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
  }
  writeNow()
}

export function upsertSave(save: PersistedSave): void {
  const snapshot = getSnapshot()
  const idx = snapshot.saves.findIndex((s) => s.id === save.id)
  if (idx >= 0) snapshot.saves[idx] = save
  else snapshot.saves.push(save)
  persistNow()
}

export function deleteSave(id: string): void {
  const snapshot = getSnapshot()
  snapshot.saves = snapshot.saves.filter((s) => s.id !== id)
  persistNow()
}
