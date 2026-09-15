# German Learn — Web Requirements

**Platform:** Web (PWA — installable on iOS / Android / desktop)
**Recommended stack:** Vite + React + TypeScript + Tailwind CSS. Alternatives: SvelteKit, Vue.
**Language pair:** German ↔ English (bi-directional).
**Target user:** Self-learners building active vocabulary + speaking confidence.
**Origin:** Web port of the iOS app spec in `../GermanLearnApp/REQUIREMENTS.md`. Keep the iOS spec as-is for future use; this file supersedes it for the web build.
**Provider model:** LLM-only (Anthropic Claude or OpenAI GPT), user-picks-one in Settings. See `../GermanLearnApp/REQUIREMENTS.md` for the original DeepL-based iOS spec.

---

## Feature 1 — Translator

- **Input modes:**
  - **Text:** standard `<input>` / `<textarea>` (German or English).
  - **Handwriting/Drawing (Phase 5):** HTML `<canvas>` with pointer events; OCR via **LLM Vision** (Claude Sonnet 5 or GPT-4o) — reuses the LLM key set for text translation; no separate OCR service.
- **Output:** rich object — `{ translation, grammar?, example? }`. Grammar note and example sentence surface when the LLM includes them; UI degrades gracefully to plain translation.
- **Engine (LLM-only):** user picks **Anthropic (Claude)** or **OpenAI (GPT)** in Settings. Both call the same JSON-shaped prompt via a same-origin Cloudflare Worker proxy (`/api/llm/openai`, `/api/llm/anthropic`) that hides upstream endpoints and avoids browser CORS quirks.
  - Default models: `claude-haiku-4-5` (Anthropic), `gpt-4o-mini` (OpenAI). User can override in Settings.
  - API key stored in `localStorage` (client-only, no backend); user pastes their own key in Settings — BYOK.
- **Demo mode:** if no API key is set, Translate screen shows 3–5 preset example outputs (translation + grammar + example) so casual visitors see what the app does before committing to setup.
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
- **Local backup/restore (JSON, Phase 2):** Settings screen offers "Backup all data" → downloads a single JSON file containing settings + vocab + provider keys. "Restore" accepts the same file. Manual sync between devices without any account.
- **Local vocab export (CSV, Phase 2):** download vocab-only CSV for opening in Sheets/Excel.
- **Google Drive Sync (Phase 6):** full app state (settings + vocab + provider keys) synced across devices via one JSON file in Drive's hidden `appDataFolder`. Hybrid architecture — localStorage stays the primary; Drive is opt-in.
  - Auth: **Google Identity Services** (GIS) JS library + Drive API scope `https://www.googleapis.com/auth/drive.appdata` (hidden folder, only this app can read).
  - Background sync on change (debounced), silent-fail if offline.
  - Last-write-wins conflict resolution by timestamp.

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
| Apple `Translation` framework (free, on-device) | LLM (Claude or OpenAI, BYOK) | LLM gives rich output (grammar, example, IPA) at ~$0.20/month for personal use |
| `PencilKit` + `Vision` OCR | `<canvas>` + LLM Vision | Same LLM key powers text + handwriting + voice chat |
| `AVSpeechSynthesizer` | `window.speechSynthesis` | Ties |
| SwiftData | IndexedDB (Dexie.js) | Ties |
| `GoogleSignIn-iOS` + Drive SDK | Google Identity Services + Drive REST | Web arguably simpler |
| `SFSpeechRecognizer` | Web `SpeechRecognition` | iOS Safari unreliable; desktop/Android fine |
| Keychain | `localStorage` (client-only) | Weaker; document it |
| Min iOS 18 | Modern evergreen browsers | Fewer platform constraints |
| App Store submission + $99/yr | Push to Cloudflare Workers (free tier) | Zero-friction ship |
