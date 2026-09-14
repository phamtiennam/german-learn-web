import { useEffect, useState } from 'react'

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(
  text: string,
  opts?: { voiceName?: string; lang?: string; rate?: number },
) {
  if (!isTTSSupported()) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = opts?.lang ?? 'de-DE'
  utter.rate = opts?.rate ?? 1
  if (opts?.voiceName) {
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.name === opts.voiceName)
    if (voice) utter.voice = voice
  }
  window.speechSynthesis.speak(utter)
}

function listVoices(langPrefix: string): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return []
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()))
}

export function useVoices(langPrefix = 'de'): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    listVoices(langPrefix),
  )

  useEffect(() => {
    if (!isTTSSupported()) return
    const update = () => setVoices(listVoices(langPrefix))
    update()
    window.speechSynthesis.addEventListener('voiceschanged', update)
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', update)
  }, [langPrefix])

  return voices
}
