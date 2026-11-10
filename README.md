# stead.mobile

A mobile-first, step by step guide to getting a financial consent order on divorce in England and Wales. A companion to the [Stead D81 wizard](https://nbinding.github.io/d81-form/), using the same palette.

**Live guide:** https://nbinding.github.io/stead-mobile/

Open `index.html` directly to use it offline. It is one self-contained file with no external fonts, scripts or requests.

## What it does

- 14 steps in order, each with who does it and when, plus tap-to-read explanations of the legal terms.
- What a judge can do with the application, an envelope checklist and a list of points to settle before filing.
- A date helper: enter the Conditional Order date to see the earliest Final Order application date.

## Data and sharing

Ticks and one optional date are kept in the browser's local storage. Nothing is sent to a backend, and the page contains no personal details.

- **Share a link** puts the same data, base64 encoded, after the `#` in the address: `https://nbinding.github.io/stead-mobile/#s=...`. Browsers do not send that part to the server. A copy opened as a local file still produces a link to the public address.
- **Export** downloads a `stead-mobile-YYYY-MM-DD.json` backup. **Import** loads one.
- Opening a link or a backup asks before replacing ticks already on the device.

Links and backups are encoded, not encrypted. They hold ticked item numbers and one date, and no names or figures.

## Publishing

GitHub Pages serves the repository root from the `main` branch. In the repository settings, choose Pages, then deploy from the `main` branch and the `/ (root)` folder.

## Scope

General information, not legal advice. Fees and forms change, so check GOV.UK before relying on a figure. Checked November 2026.
