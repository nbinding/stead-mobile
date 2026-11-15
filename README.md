# Stead

A calm, offline companion for getting a financial consent order on divorce in England and Wales.

**Live app:** https://nbinding.github.io/stead-mobile/

## What it includes

- **Your journey.** Where you are, the one next thing to do, and the 14 steps from agreeing terms to carrying out the order. Each step has its own page with what it needs: what goes in the envelope, what to settle before filing, and what the judge can do. Steps tick themselves as the tools below are completed. Once the order is sealed, the journey shows it as a keepsake with the dates it sets, and you can add those dates to your calendar.
- **Templates for the writing.** Steps that ask you to write something offer a template filled from what you have entered, to copy or download: the written agreement (step 1), letters asking pension providers for valuations and the lender for a redemption statement (2), updating pension nominations (4), notice of the application to the mortgage lender (7), the covering letter to the court (10), a reply to the judge's questions (12), and sending the pension sharing order, moving the mortgage into one name and closing joint accounts (14).
- **D81 statement.** Both of your finances today and after the order, with the sums done for you, following form D81 (04.25), in five sections. Any screen can be left with **Come back to this**, and each section ends with a summary to check.
- **Form A.** The few answers a consent application needs, filled from the D81 and set out in the form's order.
- **Consent order.** A draft in the usual financial remedy wording, built from the D81 and a few questions: the home (transfer, already transferred or sale), a lump sum, pension sharing, a clean break, costs and liberty to apply. Gaps still to fill are dotted. It is a starting point for a solicitor to check.

Names, the case number, dates and property details are entered once and reused across all three documents.

## Design

Stead uses the [nbinding design system](https://github.com/nbinding/nbinding-design-system) in its Stead look (forest green on warm paper, Source Serif 4 and Inter). See it in [Storybook](https://nbinding.github.io/nbinding-design-system/storybook/) with **App: Stead** in the toolbar. A pinned copy lives in `src/ds/` and is inlined into the page by the build.

## Display and accessibility

**Display** in the header sets text size (100–150%), the original font, plain sans-serif or OpenDyslexic, light, forest dark or the device's appearance, help with numbers (amounts in words and how each sum is worked out), extra spacing and reduced motion. These use `sessionStorage` for the current tab. Every screen works at 320px wide, at 150% text with OpenDyslexic, by keyboard and with a screen reader; the tests check this.

## Data, sharing and privacy

- Everything is saved in the browser's local storage under `stead-v2`. Nothing is sent to a server.
- Saves from the earlier D81 wizard (`stead-d81-v1`) and stead.mobile (`stead-mobile-v1`) on this site carry over automatically.
- **Your data → Share with the other person** sends two things separately: a link, and the words that open it. Stead locks all of your data with those words in the browser (PBKDF2-SHA-256 with 600,000 iterations, then AES-256-GCM, after gzip compression) and puts it after the `#` in the address: `https://nbinding.github.io/stead-mobile/#k=...`. Browsers never send that part to a server.
- Opening a link or a backup file asks before replacing anything already saved on the device.
- **Save a backup file** downloads an unencrypted `stead-YYYY-MM-DD.json`. **Open a backup file** accepts Stead, D81 wizard and stead.mobile backups.

## Building and testing

`index.html` is a single self-contained page: React, the icons, the design system and its fonts are inlined, with no external runtime requests. Sources live in `src/` and are also embedded in the page as `stead-editable-source`.

```sh
npm ci
npm run build        # writes index.html; CI checks the committed copy matches
npm test             # sums, words, saved-data checks, migrations, the order, key dates, share links
npm run test:e2e     # every flow in Chromium at phone and desktop sizes, with axe accessibility checks
```

To update the design system: `node scripts/sync-ds.mjs ../nbinding-design-system`, then build. See [TESTING.md](TESTING.md) and [AGENTS.md](AGENTS.md).

## Scope

General information and drafting help, not legal advice. Fees and forms change, so check GOV.UK before relying on a figure. Checked November 2026.
