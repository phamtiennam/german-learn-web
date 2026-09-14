import {
  DEFAULT_PROVIDER,
  SETTING_KEYS,
  useSetting,
  type Provider,
} from '../../core/settings/settingsStore'
import { useVoices } from '../../core/services/tts'

const PROVIDERS: { value: Provider; label: string; hint: string }[] = [
  {
    value: 'deepl',
    label: 'DeepL',
    hint: 'Best DE↔EN quality, free 500k chars/month.',
  },
  {
    value: 'openai',
    label: 'OpenAI',
    hint: 'Rich output (grammar, examples). Reuses key with Voice Chat later.',
  },
  {
    value: 'anthropic',
    label: 'Anthropic (Claude)',
    hint: 'Rich output. Reuses key with Voice Chat later.',
  },
]

export default function SettingsScreen() {
  const [provider, setProvider] = useSetting(
    SETTING_KEYS.provider,
    DEFAULT_PROVIDER,
  )
  const [deeplKey, setDeeplKey] = useSetting(SETTING_KEYS.deeplKey)
  const [openaiKey, setOpenaiKey] = useSetting(SETTING_KEYS.openaiKey)
  const [anthropicKey, setAnthropicKey] = useSetting(SETTING_KEYS.anthropicKey)
  const [voiceName, setVoiceName] = useSetting(SETTING_KEYS.voiceName)
  const [ttsRate, setTtsRate] = useSetting(SETTING_KEYS.ttsRate, '1')
  const voices = useVoices('de')
  const rateNum = Number(ttsRate) || 1

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-6">
      <h1 className="text-2xl font-semibold text-slate-100">Settings</h1>

      <section className="flex flex-col gap-2">
        <label
          htmlFor="provider-picker"
          className="text-sm font-medium text-slate-200"
        >
          Translation provider
        </label>
        <select
          id="provider-picker"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400">
          {PROVIDERS.find((p) => p.value === provider)?.hint}
        </p>
      </section>

      {provider === 'deepl' && (
        <section className="flex flex-col gap-2">
          <label
            htmlFor="deepl-key"
            className="text-sm font-medium text-slate-200"
          >
            DeepL API key
          </label>
          <p className="text-xs text-slate-400">
            Free tier at{' '}
            <a
              href="https://www.deepl.com/pro-api"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 underline"
            >
              deepl.com/pro-api
            </a>{' '}
            — 500k chars/month. Free keys end in <code>:fx</code>.
          </p>
          <input
            id="deepl-key"
            type="password"
            autoComplete="off"
            value={deeplKey}
            onChange={(e) => setDeeplKey(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </section>
      )}

      {provider === 'openai' && (
        <section className="flex flex-col gap-2">
          <label
            htmlFor="openai-key"
            className="text-sm font-medium text-slate-200"
          >
            OpenAI API key
          </label>
          <p className="text-xs text-slate-400">
            Get one at{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 underline"
            >
              platform.openai.com/api-keys
            </a>
            .
          </p>
          <input
            id="openai-key"
            type="password"
            autoComplete="off"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-…"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
          />
          <p className="rounded-md border border-amber-800 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
            OpenAI translator not wired up yet — switch to DeepL for now. Full
            LLM translation lands with the Voice Chat phase.
          </p>
        </section>
      )}

      {provider === 'anthropic' && (
        <section className="flex flex-col gap-2">
          <label
            htmlFor="anthropic-key"
            className="text-sm font-medium text-slate-200"
          >
            Anthropic API key
          </label>
          <p className="text-xs text-slate-400">
            Get one at{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 underline"
            >
              console.anthropic.com/settings/keys
            </a>
            .
          </p>
          <input
            id="anthropic-key"
            type="password"
            autoComplete="off"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder="sk-ant-…"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
          />
          <p className="rounded-md border border-amber-800 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
            Claude translator not wired up yet — switch to DeepL for now. Full
            LLM translation lands with the Voice Chat phase.
          </p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <label
          htmlFor="voice-picker"
          className="text-sm font-medium text-slate-200"
        >
          German voice (Text-to-Speech)
        </label>
        {voices.length === 0 ? (
          <p className="text-sm text-slate-400">
            No German voice detected on this device.
          </p>
        ) : (
          <select
            id="voice-picker"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
          >
            <option value="">System default</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <label
          htmlFor="rate-slider"
          className="text-sm font-medium text-slate-200"
        >
          Speech rate: {rateNum.toFixed(2)}×
        </label>
        <input
          id="rate-slider"
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          value={rateNum}
          onChange={(e) => setTtsRate(e.target.value)}
          className="accent-sky-500"
        />
      </section>

      <p className="mt-4 text-xs text-slate-500">
        All settings live only in this browser (localStorage). Clear browser
        data to reset.
      </p>
    </div>
  )
}
