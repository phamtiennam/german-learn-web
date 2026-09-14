# German Learn — Web Roadmap

Ship-incrementally plan for the web (PWA) version. Each phase produces something usable in a browser (and installable to Home Screen) before the next phase starts. See `REQUIREMENTS_WEB.md` for feature scope.

---

## Phase 0 — Project Setup (~half day)

- [ ] `npm create vite@latest germanlearn-web -- --template react-ts`
- [ ] Install: `tailwindcss`, `react-router-dom`, `dexie`, `dexie-react-hooks`, `vite-plugin-pwa`.
- [ ] Configure Tailwind + base styles + dark-mode class strategy.
- [ ] Add `vite-plugin-pwa` with `registerType: 'autoUpdate'`, minimal manifest, placeholder 192/512 icons.
- [ ] Folder structure:
  ```
  src/
    app/            (routes, layout, root providers)
    features/
      translate/
      vocabulary/
      review/
      voice/
      settings/
    core/
      db/           (Dexie schema, migrations)
      services/     (translator.ts, tts.ts, drive.ts, llmClient.ts)
      models/       (Word.ts, ReviewSession.ts, ...)
    ui/             (shared components, icons)
  ```
- [ ] Bottom tab bar (mobile) / sidebar (desktop): Translate · List · Review · Call · Settings.
- [ ] Git repo + `.gitignore` (node_modules, dist, .env.local).

**Done when:** empty app builds, dev server hot-reloads, 5 tabs navigate, Lighthouse PWA check passes (installable).

---

## Phase 1 — Translator + TTS (MVP, ~2–3 days)

- [ ] Translate screen: German `<textarea>`, English result panel, swap-direction button.
- [ ] `TranslatorService` interface + `DeepLTranslator` implementation (uses key from Settings → `localStorage`).
- [ ] Settings screen: DeepL API key input (masked, saved to `localStorage`).
- [ ] "🔊 Pronounce" button → `speechSynthesis.speak` with `de-DE`.
- [ ] Voice picker in Settings (list `getVoices()` filtered by `de-DE`).
- [ ] "+ Save to list" button (stub — toast only for now).
- [ ] Error states: no key, quota exceeded, offline, no `de-DE` voice.
- [ ] Loading state (spinner + disable button during fetch).

**Done when:** paste key → type "Hallo" → see "Hello" → tap speaker → hear "de-DE" voice.

---

## Phase 2 — Vocabulary List + Persistence (~2–3 days)

- [ ] Define Dexie schema: `words` table with indexed fields.
- [ ] `Word` TypeScript model + zod validation.
- [ ] List screen: virtual list (`@tanstack/react-virtual` if > 500 rows), search bar, sort dropdown, swipe-to-delete (mobile) / delete button (desktop).
- [ ] Wire "+ Save to list" from Translate screen → real Dexie insert.
- [ ] Edit modal / route: change German/English/notes.
- [ ] Empty state with friendly copy + CTA back to Translate.
- [ ] Local **export/import CSV** (download `.csv` / file input).

**Done when:** translated words land in the list, survive a browser refresh, exportable/importable via CSV.

---

## Phase 3 — Review Mode (~3–5 days)

Bumped up from iOS Phase 4 — pure UI/logic, works identically and delivers big user value early.

- [ ] Review setup screen: pick count (10/20/50) and source (all / recent / least-reviewed).
- [ ] `ReviewSession` engine (pure TS): queue, rounds, scoring.
- [ ] **Round 1** — German shown, 4 English options (1 correct + 3 distractors sampled from list).
- [ ] **Round 2** — Auto-play German TTS, 4 written German options.
- [ ] **Round 3** — Timed match: German flashes, tap matching English (mixed deck).
- [ ] Result screen: score, time, words missed (option to re-add to next session).
- [ ] Update `timesReviewed` + `lastReviewed` via Dexie transaction.
- [ ] Keyboard shortcuts on desktop (1–4 to pick option, Enter to next).

**Done when:** 10-word review runs through 3 rounds, shows score, list metadata updated.

---

## Phase 4 — PWA Polish + Deploy (~1 day)

Ship early, iterate live. Do this before adding more features.

- [ ] Real app icon (512 + 192 + maskable) — can be simple text-based first pass.
- [ ] Web App Manifest: name, short_name, theme_color, background_color.
- [ ] Verify "Add to Home Screen" on iPhone Safari: opens fullscreen, no browser chrome.
- [ ] Service worker: precache app shell; runtime cache for TTS voice list.
- [ ] Deploy to **Cloudflare Pages** (or Vercel). CI: push to `main` → auto-deploy.
- [ ] Custom subdomain (optional, ~$10/yr) or use `*.pages.dev`.

**Done when:** open URL on iPhone Safari, "Add to Home Screen", app icon appears, tap → fullscreen app works offline for Vocab + Review.

---

## Phase 5 — Handwriting Input (~3–5 days, optional)

Punt if not high-priority. Web OCR quality is materially worse than iOS Vision.

- [ ] `<canvas>` component with pointer events (mouse + touch + Apple Pencil on iPad).
- [ ] Clear / undo buttons.
- [ ] Toggle on Translate screen: keyboard ↔ draw.
- [ ] OCR pipeline (pick one):
  - **Path A:** Tesseract.js `deu` traineddata — free, in-browser, ~5MB download, weak on cursive.
  - **Path B:** Google Cloud Vision `DOCUMENT_TEXT_DETECTION` — needs key + backend proxy (to hide key) OR client-side with restricted key. Best quality.
- [ ] "Recognize" → insert text into German field → normal translate flow.

**Done when:** draw "Apfel" with mouse/finger/Pencil → translate to "apple".

---

## Phase 6 — Google Drive Export (~2–3 days)

- [ ] Set up Google Cloud project, OAuth client (Web application), authorize origins.
- [ ] Add Google Identity Services script + Drive REST calls (`fetch`).
- [ ] Settings → "Connect Google Drive" → GIS sign-in popup → store access token in memory (refresh via silent auth).
- [ ] Export button on List: CSV serializer → multipart upload to Drive `appDataFolder` or user-picked folder (Drive Picker API).
- [ ] Show last-export timestamp; allow disconnect (revoke token).

**Done when:** tap Export → CSV appears in my Drive, opens in Sheets.

---

## Phase 7 — Voice Chat with LLM (~1.5 weeks)

Warn about iOS Safari STT limitations up-front; primary target is desktop/Android for reliable STT.

- [ ] Settings: LLM provider picker (OpenAI / Anthropic), API key (localStorage), model, CEFR level.
- [ ] `LLMClient` interface + `OpenAIClient`, `AnthropicClient` (streaming via SSE).
- [ ] Mic permission flow + browser support detection (`'SpeechRecognition' in window || 'webkitSpeechRecognition' in window`).
- [ ] Call screen UI: avatar, mute, end, live transcript (both sides).
- [ ] Loop: `SpeechRecognition('de-DE')` → LLM (streaming) → `speechSynthesis('de-DE')` → loopback.
- [ ] System prompt tuned per level (A1/A2/B1/B2): vocab limits, gentle correction.
- [ ] Handle: silence detection (end-of-turn via `recognition.onspeechend`), interruption (user speaks → `speechSynthesis.cancel()`).
- [ ] iOS Safari fallback: allow user to tap-to-talk (hold button) instead of continuous recognition.

**Done when:** 2-minute German conversation with Lily on desktop Chrome; degraded but usable on iPhone.

---

## Phase 8 — Polish & Extras (~1 week)

- [ ] Spaced repetition (SM-2) — surface due words in Review setup.
- [ ] Onboarding (3 screens): intro, add API keys, add-to-home-screen guide.
- [ ] Localize UI: English + Vietnamese + German (i18next).
- [ ] Dark mode toggle (system / light / dark).
- [ ] Analytics (optional): Plausible or self-hosted Umami.
- [ ] Error boundary + Sentry (optional).
- [ ] Delete-all-data button in Settings (GDPR-friendly).

---

## Total estimated timeline: 3–5 weeks part-time

(vs. 7–9 weeks for the iOS version — faster because of no signing / no simulator setup / no App Store review, and Web Storage / TTS are already there.)

## Risks / open questions

- **Translation cost:** DeepL free tier is 500k chars/month — plenty for personal use. If exceeded, Google Translate v3 (~$20 / 1M chars) or LibreTranslate self-hosted.
- **iOS Safari `SpeechRecognition`:** intermittent; may need push-to-talk fallback or drop the feature on iOS.
- **PWA install friction on iOS:** users need to know about Share Sheet → Add to Home Screen. Include an in-app hint on first Safari visit.
- **Handwriting OCR quality:** materially worse than iOS Vision; consider making it a "beta" feature.
- **API keys in `localStorage`:** vulnerable to XSS — no third-party scripts, tight CSP required. Document as a trade-off vs. running a backend.

---

## What to build first (this week)

1. **Phase 0** — scaffold + PWA baseline (half day).
2. **Phase 1** — working translator + TTS (2–3 days).
3. **Phase 2** — vocab list persistence (2–3 days).

That's a genuinely useful app you can already open on your iPhone by end of week 1 — before touching handwriting, Drive, or voice chat.
