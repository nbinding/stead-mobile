// Stead's logic without a browser: sums, words, checking saved data, migrations, the order, and key dates.
import test from 'node:test';
import assert from 'node:assert/strict';
import { amountWords, capital, income, monthly, validate, empty, load, steps, position, screenState, KEY, OLD_KEY, MOBILE_KEY } from '../src/d81.js';
import { STEPS, keyDates, icsFor, finalOrderDate, journeyCount, nextStep } from '../src/steps.js';
import { draftOrder, orderText, formAAnswers, suggestedFormAOrders, equityShares } from '../src/documents.js';
import { seal, open, suggestPassphrase, WrongPassphrase } from '../src/share.js';

const memory = items => ({ getItem: k => items[k] ?? null });
const sample = () => {
  const d = empty();
  d.answers = { applicant: 'Sam Taylor', respondent: 'Alex Taylor', court: 'Leeds', married: '2010-06-12', separated: '2025-01-03', conditional: '2026-09-01' };
  d.before.properties.push({ id: 'p', address: '14 Elm Road, Leeds', value: '425000', mortgage: '182400', a: '50', b: '50' });
  d.before.items.push({ id: 'i1', kind: 'capital', person: 0, amount: '1200.50', label: 'Savings', frequency: 'monthly' }, { id: 'i2', kind: 'earnings', person: 1, amount: '500', label: 'Pay', frequency: 'weekly' });
  return d;
};

test('amounts read in British English', () => {
  assert.equal(amountWords(42500000), 'four hundred and twenty-five thousand pounds');
  assert.equal(amountWords(18240000), 'one hundred and eighty-two thousand, four hundred pounds');
  assert.equal(amountWords(100), 'one pound');
  assert.equal(amountWords(1250), 'twelve pounds and fifty pence');
  assert.equal(amountWords(-4000), 'minus forty pounds');
});

test('D81 sums: property equity split, capital and monthly income', () => {
  const d = sample();
  assert.equal(capital(d.before, 0).A, 12130000);
  assert.equal(capital(d.before, 0).H, 12130000 + 120050);
  assert.equal(capital(d.before, 1).A + capital(d.before, 0).A, 24260000);
  assert.equal(monthly('500', 'weekly'), Math.round(50000 * 52 / 12));
  assert.equal(income(d.before, 1).M, monthly('500', 'weekly'));
});

test('saved data from earlier releases still loads, and gains an empty come-back list', () => {
  const old = sample(); delete old.later; old.version = 1;
  const v = validate(old);
  assert.deepEqual(v.later, []);
  assert.equal(v.answers.applicant, 'Sam Taylor');
  const withLater = validate({ ...sample(), later: ['family', 'family', 42, 'x'.repeat(100)] });
  assert.deepEqual(withLater.later, ['family']);
  assert.throws(() => validate({ version: 9 }), /not a Stead backup/);
  assert.throws(() => validate({ ...sample(), answers: { __proto__: null, a: 3 } }), /Invalid answer/);
});

test('load: current save, then the D81 wizard save, then stead.mobile ticks', () => {
  assert.equal(load(memory({ [KEY]: JSON.stringify(sample()) })).answers.applicant, 'Sam Taylor');
  const wizard = { ...sample(), step: 'dates' };
  const fromWizard = load(memory({ [KEY]: JSON.stringify(empty()), [OLD_KEY]: JSON.stringify(wizard) }));
  assert.equal(fromWizard.step, 'home');
  assert.equal(fromWizard.answers.respondent, 'Alex Taylor');
  const mobile = load(memory({ [MOBILE_KEY]: JSON.stringify({ steps: [1, 2], env: [0], conf: [], co: '2026-09-01' }) }));
  assert.deepEqual(mobile.journey.done, [1, 2]);
  assert.equal(mobile.answers.conditional, '2026-09-01');
  assert.equal(load(memory({ [KEY]: '{not json' })).step, 'home');
});

test('D81 sections: positions and come-back states', () => {
  const d = sample();
  const ss = steps(d);
  assert.equal(ss.at(-1).id, 'review');
  const p = position(d, 'agreement');
  assert.equal(p.group, 0); assert.ok(p.last);
  d.later = ['family']; d.reviewed = ['case'];
  assert.equal(screenState(d, 'family'), 'later');
  assert.equal(screenState(d, 'case'), 'done');
  assert.equal(screenState(d, 'dates'), '');
  d.answers.interim = 'Yes';
  assert.ok(!steps(d).some(x => x.id === 'before-property'), 'interim maintenance skips capital');
});

test('the journey ticks steps itself from work done in the tools', () => {
  const d = sample();
  assert.equal(nextStep(d), 0);
  d.journey.done = [1]; d.order = { home: 'transfer' };
  assert.equal(journeyCount(d), 3, 'step 1 by hand, step 3 from the order, step 8 from the Conditional Order date');
  assert.equal(STEPS.length, 14);
  assert.equal(finalOrderDate('2026-09-01').toISOString().slice(0, 10), '2026-10-14');
  assert.equal(finalOrderDate('2026-02-30'), null);
});

test('the draft order uses names and dates, and marks gaps still to fill', () => {
  const d = sample(); d.order = { home: 'transfer', keeper: '1', lump: '121300' };
  const text = orderText(draftOrder(d));
  assert.match(text, /Sam Taylor {2}Applicant/);
  assert.match(text, /married on 12 June 2010/);
  assert.match(text, /The applicant \(Sam Taylor\) shall within 28 days of the final order transfer to the respondent \(Alex Taylor\)/);
  assert.match(text, /\[title number\]/, 'missing title number is a gap');
  assert.match(text, /lump sum of £121,300/);
  assert.deepEqual(equityShares(d.before.properties[0]), [12130000, 12130000, 24260000]);
  assert.deepEqual(suggestedFormAOrders(d), ['A lump sum order', 'A property adjustment order']);
  assert.equal(formAAnswers(d)[0][1][3][1], 'Sam Taylor');
});

test('once sealed: key dates from the order, and a calendar file with reminders', () => {
  const d = sample(); d.answers.sealed = '2026-11-20';
  d.order = { home: 'transfer', keeper: '0', transferDate: '2027-01-15', lump: '40000' };
  const dates = keyDates(d);
  assert.deepEqual(dates.map(x => x.date), ['2026-10-14', '2027-01-15', '2027-01-15']);
  assert.match(dates[1].title, /Home transferred to Sam Taylor/);
  assert.match(dates[2].title, /Lump sum of £40,000 to Alex Taylor/);
  const ics = icsFor(dates, new Date('2026-11-20T10:00:00Z'));
  assert.match(ics, /BEGIN:VCALENDAR\r\n/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 3);
  assert.match(ics, /DTSTART;VALUE=DATE:20270115\r\nDTEND;VALUE=DATE:20270116/);
  assert.match(ics, /TRIGGER:-P7D/);
  d.answers.final = 'Yes'; d.answers.finalDate = '2026-12-01'; d.order.transferDate = '';
  assert.deepEqual(keyDates(d).map(x => x.date), ['2026-12-29', '2026-12-29'], '28 days after the Final Order');
});

test('share links round-trip with the right words and refuse the wrong ones', async () => {
  const words = suggestPassphrase();
  assert.equal(words.split('-').length, 5);
  const code = await seal({ app: 'stead', v: 2, data: sample() }, words, 1000);
  assert.equal((await open(code, words, 1000)).data.answers.applicant, 'Sam Taylor');
  await assert.rejects(open(code, 'wrong-words', 1000), WrongPassphrase);
});
