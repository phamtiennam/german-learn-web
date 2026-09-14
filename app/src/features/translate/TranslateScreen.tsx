import { useState } from 'react'
import { DeepLTranslator, type Lang } from '../../core/services/translator'
import { speak, isTTSSupported } from '../../core/services/tts'
import { SETTING_KEYS, useSetting } from '../../core/settings/settingsStore'

export default function TranslateScreen() {
  const [deeplKey] = useSetting(SETTING_KEYS.deeplKey)
  const [voiceName] = useSetting(SETTING_KEYS.voiceName)
  const [rateStr] = useSetting(SETTING_KEYS.ttsRate, '1')
  const rate = Number(rateStr) || 1

  const [source, setSource] = useState<Lang>('DE')
  const [target, setTarget] = useState<Lang>('EN')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const swap = () => {
    setSource(target)
    setTarget(source)
    setInput(output)
    setOutput(input)
    setError(null)
  }

  const handleTranslate = async () => {
    if (!input.trim()) return
    if (!deeplKey) {
      setStatus('error')
      setError('Please add your DeepL API key in Settings.')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const translator = new DeepLTranslator(deeplKey)
      const result = await translator.translate(input, source, target)
      setOutput(result)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Translation failed')
    }
  }

  const pronounceGerman = () => {
    const text = source === 'DE' ? input : output
    if (!text.trim()) return
    speak(text, { voiceName: voiceName || undefined, rate, lang: 'de-DE' })
  }

  const germanText = source === 'DE' ? input : output

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-100">Translate</h1>
        <button
          onClick={swap}
          className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
          aria-label="Swap languages"
        >
          {source} → {target} ⇄
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wide text-slate-400">
          {source === 'DE' ? 'German' : 'English'}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-32 rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-100 focus:border-sky-500 focus:outline-none"
          placeholder={source === 'DE' ? 'Type in German…' : 'Type in English…'}
        />
      </div>

      <button
        onClick={handleTranslate}
        disabled={status === 'loading' || !input.trim()}
        className="rounded-lg bg-sky-500 py-2 font-medium text-slate-950 transition-colors hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400"
      >
        {status === 'loading' ? 'Translating…' : 'Translate'}
      </button>

      {status === 'error' && error && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-wide text-slate-400">
            {target === 'DE' ? 'German' : 'English'}
          </label>
          {germanText.trim() && isTTSSupported() && (
            <button
              onClick={pronounceGerman}
              className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
              aria-label="Pronounce German"
            >
              🔊 Pronounce
            </button>
          )}
        </div>
        <div className="min-h-32 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-3 text-slate-100">
          {output || (
            <span className="text-slate-500">Translation will appear here.</span>
          )}
        </div>
      </div>

      <button
        disabled
        className="mt-4 rounded-lg border border-dashed border-slate-700 py-2 text-sm text-slate-500"
      >
        + Save to list (Phase 2)
      </button>
    </div>
  )
}
