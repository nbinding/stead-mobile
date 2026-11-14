# Testing

Every pull request and push to `main` runs these in GitHub Actions.

## Build check

`npm run build` must reproduce the committed `index.html` exactly. If CI fails here, run the build and commit `index.html`.

## Unit tests (`npm test`)

Node's built-in runner, on the logic modules (`src/d81.js`, `src/steps.js`, `src/documents.js`, `src/share.js`), in about a second.

- **Sums:** property equity split between applicant, respondent and children; capital rows A to H; monthly income rows with weekly, fortnightly and yearly conversions.
- **Words:** amounts in British English, including thousands, pence and minus.
- **Saved data:** saves from earlier releases still load (and gain an empty "come back to this" list); bad or hostile data is refused; the current save, the D81 wizard save and stead.mobile ticks are read in the right order.
- **D81 sections:** positions within a section, and done or come-back states.
- **Journey:** steps that tick themselves; the earliest Final Order date (and invalid dates).
- **Documents:** the draft order uses names, dates and roles, and keeps gaps for missing details; Form A suggestions.
- **Key dates:** dates from the order, or 28 days after the Final Order; the calendar file with all-day events and a reminder a week before.
- **Share links:** round trip with the right words; the wrong words are refused.

## Browser tests (`npm run test:e2e`)

Playwright in Chromium at iPhone 13, iPhone SE (320px) and 1280px desktop sizes. `test/serve.mjs` serves the repo.

- **Journey:** the step you're on and one next action; marking a step done moves on and survives a reload; no requests to other hosts.
- **Step pages:** the judge's outcomes, each with its own badge shape; plain-language terms open in place and close with Escape, returning focus.
- **D81:** section progress, focus mode without the tab bar, typing never loses focus, a sticky Continue bar, **Come back to this**, the section summary, and what is saved.
- **Money:** a pounds field read back in words with help with numbers; a sum with its working.
- **Consent order:** the empty state leads to the cover page; the draft shows names and dotted gaps.
- **Your data:** every action in one sheet; focus is trapped and returns on Escape.
- **Sharing:** a link is made, opens in a fresh browser only with the right words, and loads the data.
- **Sealed order:** the keepsake, its dates and the calendar download.
- **Old saves:** a save from the previous release opens unchanged.
- **Worksheet and Form A:** tables, answer sheets and what is left to check, grouped by section.
- **Large text:** the journey, a D81 screen, step 11 and the order at 150% with OpenDyslexic in forest dark: no sideways scrolling.
- **Display settings** apply at once and last for the tab; desktop shows the sidebar and phones the tab bar; every target is at least 40px.
- **axe-core** finds no serious or critical WCAG 2.2 AA violations on every screen above.

```sh
npm ci
npx playwright install chromium   # skip in Claude Code cloud sessions: a matching browser is pre-installed
npm run test:e2e
```
