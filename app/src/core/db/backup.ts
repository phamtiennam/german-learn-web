import { db, type Word } from './schema'

interface BackupPayload {
  version: 1
  exportedAt: string
  settings: Record<string, string>
  words: Word[]
}

function collectSettings(): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('gl:')) continue
    const value = localStorage.getItem(key)
    if (value !== null) out[key] = value
  }
  return out
}

export async function exportBackup(): Promise<void> {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: collectSettings(),
    words: await db.words.toArray(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const stamp = new Date().toISOString().slice(0, 10)
  a.download = `germanlearn-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export interface RestoreResult {
  wordsAdded: number
  settingsRestored: number
}

export async function importBackup(file: File): Promise<RestoreResult> {
  const text = await file.text()
  const parsed = JSON.parse(text) as Partial<BackupPayload>
  if (parsed.version !== 1) {
    throw new Error('Unsupported backup version.')
  }

  let wordsAdded = 0
  if (Array.isArray(parsed.words)) {
    for (const w of parsed.words) {
      if (!w.german || !w.english) continue
      await db.words.add({
        german: w.german,
        english: w.english,
        notes: w.notes,
        dateAdded: w.dateAdded ?? Date.now(),
        timesReviewed: w.timesReviewed ?? 0,
        lastReviewed: w.lastReviewed,
      })
      wordsAdded++
    }
  }

  let settingsRestored = 0
  if (parsed.settings && typeof parsed.settings === 'object') {
    for (const [key, value] of Object.entries(parsed.settings)) {
      if (typeof value !== 'string') continue
      if (!key.startsWith('gl:')) continue
      localStorage.setItem(key, value)
      settingsRestored++
    }
  }

  return { wordsAdded, settingsRestored }
}
