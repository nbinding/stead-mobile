import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, ArrowLeft, Check, Plus, Trash2, Download, Upload, LockKeyhole, Info, Route, Calculator, FileText, Scale, X, Printer, Settings2, Share2, Copy, RefreshCw, ChevronRight, CircleHelp } from 'lucide-react';
import { toast, prefs as nbPrefs, terms } from './ds/js/nb.js';
import { KEY, clone, empty, uid, load, validate, isBlank, fromMobile, withMobile, steps, groups, questions, cats, isIncome, parties, capital, income, pennies, monthly, formatMoney, position, screenState } from './d81.js';
import { STEPS, journeyCount } from './steps.js';
import { Journey, StepPage } from './journey.jsx';
import { FormA, Order } from './docs.jsx';
import { Field, MoneyInput, Money, Overlay, Prefs, Status, download } from './ui.jsx';
import { seal, open as openSealed, openLegacy, suggestPassphrase, WrongPassphrase } from './share.js';

const HOME_URL = 'https://nbinding.github.io/stead-mobile/';
const PREF_KEY = 'stead-accessibility-session-v1';
const AREAS = [['home', 'Your journey', '14 steps, start to finish', Route], ['welcome', 'D81 statement', 'Your finances, before and after', Calculator], ['forma', 'Form A', 'The application notice', FileText], ['order', 'Consent order', 'Your agreement, in court wording', Scale]];
const TAB_NAMES = { home: 'Journey', welcome: 'D81', forma: 'Form A', order: 'Order' };
const FREQUENCIES = ['monthly', 'weekly', 'fortnightly', 'four-weekly', 'yearly'];
const EXPLAIN = { weekly: 'Weekly amount × 52 weeks, divided by 12 months.', fortnightly: 'Fortnightly amount × 26 payments, divided by 12 months.', 'four-weekly': 'Four-weekly amount × 13 payments, divided by 12 months.', yearly: 'Yearly amount divided by 12 months.', monthly: 'Already a monthly amount.' };

function readPrefs() {
  const p = nbPrefs.read(PREF_KEY);
  return { ...p, size: [100, 115, 130, 150].includes(p.size) ? p.size : 100, font: ['default', 'sans', 'dyslexic'].includes(p.font) ? p.font : 'default', theme: ['system', 'light', 'dark'].includes(p.theme) ? p.theme : 'system' };
}

/** Which area a screen belongs to, for the tab bar and the sidebar. */
const areaOf = step => step === 'home' || /^step-\d+$/.test(step) ? 'home' : step === 'forma' || step === 'order' ? step : 'welcome';

function Brand({ onClick, large }) {
  return <button type="button" className={'nb-brand st-brand' + (large ? ' nb-brand--lg' : '')} onClick={onClick} aria-label="Stead, your journey"><span className="nb-brand__letter" aria-hidden="true">s</span><span aria-hidden="true">stead<span className="nb-brand__dot">.</span></span></button>;
}

function DisplaySettings({ prefs, setPrefs }) {
  const set = (k, v) => setPrefs(p => ({ ...p, [k]: v }));
  const options = (key, label, items) => <fieldset className="nb-field"><legend className="nb-field__label">{label}</legend><div className="nb-options">{items.map(([v, t, s]) => <button type="button" key={v} aria-pressed={prefs[key] === v} onClick={() => set(key, v)}>{t}{s && <small>{s}</small>}</button>)}</div></fieldset>;
  return <>
    <p className="nb-small">Make it comfortable for you. Settings last for this tab. Your answers are saved separately.</p>
    {options('size', 'Text size', [[100, 'Standard', '100%'], [115, 'Large', '115%'], [130, 'Larger', '130%'], [150, 'Largest', '150%']])}
    {options('font', 'Reading font', [['default', 'Original'], ['sans', 'Plain sans'], ['dyslexic', 'OpenDyslexic']])}
    {options('theme', 'Appearance', [['system', 'Use device'], ['light', 'Light'], ['dark', 'Forest dark']])}
    {[['numberHelp', 'Help with numbers', 'Amounts in words, wider spacing between digits and how each sum is worked out.'], ['spacing', 'More breathing room', 'More line height, letter and word spacing.'], ['motion', 'Reduce motion', 'No animations or transitions.']].map(([k, t, s]) => <label className="nb-toggle" key={k}><input type="checkbox" checked={!!prefs[k]} onChange={e => set(k, e.target.checked)} /><span className="nb-toggle__text"><strong>{t}</strong><small>{s}</small></span></label>)}
    <div className="nb-card"><p className="nb-small">Reading preview: your monthly income</p><p className="nb-h2"><Money value={123456} /></p></div>
  </>;
}

function Amount({ x, phase, keyName = 'items', frequency, update }) {
  return <div className="st-amount">
    <MoneyInput id={'amt-' + x.id} label="Amount" required value={x.amount} onChange={v => update(phase, keyName, x.id, 'amount', v)} />
    {frequency && <div className="nb-field"><label className="nb-field__label" htmlFor={'freq-' + x.id}>How often</label><select className="nb-select" id={'freq-' + x.id} value={x.frequency || 'monthly'} onChange={e => update(phase, keyName, x.id, 'frequency', e.target.value)}>{FREQUENCIES.map(f => <option key={f}>{f}</option>)}</select></div>}
  </div>;
}
function Entry({ title, onRemove, removeLabel, children }) {
  return <div className="nb-card nb-stack st-entry"><div className="st-row-between"><strong>{title}</strong><button type="button" className="nb-icon-button" aria-label={removeLabel} onClick={onRemove}><Trash2 aria-hidden="true" /></button></div>{children}</div>;
}
function AddButton({ onClick, children }) {
  return <button type="button" className="nb-button nb-button--secondary nb-button--block" onClick={onClick}><Plus aria-hidden="true" />{children}</button>;
}
/** The D81's five sections as bars; the current one is taller. */
function Bars({ d, ss, current }) {
  return <ol className="nb-stepper nb-stepper--bars" aria-label="D81 sections">{groups.map(([g], gi) => { const done = ss.filter(x => x.group === gi).every(x => d.reviewed.includes(x.id)); return <li key={g} data-state={done ? 'done' : undefined} aria-current={gi === current ? 'step' : undefined}><span className="nb-sr-only">{g}{done ? ', done' : ''}</span></li>; })}</ol>;
}
function FocusTop({ go, saved }) {
  return <div className="st-row-between st-focus-top"><button type="button" className="nb-text-button st-plain" onClick={() => go('welcome')}><X aria-hidden="true" />Save and leave</button><span className="nb-small">{saved}</span></div>;
}

function App() {
  const [prefs, setPrefs] = useState(readPrefs);
  useEffect(() => { nbPrefs.apply(prefs, PREF_KEY); }, [prefs]);
  useEffect(() => terms(document), []);
  const [d, setD] = useState(load);
  const [share, setShare] = useState(null), [unlock, setUnlock] = useState({ code: '', pass: '', busy: false, error: '' });
  const [incoming, setIncoming] = useState(null), [saved, setSaved] = useState('Saved on this device'), [person, setPerson] = useState(0), [dialog, setDialog] = useState(null);
  const file = useRef(), form = useRef(), dRef = useRef(d);
  dRef.current = d;
  const notify = toast;
  const ss = steps(d), pos = position(d);
  const stepMatch = /^step-(\d+)$/.exec(d.step), summaryMatch = /^summary-(\d)$/.exec(d.step);
  const view = d.step === 'home' || d.step === 'forma' || d.step === 'order' ? d.step : stepMatch && +stepMatch[1] >= 1 && +stepMatch[1] <= STEPS.length ? 'step' : summaryMatch ? 'summary' : pos ? 'd81' : 'welcome';
  const area = areaOf(view === 'step' ? d.step : view === 'summary' || view === 'd81' ? 'welcome' : view);
  const focusMode = view === 'd81' || view === 'summary';
  const jDone = journeyCount(d);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)); setSaved('Saved on this device'); } catch { setSaved('This browser can’t save. Save a backup file instead.'); } }, [d]);
  const change = fn => setD(prev => { const n = clone(prev); fn(n); return n; });
  const answer = (k, v) => change(n => { n.answers[k] = v; });
  const go = id => { change(n => { n.step = id; }); setPerson(0); window.scrollTo({ top: 0, behavior: 'instant' }); setTimeout(() => { if (!document.activeElement?.matches('input, textarea, select')) document.querySelector('main h1')?.focus(); }, 40); };
  const openTool = id => id === 'd81-before' ? go(ss.find(x => x.id.startsWith('before-') && !d.reviewed.includes(x.id))?.id || ss.find(x => x.id.startsWith('before-')).id) : go(id);
  const label = p => p < 2 ? (d.answers[p ? 'respondent' : 'applicant'] || parties[p]) : 'Children';
  const update = (phase, key, id, field, value) => change(n => { n[phase][key].find(x => x.id === id)[field] = value; });
  const remove = (phase, key, id) => change(n => { n[phase][key] = n[phase][key].filter(x => x.id !== id); });

  const exportJSON = () => {
    const data = { app: 'stead', ...d, exportedAt: new Date().toISOString(), calculated: { before: parties.map((_, p) => ({ capital: capital(d.before, p), income: income(d.before, p) })), after: parties.map((_, p) => ({ capital: capital(d.after, p), income: income(d.after, p) })), units: 'GBP pence' } };
    download('stead-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(data, null, 2), 'application/json');
    notify('Your backup file has been downloaded.');
  };
  const summary = x => { const st = steps(x), pct = Math.round(st.filter(y => x.reviewed.includes(y.id)).length / st.length * 100), who = [x.answers.applicant, x.answers.respondent].filter(Boolean).join(' and '); return journeyCount(x) + ' of ' + STEPS.length + ' journey steps, D81 ' + pct + '% checked' + (who ? ' · ' + who : ''); };
  // Anything arriving from a link or a file: load it straight away on a blank device, otherwise ask first.
  const offer = (x, from) => {
    const cur = dRef.current; x.step = 'home';
    if (JSON.stringify({ ...x, step: '' }) === JSON.stringify({ ...cur, step: '' })) { notify('That ' + from + ' matches what is already on this device.'); return; }
    if (isBlank(cur)) { setD(x); setDialog(null); notify('Loaded from the ' + from + '. It is now saved on this device.'); return; }
    setIncoming({ x, from }); setDialog('incoming');
  };

  // Sharing: a link locked with a few words, sent in two separate messages.
  const shareBase = () => /^https?:$/.test(location.protocol) ? location.origin + location.pathname.replace(/index\.html$/, '') : HOME_URL;
  const lock = async pass => {
    setShare(v => ({ ...v, pass, busy: true, link: '', error: '' }));
    try { const code = await seal({ app: 'stead', v: 2, data: { ...dRef.current, step: 'home' } }, pass); setShare(v => v && v.pass === pass ? { ...v, busy: false, link: shareBase() + '#k=' + code } : v); }
    catch { setShare(v => ({ ...v, busy: false, error: 'This browser could not lock a link. Save a backup file instead.' })); }
  };
  const openShare = () => { setShare({ pass: '', link: '', busy: true, error: '', own: '' }); setDialog('share'); lock(suggestPassphrase()); };
  const sendLink = async () => {
    const text = 'Here’s our Stead file with the figures so far. I’ll send the words to open it separately.';
    if (typeof navigator.share === 'function') { try { await navigator.share({ title: 'Stead', text, url: share.link }); return; } catch (e) { if (e?.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text + '\n\n' + share.link); notify('Message and link copied. Send the words separately.'); } catch { notify('Copy did not work here. Open “Show the link” and copy it.'); }
  };
  const copyWords = async () => { try { await navigator.clipboard.writeText(share.pass); notify('Words copied. Send them in a different app, or say them.'); } catch { notify('Copy did not work here. Read the words out instead.'); } };
  const tryUnlock = async () => {
    setUnlock(v => ({ ...v, busy: true, error: '' }));
    try {
      const payload = await openSealed(unlock.code, unlock.pass.trim());
      if (!payload || payload.app !== 'stead') throw Error('not stead');
      const x = validate(payload.data);
      setUnlock({ code: '', pass: '', busy: false, error: '' }); setDialog(null); offer(x, 'shared link');
    } catch (e) { setUnlock(v => ({ ...v, busy: false, error: e instanceof WrongPassphrase ? 'Those words don’t open it. Check them with the person who sent the link.' : 'This link is damaged or incomplete. Ask for a new one.' })); }
  };
  useEffect(() => {
    const read = () => {
      const m = /^#([ks])=(.+)$/.exec(location.hash || ''); if (!m) return;
      try { history.replaceState(null, '', location.pathname + location.search); } catch { /* keep going */ }
      if (m[1] === 'k') { setUnlock({ code: m[2], pass: '', busy: false, error: '' }); setDialog('unlock'); return; }
      try { const t = openLegacy(m[2]), mob = fromMobile({ steps: t.steps, env: t.env, conf: t.conf, co: t.date }); offer(withMobile(clone(dRef.current), mob), 'shared link'); }
      catch { notify('That share link is damaged or incomplete. Ask for a new one.'); }
    };
    read(); window.addEventListener('hashchange', read); return () => window.removeEventListener('hashchange', read);
  }, []);

  // D81: Continue checks the screen and moves on; the end of a section shows its summary.
  const afterScreen = () => { const p = position(dRef.current); return p.last && p.group < 3 ? 'summary-' + p.group : ss[Math.min(p.idx + 1, ss.length - 1)].id; };
  const next = () => {
    const s = pos.s, financial = s.phase ? d[s.phase] : null;
    if (!form.current?.reportValidity()) return;
    if (s.kind === 'property' && financial.properties.some(p => Number(p.a) + Number(p.b) > 100)) { notify('Ownership shares can’t add up to more than 100%.'); return; }
    const to = afterScreen();
    change(n => { if (!n.reviewed.includes(s.id)) n.reviewed.push(s.id); n.later = (n.later || []).filter(x => x !== s.id); });
    go(to);
  };
  const later = () => { const s = pos.s, to = afterScreen(); change(n => { if (!n.reviewed.includes(s.id) && !(n.later || []).includes(s.id)) n.later = [...(n.later || []), s.id]; }); go(to); };

  function Table({ phase, type }) {
    const rows = type === 'capital' ? [['A', 'Property equity'], ['B', 'Other capital'], ['C', 'Gross capital · A + B'], ['D', 'Liabilities'], ['E', 'Net capital · C − D'], ['F', 'Pensions'], ['G', 'PPF compensation'], ['H', 'Total capital · E + F + G']] : [['A', 'Earned income'], ['B', 'State benefits'], ['C', 'Pension / PPF income'], ['D', 'Bank interest'], ['E', 'Other income'], ['F', 'Income subtotal'], ['G', 'Child maintenance between you'], ['H', 'Spousal maintenance between you'], ['I', 'Between you, subtotal'], ['J', 'Outside maintenance received'], ['K', 'Outside maintenance paid'], ['L', 'Outside maintenance subtotal'], ['M', 'Net monthly income · F + I + L']];
    return <div className="st-table-wrap" tabIndex={0} role="region" aria-label={'Question ' + (phase === 'before' ? (type === 'capital' ? 8 : 9) : (type === 'capital' ? 10 : 11))}><table className="st-table">
      <caption>Q{phase === 'before' ? (type === 'capital' ? 8 : 9) : (type === 'capital' ? 10 : 11)} · {type === 'capital' ? 'Capital' : 'Monthly income'} · {phase === 'before' ? 'Today' : 'After the order'}</caption>
      <thead><tr><th scope="col">Form row</th>{parties.map((p, i) => <th scope="col" key={p}>{label(i)}</th>)}</tr></thead>
      <tbody>{rows.map(([k, l]) => <tr key={k} className={(['H', 'E'].includes(k) && type === 'capital') || k === 'M' ? 'st-total' : ''}><th scope="row">{k} · {l}</th>{parties.map((_, p) => <td key={p}><Money value={(type === 'capital' ? capital : income)(d[phase], p)[k]} /></td>)}</tr>)}</tbody>
    </table></div>;
  }

  function Review() {
    const missing = ss.filter(x => x.id !== 'review' && !d.reviewed.includes(x.id));
    const blank = questions.flatMap(q => (q.fields || []).filter(f => (!f.show || f.show(d.answers)) && !String(f.label).includes('optional') && !String(f.label).includes('if applicable') && !d.answers[f.id]).map(f => f.label));
    return <div className="nb-stack">
      <div className="nb-note"><p><strong>{missing.length ? missing.length + ' screens still to check.' : 'Every screen checked.'}</strong> Blank sections count as £0.00, so make sure they mean “none” and not “not known yet”. This worksheet doesn’t replace the signed D81 or consent order.</p></div>
      {missing.length > 0 && <ul className="nb-list" aria-label="Still to check">{groups.map(([g], gi) => { const left = missing.filter(x => x.group === gi); if (!left.length) return null; const later = left.filter(x => screenState(d, x.id) === 'later').length; return <li key={g} className="nb-list__row"><button type="button" className="nb-list__main st-plain-button" onClick={() => go(left[0].id)}><strong>{g}</strong><small>{left.length} {left.length === 1 ? 'screen' : 'screens'} to check{later ? ' · ' + later + ' you chose to come back to' : ''}</small></button><ChevronRight aria-hidden="true" /></li>; })}</ul>}
      {blank.length > 0 && <details className="nb-disclosure"><summary>{blank.length} unanswered questions</summary><ul className="st-bullets">{blank.map(x => <li key={x}>{x}</li>)}</ul></details>}
      <div className="st-actions">
        <button type="button" className="nb-button nb-button--block" onClick={() => window.print()}><Printer aria-hidden="true" />Print or save as PDF</button>
        <button type="button" className="nb-button nb-button--secondary nb-button--block" disabled={missing.length > 0} aria-pressed={d.reviewed.includes('review')} onClick={() => { change(n => { if (!n.reviewed.includes('review')) n.reviewed.push('review'); }); notify('Worksheet marked as checked. Sign the official D81 itself.'); }}><Check aria-hidden="true" />{d.reviewed.includes('review') ? 'Worksheet checked' : 'Mark the worksheet as checked'}</button>
      </div>
      <div className="st-print-heading"><h2>D81 preparation worksheet</h2><p>Prepared {new Date().toLocaleDateString('en-GB')} · Draft for review · All amounts in pounds</p><p>Blank amounts appear as £0.00. Check these mean none. This worksheet is not a signed D81.</p></div>
      {['before', 'after'].map(phase => <section key={phase} className="nb-stack">
        <h2 className="nb-h2 st-section">{phase === 'before' ? 'Today' : 'After the order'}</h2>
        {d.answers.interim !== 'Yes' && Table({ phase, type: 'capital' })}
        {Table({ phase, type: 'income' })}
        {d[phase].properties.map((p, i) => <section className="nb-stack st-print-keep" key={p.id}>
          <h3 className="nb-h3">Property {i + 1}{i > 1 ? ' (additional sheet)' : ''}</h3>
          <p className="st-pre">{p.address || 'Address not entered'}</p>
          <dl className="nb-answers">{[['Market value', pennies(p.value)], ['Mortgage still owed', pennies(p.mortgage)], ['Equity after the mortgage', pennies(p.value) - pennies(p.mortgage)], [`Applicant’s share (${p.a}%)`, capital(d[phase], 0).properties[i]], [`Respondent’s share (${p.b}%)`, capital(d[phase], 1).properties[i]], [`Children’s share (${Math.round((100 - Number(p.a) - Number(p.b)) * 100) / 100}%)`, capital(d[phase], 2).properties[i]]].map(([n, v]) => <div className="nb-answers__row" key={n}><dt>{n}</dt><dd><Money value={v} /></dd></div>)}</dl>
        </section>)}
        {(d[phase].items.length > 0 || d[phase].transfers.length > 0) && <details className="nb-disclosure" open><summary>Itemised {phase === 'before' ? 'current' : 'proposed'} figures</summary>
          <dl className="nb-answers">{d[phase].items.map(x => <div className="nb-answers__row" key={x.id}><dt><span>{x.label || 'Unnamed item'}<small>{label(x.person)} · {cats.find(c => c[0] === x.kind)?.[2]}{isIncome(x.kind) ? ' · ' + x.frequency : ''}</small></span></dt><dd><Money value={pennies(x.amount)} /></dd></div>)}
            {d[phase].transfers.map(x => <div className="nb-answers__row" key={x.id}><dt><span>{x.kind === 'child' ? 'Child' : 'Spousal'} maintenance<small>Paid by {label(Number(x.from))} to {label(1 - Number(x.from))} · {x.frequency}</small></span></dt><dd><Money value={pennies(x.amount)} /></dd></div>)}</dl></details>}
        {d.answers[phase + 'Notes'] && <p className="st-pre nb-small">{d.answers[phase + 'Notes']}</p>}
      </section>)}
      <h2 className="nb-h2 st-section">Your other answers</h2>
      {questions.map(q => <section className="nb-stack st-print-keep" key={q.id}><h3 className="nb-h3">{q.ref} · {q.title}</h3>
        <dl className="st-sheet">{q.fields.filter(f => !f.show || f.show(d.answers)).map(f => <div key={f.id}><dt>{f.label}</dt><dd>{Array.isArray(d.answers[f.id]) ? d.answers[f.id].join(', ') : d.answers[f.id] || 'Not answered'}</dd></div>)}
          {q.id === 'family' && d.children.map((c, i) => <div key={c.id}><dt>Child {i + 1}</dt><dd>{c.name || 'Name not entered'} · {c.dob || 'Date not entered'}</dd></div>)}</dl></section>)}
      <div className="nb-note"><p><strong>Next: complete and sign the official form.</strong> Copy these answers onto D81 (04.25), with any additional sheets. Complete questions 23 and 24 and both statements of truth on the form itself.</p></div>
      <div className="st-row-between"><button type="button" className="nb-text-button" onClick={() => go('forma')}>Form A<ArrowRight aria-hidden="true" /></button><button type="button" className="nb-text-button" onClick={() => go('order')}>Consent order<ArrowRight aria-hidden="true" /></button></div>
    </div>;
  }

  function Screen() {
    const { s, group, n, of } = pos, financial = s.phase ? d[s.phase] : null, inc = isIncome(s.kind);
    return <form ref={form} className="st-page nb-stack st-screen" noValidate={false} onSubmit={e => { e.preventDefault(); next(); }}>
      <FocusTop go={go} saved={saved} />
      <div className="nb-stack st-tight"><p className="nb-small"><strong className="st-ink">Section {group + 1} of {groups.length} · {groups[group][0]}</strong> · {s.special === 'review' ? 'the worksheet' : 'screen ' + n + ' of ' + of}</p><Bars d={d} ss={ss} current={group} /></div>
      <p className="nb-eyebrow">{s.ref}{s.phase ? ' · ' + (s.phase === 'before' ? 'Today' : 'After the order') : ''}</p>
      <h1 className="nb-display st-question" tabIndex={-1}>{s.title}</h1>
      <p className="nb-lead">{s.desc}</p>

      {s.fields?.filter(f => !f.show || f.show(d.answers)).map(f => <Field key={f.id} field={f} value={d.answers[f.id]} onChange={v => answer(f.id, v)} />)}

      {s.special === 'children' && <section className="nb-stack" aria-labelledby="kids-title"><h2 className="nb-h3" id="kids-title">Children of the family</h2>
        {d.children.map((c, i) => <Entry key={c.id} title={'Child ' + (i + 1)} removeLabel={'Remove child ' + (i + 1)} onRemove={() => change(x => { x.children = x.children.filter(y => y.id !== c.id); })}>
          <Field field={{ id: 'name' + c.id, label: 'Full name', type: 'text' }} value={c.name} onChange={v => change(x => { x.children[i].name = v; })} />
          <Field field={{ id: 'dob' + c.id, label: 'Date of birth', type: 'date' }} value={c.dob} onChange={v => change(x => { x.children[i].dob = v; })} />
        </Entry>)}
        <AddButton onClick={() => change(x => { x.children.push({ id: uid(), name: '', dob: '' }); })}>Add a child</AddButton>
        <p className="nb-small">No dependent children? Continue without adding one. More than four go on an additional sheet.</p></section>}

      {s.special === 'copy' && <div className="nb-card nb-stack"><p className="nb-h3">A starting point, already worked out.</p><p className="nb-small">Copying brings over every current asset, debt, income and payment. You check each category next.</p><button type="button" className="nb-button nb-button--block" onClick={() => setDialog('copy')}>Copy today’s figures</button><p className="nb-small">Or continue and enter the figures from scratch. After a sale, record the proceeds as savings and remove the sold property, so it isn’t counted twice.</p></div>}

      {s.kind === 'property' && <>
        <div className="nb-note"><p>Add the full value and the mortgage. Use current ownership shares for today, and proposed shares for after the order. If current shares aren’t agreed, the form says to divide equally.</p></div>
        {financial.properties.map((p, i) => <Entry key={p.id} title={'Property ' + (i + 1)} removeLabel={'Remove property ' + (i + 1)} onRemove={() => remove(s.phase, 'properties', p.id)}>
          <div className="nb-field"><label className="nb-field__label" htmlFor={p.id + 'address'}>Address</label><input className="nb-input" required id={p.id + 'address'} value={p.address} onChange={e => update(s.phase, 'properties', p.id, 'address', e.target.value)} /></div>
          <div className="st-two">
            <MoneyInput id={p.id + 'value'} label="Value today" required value={p.value} onChange={v => update(s.phase, 'properties', p.id, 'value', v)} />
            <MoneyInput id={p.id + 'mortgage'} label="Mortgage still owed" required value={p.mortgage} onChange={v => update(s.phase, 'properties', p.id, 'mortgage', v)} />
            {[['a', 'Applicant’s share (%)'], ['b', 'Respondent’s share (%)']].map(([k, l]) => <div className="nb-field" key={k}><label className="nb-field__label" htmlFor={p.id + k}>{l}</label><input className="nb-input" id={p.id + k} required type="number" inputMode="decimal" min="0" max="100" step="0.01" value={p[k]} onChange={e => update(s.phase, 'properties', p.id, k, e.target.value)} /></div>)}
          </div>
          <div className="nb-sum"><span><span className="nb-sum__label">Equity after the mortgage</span><span className="nb-sum__working">{formatMoney(pennies(p.value))} − {formatMoney(pennies(p.mortgage))}</span></span><strong className="nb-sum__total">{formatMoney(pennies(p.value) - pennies(p.mortgage))}</strong></div>
          {Number(p.a) + Number(p.b) > 100 ? <p className="nb-field__error" role="alert">The shares add up to more than 100%.</p> : <p className="nb-small">Children’s share: {Math.round((100 - Number(p.a) - Number(p.b)) * 100) / 100}%. Any share left over goes to the children.</p>}
        </Entry>)}
        <AddButton onClick={() => change(x => { x[s.phase].properties.push({ id: uid(), address: '', value: '', mortgage: '', a: '50', b: '50' }); })}>Add a property</AddButton>
        <p className="nb-small">No property? Continue to record none.</p>
      </>}

      {s.kind && s.kind !== 'property' && s.kind !== 'maintenance' && <>
        <div className="nb-field"><span className="nb-field__label" id="whose">Whose?</span><div className="nb-segmented" role="radiogroup" aria-labelledby="whose">{parties.map((p, i) => <button type="button" role="radio" key={p} aria-checked={person === i} onClick={() => setPerson(i)}>{label(i)}</button>)}</div></div>
        {financial.items.filter(x => x.kind === s.kind && x.person === person).map(x => <Entry key={x.id} title={x.label || cats.find(c => c[0] === s.kind)?.[2]} removeLabel={'Remove ' + (x.label || 'this item')} onRemove={() => remove(s.phase, 'items', x.id)}>
          <Field field={{ id: 'label-' + x.id, label: 'What is it?', type: 'text' }} value={x.label} onChange={v => update(s.phase, 'items', x.id, 'label', v)} />
          <Amount x={x} phase={s.phase} frequency={inc} update={update} />
          {inc && <p className="nb-small">{formatMoney(monthly(x.amount, x.frequency))} a month{prefs.numberHelp ? '. ' + EXPLAIN[x.frequency] : ''}</p>}
        </Entry>)}
        {!financial.items.some(x => x.kind === s.kind && x.person === person) && <p className="nb-small">Nothing added for {label(person)} yet. Add each one separately and we total them for you.</p>}
        <AddButton onClick={() => change(x => { x[s.phase].items.push({ id: uid(), kind: s.kind, person, amount: '', label: '', frequency: 'monthly' }); })}>Add {s.kind === 'debt' ? 'a debt' : s.kind === 'pension' ? 'a pension' : 'one for ' + label(person)}</AddButton>
        <dl className="nb-answers" aria-label="Totals">{parties.map((p, i) => <div className="nb-answers__row" key={p}><dt>{label(i)}{inc ? ', a month' : ''}</dt><dd><Money value={financial.items.filter(x => x.kind === s.kind && x.person === i).reduce((a, x) => a + (inc ? monthly(x.amount, x.frequency) : pennies(x.amount)), 0)} /></dd></div>)}</dl>
        <p className="nb-small">Check all three people. If nobody has anything here, just continue.</p>
      </>}

      {s.kind === 'maintenance' && <>
        {financial.transfers.map(x => <Entry key={x.id} title="Regular payment" removeLabel="Remove this payment" onRemove={() => remove(s.phase, 'transfers', x.id)}>
          <div className="st-two">
            <div className="nb-field"><label className="nb-field__label" htmlFor={'kind-' + x.id}>Type</label><select className="nb-select" id={'kind-' + x.id} value={x.kind} onChange={e => update(s.phase, 'transfers', x.id, 'kind', e.target.value)}><option value="child">Child maintenance</option><option value="spousal">Spousal maintenance</option></select></div>
            <div className="nb-field"><label className="nb-field__label" htmlFor={'from-' + x.id}>Paid by</label><select className="nb-select" id={'from-' + x.id} value={x.from} onChange={e => update(s.phase, 'transfers', x.id, 'from', Number(e.target.value))}><option value={0}>{label(0)}</option><option value={1}>{label(1)}</option></select></div>
          </div>
          <Amount x={x} phase={s.phase} keyName="transfers" frequency update={update} />
          <p className="nb-small">{label(Number(x.from))} pays {label(1 - Number(x.from))} {formatMoney(monthly(x.amount, x.frequency))} a month.</p>
        </Entry>)}
        <AddButton onClick={() => change(x => { x[s.phase].transfers.push({ id: uid(), kind: 'child', from: 0, amount: '', frequency: 'monthly' }); })}>Add a payment</AddButton>
        <p className="nb-small">No maintenance between you? Continue without adding one.</p>
      </>}

      {s.special === 'review' && Review()}

      {s.special !== 'review' && <div className="nb-dock st-dock">
        <button type="submit" className="nb-button nb-button--block nb-button--trailing">Continue<ArrowRight aria-hidden="true" /></button>
        <div className="st-row-between">
          <button type="button" className="nb-text-button st-plain" onClick={() => go(pos.idx ? ss[pos.idx - 1].id : 'welcome')}><ArrowLeft aria-hidden="true" />Back</button>
          <button type="button" className="nb-text-button" onClick={later}>Come back to this</button>
        </div>
      </div>}
    </form>;
  }

  function Summary() {
    const g = +summaryMatch[1], screens = ss.filter(x => x.group === g), nextFirst = ss.find(x => x.group === g + 1);
    const total = (phase, p) => phase ? capital(d[phase], p).H : 0;
    return <div className="st-page nb-stack">
      <FocusTop go={go} saved={saved} />
      <div className="nb-stack st-tight"><p className="nb-small"><strong className="st-ink">Section {g + 1} of {groups.length} done</strong></p><Bars d={d} ss={ss} current={-1} /></div>
      <h1 className="nb-display" tabIndex={-1}>{groups[g][0]}. <em>That’s section {g + 1} done.</em></h1>
      <p className="nb-small">Check these before moving on. Choose any screen to change it.</p>
      <dl className="nb-answers">{screens.map(x => { const st = screenState(d, x.id); return <div className="nb-answers__row" key={x.id}><dt><Status small state={st} n="·" label={st === 'done' ? 'Checked' : st === 'later' ? 'Come back to this' : 'Not checked yet'} /><span>{x.title.replace(/\.$/, '')}{st === 'later' && <small>You chose to come back to this</small>}</span></dt><dd><button type="button" className="nb-text-button" onClick={() => go(x.id)}>{st === 'done' ? 'Change' : 'Answer'}</button></dd></div>; })}</dl>
      {(g === 1 || g === 2) && d.answers.interim !== 'Yes' && <div className="nb-stack">{[0, 1].map(p => <div className="nb-sum" key={p}><span><span className="nb-sum__label">{label(p)}: total capital</span><span className="nb-sum__working">{g === 1 ? 'Today' : 'After the order'} · D81 row H</span></span><strong className="nb-sum__total">{formatMoney(total(g === 1 ? 'before' : 'after', p))}</strong></div>)}</div>}
      {nextFirst && <button type="button" className="nb-button nb-button--block nb-button--trailing" onClick={() => go(nextFirst.id)}>Start section {g + 2}: {groups[g + 1][0]}<ArrowRight aria-hidden="true" /></button>}
    </div>;
  }

  function Welcome() {
    const firstOpen = ss.find(x => !d.reviewed.includes(x.id));
    const started = ss.some(x => d.reviewed.includes(x.id));
    return <div className="st-page nb-stack">
      <p className="nb-eyebrow">The D81, at your pace</p>
      <h1 className="nb-display" tabIndex={-1}>A clearer picture. <em>A steadier next step.</em></h1>
      <p className="nb-lead">Make sense of your finances, one question at a time. We do the sums.</p>
      <button type="button" className="nb-button nb-button--block nb-button--trailing" onClick={() => go(firstOpen?.id || 'review')}>{started ? 'Continue where you left off' : 'Let’s get started'}<ArrowRight aria-hidden="true" /></button>
      <ol className="nb-timeline" aria-label="D81 sections">{groups.map(([g, desc], gi) => { const all = ss.filter(x => x.group === gi), done = all.filter(x => d.reviewed.includes(x.id)).length, st = done === all.length ? 'done' : done ? 'now' : ''; return <li className={'nb-timeline__item' + (st === 'done' ? ' nb-timeline__item--done' : '')} key={g}><Status state={st} n={gi + 1} label={'Section ' + (gi + 1) + (st === 'done' ? ', done' : '')} /><span><button type="button" className="nb-timeline__title st-link" onClick={() => go(all.find(x => !d.reviewed.includes(x.id))?.id || all[0].id)}>{g}</button><span className="nb-timeline__detail">{desc} · {done} of {all.length} screens</span></span></li>; })}</ol>
      <div className="nb-note"><p><strong>You don’t need every answer to begin.</strong> Have your mortgage balance, pension valuations and recent payslips handy. You can come back to anything.</p></div>
      <button type="button" className="nb-text-button st-start" onClick={() => file.current.click()}><Upload aria-hidden="true" />Open a backup file</button>
      <p className="nb-small">Based on form D81 (04.25). A preparation tool, not legal advice.</p>
    </div>;
  }

  const shareWords = share?.pass || '';
  return <Prefs.Provider value={prefs}>
    <a className="nb-skip" href="#main">Skip to content</a>
    <div className={'st-shell' + (focusMode ? ' st-focus' : '')}>
      <aside className="nb-sidebar st-sidebar">
        <Brand large onClick={() => go('home')} />
        <p className="nb-sidebar__label">A little clarity, one step at a time</p>
        <ul className="nb-nav" aria-label="Stead">{AREAS.map(([id, name, desc, Icon], i) => {
          const ok = [jDone === STEPS.length, d.reviewed.includes('review'), d.formA.complete === 'Yes', d.order.complete === 'Yes'][i];
          return <li key={id}><button type="button" className="nb-nav__item" aria-current={area === id ? 'page' : undefined} onClick={() => go(id)}><span className="nb-nav__num">{ok ? <Check size={16} aria-label="Done" /> : String(i + 1).padStart(2, '0')}</span><span><strong>{name}</strong><small>{desc}</small></span></button></li>;
        })}</ul>
        <div className="st-grow" />
        <p className="nb-small st-row-between"><span>Your journey</span><span>{jDone} of {STEPS.length}</span></p>
        <progress className="nb-progress" value={jDone} max={STEPS.length} aria-label="Journey steps done">{jDone} of {STEPS.length}</progress>
        <p className="nb-privacy"><LockKeyhole aria-hidden="true" /><span>Saved only in this browser. Your information stays with you.</span></p>
      </aside>
      <div className="st-main">
        {!focusMode && <header className="nb-topbar st-topbar">
          <span className="st-mobile-only"><Brand onClick={() => go('home')} /></span>
          <nav className="nb-breadcrumb st-desktop-only" aria-label="Breadcrumb">Stead <span aria-hidden="true">/</span> <strong>{AREAS.find(a => a[0] === area)[1]}</strong></nav>
          <div className="nb-topbar__actions">
            <button type="button" className="nb-chip" onClick={() => setDialog('display')}><Settings2 aria-hidden="true" /><span>Display</span></button>
            <button type="button" className="nb-chip" onClick={() => setDialog('data')}><LockKeyhole aria-hidden="true" /><span>Your data</span></button>
          </div>
        </header>}
        <main id="main" tabIndex={-1}>
          {view === 'home' ? <Journey d={d} change={change} go={go} openTool={openTool} notify={notify} />
            : view === 'step' ? <StepPage d={d} i={+stepMatch[1] - 1} change={change} go={go} openTool={openTool} notify={notify} />
            : view === 'forma' ? <FormA d={d} change={change} go={go} notify={notify} />
            : view === 'order' ? <Order d={d} change={change} go={go} notify={notify} />
            : view === 'summary' ? Summary()
            : view === 'd81' ? <React.Fragment key={d.step}>{Screen()}</React.Fragment>
            : Welcome()}
        </main>
        {!focusMode && <nav className="nb-tabbar st-tabbar" aria-label="Stead">{AREAS.map(([id, , , Icon]) => <button type="button" key={id} className="nb-tabbar__item" aria-current={area === id ? 'page' : undefined} onClick={() => go(id)}><Icon aria-hidden="true" />{TAB_NAMES[id]}</button>)}</nav>}
      </div>
    </div>

    <input type="file" ref={file} hidden accept=".json,application/json" aria-label="Open a backup file" onChange={async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      try {
        if (f.size > 5e6) throw Error('Choose a backup file smaller than 5 MB.');
        const raw = JSON.parse(await f.text());
        offer(raw && raw.app === 'stead.mobile' ? withMobile(clone(dRef.current), fromMobile(raw)) : validate(raw), 'backup file');
      } catch (err) { notify(err instanceof SyntaxError ? 'That file isn’t a Stead backup.' : err.message || 'That file couldn’t be read.'); }
    }} />

    {dialog === 'display' && <Overlay title="Display and accessibility" onClose={() => setDialog(null)} actions={<><button type="button" className="nb-button nb-button--secondary" onClick={() => setPrefs({ ...nbPrefs.defaults })}>Reset</button><button type="button" className="nb-button" onClick={() => setDialog(null)}>Done</button></>}><DisplaySettings prefs={prefs} setPrefs={setPrefs} /></Overlay>}

    {dialog === 'data' && <Overlay kind="sheet" title="Your data" onClose={() => setDialog(null)}>
      <p className="nb-privacy"><LockKeyhole aria-hidden="true" /><span>{saved}. Nothing is uploaded.</span></p>
      <ul className="nb-actions">
        <li><button type="button" className="nb-action" onClick={openShare}><span className="nb-badge nb-badge--solid" aria-hidden="true"><Share2 /></span><span><strong>Share with the other person</strong><small>A locked link, and words to open it</small></span><ChevronRight aria-hidden="true" /></button></li>
        <li><button type="button" className="nb-action" onClick={() => { setDialog(null); exportJSON(); }}><span className="nb-badge" aria-hidden="true"><Download /></span><span><strong>Save a backup file</strong><small>Keep a copy somewhere safe</small></span><ChevronRight aria-hidden="true" /></button></li>
        <li><button type="button" className="nb-action" onClick={() => { setDialog(null); file.current.click(); }}><span className="nb-badge" aria-hidden="true"><Upload /></span><span><strong>Open a backup file</strong><small>We ask before replacing anything</small></span><ChevronRight aria-hidden="true" /></button></li>
        <li><button type="button" className="nb-action" onClick={() => setDialog('privacy')}><span className="nb-badge" aria-hidden="true"><Info /></span><span><strong>About your saved information</strong><small>What is kept, and where</small></span><ChevronRight aria-hidden="true" /></button></li>
        <li><button type="button" className="nb-action" onClick={() => setDialog('help')}><span className="nb-badge" aria-hidden="true"><CircleHelp /></span><span><strong>How Stead fits together</strong><small>The journey, the D81, Form A and the order</small></span><ChevronRight aria-hidden="true" /></button></li>
      </ul>
      <button type="button" className="nb-text-button nb-text-button--danger st-start" onClick={() => setDialog('reset')}>Clear everything from this browser</button>
    </Overlay>}

    {dialog === 'share' && share && <Overlay kind="sheet" title={'Share with ' + (d.answers.respondent && d.answers.applicant ? 'the other person' : 'the other person')} onClose={() => { setDialog(null); setShare(null); }}>
      <p className="nb-small">They open it in Stead and see your journey, D81, Form A and draft order. Nothing passes through a server.</p>
      <div className="nb-beat"><p className="nb-beat__head"><span className="nb-beat__n">1</span>Send the link</p>
        <p className="nb-preview">Here’s our Stead file with the figures so far. I’ll send the words to open it separately.</p>
        <button type="button" className="nb-button nb-button--block" disabled={!share.link} onClick={sendLink}><Share2 aria-hidden="true" />{share.busy ? 'Locking…' : 'Send the link'}</button></div>
      <div className="nb-beat"><p className="nb-beat__head"><span className="nb-beat__n">2</span>The words that open it</p>
        <p className="nb-words" aria-live="polite">{shareWords}</p>
        <p className="nb-small">Send these in a different app, or say them. Anyone with the link and the words can open your file.</p>
        <button type="button" className="nb-button nb-button--secondary nb-button--block" onClick={copyWords}><Copy aria-hidden="true" />Copy the words</button>
        <button type="button" className="nb-text-button st-start" onClick={() => lock(suggestPassphrase())}><RefreshCw aria-hidden="true" />Suggest different words</button></div>
      {share.error && <p className="nb-field__error" role="alert">{share.error}</p>}
      <details className="nb-disclosure"><summary>Use your own words</summary><div className="nb-stack">
        <div className="nb-field"><label className="nb-field__label" htmlFor="own-words">Your words</label><div className="nb-input-row"><input className="nb-input nb-input--mono" id="own-words" autoComplete="off" autoCapitalize="none" spellCheck={false} value={share.own} onChange={e => setShare(v => ({ ...v, own: e.target.value }))} /></div><p className="nb-field__hint">At least 8 characters. Longer is safer.</p></div>
        <button type="button" className="nb-button nb-button--secondary nb-button--block" onClick={() => share.own.trim().length < 8 ? notify('Use at least 8 characters.') : lock(share.own.trim())}>Lock with these words</button></div></details>
      <details className="nb-disclosure"><summary>Show the link</summary><textarea className="nb-textarea nb-textarea--mono" readOnly rows={4} aria-label="Link" value={share.link} onFocus={e => e.target.select()} /></details>
      <p className="nb-small">The link is a snapshot of what you have now. After you make changes, share a new one.</p>
    </Overlay>}

    {dialog === 'unlock' && <Overlay title="Open shared progress" onClose={() => setDialog(null)} actions={<button type="button" className="nb-button" disabled={unlock.busy || !unlock.pass.trim()} onClick={tryUnlock}>{unlock.busy ? 'Opening…' : 'Open it'}</button>}>
      <p>Someone has sent you their Stead progress. Type the words they gave you.</p>
      <div className="nb-field"><label className="nb-field__label" htmlFor="unlock-pass">The words that open it</label><input className="nb-input nb-input--mono" id="unlock-pass" data-autofocus autoComplete="off" autoCapitalize="none" spellCheck={false} value={unlock.pass} aria-invalid={unlock.error ? 'true' : undefined} aria-describedby={unlock.error ? 'unlock-err' : 'unlock-hint'} onChange={e => setUnlock(v => ({ ...v, pass: e.target.value, error: '' }))} onKeyDown={e => { if (e.key === 'Enter' && unlock.pass.trim() && !unlock.busy) tryUnlock(); }} />
        {unlock.error ? <p className="nb-field__error" id="unlock-err" role="alert">{unlock.error}</p> : <p className="nb-field__hint" id="unlock-hint">It opens on this device. Nothing is sent anywhere.</p>}</div>
    </Overlay>}

    {dialog === 'incoming' && incoming && <Overlay title="Replace what is on this device?" onClose={() => { setDialog(null); setIncoming(null); }} actions={<>
      <button type="button" className="nb-button nb-button--secondary" onClick={exportJSON}>Back up mine first</button>
      <button type="button" className="nb-button nb-button--secondary" onClick={() => { setDialog(null); setIncoming(null); notify('Kept what is on this device.'); }}>Keep mine</button>
      <button type="button" className="nb-button" onClick={() => { setD(incoming.x); setIncoming(null); setDialog(null); notify('Loaded. It is now saved on this device.'); }}>Use the {incoming.from === 'shared link' ? 'shared' : 'file'} version</button></>}>
      <p>This device already has Stead progress. Choose which to keep.</p>
      <dl className="st-sheet"><div><dt>From the {incoming.from}</dt><dd>{summary(incoming.x)}</dd></div><div><dt>On this device</dt><dd>{summary(d)}</dd></div></dl>
    </Overlay>}

    {dialog === 'copy' && <Overlay title="Use today as your starting point?" onClose={() => setDialog(null)} actions={<button type="button" className="nb-button" onClick={() => { change(n => { n.after = clone(n.before); n.reviewed = n.reviewed.filter(id => !id.startsWith('after-')); }); setDialog(null); notify('Today’s figures copied. Check the proposed amounts next.'); }}>Copy the figures</button>}><p>This replaces the proposed figures with a separate copy of today’s. Changing one won’t change the other.</p></Overlay>}

    {dialog === 'privacy' && <Overlay title="Your information, your control" onClose={() => setDialog(null)} actions={<><button type="button" className="nb-button nb-button--secondary" onClick={exportJSON}>Save a backup file</button><button type="button" className="nb-button" onClick={() => setDialog(null)}>Got it</button></>}>
      <p>Everything you enter is kept in this browser’s storage. It isn’t uploaded. Anyone using this browser profile can open it, and it isn’t encrypted on this device.</p>
      <p>Backup files aren’t encrypted. Share links are locked with your words in your browser before they leave it, and the locked data sits after the # in the address, which browsers never send to a server.</p>
    </Overlay>}

    {dialog === 'help' && <Overlay title="How Stead fits together" onClose={() => setDialog(null)} actions={<button type="button" className="nb-button" onClick={() => setDialog(null)}>Got it</button>}>
      <p>Your journey lists the 14 steps from agreeing terms to carrying out the order. Steps tick themselves as you finish each tool.</p>
      <p>The D81 statement follows form D81 (04.25). Form A and the consent order reuse your D81 answers, so you enter names, dates and property details once.</p>
      <p>Stead prepares drafts and worksheets. It isn’t legal advice, and it doesn’t replace the signed official forms.</p>
    </Overlay>}

    {dialog === 'reset' && <Overlay title="Clear everything from this browser?" onClose={() => setDialog('data')} actions={<><button type="button" className="nb-button nb-button--secondary" onClick={() => setDialog('data')}>Keep it</button><button type="button" className="nb-button st-danger" onClick={() => { setD(empty()); setDialog(null); notify('Stead data cleared from this browser.'); }}>Clear everything</button></>}>
      <p>This removes everything Stead has saved in this browser: the journey, the D81, Form A and the consent order. Backup files you saved stay where they are.</p>
    </Overlay>}
  </Prefs.Provider>;
}

createRoot(document.getElementById('root')).render(<App />);
