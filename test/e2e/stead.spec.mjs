// Stead in a browser, at iPhone 13, iPhone SE (320px) and desktop sizes.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const tabs = page => page.locator('.st-tabbar:visible, .st-sidebar:visible').first();
async function openApp(page, { data, prefs } = {}) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(([d, p]) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      if (d) localStorage.setItem('stead-v2', JSON.stringify(d));
      if (p) sessionStorage.setItem('stead-accessibility-session-v1', JSON.stringify(p));
    }
  }, [data || null, prefs || null]);
  await page.goto('index.html');
  await page.evaluate(() => document.fonts.ready);
  return errors;
}
async function area(page, name) {
  const t = tabs(page);
  await t.getByRole('button', { name: new RegExp('^\\d*\\s*(your |consent )?' + name, 'i') }).click(); // the sidebar says “Your journey”, “Consent order”
}
async function noSideways(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(await page.evaluate(() => innerWidth)).toBe(page.viewportSize().width);
}
// Sticky bars overlap whatever scrolls under them, so axe's target-size check would fail on whatever happens to be
// beneath them at that moment. They're unstuck while axe runs; their own tap sizes are checked in the last test.
async function axe(page) {
  await page.addStyleTag({ content: '.st-tabbar, .st-dock { position: static !important; }' });
  const r = await new AxeBuilder({ page }).options({ preload: false }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
}
const saved = { version: 2, step: 'home', answers: { applicant: 'Sam Taylor', respondent: 'Alex Taylor', conditional: '2026-09-01' }, before: { properties: [{ id: 'p1', address: '14 Elm Road, Leeds', value: '425000', mortgage: '182400', a: '50', b: '50' }], items: [], transfers: [] }, after: { properties: [], items: [], transfers: [] }, children: [], reviewed: ['case'], journey: { done: [1], env: [], conf: [] }, formA: {}, order: {} };

test('journey: the step you are on, one next action, and no requests to other hosts', async ({ page }) => {
  const external = [];
  page.on('request', r => { if (!r.url().startsWith('http://localhost:4175/') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) external.push(r.url()); });
  const errors = await openApp(page);
  await expect(page.locator('html')).toHaveAttribute('data-nb-app', 'stead');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Put your agreement in writing.');
  await expect(page.getByText('Step 1 of 14 · Before the Conditional Order')).toBeVisible();
  await expect(page.locator('.nb-timeline [aria-current="step"]')).toContainText('Put your agreement in writing');
  await page.getByRole('button', { name: 'Mark as done' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gather your figures.');
  await expect(page.getByText('1 of 14 steps done')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gather your figures.');
  await noSideways(page);
  expect(await axe(page)).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('a step page carries its reference: the judge’s outcomes by shape, terms explained in place', async ({ page }) => {
  const errors = await openApp(page);
  await page.getByRole('button', { name: 'Show all 14 steps' }).click();
  await page.getByRole('button', { name: 'Wait for the judge' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wait for the judge.');
  const outcomes = page.getByRole('list', { name: 'What the judge can do' });
  await expect(outcomes.locator('li')).toHaveCount(4);
  await expect(outcomes.locator('.nb-badge--solid, .nb-badge--ring, .nb-badge--dashed')).toHaveCount(3); // the fourth is plain
  const term = page.getByRole('button', { name: 'section 25' });
  await term.click();
  await expect(term).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.nb-term-pop:visible')).toContainText('Matrimonial Causes Act 1973');
  await page.keyboard.press('Escape');
  await expect(page.locator('.nb-term-pop:visible')).toHaveCount(0);
  await expect(term).toBeFocused();
  await page.getByRole('button', { name: /Next · 12/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Answer any questions.');
  await noSideways(page);
  expect(await axe(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('steps that need writing offer a template filled from what you entered, to copy or download', async ({ page }) => {
  const errors = await openApp(page, { data: saved });
  await page.getByRole('button', { name: 'Show all 14 steps' }).click();
  await page.getByRole('button', { name: 'Put your agreement in writing' }).click();
  await expect(page.getByRole('heading', { name: 'A template for this step' })).toBeVisible();
  await page.getByText('Our agreement on finances').click();
  const doc = page.getByRole('article', { name: 'Our agreement on finances' });
  await expect(doc).toContainText('Between Sam Taylor and Alex Taylor');
  await expect(doc).toContainText('14 Elm Road, Leeds');
  await expect(doc.locator('.nb-gap').first()).toBeVisible();
  const file = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  expect((await file).suggestedFilename()).toMatch(/^stead-agreement-\d{4}-\d{2}-\d{2}\.txt$/);
  await page.getByRole('button', { name: /Next · 02/ }).click();
  await expect(page.getByRole('heading', { name: 'Templates for this step' })).toBeVisible();
  await page.getByText('Letter asking a pension provider for a valuation').click();
  await expect(page.getByRole('article', { name: 'Letter asking a pension provider for a valuation' })).toContainText('Pensions on Divorce etc. (Provision of Information) Regulations 2000');
  await noSideways(page);
  expect(await axe(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('D81: sections, a sticky Continue, come back to this, and a section summary', async ({ page }) => {
  const errors = await openApp(page);
  await area(page, 'D81');
  await page.getByRole('button', { name: /get started/ }).click();
  await expect(page.getByText('Section 1 of 5 · The two of you')).toBeVisible();
  await expect(page.locator('.st-tabbar')).toHaveCount(0); // focus mode
  const name = page.getByLabel('Applicant’s full name');
  await name.pressSequentially('Sam Taylor');
  await expect(name).toBeFocused(); // typing never loses focus
  await page.getByLabel('Respondent’s full name').fill('Alex Taylor');
  const dock = page.locator('.st-dock');
  expect(await dock.evaluate(el => getComputedStyle(el).position)).toBe('sticky');
  for (const step of ['Continue', 'Continue', 'Continue', 'Come back to this', 'Continue']) await page.getByRole('button', { name: step, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('That’s section 1 done.');
  await expect(page.getByRole('img', { name: 'Come back to this' })).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole('button', { name: /Start section 2/ }).click();
  await expect(page.getByText(/Section 2 of 5 · Finances today/)).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('stead-v2')));
  expect(stored.later).toEqual(['family']);
  expect(stored.answers.applicant).toBe('Sam Taylor');
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('money: a pounds field reads the amount back in words with help with numbers, and the sum shows its working', async ({ page }) => {
  await openApp(page, { data: { ...saved, step: 'before-property' }, prefs: { size: 100, font: 'default', theme: 'system', numberHelp: true, spacing: false, motion: false } });
  await page.getByLabel('Value today').fill('425000');
  await expect(page.getByText('£425,000.00: four hundred and twenty-five thousand pounds')).toBeVisible();
  await expect(page.locator('.nb-sum__total')).toHaveText('£242,600.00');
  await expect(page.locator('.nb-sum__working')).toHaveText('£425,000.00 − £182,400.00');
  await expect(page.locator('html')).toHaveAttribute('data-nb-number-help', 'true');
  expect(await axe(page)).toEqual([]);
});

test('consent order: an empty state that leads somewhere, then a draft with dotted gaps', async ({ page }) => {
  const errors = await openApp(page);
  await area(page, 'Order');
  await expect(page.getByText('Your names and dates come from the D81 cover page.')).toBeVisible();
  await expect(page.getByText('Not entered yet')).toHaveCount(0);
  await page.getByRole('button', { name: 'Fill in the cover page' }).click();
  await page.getByLabel('Applicant’s full name').fill('Sam Taylor');
  await page.getByLabel('Respondent’s full name').fill('Alex Taylor');
  await page.getByRole('button', { name: 'Save and leave' }).click();
  await area(page, 'Order');
  await expect(page.locator('.st-sheet')).toContainText('Sam Taylor');
  const doc = page.getByRole('article', { name: 'Draft consent order' });
  await expect(doc).toContainText('Sam Taylor  Applicant');
  await expect(doc.locator('.nb-gap').first()).toBeVisible();
  await noSideways(page);
  expect(await axe(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('your data: one sheet for sharing, backups and saved information; focus returns', async ({ page }) => {
  await openApp(page);
  const opener = page.getByRole('button', { name: 'Your data' });
  await opener.click();
  const sheet = page.getByRole('dialog', { name: 'Your data' });
  for (const n of ['Share with the other person', 'Save a backup file', 'Open a backup file', 'About your saved information', 'How Stead fits together']) await expect(sheet.getByRole('button', { name: new RegExp(n) })).toBeVisible();
  expect(await axe(page)).toEqual([]);
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.querySelector('[role=dialog]').contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('sharing in two steps: the link opens on another device only with the words', async ({ page, browser }) => {
  await openApp(page, { data: saved });
  await page.getByRole('button', { name: 'Your data' }).click();
  await page.getByRole('button', { name: /Share with the other person/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Share with the other person' });
  await expect(sheet.getByRole('button', { name: 'Send the link' })).toBeEnabled({ timeout: 20000 });
  const words = await sheet.locator('.nb-words').textContent();
  expect(words.split('-')).toHaveLength(5);
  await sheet.getByText('Show the link').click();
  const link = await sheet.getByRole('textbox', { name: 'Link' }).inputValue();
  expect(link).toMatch(/^http:\/\/localhost:4175\/#k=[\w-]+$/);
  expect(await axe(page)).toEqual([]);

  const other = await (await browser.newContext()).newPage();
  await other.goto(link);
  const dialog = other.getByRole('dialog', { name: 'Open shared progress' });
  await dialog.getByLabel('The words that open it').fill('wrong-words-here');
  await dialog.getByRole('button', { name: 'Open it' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Those words don’t open it', { timeout: 20000 });
  await dialog.getByLabel('The words that open it').fill(words);
  await dialog.getByRole('button', { name: 'Open it' }).click();
  await expect(other.getByRole('status').last()).toContainText('Loaded from the shared link', { timeout: 20000 });
  expect(await other.evaluate(() => JSON.parse(localStorage.getItem('stead-v2')).answers.respondent)).toBe('Alex Taylor');
  expect(new URL(other.url()).hash).toBe('');
});

test('a sealed order becomes a keepsake with its dates and a calendar file', async ({ page }) => {
  await openApp(page, { data: { ...saved, answers: { ...saved.answers, sealed: '2026-11-20' }, order: { home: 'transfer', keeper: '0', transferDate: '2027-01-15' } } });
  await expect(page.getByRole('heading', { name: /Consent order sealed on Friday,? 20 November 2026/ })).toBeAttached();
  await expect(page.locator('.nb-dates li')).toHaveCount(2);
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Add these dates to my calendar' }).click()]);
  expect(file.suggestedFilename()).toBe('stead-key-dates.ics');
  expect(await axe(page)).toEqual([]);
});

test('saves from the previous release open unchanged', async ({ page }) => {
  const old = { ...saved, step: 'dates', journey: { done: [1, 4], env: [0, 1], conf: [2] } };
  delete old.later;
  const errors = await openApp(page, { data: old });
  await expect(page.getByLabel('Date of marriage or civil partnership')).toBeVisible();
  await page.getByRole('button', { name: 'Save and leave' }).click();
  await area(page, 'Journey');
  await expect(page.getByText(/3 of 14 steps done/)).toBeVisible(); // 1 and 4 by hand, 8 from the Conditional Order date
  expect(errors).toEqual([]);
});

for (const [name, setup] of [['journey', async () => {}], ['a D81 screen', async page => { await area(page, 'D81'); await page.getByRole('button', { name: /Continue|get started/ }).click(); }], ['step 11', async page => { await page.getByRole('button', { name: 'Show all 14 steps' }).click(); await page.getByRole('button', { name: 'Wait for the judge' }).click(); }], ['the consent order', async page => area(page, 'Order')]]) {
  test(`${name} holds up at 150% text with OpenDyslexic, in forest dark`, async ({ page }) => {
    const errors = await openApp(page, { data: saved, prefs: { size: 150, font: 'dyslexic', theme: 'dark', numberHelp: true, spacing: true, motion: true } });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await setup(page);
    await noSideways(page);
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('display settings apply at once and last for the tab', async ({ page }) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Display' }).click();
  const dialog = page.getByRole('dialog', { name: 'Display and accessibility' });
  await dialog.getByRole('button', { name: /Largest/ }).click();
  await dialog.getByRole('button', { name: 'Forest dark' }).click();
  await dialog.getByRole('checkbox', { name: /Help with numbers/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--nb-text-scale').trim())).toBe('1.5');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-nb-number-help', 'true');
});

test('desktop shows the sidebar; phones show the tab bar', async ({ page }) => {
  await openApp(page);
  const desktop = page.viewportSize().width >= 1000;
  await expect(page.locator('.st-sidebar')).toBeVisible({ visible: desktop });
  await expect(page.locator('.st-tabbar')).toBeVisible({ visible: !desktop });
  const targets = await page.$$eval('.nb-button, .nb-chip, .nb-text-button, .nb-tabbar__item, .nb-nav__item, .st-link', els => els.filter(e => e.offsetParent).map(e => [e.textContent.trim(), e.getBoundingClientRect()]).filter(([, r]) => r.height < 39.5).map(([t, r]) => `${t} ${Math.round(r.height)}`));
  expect(targets).toEqual([]);
});

test('the D81 worksheet and Form A: tables, answer sheets and what is left to check', async ({ page }) => {
  const errors = await openApp(page, { data: { ...saved, step: 'review', later: ['family'] } });
  await expect(page.getByRole('table').first()).toBeVisible();
  await expect(page.getByText(/screens still to check/)).toBeVisible();
  await expect(page.getByRole('list', { name: 'Still to check' }).getByRole('button', { name: /The two of you/ })).toContainText('1 you chose to come back to');
  await noSideways(page);
  expect(await axe(page)).toEqual([]);
  await page.getByRole('button', { name: 'Save and leave' }).click();
  await area(page, 'Form A');
  await expect(page.getByRole('heading', { name: 'Your Form A answers' })).toBeVisible();
  await expect(page.locator('.st-sheet').first()).toContainText('Sam Taylor');
  await page.getByRole('checkbox', { name: 'A lump sum order' }).check();
  await noSideways(page);
  expect(await axe(page)).toEqual([]);
  expect(errors).toEqual([]);
});
