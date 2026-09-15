import type { Provider } from '../settings/settingsStore'

export type Lang = 'DE' | 'EN'

export interface TranslationResult {
  translation: string
  grammar?: string
  example?: { de: string; en: string }
}

export interface TranslateOptions {
  richOutput?: boolean
}

export interface Translator {
  translate(
    text: string,
    source: Lang,
    target: Lang,
    opts?: TranslateOptions,
  ): Promise<TranslationResult>
}

export const LONG_INPUT_THRESHOLD = 200

const SYSTEM_PROMPT_RICH = `You are a German ↔ English translation assistant for a language learning app.
When translating, return a JSON object with these fields:
- "translation": the translated text (accurate, natural, contextual)
- "grammar": (optional) a brief 1–2 sentence note in English about tricky grammar or vocabulary
- "example": (optional) an example sentence using the source phrase, as { "de": "...", "en": "..." }

Return ONLY valid JSON. No markdown, no code fences, no prose outside the object.`

const SYSTEM_PROMPT_PLAIN = `You are a German ↔ English translator.
Return a JSON object with a single field:
- "translation": the translated text (accurate, natural, contextual)

Return ONLY valid JSON. No markdown, no code fences, no prose outside the object.`

function buildUserPrompt(text: string, source: Lang, target: Lang): string {
  const from = source === 'DE' ? 'German' : 'English'
  const to = target === 'DE' ? 'German' : 'English'
  return `Translate this ${from} text to ${to}:\n\n${text}`
}

function pickSystemPrompt(opts?: TranslateOptions): string {
  return opts?.richOutput === false ? SYSTEM_PROMPT_PLAIN : SYSTEM_PROMPT_RICH
}

function parseResult(raw: string): TranslationResult {
  const cleaned = raw.trim().replace(/^```json\s*|\s*```$/g, '')
  try {
    const parsed = JSON.parse(cleaned) as TranslationResult
    if (typeof parsed.translation === 'string') return parsed
    throw new Error('Response JSON missing translation field')
  } catch {
    return { translation: cleaned }
  }
}

function extractProviderError(
  provider: 'DeepL' | 'OpenAI' | 'Anthropic',
  status: number,
  body: string,
): string {
  let message = body
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string; code?: string; type?: string }
      message?: string
    }
    if (parsed.error?.message) message = parsed.error.message
    else if (parsed.message) message = parsed.message
  } catch {
    // Body wasn't JSON — fall back to raw text
  }
  return `${provider} ${status}: ${message.trim() || 'request failed'}`
}

export class DeepLTranslator implements Translator {
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async translate(
    text: string,
    source: Lang,
    target: Lang,
    _opts?: TranslateOptions,
  ): Promise<TranslationResult> {
    const trimmed = text.trim()
    if (!trimmed) return { translation: '' }
    if (source === target) return { translation: text }

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: trimmed,
        source_lang: source,
        target_lang: target === 'EN' ? 'EN-US' : 'DE',
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(extractProviderError('DeepL', res.status, body))
    }

    const data = (await res.json()) as { translations: { text: string }[] }
    return { translation: data.translations[0]?.text ?? '' }
  }
}

export class OpenAITranslator implements Translator {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  async translate(
    text: string,
    source: Lang,
    target: Lang,
    opts?: TranslateOptions,
  ): Promise<TranslationResult> {
    const trimmed = text.trim()
    if (!trimmed) return { translation: '' }
    if (source === target) return { translation: text }

    const res = await fetch('/api/llm/openai', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: pickSystemPrompt(opts) },
          { role: 'user', content: buildUserPrompt(trimmed, source, target) },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(extractProviderError('OpenAI', res.status, body))
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[]
    }
    const content = data.choices[0]?.message?.content ?? ''
    return parseResult(content)
  }
}

export class AnthropicTranslator implements Translator {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  async translate(
    text: string,
    source: Lang,
    target: Lang,
    opts?: TranslateOptions,
  ): Promise<TranslationResult> {
    const trimmed = text.trim()
    if (!trimmed) return { translation: '' }
    if (source === target) return { translation: text }

    const res = await fetch('/api/llm/anthropic', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4000,
        system: pickSystemPrompt(opts),
        messages: [
          { role: 'user', content: buildUserPrompt(trimmed, source, target) },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(extractProviderError('Anthropic', res.status, body))
    }

    const data = (await res.json()) as {
      content: { type: string; text?: string }[]
    }
    const textBlock = data.content.find((b) => b.type === 'text')
    const content = textBlock?.text ?? ''
    return parseResult(content)
  }
}

export function createTranslator(
  provider: Provider,
  key: string,
  model: string,
): Translator | null {
  if (!key) return null
  if (provider === 'deepl') return new DeepLTranslator(key)
  if (provider === 'openai') return new OpenAITranslator(key, model)
  if (provider === 'anthropic') return new AnthropicTranslator(key, model)
  return null
}
