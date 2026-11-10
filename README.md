# Stead

A calm, offline companion for getting a financial consent order on divorce in England and Wales.

**Live app:** https://nbinding.github.io/stead-mobile/

## What it includes

- **Your journey.** The 14 steps from agreeing terms to carrying out the order, with plain-language explanations of each legal term, what a judge can do with the application, an envelope checklist and the points to settle before filing. Steps tick themselves as the tools below are completed.
- **D81 statement.** Both parties' finances today and after the order, with the sums done for you, following form D81 (04.25). This is the former [d81-form](https://github.com/nbinding/d81-form) wizard.
- **Form A.** The few answers a consent application needs, filled from the D81 and set out in the form's order.
- **Consent order.** A draft in the usual financial remedy wording, built from the D81 and a few questions: the home (transfer, already transferred or sale), a lump sum, pension sharing, a clean break, costs and liberty to apply. It is a starting point for a solicitor to check.

Names, the case number, dates and property details are entered once and reused across all three documents.

## Display and accessibility

**Display** in the header sets text size (100–150%), the original font, plain sans-serif or the embedded OpenDyslexic font, light, forest dark or device appearance, help with numbers, extra spacing and reduced motion. Display preferences use `sessionStorage` for the current tab.

## Data, sharing and privacy

- Everything is saved in the browser's local storage under `stead-v2`. Nothing is sent to a server.
- Saves from the earlier D81 wizard (`stead-d81-v1`) and stead.mobile (`stead-mobile-v1`) on this site carry over automatically.
- **Share** locks all of your data with a passphrase in the browser (PBKDF2-SHA-256 with 600,000 iterations, then AES-256-GCM, after gzip compression) and puts it after the `#` in the address: `https://nbinding.github.io/stead-mobile/#k=...`. Browsers never send that part to a server. Send the passphrase separately from the link.
- Opening a link or importing a backup asks before replacing anything already saved on the device.
- **Export** downloads an unencrypted `stead-YYYY-MM-DD.json` backup. **Import** accepts Stead, D81 wizard and stead.mobile backups.

## Building

`index.html` is a single self-contained file. React, Base UI, Three.js and the OpenDyslexic font are bundled, with no external runtime requests. Sources live in `src/` and are also embedded in the page as `stead-editable-source`.

```sh
npm install
mkdir -p dist && node build.mjs
cp dist/index.html index.html
```

## Scope

General information and drafting help, not legal advice. Fees and forms change, so check GOV.UK before relying on a figure. Checked November 2026.
