// Letters and agreements the journey asks you to write, as templates filled from what Stead already knows.
// Gaps still to fill are written [like this]. Pure logic, no React, so it can be unit tested.
//
// Built from the usual shape of these documents in England and Wales: separation agreements (full disclosure,
// a chance of independent legal advice, terms to be put into a consent order), pension scheme divorce valuation
// requests (the Pensions on Divorce etc. (Provision of Information) Regulations 2000), Form A and D81 notice to a
// mortgage lender (Family Procedure Rules 2010, Part 9), and serving a pension sharing order (FPR 9.36).
import { formatMoney, pennies, ukDate } from './d81.js';

const ROLE = ['applicant', 'respondent'];
const nameOf = (d, p) => d.answers[ROLE[p]] || '[' + ROLE[p] + '’s full name]';
const gap = (v, label) => v || '[' + label + ']';
const dateOr = (v, label) => v ? ukDate(v) : '[' + label + ']';
const money = v => formatMoney(pennies(v)).replace('.00', '');
const homeAddress = d => d.before.properties[Number(d.order?.propertyIndex || 0)]?.address || d.before.properties[0]?.address || '';
const pensions = d => d.before.items.filter(x => x.kind === 'pension');
const proceedings = d => d.answers.proceeding === 'dissolution' ? 'dissolution of our civil partnership' : 'divorce';
const marriage = d => d.answers.proceeding === 'dissolution' ? 'civil partnership' : 'marriage';

const letterHead = (from, to) => [
  '[Your full name]\n[Your address]\n[Your email or phone]',
  to,
  '[Date]'
].concat(from ? [from] : []);
const signOff = (who = '[Your full name]') => 'Yours faithfully,\n\n\n' + who;
const join = parts => parts.filter(Boolean).join('\n\n') + '\n';

/** Step 1: the agreed terms on one page, both signed. */
function agreement(d) {
  const a = d.answers, o = d.order || {}, n = [nameOf(d, 0), nameOf(d, 1)];
  const keeper = Number(o.keeper || 0), addr = gap(homeAddress(d), 'address of the home');
  const home = o.home === 'transfer' ? `${addr} will be transferred into the sole name of ${n[keeper]}, who will take over the mortgage and ask the lender to release ${n[1 - keeper]} from it.`
    : o.home === 'done' ? `${addr} has already been transferred into the sole name of ${n[keeper]}.`
      : o.home === 'sale' ? `${addr} will be sold. After the mortgage and sale costs, ${n[0]} receives ${Number(o.saleA || 50)}% and ${n[1]} receives ${100 - Number(o.saleA || 50)}% of the net proceeds.`
        : o.home === 'none' ? 'There is no property to divide.'
          : `[What happens to ${addr}: who keeps it, or whether it is sold and how the money is split]`;
  const lump = o.lump && pennies(o.lump) > 0
    ? `${n[o.home === 'transfer' || o.home === 'done' ? keeper : Number(o.lumpPayer || 0)]} will pay ${n[o.home === 'transfer' || o.home === 'done' ? 1 - keeper : 1 - Number(o.lumpPayer || 0)]} a lump sum of ${money(o.lump)} by [date].`
    : '[Any lump sum: who pays whom, how much and by when. Write None if there is none.]';
  const pension = o.pension === 'Yes'
    ? `${gap(o.pensionPct, 'percentage')}% of ${n[Number(o.pensionFrom || 0)]}’s pension with ${gap(o.pensionProvider, 'pension scheme')} will be shared with ${n[1 - Number(o.pensionFrom || 0)]} by a pension sharing order. Each of us keeps any other pension in our own name.`
    : '[Pensions: each keeps their own, or which pension is shared and by what percentage]';
  return join([
    'AGREEMENT ON OUR FINANCES',
    'Subject to a consent order being approved by the court',
    `Between ${n[0]} and ${n[1]}.\nWe ${a.proceeding === 'dissolution' ? 'registered our civil partnership' : 'married'} on ${dateOr(a.married, 'date')} and separated on ${dateOr(a.separated, 'date')}.`,
    '1. What this is\nThis sets out the financial arrangements we have agreed in our ' + proceedings(d) + '. We intend to ask the court to make a consent order in these terms. Until the court seals that order, this agreement does not stop either of us from making a financial claim.',
    '2. The home\n' + home,
    '3. Money\n' + lump + '\nSavings and investments: [who keeps which account or investment]',
    '4. Debts\n[Who is responsible for each loan, credit card or overdraft]',
    '5. Pensions\n' + pension,
    '6. Maintenance\n' + (a.cleanBreak === 'No' ? '[What maintenance is paid, by whom, how much and for how long]' : 'Neither of us will pay maintenance to the other. We intend a clean break, ending all financial claims between us.'),
    '7. Contents of the home and cars\n' + (o.chattels === 'Yes' ? 'We have already divided the contents of the home between us.' : '[Who keeps which car, furniture and other belongings]'),
    '8. Children\n' + (d.children.some(c => c.name) ? '[Child maintenance and where the children will live. Child maintenance cannot be permanently excluded by a clean break.]' : '[Delete this section if there are no children]'),
    '9. How we reached this\nWe have each told the other about all of our income, property, savings, debts and pensions, as set out in our joint statement of information (form D81). We have each had the chance to take independent legal advice. We each sign this freely and without pressure from the other.',
    '10. Next steps\n[Who will draft the consent order, who will sign Form A, and the date each transfer or payment will happen]',
    `Signed ............................................  ${n[0]}      Date ....................`,
    `Signed ............................................  ${n[1]}      Date ....................`
  ]);
}

/** Step 2: asking a pension provider for a valuation for the divorce. */
function cetv(d) {
  const list = pensions(d);
  return join([
    ...letterHead(null, '[Pension scheme name]\n[Scheme address, or the divorce team’s email]'),
    'Dear Sir or Madam,',
    `Request for a cash equivalent transfer value on ${proceedings(d)}\nMember: [member’s full name]\nDate of birth: [date of birth]\nNational Insurance number: [NI number]\nMembership or policy number: [number]`,
    `I am ${proceedings(d) === 'divorce' ? 'getting divorced' : 'ending my civil partnership'} and we are agreeing a financial settlement in England and Wales. Please send me a cash equivalent transfer value of my benefits in the scheme, calculated for divorce, under the Pensions on Divorce etc. (Provision of Information) Regulations 2000.`,
    `For your records: date of ${marriage(d)} ${dateOr(d.answers.married, 'date')}, date of separation ${dateOr(d.answers.separated, 'date')}.`,
    'As a pension sharing order may be part of our agreement, please also tell me whether the scheme can carry one out, what you charge for doing so, whether you offer the former partner membership of the scheme or only a transfer out, and any other information you provide where a pension sharing order may be made.',
    'If there is a fee for any of this, please tell me before going ahead. If the scheme uses its own form for divorce requests, please send it to me.',
    signOff(),
    list.length ? 'Pensions in your D81 to request: ' + list.map(x => x.label || 'unnamed pension').join(', ') + '.' : ''
  ]);
}

/** Step 2: asking the mortgage lender what is needed to repay the mortgage. */
function redemption(d) {
  return join([
    ...letterHead(null, '[Lender name]\n[Lender address]'),
    'Dear Sir or Madam,',
    `Mortgage account number: [account number]\nProperty: ${gap(homeAddress(d), 'property address')}\nBorrowers: ${nameOf(d, 0)} and ${nameOf(d, 1)}`,
    `We are separating and agreeing how to divide our finances. Please send a redemption statement showing the amount needed to repay this mortgage in full on [a date about four weeks from now], including any early repayment charge and fees, and the daily interest after that date.`,
    'Please also tell us whether the mortgage could be transferred into one borrower’s sole name, and what that person would need to apply.',
    'This is a request for information only. Please do not close or change the account.',
    signOff('[Your full name]\n(Both borrowers can sign, or the lender may accept a request from one of you)')
  ]);
}

/** Step 4: updating who a pension or death-in-service benefit goes to. */
function nomination() {
  return join([
    ...letterHead(null, '[Pension scheme or employer benefits team]\n[Address]'),
    'Dear Sir or Madam,',
    'Member: [your full name]\nDate of birth: [date of birth]\nMembership or policy number: [number]',
    'My circumstances have changed and I am separated from [former partner’s name]. Please treat any earlier expression of wish or nomination in their favour as withdrawn.',
    'Please send me your current nomination or expression of wish form so I can name who should receive any lump sum or benefits on my death. If you accept a letter, my new wishes are:\n[Name, relationship, address, share %]\n[Name, relationship, address, share %]',
    'Please confirm in writing once your records are updated.',
    signOff()
  ]);
}

/** Step 7: telling the mortgage lender about the application, so the D81 can say notice was given. */
function lenderNotice(d) {
  const f = d.formA || {};
  return join([
    ...letterHead(null, f.mortgagee || '[Lender’s registered name and address, as on Form A]'),
    'Dear Sir or Madam,',
    `Notice of an application for a financial order by consent\nProperty: ${gap(homeAddress(d), 'property address')}\nTitle number: ${gap(d.order?.title, 'title number')}\nMortgage account number: [account number]\nCourt case number: ${gap(d.answers.case, 'divorce case number')}`,
    `${nameOf(d, 0)} and ${nameOf(d, 1)} are applying to the Family Court for a financial order by consent in our ${proceedings(d)}. The order we have agreed includes a property adjustment order for the property above, on which you hold a mortgage. A copy of the application (Form A) is enclosed.`,
    'Under the Family Procedure Rules you may, within 14 days of receiving this notice, ask the court for a copy of our statement of information, and tell the court of any objection. If you have no objection, you need do nothing, though a short reply confirming that would help us.',
    'The transfer will not take place until the court has approved the order. We will contact you separately about transferring the mortgage.',
    'Yours faithfully,\n\n\n' + nameOf(d, 0) + '\n\n\n' + nameOf(d, 1),
    'Enclosed: copy of Form A. Keep proof of posting. The D81 (question 17) asks whether notice was given and whether the lender objected within 14 days.'
  ]);
}

/** Step 10: the covering letter in the envelope. */
function coverLetter(d) {
  const a = d.answers, o = d.order || {};
  const items = ['Form A, signed by the applicant', 'Form D81, signed by both of us', 'The draft consent order, signed by both of us, with two copies', 'A copy of the Conditional Order'];
  if (o.pension === 'Yes') items.push('A pension sharing annex (Form P1) for each pension being shared');
  items.push(d.formA?.helpRef ? 'Help with Fees reference ' + d.formA.helpRef : 'The court fee: [cheque payable to “HM Courts and Tribunals Service”, or card details as the court asks]');
  return join([
    ...letterHead(null, 'HMCTS Financial Remedy\nPO Box 12746\nHarlow\nCM20 9QZ'),
    'Dear Sir or Madam,',
    `${nameOf(d, 0)} and ${nameOf(d, 1)}\nCase number: ${gap(a.case, 'divorce case number')}\nApplication for a financial order by consent`,
    `We enclose our application for a consent order. The Conditional Order was made on ${dateOr(a.conditional, 'date')}. ${a.final === 'Yes' ? 'The Final Order was made on ' + dateOr(a.finalDate, 'date') + '.' : 'The Final Order has not yet been made.'}`,
    'Enclosed:\n' + items.map(x => '• ' + x).join('\n'),
    'Please send the sealed order to both of us at the addresses on the forms. Contact details for the applicant are above.',
    signOff(nameOf(d, 0) + ', applicant')
  ]);
}

/** Step 12: answering the judge in writing. */
function reply(d) {
  return join([
    ...letterHead(null, '[The court’s address from its letter]'),
    'Dear Sir or Madam,',
    `${nameOf(d, 0)} and ${nameOf(d, 1)}\nCase number: ${gap(d.answers.case, 'divorce case number')}\nYour letter dated [date of the court’s letter]`,
    'Thank you for your letter. We both write in reply to the questions the judge raised about our draft consent order.',
    '1. [Copy the judge’s first question]\n[Your answer. Give the figure or reason asked for. Say which D81 question or order paragraph it refers to.]',
    '2. [Copy the judge’s next question]\n[Your answer]',
    '[Choose one:]\nWe enclose an amended draft order, signed by both of us, with the changes shown.\nOR\nWe would both like to keep the terms as drafted, for these reasons: [why you both consider the order fair, for example each person’s housing, income and needs].',
    'We both agree with the contents of this letter.',
    'Signed ............................................  ' + nameOf(d, 0) + '      Date ....................',
    'Signed ............................................  ' + nameOf(d, 1) + '      Date ....................'
  ]);
}

/** Step 14: sending the order to the pension provider so the share is carried out. */
function pensionShare(d) {
  const o = d.order || {}, from = Number(o.pensionFrom || 0);
  return join([
    ...letterHead(null, '[Pension scheme name]\n[Address of the divorce or pension sharing team]'),
    'Dear Sir or Madam,',
    `Pension sharing order\nMember (transferor): ${nameOf(d, from)}\nFormer ${d.answers.proceeding === 'dissolution' ? 'civil partner' : 'spouse'} (transferee): ${nameOf(d, 1 - from)}\nScheme and reference: ${gap(o.pensionProvider, 'scheme name and member number')}\nCourt case number: ${gap(d.answers.case, 'divorce case number')}`,
    `The court has made a pension sharing order of ${gap(o.pensionPct, 'percentage')}% against the member’s benefits in your scheme. Please find enclosed:\n• a sealed copy of the consent order\n• the pension sharing annex (Form P1) for this scheme\n• a copy of the Final Order${d.answers.finalDate ? ', made on ' + ukDate(d.answers.finalDate) : ''}`,
    'Please confirm you have everything you need to carry out the share, tell us anything else you require, and let us know the date the share will be implemented. Please also confirm your charges and how they will be paid.',
    'Transferee’s details for the share:\nAddress: [address]\nDate of birth: [date of birth]\nNational Insurance number: [NI number]\n[If transferring out: the receiving scheme’s name, address and reference]',
    signOff(),
    'Check first whether the court has already sent these. The rules require the order and annex to reach the scheme within 7 days of the order or the Final Order, whichever is later.'
  ]);
}

/** Step 14: closing a joint account. */
function jointAccount(d) {
  return join([
    ...letterHead(null, '[Bank or building society]\n[Address]'),
    'Dear Sir or Madam,',
    `Joint account in the names of ${nameOf(d, 0)} and ${nameOf(d, 1)}\nSort code: [sort code]\nAccount number: [account number]`,
    'We have separated, and the court has approved our financial arrangements. We both ask you to close this account, cancel any direct debits, standing orders and cards on it, and pay the closing balance as follows:\n[Name, sort code and account number, and the amount or share each person receives]',
    'If the account is overdrawn, [who will clear the overdraft, and by when].',
    'Please confirm in writing when the account is closed.',
    'Yours faithfully,\n\n\n' + nameOf(d, 0) + '\n\n\n' + nameOf(d, 1)
  ]);
}

/** Step 14: moving the mortgage into one name after a transfer. */
function lenderTransfer(d) {
  const o = d.order || {}, keeper = Number(o.keeper || 0);
  return join([
    ...letterHead(null, d.formA?.mortgagee || '[Lender name and address]'),
    'Dear Sir or Madam,',
    `Mortgage account number: [account number]\nProperty: ${gap(homeAddress(d), 'property address')}\nTitle number: ${gap(o.title, 'title number')}`,
    `The court has made a consent order${d.answers.sealed ? ' on ' + ukDate(d.answers.sealed) : ''} in our ${proceedings(d)}. It provides for the property to be transferred into the sole name of ${nameOf(d, keeper)}${o.transferDate ? ' by ' + ukDate(o.transferDate) : ''}. A copy of the sealed order is enclosed.`,
    `Please treat this as an application for a transfer of equity, and for ${nameOf(d, 1 - keeper)} to be released from all liability under the mortgage. Please tell us what you need from ${nameOf(d, keeper)} to assess the mortgage in their sole name, and the name of the conveyancer you will deal with.`,
    'Yours faithfully,\n\n\n' + nameOf(d, 0) + '\n\n\n' + nameOf(d, 1)
  ]);
}

/**
 * Templates for each journey step, by step number. `when` hides one that doesn't apply to this couple.
 * `why` says what the template is for and when to use it.
 */
export const TEMPLATES = {
  1: [{ id: 'agreement', title: 'Our agreement on finances', why: 'One page you both sign. It is filled from your D81 and consent order answers, so it grows as you use Stead.', build: agreement }],
  2: [
    { id: 'cetv', title: 'Letter asking a pension provider for a valuation', why: 'Send one for every pension either of you holds, including ones you do not plan to share. Providers have up to three months to reply. Many schemes have their own form, so check their website first.', build: cetv },
    { id: 'redemption', title: 'Letter asking the lender for a redemption statement', why: 'Shows exactly what it would cost to pay off the mortgage, and whether it could move into one name.', build: redemption, when: d => d.before.properties.some(p => pennies(p.mortgage) > 0) || !d.before.properties.length }
  ],
  4: [{ id: 'nomination', title: 'Letter updating a pension nomination', why: 'For pensions, death-in-service and life cover. Most schemes ask you to use their own form; this letter asks for it and withdraws the old nomination meanwhile.', build: nomination }],
  7: [{ id: 'lender-notice', title: 'Notice of the application to the mortgage lender', why: 'Only if the order transfers a home with a mortgage. Send it with a copy of Form A, keep proof of posting, and wait 14 days before you post the application.', build: lenderNotice, when: d => d.order?.home !== 'none' && d.order?.home !== 'sale' }],
  10: [{ id: 'cover', title: 'Covering letter to the court', why: 'Goes on top of the envelope’s contents, so the court can see everything is there.', build: coverLetter }],
  12: [{ id: 'reply', title: 'Reply to the judge’s questions', why: 'Answer each question in turn, both sign, and send it by the date in the court’s letter.', build: reply }],
  14: [
    { id: 'pension-share', title: 'Letter sending the pension sharing order', why: 'So the scheme can carry out the share. Without it, a share can go unimplemented for years.', build: pensionShare, when: d => d.order?.pension === 'Yes' },
    { id: 'lender-transfer', title: 'Letter asking the lender to move the mortgage into one name', why: 'Starts the transfer of equity and the release from the mortgage.', build: lenderTransfer, when: d => d.order?.home === 'transfer' || !d.order?.home },
    { id: 'joint-account', title: 'Letter closing a joint account', why: 'Both of you sign. Send one per account.', build: jointAccount }
  ]
};

/** The templates for a step (1 to 14) that apply to this couple, built from what they have entered. */
export function templatesFor(d, step) {
  return (TEMPLATES[step] || []).filter(t => !t.when || t.when(d)).map(t => ({ id: t.id, title: t.title, why: t.why, text: t.build(d) }));
}

/** Plain text for copying or downloading, with a closing note. */
export const templateText = text => text + '\nTemplate from Stead. Not legal advice. Check it suits your situation before you send or sign it.\n';
