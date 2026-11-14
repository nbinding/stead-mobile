// The D81 and Stead's saved data: questions, sums, validation and loading. Pure logic, no React, so it can be
// unit tested. All amounts are in pence.

export const KEY = 'stead-v2';
export const OLD_KEY = 'stead-d81-v1';
export const MOBILE_KEY = 'stead-mobile-v1';

export const clone = x => JSON.parse(JSON.stringify(x));
export const empty = () => ({ version: 2, step: 'home', answers: {}, before: { properties: [], items: [], transfers: [] }, after: { properties: [], items: [], transfers: [] }, children: [], reviewed: [], later: [], journey: { done: [], env: [], conf: [] }, formA: {}, order: {} });
export const uid = () => globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);

// Money and dates
export const pennies = v => Math.round((Number(v) || 0) * 100);
export const formatMoney = x => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format((x || 0) / 100);
export const shortMoney = x => formatMoney(x).replace(/\.00$/, '');
export const monthly = (v, f = 'monthly') => Math.round(pennies(v) * ({ monthly: 1, weekly: 52 / 12, fortnightly: 26 / 12, 'four-weekly': 13 / 12, yearly: 1 / 12 }[f] || 1));
export const ukDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''; };

function integerWords(n) {
  const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + integerWords(n % 100) : '');
  for (const [scale, name] of [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1000, 'thousand']])
    if (n >= scale) return integerWords(Math.floor(n / scale)) + ' ' + name + (n % scale ? (n % scale < 100 ? ' and ' : ', ') + integerWords(n % scale) : '');
  return '';
}
/** An amount in pence, in British English words: 42560000 → "four hundred and twenty-five thousand, six hundred pounds". */
export function amountWords(pence) {
  if (!Number.isSafeInteger(pence)) return 'Amount unavailable';
  const n = Math.abs(pence), pounds = Math.floor(n / 100), p = n % 100;
  return (pence < 0 ? 'minus ' : '') + integerWords(pounds) + (pounds === 1 ? ' pound' : ' pounds') + (p ? ' and ' + integerWords(p) + (p === 1 ? ' penny' : ' pence') : '');
}

// People and categories
export const parties = ['Applicant', 'Respondent', 'Children'];
export const cats = [
  ['capital', 'B', 'Savings and other assets', 'Bank balances, savings, investments, ISAs and other capital. Enter only each person’s share.'],
  ['debt', 'D', 'Loans and other debts', 'Credit cards, loans and overdrafts. Leave out mortgages already taken off a property.'],
  ['pension', 'F', 'Pension pots', 'Use the cash equivalent value of each pension, not a yearly retirement income.'],
  ['ppf', 'G', 'Pension Protection Fund', 'Enter the capital value of any PPF compensation.'],
  ['earnings', 'A', 'Take-home pay', 'Pay after tax and National Insurance. If self-employed, use an average from your latest HMRC tax statement.'],
  ['benefits', 'B', 'Benefits', 'State benefits and child benefit.'],
  ['pensionIncome', 'C', 'Pension income', 'Regular pension income and PPF compensation payments.'],
  ['interest', 'D', 'Bank interest', 'Interest received from bank accounts.'],
  ['otherIncome', 'E', 'Other income', 'For example, trust fund or investment income.'],
  ['received', 'J', 'Maintenance from someone else', 'Child maintenance received from someone outside these proceedings.'],
  ['paid', 'K', 'Maintenance to someone else', 'Child or spousal maintenance paid to someone outside these proceedings. Enter a positive amount; we take it off.'],
];
export const isIncome = kind => cats.findIndex(c => c[0] === kind) > 3;

// Splits a property's equity between applicant, respondent and children, giving leftover pence fairly.
export function allocation(net, shares) {
  const raw = shares.map(v => Math.abs(net) * v / 100), values = raw.map(Math.floor);
  const left = Math.abs(net) - values.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, f: v - values[i] })).sort((a, b) => b.f - a.f || a.i - b.i);
  for (let j = 0; j < left; j++) values[order[j % 3].i]++;
  return values.map(v => v * Math.sign(net));
}
/** D81 capital rows A to H for one person (0 applicant, 1 respondent, 2 children). */
export function capital(s, p) {
  const prop = s.properties.map(x => allocation(pennies(x.value) - pennies(x.mortgage), [Number(x.a || 0), Number(x.b || 0), 100 - Number(x.a || 0) - Number(x.b || 0)])[p]);
  const sum = k => s.items.filter(x => x.kind === k && x.person === p).reduce((a, x) => a + pennies(x.amount), 0);
  const A = prop.reduce((a, b) => a + b, 0), B = sum('capital'), C = A + B, D = sum('debt'), E = C - D, F = sum('pension'), G = sum('ppf');
  return { A, B, C, D, E, F, G, H: E + F + G, properties: prop };
}
/** D81 monthly income rows A to M for one person. */
export function income(s, p) {
  const sum = k => s.items.filter(x => x.kind === k && x.person === p).reduce((a, x) => a + monthly(x.amount, x.frequency), 0);
  const t = k => s.transfers.filter(x => x.kind === k).reduce((a, x) => a + (p === Number(x.from) ? -1 : p === 1 - Number(x.from) ? 1 : 0) * monthly(x.amount, x.frequency), 0);
  const A = sum('earnings'), B = sum('benefits'), C = sum('pensionIncome'), D = sum('interest'), E = sum('otherIncome'), F = A + B + C + D + E;
  const G = t('child'), H = t('spousal'), I = G + H, J = sum('received'), K = -sum('paid'), L = J + K;
  return { A, B, C, D, E, F, G, H, I, J, K, L, M: F + I + L };
}

// Questions
const f = (id, label, type = 'text', options, show) => ({ id, label, type, options, show });
const yes = ['Yes', 'No'];
export const questions = [
  { id: 'case', group: 0, ref: 'Cover page', title: 'First, the two of you.', desc: 'Use the names and roles shown on your court paperwork.', fields: [f('applicant', 'Applicant’s full name'), f('respondent', 'Respondent’s full name'), f('court', 'Name of court'), f('case', 'Case number'), f('separate', 'Are you completing separate D81 forms?', 'choice', yes), f('separateReason', 'Why are you completing separate forms?', 'textarea', null, a => a.separate === 'Yes')] },
  { id: 'dates', group: 0, ref: 'Questions 1–2', title: 'A few important dates.', desc: 'These give the court the timeline of your relationship.', fields: [f('married', 'Date of marriage or civil partnership', 'date'), f('cohabited', 'Date you began living together, if earlier (optional)', 'date'), f('separated', 'Date of separation', 'date')] },
  { id: 'orders', group: 0, ref: 'Questions 3–5', title: 'Where are the proceedings?', desc: 'Check the dates against your court documents. You can leave dates blank and come back later.', fields: [f('conditional', 'Date of decree nisi / conditional / nullity / separation order', 'date'), f('interim', 'Is this application only for interim maintenance?', 'choice', yes), f('final', 'Has the decree absolute / final order been granted?', 'choice', yes), f('finalDate', 'Date of final order', 'date', null, a => a.final === 'Yes')] },
  { id: 'family', group: 0, ref: 'Question 6', title: 'Who is in your family?', desc: 'Include children under 18 and any older children who depend on the family.', fields: [f('applicantDob', 'Applicant’s date of birth', 'date'), f('respondentDob', 'Respondent’s date of birth', 'date')], special: 'children' },
  { id: 'agreement', group: 0, ref: 'Question 7', title: 'How did you reach agreement?', desc: 'Choose the route that best describes how you reached the proposed consent order.', fields: [f('agreement', 'Your agreement was reached through', 'choice', ['Discussion between parties', 'Negotiations through solicitors', 'Out-of-court dispute resolution', 'Other']), f('agreementOther', 'Tell us a little more', 'textarea', null, a => a.agreement === 'Other')] },
  { id: 'context', group: 3, ref: 'Question 12', title: 'Is there anything else to explain?', desc: 'For example, a medical condition, a job change, an earlier agreement, a different pension valuation, or a state pension not yet being paid.', fields: [f('otherMatters', 'Are there other matters the court should consider?', 'choice', yes), f('otherDetails', 'Details for the court', 'textarea', null, a => a.otherMatters === 'Yes')] },
  { id: 'reason', group: 3, ref: 'Questions 13–14', title: 'The thinking behind your agreement.', desc: 'Explain the reasons in your own words. If pensions are offset against other assets, explain how you agreed that.', fields: [f('division', 'Why have you agreed this division of assets?', 'textarea'), f('cleanBreak', 'Will maintenance claims be dismissed (a clean break)?', 'choice', yes), f('support', 'How will each of you support yourselves?', 'textarea', null, a => a.cleanBreak === 'Yes')] },
  { id: 'housing', group: 3, ref: 'Question 15', title: 'Where will everyone live?', desc: 'Include the address and whether each person owns or rents. For children who live equally with you both, say so.', fields: [f('applicantHome', 'Applicant: address, and whether they own or rent', 'textarea'), f('respondentHome', 'Respondent: address, and whether they own or rent', 'textarea'), f('childrenHome', 'Each child: name, address, and who they live with (if applicable)', 'textarea')] },
  { id: 'relationships', group: 3, ref: 'Question 16', title: 'Any new relationships?', desc: 'Record each person’s current circumstances and plans.', fields: parties.slice(0, 2).flatMap((p, i) => [f('relationship' + i, p, 'choice', ['No present intention to remarry, form a civil partnership or cohabit', 'In a cohabiting relationship', 'Remarried / formed a civil partnership', 'Intend to remarry / form a civil partnership', 'Intend to cohabit']), f('relationshipDate' + i, p + ': date (if applicable or known)', 'date', null, a => ['Remarried / formed a civil partnership', 'Intend to remarry / form a civil partnership'].includes(a['relationship' + i]))]) },
  { id: 'mortgage', group: 3, ref: 'Questions 17–17.2', title: 'Will a property be transferred?', desc: 'These answers record notice to the mortgage lender and its response.', fields: [f('transferProperty', 'Does the order provide for a transfer of property?', 'choice', yes), f('mortgageNotice', 'Have any mortgage lenders been given notice?', 'choice', yes, a => a.transferProperty === 'Yes'), f('mortgageObjection', 'Has any lender objected within 14 days?', 'choice', yes, a => a.transferProperty === 'Yes')] },
  { id: 'pensionOrders', group: 3, ref: 'Questions 18–22.1', title: 'Does the order involve pensions?', desc: 'Use the proposed order and the pension provider’s letters to answer these.', fields: [f('pensionOrder', 'Are you applying for a pension order?', 'choice', yes), f('pensionTypes', 'Which pension provisions apply?', 'checks', ['Pension sharing', 'PPF compensation sharing', 'Pension attachment', 'PPF compensation attachment'], a => a.pensionOrder === 'Yes'), f('pensionNotice', 'Q19 · Has notice been given to every relevant provider or the PPF Board?', 'choice', yes, a => a.pensionOrder === 'Yes' && a.pensionTypes?.some(x => x.includes('attachment'))), f('pensionObjection', 'Q20 · Has the pension provider objected within 21 days?', 'choice', yes, a => a.pensionOrder === 'Yes' && a.pensionTypes?.includes('Pension attachment')), f('pensionInfo', 'Q21 · Has the pension provider sent the Regulation 4 information?', 'choice', yes, a => a.pensionOrder === 'Yes' && a.pensionTypes?.includes('Pension sharing')), f('pensionPower', 'Q21.1 · Does it show the power to make a pension sharing order?', 'choice', yes, a => a.pensionOrder === 'Yes' && a.pensionTypes?.includes('Pension sharing')), f('ppfInfo', 'Q22 · Has the PPF Board sent the Regulation 5 information?', 'choice', yes, a => a.pensionOrder === 'Yes' && a.pensionTypes?.includes('PPF compensation sharing')), f('ppfPower', 'Q22.1 · Does it show the power to make a compensation sharing order?', 'choice', yes, a => a.pensionOrder === 'Yes' && a.pensionTypes?.includes('PPF compensation sharing'))] },
  { id: 'signing', group: 4, ref: 'Questions 23–24 · Statements of truth', title: 'A final check, together.', desc: 'You both need to read the completed statements. The official D81 must still be signed and dated: these are notes to prepare, not signatures.', fields: parties.slice(0, 2).flatMap((p, i) => [f('read' + i, p + ': have you read the other person’s completed statement?', 'choice', yes), f('signer' + i, p + ': who will sign the statement of truth?', 'choice', [p, 'Litigation friend', 'Solicitor']), f('signerName' + i, p + ': signatory’s full name'), f('firm' + i, p + ': solicitor’s firm and position (if applicable)')]) },
];

/** The D81's five sections. */
export const groups = [
  ['The two of you', 'Names, dates and family'],
  ['Finances today', 'What you each have and earn now'],
  ['After the order', 'Your finances once it takes effect'],
  ['The wider picture', 'Plans and reasons'],
  ['Check and finish', 'Bring everything together'],
];

/** Every D81 screen in order, depending on earlier answers. */
export function steps(d) {
  const q = questions.filter(x => x.group === 0);
  for (const phase of ['before', 'after']) {
    const group = phase === 'before' ? 1 : 2, ref = phase === 'before' ? 8 : 10;
    if (phase === 'after') q.push({ id: 'afterIntro', group, title: 'Now, what changes.', desc: 'Build a separate picture of your finances once the order takes effect. Copy today’s figures as a starting point, then change what will be different.', special: 'copy', ref: 'Questions 10–11' });
    if (d.answers.interim !== 'Yes') {
      q.push({ id: phase + '-property', group, phase, kind: 'property', ref: 'Question ' + ref + ' · A', title: 'Start with property.', desc: 'Add each property once. We take off the mortgage and divide the equity between its owners.' });
      for (const c of cats.slice(0, 4)) q.push({ id: phase + '-' + c[0], group, phase, kind: c[0], ref: 'Question ' + ref + ' · ' + c[1], title: c[2] + '.', desc: c[3] });
    }
    for (const c of cats.slice(4, 9)) q.push({ id: phase + '-' + c[0], group, phase, kind: c[0], ref: 'Question ' + (ref + 1) + ' · ' + c[1], title: c[2] + '.', desc: c[3] });
    q.push({ id: phase + '-maintenance', group, phase, kind: 'maintenance', ref: 'Question ' + (ref + 1) + ' · G–I', title: 'Payments between the two of you.', desc: 'Enter each payment once. We take it from the payer and add it to the person who receives it.' });
    for (const c of cats.slice(9)) q.push({ id: phase + '-' + c[0], group, phase, kind: c[0], ref: 'Question ' + (ref + 1) + ' · ' + c[1], title: c[2] + '.', desc: c[3] });
    q.push({ id: phase + '-notes', group, ref: 'Questions ' + ref + '–' + (ref + 1), title: 'Anything to add to these figures?', desc: 'Explain valuations, anything unusual, and whether outside maintenance is under a formal or informal arrangement.', fields: [f(phase + 'Notes', 'Notes and explanations (optional)', 'textarea')] });
  }
  return [...q, ...questions.filter(x => x.group >= 3), { id: 'review', group: 4, ref: 'Your D81 worksheet', title: 'Your numbers, together.', desc: 'Check the figures and answers before you copy them onto the official D81.', special: 'review' }];
}

/** Where someone is in the D81: the screen, its section, and its place within that section. */
export function position(d, id = d.step) {
  const ss = steps(d), idx = ss.findIndex(x => x.id === id), s = ss[idx];
  if (!s) return null;
  const inGroup = ss.filter(x => x.group === s.group);
  return { idx, s, group: s.group, n: inGroup.indexOf(s) + 1, of: inGroup.length, last: inGroup.at(-1) === s };
}
/** How each screen stands: 'done', 'later' (skipped to come back to) or ''. */
export const screenState = (d, id) => d.reviewed.includes(id) ? 'done' : (d.later || []).includes(id) ? 'later' : '';

// Loading and checking saved data
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function cleanList(x, min, max) { return Array.isArray(x) ? [...new Set(x.filter(n => Number.isInteger(n) && n >= min && n <= max))].sort((a, b) => a - b) : []; }
function cleanStrings(o) {
  const r = {};
  if (o && typeof o === 'object' && !Array.isArray(o)) for (const [k, v] of Object.entries(o)) {
    if (BAD_KEYS.has(k) || Object.keys(r).length >= 80) continue;
    if (typeof v === 'string' && v.length <= 20000) r[k] = v;
    else if (Array.isArray(v) && v.length <= 50 && v.every(x => typeof x === 'string' && x.length <= 500)) r[k] = v;
  }
  return r;
}
const cleanIds = x => Array.isArray(x) ? [...new Set(x.filter(v => typeof v === 'string' && v.length <= 60))].slice(0, 200) : [];

/** Checks data from storage, a backup file or a share link, and returns a clean copy. Throws if it isn't Stead data. */
export function validate(d) {
  if (!d || ![1, 2].includes(d.version) || !d.answers || typeof d.answers !== 'object' || Array.isArray(d.answers) || !Array.isArray(d.children) || !Array.isArray(d.reviewed) || typeof d.step !== 'string') throw Error('This is not a Stead backup file.');
  if (d.answers.pensionTypes !== undefined && !Array.isArray(d.answers.pensionTypes)) throw Error('Invalid pension selections.');
  if (!d.reviewed.every(x => typeof x === 'string') || d.children.length > 100 || !d.children.every(c => c && typeof c.id === 'string' && typeof c.name === 'string' && typeof c.dob === 'string')) throw Error('Invalid family data.');
  for (const phase of ['before', 'after']) {
    const s = d[phase];
    if (!s || !['properties', 'items', 'transfers'].every(k => Array.isArray(s[k]) && s[k].length < 1000)) throw Error('Invalid financial data.');
    for (const p of s.properties) {
      if (!p || typeof p.id !== 'string' || typeof p.address !== 'string') throw Error('Invalid property data.');
      if (![p.value, p.mortgage, p.a, p.b].every(v => v === '' || Number.isFinite(Number(v))) || Number(p.a) < 0 || Number(p.b) < 0 || Number(p.a) + Number(p.b) > 100 || Number(p.value) < 0 || Number(p.mortgage) < 0) throw Error('Invalid property values or shares.');
    }
    for (const x of [...s.items, ...s.transfers])
      if (!x || typeof x.id !== 'string' || !['monthly', 'weekly', 'fortnightly', 'four-weekly', 'yearly'].includes(x.frequency) || !['string', 'number'].includes(typeof x.amount) || !Number.isFinite(Number(x.amount)) || Number(x.amount) < 0 || Number(x.amount) > 1e12) throw Error('Invalid amount.');
    for (const x of s.items) if (typeof x.label !== 'string' || !cats.some(c => c[0] === x.kind) || ![0, 1, 2].includes(x.person)) throw Error('Invalid financial category.');
    for (const x of s.transfers) if (!['child', 'spousal'].includes(x.kind) || ![0, 1].includes(Number(x.from))) throw Error('Invalid transfer.');
  }
  for (const v of Object.values(d.answers)) if (typeof v !== 'string' && !(Array.isArray(v) && v.every(x => typeof x === 'string'))) throw Error('Invalid answer.');
  const j = d.journey || {};
  return { version: 2, step: d.step, answers: cleanStrings(d.answers), before: d.before, after: d.after, children: d.children, reviewed: d.reviewed, later: cleanIds(d.later), journey: { done: cleanList(j.done, 1, 14), env: cleanList(j.env, 0, 6), conf: cleanList(j.conf, 0, 5) }, formA: cleanStrings(d.formA), order: cleanStrings(d.order) };
}

/** True when nothing has been entered anywhere in Stead on this device. */
export function isBlank(x) {
  return !Object.values(x.answers).some(v => Array.isArray(v) ? v.length : v) && !x.reviewed.length && !x.children.length
    && !['before', 'after'].some(p => x[p].properties.length || x[p].items.length || x[p].transfers.length)
    && !x.journey.done.length && !x.journey.env.length && !x.journey.conf.length && !Object.keys(x.formA).length && !Object.keys(x.order).length;
}
/** Ticks from the earlier stead.mobile page, on the same site, carry over once. */
export function fromMobile(m) {
  if (!m || typeof m !== 'object') return null;
  const keys = o => Array.isArray(o) ? o : Object.keys(o || {}).filter(k => o[k]).map(Number);
  const co = m.co ?? m.conditionalOrderDate;
  return { done: cleanList(keys(m.steps ?? m.stepsDone), 1, 14), env: cleanList(keys(m.env ?? m.envelopeTicked), 0, 6), conf: cleanList(keys(m.conf ?? m.beforeFilingTicked), 0, 5), date: typeof co === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(co) ? co : '' };
}
export function withMobile(v, m) {
  if (!m) return v;
  v.journey = { done: m.done, env: m.env, conf: m.conf };
  if (m.date && !v.answers.conditional) v.answers.conditional = m.date;
  return v;
}
/** Reads saved data, carrying over saves from the earlier D81 wizard and stead.mobile. */
export function load(storage = globalThis.localStorage) {
  const mobile = () => { try { return fromMobile(JSON.parse(storage.getItem(MOBILE_KEY))); } catch { return null; } };
  for (const k of [KEY, OLD_KEY]) {
    try {
      const raw = storage.getItem(k);
      if (!raw) continue;
      let v = validate(JSON.parse(raw));
      if (k === KEY && isBlank(v) && storage.getItem(OLD_KEY)) continue;
      if (k === OLD_KEY) v.step = 'home';
      if (!v.journey.done.length && !v.journey.env.length && !v.journey.conf.length) v = withMobile(v, mobile());
      return v;
    } catch { /* try the next one */ }
  }
  return withMobile(empty(), mobile());
}
