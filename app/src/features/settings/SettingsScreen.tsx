import { SETTING_KEYS, useSetting } from '../../core/settings/settingsStore'
import { useVoices } from '../../core/services/tts'

export default function SettingsScreen() {
  const [deeplKey, setDeeplKey] = useSetting(SETTING_KEYS.deeplKey)
  const [voiceName, setVoiceName] = useSetting(SETTING_KEYS.voiceName)
  const [ttsRate, setTtsRate] = useSetting(SETTING_KEYS.ttsRate, '1')
  const voices = useVoices('de')
  const rateNum = Number(ttsRate) || 1

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-6">
      <h1 className="text-2xl font-semibold text-slate-100">Settings</h1>

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
