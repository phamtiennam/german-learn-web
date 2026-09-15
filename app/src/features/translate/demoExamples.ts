import type { Lang, TranslationResult } from '../../core/services/translator'

export interface DemoExample {
  source: Lang
  target: Lang
  input: string
  result: TranslationResult
}

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    source: 'DE',
    target: 'EN',
    input: 'Hallo, wie geht es dir?',
    result: {
      translation: 'Hello, how are you?',
      grammar:
        '"wie geht es dir?" is the informal way to ask how someone is doing. Use "wie geht es Ihnen?" for formal contexts.',
      example: {
        de: 'Hallo, wie geht es dir heute?',
        en: 'Hello, how are you today?',
      },
    },
  },
  {
    source: 'DE',
    target: 'EN',
    input: 'Ich bin müde.',
    result: {
      translation: "I am tired.",
      grammar:
        '"müde" is a predicative adjective following "sein" (to be) — it does not take endings here.',
      example: {
        de: 'Nach der Arbeit bin ich immer müde.',
        en: 'After work I am always tired.',
      },
    },
  },
  {
    source: 'EN',
    target: 'DE',
    input: 'The book is on the table.',
    result: {
      translation: 'Das Buch liegt auf dem Tisch.',
      grammar:
        'German uses "liegen" (to lie) for objects resting horizontally, and "auf" + dative ("dem Tisch") to indicate a static location.',
      example: {
        de: 'Das Buch liegt auf dem Tisch neben der Lampe.',
        en: 'The book is on the table next to the lamp.',
      },
    },
  },
]
