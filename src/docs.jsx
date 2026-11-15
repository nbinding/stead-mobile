// Form A and the draft consent order: a few questions each, built from the D81 answers.
import React from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, Printer, Download, PencilLine } from 'lucide-react';
import { Field, MoneyInput, Rich, Gaps, download } from './ui.jsx';
import { formatMoney, pennies, ukDate } from './d81.js';
import { FORM_A_ORDERS, suggestedFormAOrders, formAAnswers, draftOrder, orderText, equityShares } from './documents.js';

/** What comes from the D81. With no names yet, one line and one button rather than a list of blanks. */
function FromD81({ d, go, rows }) {
  const a = d.answers;
  if (!a.applicant || !a.respondent) return <div className="nb-card nb-stack">
    <p className="nb-h3">Your names and dates come from the D81 cover page.</p>
    <p className="nb-small">Fill it in once and they appear here, in Form A and in the consent order.</p>
    <button type="button" className="nb-button nb-button--block nb-button--trailing" onClick={() => go('case')}>Fill in the cover page<ArrowRight aria-hidden="true" /></button>
  </div>;
  return <div className="nb-stack">
    <dl className="st-sheet">{rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    <button type="button" className="nb-text-button st-start" onClick={() => go('case')}><PencilLine aria-hidden="true" />Change these in the D81</button>
  </div>;
}

function Header({ eyebrow, title, soft, lead }) {
  return <><p className="nb-eyebrow">{eyebrow}</p><h1 className="nb-display" tabIndex={-1}>{title} <em>{soft}</em></h1><p className="nb-lead">{lead}</p></>;
}

function Checked({ done, onClick }) {
  return <button type="button" className="nb-button nb-button--secondary nb-button--block" aria-pressed={done} onClick={onClick}><Check aria-hidden="true" />{done ? 'Checked' : 'Mark as checked'}</button>;
}

export function FormA({ d, change, go, notify }) {
  const f = d.formA, a = d.answers;
  const set = (k, v) => change(n => { n.formA[k] = v; });
  const missing = suggestedFormAOrders(d).filter(x => !(f.orders || []).includes(x));
  return <div className="st-page nb-stack">
    <Header eyebrow="Form A · consent application" title="The application notice." soft="Only a few parts." lead="For a consent order you complete only a few parts of Form A. Your names and case details come from the D81, so you enter them once." />
    <FromD81 d={d} go={go} rows={[['Applicant', a.applicant], ['Respondent', a.respondent], ['Court', a.court], ['Case number', a.case]]} />

    <Field field={{ id: 'proceeding', label: 'Which proceedings is this part of?', type: 'choice', options: ['Divorce', 'Dissolution of a civil partnership'] }} value={a.proceeding === 'dissolution' ? 'Dissolution of a civil partnership' : 'Divorce'} onChange={v => change(n => { n.answers.proceeding = v === 'Divorce' ? 'divorce' : 'dissolution'; })} />
    <Field field={{ id: 'askedInDivorce', label: 'Did the divorce or dissolution application say you intended to apply for a financial order?', type: 'choice', options: ['Yes', 'No', 'Not sure'], hint: 'This decides which statement you tick on page 2. Check the application you sent. If you are not sure, Stead assumes yes, which is usual.' }} value={f.askedInDivorce} onChange={v => set('askedInDivorce', v)} />
    <Field field={{ id: 'helpRef', label: 'Help with Fees reference (optional)', type: 'text' }} value={f.helpRef} onChange={v => set('helpRef', v)} />
    {missing.length > 0 && <div className="nb-note"><p><strong>Suggested from your consent order:</strong> {missing.join(', ')}</p><button type="button" className="nb-text-button" onClick={() => change(n => { n.formA.orders = [...new Set([...(n.formA.orders || []), ...missing])]; })}>Add these</button></div>}
    <Field field={{ id: 'orders', label: 'Which orders should Form A list?', type: 'checks', options: FORM_A_ORDERS, hint: 'Tick the orders your consent order makes. Many people also tick the claims it dismisses, so every claim is formally before the court. Ask whoever checks your order.' }} value={f.orders} onChange={v => set('orders', v)} />
    {(f.orders || []).includes('A property adjustment order') && <Field field={{ id: 'mortgagee', label: 'Mortgage lender’s registered name and address', type: 'textarea', hint: 'Use the name and address on your mortgage statement or the title register. Write None if there is no mortgage.' }} value={f.mortgagee} onChange={v => set('mortgagee', v)} />}

    <h2 className="nb-h2 st-section">Your Form A answers</h2>
    <p className="nb-small">Copy these onto the official Form A (05.26), in the same order. Leave the signature and date until the day you post.</p>
    {formAAnswers(d).map(([title, rows]) => <section key={title} className="nb-stack st-print-keep"><h3 className="nb-h3">{title}</h3><dl className="st-sheet">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>)}
    <div className="st-actions">
      <button type="button" className="nb-button nb-button--block" onClick={() => window.print()}><Printer aria-hidden="true" />Print or save as PDF</button>
      <Checked done={f.complete === 'Yes'} onClick={() => { set('complete', f.complete === 'Yes' ? '' : 'Yes'); notify(f.complete === 'Yes' ? 'Form A marked as not checked.' : 'Form A marked as checked. Journey step 7 is now done.'); }} />
    </div>
    <div className="st-row-between"><button type="button" className="nb-text-button" onClick={() => go('home')}><ArrowLeft aria-hidden="true" />Journey</button><button type="button" className="nb-text-button" onClick={() => go('order')}>Consent order<ArrowRight aria-hidden="true" /></button></div>
  </div>;
}

export function Order({ d, change, go, notify }) {
  const o = d.order, a = d.answers;
  const set = (k, v) => change(n => { n.order[k] = v; });
  const props = d.before.properties, prop = props[Number(o.propertyIndex || 0)];
  const keeper = Number(o.keeper || 0), shares = prop ? equityShares(prop) : null, suggest = shares ? shares[1 - keeper] : 0;
  const names = [a.applicant || 'Applicant', a.respondent || 'Respondent'];
  const blocks = draftOrder(d);
  const pick = (id, label, options, value, onChange, hint) => <Field field={{ id, label, type: 'choice', options: options.map(x => x[1]), hint }} value={(options.find(x => x[0] === value) || [])[1]} onChange={v => onChange(options.find(x => x[1] === v)[0])} />;
  const copy = async () => { try { await navigator.clipboard.writeText(orderText(blocks)); notify('Draft order copied.'); } catch { notify('Copy did not work here. Use Download instead.'); } };
  const keeps = o.home === 'transfer' || o.home === 'done';
  return <div className="st-page nb-stack">
    <Header eyebrow="Consent order · draft for checking" title="Your agreement," soft="in the court’s words." lead="Answer a few questions and Stead builds a draft from your D81 in the usual wording. It is a starting point. Have a solicitor check it before you both sign." />
    <FromD81 d={d} go={go} rows={[['Applicant', a.applicant], ['Respondent', a.respondent], ['Married', ukDate(a.married)], ['Separated', ukDate(a.separated)], ['Conditional Order', ukDate(a.conditional)], ['Properties', props.map(p => p.address || 'Unnamed').join(', ')]]} />

    <h2 className="nb-h2 st-section">The home</h2>
    {pick('home', 'What happens to the home?', [['transfer', 'One of us keeps it, and the order transfers it'], ['done', 'One of us has already taken it over'], ['sale', 'It will be sold and the money split'], ['none', 'There is no property to deal with']], o.home, v => set('home', v))}
    {props.length > 1 && o.home && o.home !== 'none' && <Field field={{ id: 'propertyIndex', label: 'Which property?', type: 'choice', options: props.map((p, i) => (i + 1) + '. ' + (p.address || 'Unnamed')) }} value={prop ? (Number(o.propertyIndex || 0) + 1) + '. ' + (prop.address || 'Unnamed') : ''} onChange={v => set('propertyIndex', String(Number(v.split('.')[0]) - 1))} />}
    {o.home && o.home !== 'none' && !prop && <div className="nb-card nb-stack"><p className="nb-h3">The address and figures come from D81 question 8.</p><button type="button" className="nb-button nb-button--block nb-button--trailing" onClick={() => go('before-property')}>Add the property in the D81<ArrowRight aria-hidden="true" /></button></div>}
    {keeps && prop && <>
      {pick('keeper', 'Who keeps it?', [['0', names[0]], ['1', names[1]]], o.keeper || '0', v => set('keeper', v))}
      <Field field={{ id: 'title', label: 'Land Registry title number (optional)', type: 'text', hint: 'On the title register, for example EX123456.' }} value={o.title} onChange={v => set('title', v)} />
      {o.home === 'transfer' && <Field field={{ id: 'transferDate', label: 'Latest date for the transfer (optional)', type: 'date', hint: 'Leave blank for “within 28 days of the final order”. A fixed date acts as a longstop.' }} value={o.transferDate} onChange={v => set('transferDate', v)} />}
      {o.home === 'done' && <Field field={{ id: 'doneDate', label: 'Date the transfer completed', type: 'date' }} value={o.doneDate} onChange={v => set('doneDate', v)} />}
      {pick('releaseMortgage', o.home === 'done' ? 'Has ' + names[1 - keeper] + ' been released from the mortgage?' : 'Should ' + names[keeper] + ' promise to get ' + names[1 - keeper] + ' released from the mortgage?', [['Yes', 'Yes'], ['No', 'No, or there is no mortgage']], o.releaseMortgage || 'Yes', v => set('releaseMortgage', v))}
    </>}
    {o.home === 'sale' && prop && <>
      <Field field={{ id: 'saleA', label: 'Share of the net proceeds for ' + names[0] + ' (%)', type: 'number', hint: names[1] + ' receives the rest: ' + (Math.round((100 - Number(o.saleA || 50)) * 100) / 100) + '%.' }} value={o.saleA || '50'} onChange={v => set('saleA', v)} />
      {pick('saleConduct', 'Who handles the sale?', [['joint', 'Both of us'], ['0', names[0]], ['1', names[1]]], o.saleConduct || 'joint', v => set('saleConduct', v))}
      {pick('salePayer', 'Who pays the mortgage until it sells?', [['0', names[0]], ['1', names[1]], ['both', 'Both, equally']], o.salePayer || '0', v => set('salePayer', v))}
    </>}

    <h2 className="nb-h2 st-section">Money</h2>
    <MoneyInput id="lump" label={keeps ? 'Payment to ' + names[1 - keeper] + ' for their share' : 'Lump sum, if any'} hint="Leave blank if no lump sum is paid." value={o.lump} onChange={v => set('lump', v)} />
    {keeps && prop && suggest > 0 && <div className="nb-sum"><span><span className="nb-sum__label">{names[1 - keeper]}’s share of the equity today</span><span className="nb-sum__working">{formatMoney(pennies(prop.value))} value − {formatMoney(pennies(prop.mortgage))} mortgage, × {(1 - keeper) ? prop.b : prop.a}%</span></span><strong className="nb-sum__total">{formatMoney(suggest)}</strong></div>}
    {keeps && prop && suggest > 0 && pennies(o.lump) !== suggest && <button type="button" className="nb-button nb-button--secondary nb-button--block" onClick={() => set('lump', (suggest / 100).toFixed(2))}>Use {formatMoney(suggest)}</button>}
    {!keeps && pennies(o.lump) > 0 && <>
      {pick('lumpPayer', 'Who pays it?', [['0', names[0]], ['1', names[1]]], o.lumpPayer || '0', v => set('lumpPayer', v))}
      <Field field={{ id: 'lumpDate', label: 'Pay by (optional)', type: 'date', hint: 'Leave blank for “within 28 days of the final order”.' }} value={o.lumpDate} onChange={v => set('lumpDate', v)} />
    </>}
    {pick('pension', 'Will a pension be shared?', [['No', 'No'], ['Yes', 'Yes']], o.pension || 'No', v => set('pension', v), 'Pension sharing needs a separate annex, Form P1, for each pension.')}
    {o.pension === 'Yes' && <>
      {pick('pensionFrom', 'Whose pension is shared?', [['0', names[0]], ['1', names[1]]], o.pensionFrom || '0', v => set('pensionFrom', v))}
      <Field field={{ id: 'pensionProvider', label: 'Pension scheme name and reference', type: 'text' }} value={o.pensionProvider} onChange={v => set('pensionProvider', v)} />
      <Field field={{ id: 'pensionPct', label: 'Percentage to share (%)', type: 'number' }} value={o.pensionPct} onChange={v => set('pensionPct', v)} />
    </>}

    <h2 className="nb-h2 st-section">Everything else</h2>
    {pick('cleanBreak', 'Clean break: end all financial claims between you?', [['Yes', 'Yes'], ['No', 'No, maintenance continues']], a.cleanBreak || 'Yes', v => change(n => { n.answers.cleanBreak = v; }), 'The same answer as D81 question 14. A clean break cannot stop claims for child maintenance.')}
    {a.cleanBreak === 'No' && <div className="nb-note"><p>Stead does not draft maintenance orders. If maintenance continues, have a solicitor draft that part.</p></div>}
    {pick('chattels', 'Have you divided the contents of the home between you?', [['Yes', 'Yes'], ['No', 'Not yet']], o.chattels || 'Yes', v => set('chattels', v))}
    <Field field={{ id: 'extra', label: 'Anything else to record (optional)', type: 'textarea', hint: 'One point per line. Each becomes a numbered recital, for example who keeps each car.' }} value={o.extra} onChange={v => set('extra', v)} />

    <h2 className="nb-h2 st-section">The draft</h2>
    <p className="nb-small">It takes shape as you answer. Dotted gaps are still to fill.</p>
    <article className="nb-document" aria-label="Draft consent order">
      {blocks.map((b, i) => b.t === 'c' ? <p key={i} className="nb-document__centre"><Gaps text={b.text} /></p> : b.t === 'h' ? <h3 key={i} className="nb-document__title">{b.text}</h3> : b.t === 'n' ? <p key={i} className="nb-document__para"><span>{b.n}.</span><span><Gaps text={b.text} /></span></p> : <p key={i}><Gaps text={b.text} /></p>)}
      <p className="nb-small st-footnote">Draft prepared with Stead. Not legal advice. Have a solicitor check it before you sign.</p>
    </article>
    <div className="st-actions">
      <button type="button" className="nb-button nb-button--block" onClick={() => window.print()}><Printer aria-hidden="true" />Print or save as PDF</button>
      <div className="st-row-between"><button type="button" className="nb-text-button" onClick={copy}><Copy aria-hidden="true" />Copy the text</button><button type="button" className="nb-text-button" onClick={() => { download('stead-consent-order-draft-' + new Date().toISOString().slice(0, 10) + '.txt', orderText(blocks)); notify('Draft order downloaded as a text file.'); }}><Download aria-hidden="true" />Download</button></div>
      <Checked done={o.complete === 'Yes'} onClick={() => { set('complete', o.complete === 'Yes' ? '' : 'Yes'); notify(o.complete === 'Yes' ? 'Order marked as not checked.' : 'Order marked as checked. Journey step 5 is now done.'); }} />
    </div>
    <div className="st-row-between"><button type="button" className="nb-text-button" onClick={() => go('forma')}><ArrowLeft aria-hidden="true" />Form A</button><button type="button" className="nb-text-button" onClick={() => go('home')}>Journey<ArrowRight aria-hidden="true" /></button></div>
  </div>;
}
