import { useSyncExternalStore } from 'react'

const PREFIX = 'gl:'
const listeners = new Set<() => void>()
const emit = () => {
  for (const cb of listeners) cb()
}
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function read(key: string, fallback: string): string {
  return localStorage.getItem(PREFIX + key) ?? fallback
}

export function getSetting(key: string, fallback = ''): string {
  return read(key, fallback)
}

export function setSetting(key: string, value: string) {
  if (value === '') {
    localStorage.removeItem(PREFIX + key)
  } else {
    localStorage.setItem(PREFIX + key, value)
  }
  emit()
}

export function useSetting(
  key: string,
  fallback = '',
): [string, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  )
  return [value, (v: string) => setSetting(key, v)]
}

export const SETTING_KEYS = {
  provider: 'provider',
  openaiKey: 'openaiKey',
  openaiModel: 'openaiModel',
  anthropicKey: 'anthropicKey',
  anthropicModel: 'anthropicModel',
  voiceName: 'voiceName',
  ttsRate: 'ttsRate',
} as const

export type Provider = 'openai' | 'anthropic'
export const DEFAULT_PROVIDER: Provider = 'anthropic'
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
export const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5'
