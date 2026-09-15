import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  addWord,
  db,
  deleteWord,
  updateWord,
  type Word,
} from '../../core/db/schema'
import AddWordDialog, { type DialogInput } from './AddWordDialog'

type SortKey = 'recent' | 'alpha-de' | 'alpha-en' | 'least-reviewed'

interface DialogState {
  mode: 'add' | 'edit'
  initial: DialogInput
  editingId?: number
}

const emptyInput: DialogInput = { german: '', english: '', notes: '' }

function detectPair(text: string): DialogInput {
  const split = text.split(/\s*[—–\-=:|]\s*/)
  if (split.length === 2 && split[0].trim() && split[1].trim()) {
    return { german: split[0].trim(), english: split[1].trim(), notes: '' }
  }
  return { german: text.trim(), english: '', notes: '' }
}

export default function VocabularyScreen() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const words =
    useLiveQuery(async () => {
      const list = await db.words.toArray()
      const q = search.trim().toLowerCase()
      const filtered = q
        ? list.filter(
            (w) =>
              w.german.toLowerCase().includes(q) ||
              w.english.toLowerCase().includes(q) ||
              (w.notes?.toLowerCase().includes(q) ?? false),
          )
        : list
      return filtered.sort((a, b) => {
        switch (sort) {
          case 'recent':
            return b.dateAdded - a.dateAdded
          case 'alpha-de':
            return a.german.localeCompare(b.german, 'de')
          case 'alpha-en':
            return a.english.localeCompare(b.english, 'en')
          case 'least-reviewed':
            return a.timesReviewed - b.timesReviewed
        }
      })
    }, [search, sort]) ?? []

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const handleSave = async (input: DialogInput) => {
    if (dialog?.mode === 'edit' && dialog.editingId != null) {
      await updateWord(dialog.editingId, input)
      showToast('Updated')
    } else {
      await addWord(input)
      showToast('Saved to list')
    }
    setDialog(null)
  }

  const handlePasteSave = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        showToast('Clipboard is empty')
        return
      }
      setDialog({ mode: 'add', initial: detectPair(text) })
    } catch {
      showToast('Clipboard access denied')
    }
  }

  const handleDelete = async (word: Word) => {
    if (word.id == null) return
    if (!confirm(`Delete "${word.german}"?`)) return
    await deleteWord(word.id)
    showToast('Deleted')
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-100">Vocabulary</h1>
        <span className="text-xs text-slate-500">
          {words.length} {words.length === 1 ? 'word' : 'words'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDialog({ mode: 'add', initial: emptyInput })}
          className="flex-1 rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          + Add manually
        </button>
        <button
          onClick={handlePasteSave}
          className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          📋 Paste & Save
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          <option value="recent">Recent first</option>
          <option value="alpha-de">A–Z (German)</option>
          <option value="alpha-en">A–Z (English)</option>
          <option value="least-reviewed">Least reviewed</option>
        </select>
      </div>

      {words.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
          No words yet.
          <br />
          Translate one on the{' '}
          <Link to="/translate" className="text-sky-400 underline">
            Translate tab
          </Link>{' '}
          and hit + Save, or add manually above.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {words.map((w) => (
            <li
              key={w.id}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-slate-100">{w.german}</p>
                  <p className="text-sm text-slate-400">{w.english}</p>
                  {w.notes && (
                    <p className="mt-1 text-xs text-slate-500">{w.notes}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() =>
                      setDialog({
                        mode: 'edit',
                        editingId: w.id,
                        initial: {
                          german: w.german,
                          english: w.english,
                          notes: w.notes ?? '',
                        },
                      })
                    }
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(w)}
                    className="rounded-md border border-rose-900 px-2 py-1 text-xs text-rose-400 hover:bg-rose-950/40"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {w.timesReviewed > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Reviewed {w.timesReviewed} time
                  {w.timesReviewed === 1 ? '' : 's'}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {dialog && (
        <AddWordDialog
          title={dialog.mode === 'edit' ? 'Edit word' : 'Add word'}
          initial={dialog.initial}
          onSave={handleSave}
          onCancel={() => setDialog(null)}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-100 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
