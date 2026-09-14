# German Learn — Web Requirements

**Platform:** Web (PWA — installable on iOS / Android / desktop)
**Recommended stack:** Vite + React + TypeScript + Tailwind CSS. Alternatives: SvelteKit, Vue.
**Language pair:** German ↔ English (bi-directional).
**Target user:** Self-learners building active vocabulary + speaking confidence.
**Origin:** Web port of the iOS app spec in `../GermanLearnApp/REQUIREMENTS.md`. Keep the iOS spec as-is for future use; this file supersedes it for the web build.

---

## Feature 1 — Translator

- **Input modes:**
  - **Text:** standard `<input>` / `<textarea>` (German or English).
  - **Handwriting/Drawing:** HTML `<canvas>` with pointer events; OCR via one of:
    - **DeepL Write API** — no handwriting; text only.
    - **Google Cloud Vision `DOCUMENT_TEXT_DETECTION`** — best web OCR; paid (~$1.50 / 1k images).
    - **Tesseract.js** — free, in-browser, but weak on handwriting; fine for printed.
    - Phase 1 defers handwriting; add later once text path is stable.
- **Output:** translation to the opposite language.
- **Translation engine (pick one in Phase 1):**
  - **DeepL API Free** — 500k chars/month free; best quality for DE↔EN.
  - **Google Cloud Translate v3** — pay per char, high quality.
  - **LibreTranslate** (self-hosted, free) — lower quality; only if avoiding paid APIs.
- API key stored in `localStorage` (client-only, no backend); user pastes their own key in Settings.
- "+ Add to my list" button on the result screen.

## Feature 2 — Pronunciation (Text-to-Speech)

- Tap a speaker icon → hear the German word.
- **Web Speech API:** `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))` with `utter.lang = 'de-DE'`.
- Voice picker: enumerate `speechSynthesis.getVoices()` filtered by `de-DE` (Anna / Markus / Helena on iOS Safari; Google DE on Chrome/Android).
- Rate slider: `utter.rate` in `[0.5, 1.0]`.
- Fallback: if no `de-DE` voice available, disable button + show hint.

## Feature 3 — Vocabulary List

- **Persistent storage:** IndexedDB via **Dexie.js** (typed, promise-based, works offline).
- Each entry: `{ id, german, english, dateAdded, notes, timesReviewed, lastReviewed }`.
- CRUD: add, edit, delete, search (Dexie `where().startsWithIgnoreCase()`), sort (alphabetical / recent / least-reviewed).
- **Export to Google Drive:**
  - Format: CSV or JSON.
  - Auth: **Google Identity Services** (GIS) JS library + Drive API scope `https://www.googleapis.com/auth/drive.file`.
  - User picks a folder (Drive Picker API); app uploads `vocabulary_YYYY-MM-DD.csv` via `fetch` to Drive REST.
- **Local export/import fallback:** download CSV / paste-in-CSV — works with zero setup, no OAuth required.

## Feature 4 — Review Mode (Duolingo-style)

- User selects 10+ words from the list (or "review all due").
- **Round 1 — German → English (recall):** show German word, user types or picks English from 4 options.
- **Round 2 — Listen → match:** play German audio (Web Speech API), user picks the matching written form from 4 options.
- **Round 3 — Speed match:** German word flashes, user matches to English (timed, mixed order).
- Score + streak at the end. Update `timesReviewed` / `lastReviewed` per word.
- **Stretch:** spaced repetition (SM-2 algorithm) to surface due words. Same logic works identically in JS.

## Feature 5 — Voice Conversation ("Call Lily")

- Phone-call-style UI: avatar, mute button, end-call button, live transcript.
- Pipeline:
  1. Mic capture → **Web Speech API** `SpeechRecognition` (Chrome/Safari) with `recognition.lang = 'de-DE'`.
  2. Transcript → LLM API (user's own key — OpenAI ChatGPT or Anthropic Claude) via `fetch`.
  3. LLM response → `speechSynthesis` (German voice) → speaker.
- **Known limitation:** iOS Safari's `SpeechRecognition` uses Apple server-side dictation and can drop mid-utterance. Desktop Chrome/Edge and Android Chrome are reliable. Communicate this in the UI ("best on desktop / Android").
- System prompt: *"You are Lily, a friendly German tutor. Speak only in simple German (A1–B1 level). Correct mistakes gently."*
- Settings screen: paste API key (localStorage), choose provider + model + level (A1/A2/B1/B2).

---

## Non-functional

- **Privacy:**
  - API keys in `localStorage` only, never sent to any server we control (no backend).
  - Mic permission requested with clear copy; only active on Call screen.
- **Offline (PWA):**
  - Service worker (via `vite-plugin-pwa`) caches app shell + static assets.
  - IndexedDB-backed vocab list + review mode fully offline.
  - Translator (needs API) + Voice chat (needs API + network) require online — degrade gracefully.
- **Installable:**
  - Web App Manifest with icons, `display: 'standalone'`, theme color.
  - iOS: "Add to Home Screen" from Safari share sheet → app opens fullscreen without browser chrome.
  - Android/Chrome: install prompt via `beforeinstallprompt` event.
- **Accessibility:**
  - Semantic HTML + ARIA labels on all controls.
  - Keyboard-navigable (tab order, focus rings).
  - Screen reader tested (VoiceOver on iOS, NVDA on Windows).
  - Respect `prefers-reduced-motion`, `prefers-color-scheme`.
- **Responsive:** phone-first layout (min-width 320px); scales to tablet + desktop.
- **Browser support:**
  - **Primary:** Safari 16+ (iOS 16.4+ for PWA push), Chrome / Edge 120+, Firefox 120+.
  - **Voice chat degraded:** iOS Safari (STT may drop); recommend Chrome/Android for best experience.
- **Bundle:** target < 300 KB initial JS (gzip); code-split by route.
- **Analytics:** none by default. Optional privacy-respecting Plausible if wanted.

---

## Differences vs. iOS spec (quick reference)

| iOS spec | Web equivalent | Notes |
|---|---|---|
| Apple `Translation` framework (free, on-device) | DeepL / Google Translate API (paid) | Web has no free on-device MT; DeepL free tier covers hobby use |
| `PencilKit` + `Vision` OCR | `<canvas>` + Tesseract.js / Cloud Vision | Handwriting quality drops; deferred |
| `AVSpeechSynthesizer` | `window.speechSynthesis` | Ties |
| SwiftData | IndexedDB (Dexie.js) | Ties |
| `GoogleSignIn-iOS` + Drive SDK | Google Identity Services + Drive REST | Web arguably simpler |
| `SFSpeechRecognizer` | Web `SpeechRecognition` | iOS Safari unreliable; desktop/Android fine |
| Keychain | `localStorage` (client-only) | Weaker; document it |
| Min iOS 18 | Modern evergreen browsers | Fewer platform constraints |
| App Store submission + $99/yr | Push to Cloudflare Pages / Vercel (free tier) | Zero-friction ship |
