import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DeepLTranslator, type Lang } from '../../core/services/translator'
import { speak, isTTSSupported } from '../../core/services/tts'
import {
  DEFAULT_PROVIDER,
  SETTING_KEYS,
  useSetting,
} from '../../core/settings/settingsStore'

export default function TranslateScreen() {
  const [provider] = useSetting(SETTING_KEYS.provider, DEFAULT_PROVIDER)
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

  const providerReady = provider === 'deepl'
  const needsDeeplKey = provider === 'deepl' && !deeplKey

  const swap = () => {
    setSource(target)
    setTarget(source)
    setInput(output)
    setOutput(input)
    setError(null)
  }

  const handleTranslate = async () => {
    if (!input.trim()) return
    if (!providerReady) {
      setStatus('error')
      setError(
        `Provider "${provider}" is not wired up yet. Switch to DeepL in Settings.`,
      )
      return
    }
    if (needsDeeplKey) {
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

      {!providerReady && (
        <div className="rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          <p className="font-medium">
            The <code>{provider}</code> provider isn't wired up yet.
          </p>
          <p className="mt-1 text-amber-300">
            Switch to <strong>DeepL</strong> in{' '}
            <Link to="/settings" className="text-sky-400 underline">
              Settings
            </Link>{' '}
            for now. LLM providers ship with the Voice Chat phase.
          </p>
        </div>
      )}

      {providerReady && needsDeeplKey && (
        <div className="rounded-lg border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm text-slate-200">
          <p className="font-medium text-slate-100">
            Set up your DeepL key first
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-300">
            <li>
              Get a free key at{' '}
              <a
                href="https://www.deepl.com/pro-api"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 underline"
              >
                deepl.com/pro-api
              </a>{' '}
              (500k chars/month, ends with <code>:fx</code>).
            </li>
            <li>
              Paste it in{' '}
              <Link to="/settings" className="text-sky-400 underline">
                Settings
              </Link>{' '}
              — then come back here to translate.
            </li>
          </ol>
        </div>
      )}

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
