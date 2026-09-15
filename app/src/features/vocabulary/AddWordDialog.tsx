import { useEffect, useState } from 'react'

export interface DialogInput {
  german: string
  english: string
  notes: string
}

interface Props {
  initial: DialogInput
  title: string
  saveLabel?: string
  onSave: (input: DialogInput) => Promise<void> | void
  onCancel: () => void
}

export default function AddWordDialog({
  initial,
  title,
  saveLabel = 'Save',
  onSave,
  onCancel,
}: Props) {
  const [german, setGerman] = useState(initial.german)
  const [english, setEnglish] = useState(initial.english)
  const [notes, setNotes] = useState(initial.notes)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setGerman(initial.german)
    setEnglish(initial.english)
    setNotes(initial.notes)
  }, [initial.german, initial.english, initial.notes])

  const canSave = german.trim().length > 0 && english.trim().length > 0

  const handleSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      await onSave({
        german: german.trim(),
        english: english.trim(),
        notes: notes.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              German
            </span>
            <input
              value={german}
              onChange={(e) => setGerman(e.target.value)}
              placeholder="der Apfel"
              autoFocus
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              English
            </span>
            <input
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              placeholder="apple"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="masculine, plural: Äpfel"
              className="min-h-20 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400"
          >
            {saving ? 'Saving…' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
