// The journey's content and rules: the fourteen steps, plain-language terms, the envelope, what the judge can do,
// and the dates the order sets. Pure logic, no React, so it can be unit tested.
import { pennies, shortMoney } from './d81.js';

export const GLOSSARY={
  'consent order':'A financial order where you both agree the terms and a judge approves them. Once sealed it binds you both.',
  'Conditional Order':'The court’s confirmation that it sees no reason you cannot divorce. The court cannot approve a consent order before it.',
  'Final Order':'The document that legally ends the marriage. You can apply six weeks and one day after the Conditional Order.',
  'sealed':'Stamped by the court after a judge approves it. The seal is what makes the order binding.',
  'clean break':'An order that ends all financial claims between you for good, including claims on pensions and on each other’s estate.',
  'Form A':'The notice that asks the court to make a financial order. One of you completes and signs it.',
  'D81':'The statement of information. One joint form showing the judge both of your finances, so they can check the order is fair.',
  'applicant':'For this application, whichever of you completes and signs Form A. It does not have to be the person who applied for the divorce.',
  'transfer of equity':'The legal step that moves a home from joint names into one name. A conveyancer does this with Land Registry form TR1.',
  'statement of truth':'A signed declaration that the facts in a form are true. Signing a false one can be contempt of court.',
  'pension transfer value':'The cash equivalent transfer value, or CETV. The figure your pension provider puts on your pension today. The D81 asks for one per pension.',
  'dismissal paragraphs':'The clauses in the order where each of you gives up future claims against the other. These create the clean break.',
  'mediation meeting':'A Mediation Information and Assessment Meeting, or MIAM. Required before an application where you disagree. Not required for a consent order.',
  'section 25':'The part of the Matrimonial Causes Act 1973 listing what a judge must weigh, including each person’s income, needs, housing and any children.',
  'redemption statement':'A statement from your mortgage lender showing the exact amount needed to repay the mortgage, including any early repayment charge.',
  'longstop date':'A final deadline written into the order. If a transfer or payment has not happened by then, the fallback in the order applies, such as a sale.',
  'pension sharing annex':'Form P1. A separate sheet attached to the order for each pension being shared. Only needed if the order shares a pension.',
  'Help with Fees':'The court scheme that reduces or removes fees for people on a low income or certain benefits. Apply before you pay.',
  'contested case':'Court proceedings where you do not agree and a judge decides after a series of hearings.',
  'set aside':'Cancelled by the court. This happens only for serious reasons such as hidden assets or fraud.'
};

// tool: [view id, button label]; auto(d) ticks the step from work done elsewhere in Stead.
export const STEPS=[
  {phase:'Before the Conditional Order',who:'Both',when:'First',title:'Put your agreement in writing',detail:[
    'Write the agreed terms on one page, then both sign and date it.',
    'Cover the home, savings, debts, pensions, any maintenance and the contents of the home.',
    'A signed agreement does not bind the court, but a judge gives it weight if one of you later changes your mind.']},
  {who:'Both',when:'Start early',title:'Gather your figures',tool:['d81-before','Enter them in the D81'],auto:d=>d.reviewed.some(x=>x.startsWith('before-'))&&['before-property','before-capital','before-debt','before-pension','before-earnings'].filter(x=>!(d.answers.interim==='Yes'&&x!=='before-earnings')).every(x=>d.reviewed.includes(x)),autoLabel:'Today’s figures reviewed in the D81',detail:[
    'A [[pension transfer value]] for every pension you each hold. Providers can take up to three months, so request these first.',
    'A current valuation of any property and a mortgage [[redemption statement]].',
    'Savings, debts and net monthly income for each of you.']},
  {who:'Both',when:'Before drafting',title:'Decide when any transfer or sale happens',tool:['order','Set this in the consent order'],auto:d=>!!d.order?.home,autoLabel:'Chosen in the consent order',detail:[
    'If the order comes first, it tells you what to do and by when. Give it a [[longstop date]] and a fallback, so it still works if a mortgage is refused.',
    'If you transfer or pay before the order, the order records what has already happened. Until it is [[sealed]], either of you can still make a financial claim, so the person paying carries that risk.',
    'Either way, keep proof: the completion statement, the updated title register and bank records of any payment.']},
  {who:'Both',when:'Any time',title:'Update wills and nominations',detail:[
    'Make new wills.',
    'Update pension and death-in-service nominations. These sit outside the divorce, so the order does not change them.']},
  {who:'Both',when:'Once terms are agreed',title:'Draft the consent order',tool:['order','Open the consent order'],auto:d=>d.order?.complete==='Yes',autoLabel:'Marked as checked in the consent order',detail:[
    'Stead builds a draft in the court’s usual wording from your D81 and a few questions.',
    'Include [[dismissal paragraphs]] for each of you if you want a [[clean break]].',
    'A fixed-fee solicitor check of those paragraphs is the one cost worth paying. A mistake there cannot be corrected later.']},
  {who:'Both',when:'Once figures are in',title:'Fill in one joint D81',tool:['welcome','Open the D81'],auto:d=>d.reviewed.includes('review'),autoLabel:'D81 worksheet marked as reviewed',detail:[
    'Use figures that are current on the day you sign the [[D81]], not the figures from when you separated.',
    'Show each person’s position before the order and after it, so the judge can see its effect.',
    'Use the explanation boxes to say why you both consider the split fair, where each of you will live and how each of you will manage.']},
  {who:'Applicant',when:'Once the order is drafted',title:'Complete Form A',tool:['forma','Open Form A'],auto:d=>d.formA?.complete==='Yes',autoLabel:'Marked as checked in Form A',detail:[
    'The [[applicant]] ticks Yes to applying for an order by consent. This removes the [[mediation meeting]] requirement and keeps you on the lower fee.',
    'Tick each type of order your consent order makes or dismisses, so they match.',
    'If the order transfers a mortgaged home, write to the lender about the application and keep proof of posting. The D81 asks whether you have.']},
  {phase:'After the Conditional Order',who:'Applicant',when:'20 weeks after the divorce application',title:'Apply for the Conditional Order',auto:d=>!!d.answers.conditional,autoLabel:'Conditional Order date entered',detail:[
    'Apply online using the link in the court’s reminder email.',
    'The court cannot approve a consent order until the [[Conditional Order]] is granted. Enter its date below when you have it.']},
  {who:'Both',when:'Once it is granted',title:'Finish and sign',detail:[
    'Add the Conditional Order date to the D81 (question 3).',
    'Both sign the consent order and both sign the [[statement of truth]] on the D81, in ink.',
    'The applicant signs [[Form A]]. Date everything on the day you sign.']},
  {who:'Applicant',when:'The same week',title:'Post the application',detail:[
    'Use the envelope checklist below.',
    'Keep your own copies of everything.',
    'If you are on a low income, look at [[Help with Fees]] before you pay.']},
  {who:'Both',when:'The following weeks',title:'Wait for the judge',detail:[
    'There is usually no hearing.',
    'Timings vary with court workload. Allow several weeks.']},
  {who:'Both',when:'If the court writes to you',title:'Answer any questions',detail:[
    'Reply in writing by the date given.',
    'You can amend the order, or keep the terms and explain why you both consider them fair.',
    'Step 11 covers each possible response.']},
  {who:'Applicant',when:'Once the sealed order arrives',title:'Apply for the Final Order',auto:d=>d.answers.final==='Yes',autoLabel:'Final Order recorded in the D81',detail:[
    'The earliest date for the [[Final Order]] is six weeks and one day after the Conditional Order.',
    'Wait until the consent order is [[sealed]]. Finalising the divorce first can remove rights you would otherwise keep, such as pension benefits on death.']},
  {who:'Both',when:'By the dates in the order',title:'Carry out the order',detail:[
    'Complete any [[transfer of equity]], sale, payment or pension share by its deadline.',
    'Close joint accounts and remove each other from bills, insurance and anything else still shared.']}
];

export const OUTCOMES=[
  ['good','Approves','The order is [[sealed]] and binds you both.','Go to step 13.'],
  ['ask','Asks questions','The judge wants a figure explained or a clause reworded. This is the most common response short of approval.','Reply in writing by the date given. You can amend the order, or keep the terms and explain your reasons.'],
  ['hear','Lists a short hearing','The judge wants to hear from you both, usually to check each of you understands what you are giving up.','Both attend and explain the agreement in your own words.'],
  ['no','Refuses','The judge is not satisfied the order is fair, even after your explanation.','Amend and resubmit, or accept that no order will be made.']
];

export const ENVELOPE=[
  ['Form A','Signed by the applicant'],
  ['Form D81','Signed by both of you, with the Conditional Order date completed'],
  ['The draft consent order','Signed by both of you'],
  ['Two photocopies of the signed order',''],
  ['A copy of the Conditional Order',''],
  ['A pension sharing annex for each shared pension','Only if the order shares a pension'],
  ['Your own copies of everything','Kept at home, not posted']
];

export const SETTLE=[
  ['Any split that is not equal has a stated reason','The D81 explanation boxes are the place for it.'],
  ['Every pension is disclosed with a current transfer value','Including pensions neither of you plans to share.'],
  ['Each of you has had the chance to take legal advice','The D81 records whether you did. A judge is less likely to query an order where both did.'],
  ['The Form A boxes match the order','Each order made or dismissed in the draft has its box ticked.'],
  ['Any transfer in the order has a deadline and a fallback','Without them the order is hard to enforce.'],
  ['Child maintenance','It sits outside a clean break and cannot be permanently excluded by the order.']
];

// Earliest Final Order application: six weeks and one day after the Conditional Order.
export function finalOrderDate(iso){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||'');
  if(!m)return null;
  const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));
  if(isNaN(d)||d.getUTCDate()!==+m[3])return null;
  d.setUTCDate(d.getUTCDate()+43);
  return d;
}

export function stepDone(d,i){const s=STEPS[i];return (d.journey?.done||[]).includes(i+1)||!!(s.auto&&s.auto(d))}
export function journeyCount(d){return STEPS.filter((_,i)=>stepDone(d,i)).length}

const iso = d => d.toISOString().slice(0, 10);
const addDays = (isoDate, n) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || ''); if (!m) return null; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); if (isNaN(d)) return null; d.setUTCDate(d.getUTCDate() + n); return iso(d); };

/** The first step that isn't done, or -1 when all fourteen are. */
export const nextStep = d => STEPS.findIndex((_, i) => !stepDone(d, i));

/**
 * What happens next and when, once the order is sealed: dates the order sets (or 28 days after the Final Order
 * when it sets none), and the earliest Final Order date. Only dates Stead can work out are listed.
 */
export function keyDates(d) {
  const a = d.answers, o = d.order || {}, out = [];
  const names = [a.applicant || 'the applicant', a.respondent || 'the respondent'];
  const after28 = a.final === 'Yes' && a.finalDate ? addDays(a.finalDate, 28) : null;
  const keeper = Number(o.keeper || 0);
  const fo = finalOrderDate(a.conditional);
  if (a.sealed && a.final !== 'Yes' && fo) out.push({ date: iso(fo), title: 'Apply for the Final Order', detail: 'The earliest date. The consent order is sealed, so you can go ahead.' });
  if (o.home === 'transfer') {
    const date = o.transferDate || after28;
    if (date) out.push({ date, title: 'Home transferred to ' + names[keeper], detail: o.transferDate ? 'The latest date in the order' : '28 days after the Final Order' });
  }
  if (o.lump && pennies(o.lump) > 0 && o.home !== 'done') {
    const payer = o.home === 'transfer' ? keeper : Number(o.lumpPayer || 0);
    const date = o.home === 'transfer' ? (o.transferDate || after28) : (o.lumpDate || after28);
    if (date) out.push({ date, title: 'Lump sum of ' + shortMoney(pennies(o.lump)) + ' to ' + names[1 - payer], detail: 'Paid by ' + names[payer] });
  }
  return out.sort((x, y) => x.date.localeCompare(y.date));
}

/** A calendar file with each key date as an all-day event and a reminder a week before. */
export function icsFor(dates, stamp = new Date()) {
  const esc = t => String(t).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const day = s => s.replace(/-/g, '');
  const now = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const events = dates.map((x, i) => ['BEGIN:VEVENT', `UID:stead-${day(x.date)}-${i}@stead`, `DTSTAMP:${now}`, `DTSTART;VALUE=DATE:${day(x.date)}`, `DTEND;VALUE=DATE:${day(addDays(x.date, 1))}`, `SUMMARY:${esc(x.title)}`, `DESCRIPTION:${esc(x.detail + '. From your consent order, prepared with Stead.')}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(x.title)}`, 'TRIGGER:-P7D', 'END:VALARM', 'END:VEVENT'].join('\r\n'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Stead//Consent order//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR', ''].join('\r\n');
}
