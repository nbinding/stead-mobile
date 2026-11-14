# AGENTS.md

Guidance for AI coding agents working in this repository.

**What this is:** Stead, a static, client-only web app for preparing a financial consent order in England and Wales. It's live at https://nbinding.github.io/stead-mobile/ and served by GitHub Pages from the root of `main`, so **anything merged to `main` is live within about a minute**. Merge only when the owner asks.

## Ground rules

- **No backend, no accounts, no tracking, no network calls.** Everything stays in the browser. Share links carry encrypted data after the `#`.
- **One self-contained page.** `npm run build` inlines React, the icons, the design system and its fonts into `index.html`. Commit the rebuilt `index.html` with every source change; CI checks it matches.
- **Don't weaken the crypto** in `src/share.js` (PBKDF2-SHA-256, 600,000 iterations, AES-256-GCM, random salt and IV). Ask before changing it.
- **Keep old saves and links working.** `validate()` in `src/d81.js` must keep reading data from earlier releases; `load()` carries over the D81 wizard and stead.mobile saves. Add a test whenever the saved format changes.
- **Treat anything from a file or link as untrusted.** It goes through `validate()`; React escapes text; never use `dangerouslySetInnerHTML`.
- **Mobile first.** 320px wide with no sideways scrolling, 150% text, OpenDyslexic, light and forest dark. Tap targets at least 44px.
- Not legal advice: keep wording careful and point to GOV.UK and a solicitor where it matters.

## Where things live

| File | Role |
|---|---|
| `src/d81.js` | D81 questions and sections, sums (pence), words for amounts, saved-data checks, loading and migrations. No React. |
| `src/steps.js` | The 14 steps, glossary, envelope, outcomes, key dates and the calendar file. No React. |
| `src/documents.js` | Form A answers and the draft consent order. No React. |
| `src/share.js` | Locking and opening share links, and suggested words. |
| `src/ui.jsx` | Shared React pieces on the design system: fields, money inputs, terms, the sheet/dialog overlay, status marks. |
| `src/journey.jsx` | The journey, step pages and the sealed-order keepsake. |
| `src/docs.jsx` | Form A and consent order screens. |
| `src/app.jsx` | The shell (top bar, tab bar, sidebar), the D81 screens, Your data, sharing and dialogs. |
| `src/style.css` | Stead-only layout and tables on top of the design system. Use `--nb-*` tokens. |
| `src/ds/` | Pinned copy of the nbinding design system. **Don't edit it here**: change the design system repo, then `node scripts/sync-ds.mjs ../nbinding-design-system`. |

## Design

- Use the design system's `nb-` components in the Stead look (`data-nb-app="stead"` on `<html>`). If a component is missing, add it to the design system first; Stead's own CSS is only for layout and tables.
- One job per screen, one primary action. Structure with space and type rather than boxes. Show state by shape (ring, solid tick, dotted "?"), never colour alone.
- Plain, friendly UK English. Explain legal terms with `[[term]]` markers, which become plain-language explanations.

## Before you push

```sh
npm run build && npm test && npm run test:e2e
```

Add or update tests with every behaviour change. Never skip, disable or loosen a test to get CI green; fix the cause. Don't put secrets, personal details or model names in commits, code or docs.
