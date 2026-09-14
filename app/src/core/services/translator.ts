export type Lang = 'DE' | 'EN'

export interface Translator {
  translate(text: string, source: Lang, target: Lang): Promise<string>
}

export class DeepLTranslator implements Translator {
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async translate(text: string, source: Lang, target: Lang): Promise<string> {
    const trimmed = text.trim()
    if (!trimmed) return ''
    if (source === target) return text

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
      throw new Error(
        `DeepL ${res.status}: ${body || res.statusText || 'request failed'}`,
      )
    }

    const data = (await res.json()) as { translations: { text: string }[] }
    return data.translations[0]?.text ?? ''
  }
}
