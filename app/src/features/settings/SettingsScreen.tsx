import {
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_PROVIDER,
  SETTING_KEYS,
  useSetting,
  type Provider,
} from '../../core/settings/settingsStore'
import { useVoices } from '../../core/services/tts'

interface ProviderMeta {
  value: Provider
  label: string
  keyLabel: string
  keyPlaceholder: string
  keyUrl: string
  keyUrlLabel: string
  hint: string
  hasModel: boolean
}

const PROVIDERS: ProviderMeta[] = [
  {
    value: 'deepl',
    label: 'DeepL',
    keyLabel: 'DeepL API key',
    keyPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx',
    keyUrl: 'https://www.deepl.com/pro-api',
    keyUrlLabel: 'deepl.com/pro-api',
    hint: 'Best DE↔EN quality, 500k chars/month free. Plain translation (no grammar/example).',
    hasModel: false,
  },
  {
    value: 'anthropic',
    label: 'Anthropic (Claude)',
    keyLabel: 'Anthropic API key',
    keyPlaceholder: 'sk-ant-…',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyUrlLabel: 'console.anthropic.com/settings/keys',
    hint: 'Claude Haiku 4.5 by default — rich output (translation + grammar + example).',
    hasModel: true,
  },
  {
    value: 'openai',
    label: 'OpenAI (GPT)',
    keyLabel: 'OpenAI API key',
    keyPlaceholder: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyUrlLabel: 'platform.openai.com/api-keys',
    hint: 'GPT-4o-mini by default — rich output. Requires $5 minimum credit on OpenAI.',
    hasModel: true,
  },
]

export default function SettingsScreen() {
  const [providerRaw, setProvider] = useSetting(
    SETTING_KEYS.provider,
    DEFAULT_PROVIDER,
  )
  const provider = providerRaw as Provider

  const [deeplKey, setDeeplKey] = useSetting(SETTING_KEYS.deeplKey)
  const [openaiKey, setOpenaiKey] = useSetting(SETTING_KEYS.openaiKey)
  const [openaiModel, setOpenaiModel] = useSetting(
    SETTING_KEYS.openaiModel,
    DEFAULT_OPENAI_MODEL,
  )
  const [anthropicKey, setAnthropicKey] = useSetting(
    SETTING_KEYS.anthropicKey,
  )
  const [anthropicModel, setAnthropicModel] = useSetting(
    SETTING_KEYS.anthropicModel,
    DEFAULT_ANTHROPIC_MODEL,
  )

  const [voiceName, setVoiceName] = useSetting(SETTING_KEYS.voiceName)
  const [ttsRate, setTtsRate] = useSetting(SETTING_KEYS.ttsRate, '1')
  const voices = useVoices('de')
  const rateNum = Number(ttsRate) || 1

  const active = PROVIDERS.find((p) => p.value === provider) ?? PROVIDERS[0]

  const keyValue =
    provider === 'deepl'
      ? deeplKey
      : provider === 'openai'
        ? openaiKey
        : anthropicKey
  const setKeyValue =
    provider === 'deepl'
      ? setDeeplKey
      : provider === 'openai'
        ? setOpenaiKey
        : setAnthropicKey

  const modelValue = provider === 'openai' ? openaiModel : anthropicModel
  const setModelValue =
    provider === 'openai' ? setOpenaiModel : setAnthropicModel

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
        <p className="text-xs text-slate-400">{active.hint}</p>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="api-key" className="text-sm font-medium text-slate-200">
          {active.keyLabel}
        </label>
        <p className="text-xs text-slate-400">
          Get one at{' '}
          <a
            href={active.keyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 underline"
          >
            {active.keyUrlLabel}
          </a>
          . Stored locally in this browser only.
        </p>
        <input
          id="api-key"
          type="password"
          autoComplete="off"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          placeholder={active.keyPlaceholder}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
        />
      </section>

      {active.hasModel && (
        <section className="flex flex-col gap-2">
          <label htmlFor="model" className="text-sm font-medium text-slate-200">
            Model
          </label>
          <input
            id="model"
            type="text"
            value={modelValue}
            onChange={(e) => setModelValue(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
          />
          <p className="text-xs text-slate-400">
            Advanced. Defaults:{' '}
            <code>{DEFAULT_ANTHROPIC_MODEL}</code> for Anthropic,{' '}
            <code>{DEFAULT_OPENAI_MODEL}</code> for OpenAI.
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
