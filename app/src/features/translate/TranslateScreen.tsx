import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createTranslator,
  LONG_INPUT_THRESHOLD,
  type Lang,
  type TranslationResult,
} from '../../core/services/translator'
import { speak, isTTSSupported } from '../../core/services/tts'
import {
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_PROVIDER,
  SETTING_KEYS,
  useSetting,
  type Provider,
} from '../../core/settings/settingsStore'
import { DEMO_EXAMPLES } from './demoExamples'

export default function TranslateScreen() {
  const [providerRaw] = useSetting(SETTING_KEYS.provider, DEFAULT_PROVIDER)
  const provider = providerRaw as Provider
  const [openaiKey] = useSetting(SETTING_KEYS.openaiKey)
  const [anthropicKey] = useSetting(SETTING_KEYS.anthropicKey)
  const [openaiModel] = useSetting(
    SETTING_KEYS.openaiModel,
    DEFAULT_OPENAI_MODEL,
  )
  const [anthropicModel] = useSetting(
    SETTING_KEYS.anthropicModel,
    DEFAULT_ANTHROPIC_MODEL,
  )
  const [voiceName] = useSetting(SETTING_KEYS.voiceName)
  const [rateStr] = useSetting(SETTING_KEYS.ttsRate, '1')
  const rate = Number(rateStr) || 1

  const activeKey = provider === 'openai' ? openaiKey : anthropicKey
  const activeModel =
    provider === 'openai' ? openaiModel : anthropicModel

  const [source, setSource] = useState<Lang>('DE')
  const [target, setTarget] = useState<Lang>('EN')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const swap = () => {
    setSource(target)
    setTarget(source)
    setInput(result?.translation ?? '')
    setResult(null)
    setError(null)
  }

  const handleTranslate = async () => {
    if (!input.trim()) return
    const translator = createTranslator(provider, activeKey, activeModel)
    if (!translator) {
      setStatus('error')
      setError('Add your API key in Settings.')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const richOutput = input.trim().length <= LONG_INPUT_THRESHOLD
      const r = await translator.translate(input, source, target, {
        richOutput,
      })
      setResult(r)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Translation failed')
    }
  }

  const pronounce = (text: string) => {
    if (!text.trim()) return
    speak(text, { voiceName: voiceName || undefined, rate, lang: 'de-DE' })
  }

  const translatedText = result?.translation ?? ''
  const germanForSpeaker = source === 'DE' ? input : translatedText

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

      {!activeKey && (
        <div className="rounded-lg border border-sky-800 bg-sky-950/40 px-4 py-3 text-sm text-slate-200">
          <p className="font-medium text-slate-100">
            Add your {provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key
          </p>
          <p className="mt-1 text-slate-300">
            Paste it in{' '}
            <Link to="/settings" className="text-sky-400 underline">
              Settings
            </Link>{' '}
            to start translating. Preview of what results look like ↓
          </p>
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
        {input.trim().length > LONG_INPUT_THRESHOLD && (
          <p className="text-xs text-amber-400">
            Long input ({input.trim().length} chars) — grammar note & example
            will be skipped. Use shorter phrases for full learning output.
          </p>
        )}
      </div>

      <button
        onClick={handleTranslate}
        disabled={status === 'loading' || !input.trim() || !activeKey}
        className="rounded-lg bg-sky-500 py-2 font-medium text-slate-950 transition-colors hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400"
      >
        {status === 'loading' ? 'Translating…' : 'Translate'}
      </button>

      {status === 'error' && error && (
        <div className="rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      {result && (
        <ResultCard
          result={result}
          targetLabel={target === 'DE' ? 'German' : 'English'}
          onPronounce={
            isTTSSupported() && germanForSpeaker
              ? () => pronounce(germanForSpeaker)
              : undefined
          }
        />
      )}

      {!activeKey && (
        <section className="mt-4 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Sample outputs (demo mode)
          </p>
          {DEMO_EXAMPLES.map((ex, i) => (
            <DemoCard key={i} example={ex} />
          ))}
        </section>
      )}

      <button
        disabled
        className="mt-4 rounded-lg border border-dashed border-slate-700 py-2 text-sm text-slate-500"
      >
        + Save to list (Phase 2)
      </button>
    </div>
  )
}

function ResultCard({
  result,
  targetLabel,
  onPronounce,
}: {
  result: TranslationResult
  targetLabel: string
  onPronounce?: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {targetLabel}
        </span>
        {onPronounce && (
          <button
            onClick={onPronounce}
            className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
            aria-label="Pronounce German"
          >
            🔊 Pronounce
          </button>
        )}
      </div>
      <p className="text-lg text-slate-100 whitespace-pre-wrap">
        {result.translation}
      </p>
      {result.grammar && (
        <div className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Grammar
          </p>
          <p className="mt-1 text-sm text-slate-300">{result.grammar}</p>
        </div>
      )}
      {result.example && (
        <div className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Example
          </p>
          <p className="mt-1 text-sm text-slate-200">{result.example.de}</p>
          <p className="mt-1 text-sm italic text-slate-400">
            {result.example.en}
          </p>
        </div>
      )}
    </div>
  )
}

function DemoCard({ example }: { example: (typeof DEMO_EXAMPLES)[number] }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {example.source} → {example.target}
      </p>
      <p className="mt-1 text-slate-300">{example.input}</p>
      <p className="mt-2 text-slate-100">{example.result.translation}</p>
      {example.result.grammar && (
        <p className="mt-2 text-xs text-slate-400">
          {example.result.grammar}
        </p>
      )}
    </div>
  )
}
