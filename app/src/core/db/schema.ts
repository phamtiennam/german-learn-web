import Dexie, { type EntityTable } from 'dexie'

export interface Word {
  id?: number
  german: string
  english: string
  notes?: string
  dateAdded: number
  timesReviewed: number
  lastReviewed?: number
}

class GermanLearnDB extends Dexie {
  words!: EntityTable<Word, 'id'>

  constructor() {
    super('germanlearn')
    this.version(1).stores({
      words: '++id, german, english, dateAdded, lastReviewed',
    })
  }
}

export const db = new GermanLearnDB()

export interface WordInput {
  german: string
  english: string
  notes?: string
}

export async function addWord(input: WordInput): Promise<number> {
  const now = Date.now()
  return (await db.words.add({
    german: input.german.trim(),
    english: input.english.trim(),
    notes: input.notes?.trim() || undefined,
    dateAdded: now,
    timesReviewed: 0,
  })) as number
}

export async function updateWord(
  id: number,
  input: WordInput,
): Promise<number> {
  return await db.words.update(id, {
    german: input.german.trim(),
    english: input.english.trim(),
    notes: input.notes?.trim() || undefined,
  })
}

export async function deleteWord(id: number): Promise<void> {
  await db.words.delete(id)
}

export async function countWords(): Promise<number> {
  return await db.words.count()
}
