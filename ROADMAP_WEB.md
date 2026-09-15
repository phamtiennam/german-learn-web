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

- [x] Translate screen: German `<textarea>`, English result panel, swap-direction button.
- [x] `Translator` interface + `OpenAITranslator` / `AnthropicTranslator` implementations (LLM-only, BYOK, key from Settings → `localStorage`).
- [x] Cloudflare Worker same-origin proxy (`/api/llm/openai`, `/api/llm/anthropic`) — avoids browser CORS, hides upstream endpoints.
- [x] Settings screen: **provider picker** (Anthropic / OpenAI) + per-provider API key + model override + link to key-console.
- [x] "🔊 Pronounce" button → `speechSynthesis.speak` with `de-DE`.
- [x] Voice picker in Settings (list `getVoices()` filtered by `de-DE`).
- [x] Rich translation output: translation + optional grammar note + optional example sentence.
- [x] Demo mode: 3–5 preset example outputs when no API key set.
- [x] "+ Save to list" button (stub — Phase 2 wires it up).
- [x] Error states: no key, request failed, offline.

**Done when:** paste key → type "Hallo" → see "Hello" + grammar note + example → tap speaker → hear "de-DE" voice.

**Deferred (see Phase 5):** LLM Vision handwriting OCR uses the same key set here.

---

## Phase 2 — Vocabulary List + Persistence (~2–3 days)

- [x] Define Dexie schema: `words` table with indexed fields.
- [x] `Word` TypeScript model.
- [x] List screen: search bar, sort dropdown (recent / A-Z DE / A-Z EN / least-reviewed), edit + delete on each row.
- [x] Wire "+ Save to list" from Translate screen → real Dexie insert (with grammar/example prefilled in Notes).
- [x] Add-word / edit-word modal (shared component).
- [x] Empty state with friendly copy + CTA back to Translate.
- [x] **📋 Paste & Save** button — reads clipboard, auto-splits on `— - = : |` separators, opens dialog pre-filled.
- [x] **`/add?de=&en=&notes=`** URL route — accepts URL params (also `?text=` fallback for share-target), opens save dialog. Foundation for iOS Shortcut / share sheet flow.
- [x] **PWA `share_target`** in manifest — Android Chrome + desktop share menus surface the app. iOS Safari doesn't support share targets; iOS users go via Shortcut (see below).
- [x] Local **backup/restore JSON** for **full app state** (settings + vocab). Settings screen → "Backup all data" downloads `germanlearn-backup-YYYY-MM-DD.json`; "Restore from file" merges words + restores settings.

**Done when:** translated words land in the list, survive a browser refresh, vocab exportable/importable via JSON, `/add?de=X&en=Y` URL round-trips.

**Deferred to Phase 6:** iOS Shortcut template (one-tap install via iCloud share link) that calls `/add?de=[SelectedText]` from any Share sheet. Not needed to unblock the workflow — power users can build it in Shortcuts app today; the app's `/add` route is the anchor.

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

## Phase 5 — Handwriting Input (~2–3 days)

Uses **LLM Vision** (Claude Sonnet 5 / GPT-4o) via the API key already configured in Settings — no separate OCR service to set up. Handwriting quality on par with Google Cloud Vision, no extra provider.

- [ ] `<canvas>` component with pointer events (mouse + touch + Apple Pencil on iPad).
- [ ] Clear / undo buttons.
- [ ] Toggle on Translate screen: keyboard ↔ draw.
- [ ] On "Recognize": export canvas as PNG → base64 → send with a vision-capable model (`claude-sonnet-5` or `gpt-4o`) → prompt: "Extract the German text from this image, then translate to English."
- [ ] Reuse the `/api/llm/*` Worker proxy; extend request shape to include image content.
- [ ] Guard: if user's current model isn't vision-capable, prompt them to switch model (Settings) or default to vision model for this feature only.
- [ ] Insert recognized text into the German field → normal translate flow (or bypass and show combined OCR+translate result).

**Done when:** draw "Apfel" with mouse/finger/Pencil → recognized as "Apfel" → translated to "apple".

---

## Phase 6 — Google Drive Sync (~3–4 days)

Upgrade from the original "Drive Export" scope: sync the **full app state** (settings + vocab + provider keys), not just vocab CSV. Hybrid architecture — localStorage stays the fast/offline primary; Drive is opt-in sync across devices.

- [ ] Set up Google Cloud project, OAuth client (Web application), authorize origins.
- [ ] Add Google Identity Services (GIS) script + Drive REST calls (`fetch`).
- [ ] Use `drive.appdata` scope — file lives in the hidden `appDataFolder`, invisible in normal Drive UI, only reachable via this app's OAuth client. Sufficient for storing API keys without extra encryption.
- [ ] Settings → "Sync with Google Drive" → GIS sign-in popup → store access token in memory (refresh via silent auth on next visit).
- [ ] On sign-in: upload current localStorage state as `germanlearn-state.json` in `appDataFolder`.
- [ ] On sign-in from a second device: pull `germanlearn-state.json` → merge into localStorage → app already usable.
- [ ] Background sync: after any settings/vocab change, debounce 5s then push to Drive. Silent-fail if offline.
- [ ] Conflict handling: last-write-wins by timestamp (simple). Warn user if pulled state is older than local unsaved changes.
- [ ] Show last-sync timestamp; "Sign out of Google" clears token (data stays in localStorage).

**Done when:** sign in on Mac → paste key + add vocab → sign in on iPhone → same key + vocab appear without re-entry.

---

## Phase 7 — Voice Chat with LLM (~1.5 weeks)

Warn about iOS Safari STT limitations up-front; primary target is desktop/Android for reliable STT. Uses the **same LLM key from Phase 1** — no additional setup.

- [ ] Settings: CEFR level picker (A1/A2/B1/B2). Provider + key + model are already in Settings from Phase 1.
- [ ] Extend `Translator` interface / add `ChatClient` interface — same OpenAI/Anthropic adapters, different prompts.
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
