// The journey: where you are, the one next thing, the fourteen steps, and each step's own page with the
// reference it needs (what goes in the envelope, what the judge can do, what to settle before filing).
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, ArrowUpRight, CalendarPlus, Check, CircleHelp, Copy, Download, MessageSquare, X, LockKeyhole } from 'lucide-react';
import { STEPS, OUTCOMES, ENVELOPE, SETTLE, stepDone, journeyCount, nextStep, finalOrderDate, keyDates, icsFor } from './steps.js';
import { ukDate } from './d81.js';
import { Rich, Status, Gaps, download } from './ui.jsx';
import { templatesFor, templateText } from './templates.js';

const pad = n => String(n).padStart(2, '0');
const phaseOf = i => STEPS.slice(0, i + 1).reverse().find(s => s.phase)?.phase || '';
const longDate = d => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Marks a step done or not done. Steps Stead ticks itself explain why instead. */
export function useToggle(d, change, notify) {
  return i => {
    const s = STEPS[i];
    if (s.auto && s.auto(d) && !(d.journey.done || []).includes(i + 1)) { notify('This step ticks itself: ' + s.autoLabel.toLowerCase() + '.'); return; }
    change(n => { const list = n.journey.done, at = list.indexOf(i + 1); if (at >= 0) list.splice(at, 1); else list.push(i + 1); });
  };
}

function Timeline({ d, go, all }) {
  const next = nextStep(d);
  const from = all || next < 0 ? 0 : Math.max(0, Math.min(next - 2, STEPS.length - 6)), to = all || next < 0 ? STEPS.length : from + 6;
  return <ol className="nb-timeline" aria-label="The fourteen steps">
    {STEPS.map((s, i) => {
      if (i < from || i >= to) return null;
      const done = stepDone(d, i), now = i === next, phase = i === from ? phaseOf(i) : s.phase;
      return <React.Fragment key={i}>
        {phase && <li className="nb-timeline__phase" aria-hidden="true">{phase}</li>}
        <li className={'nb-timeline__item' + (done ? ' nb-timeline__item--done' : '')} aria-current={now ? 'step' : undefined}>
          <Status state={done ? 'done' : now ? 'now' : ''} n={i + 1} label={done ? 'Step ' + (i + 1) + ', done' : 'Step ' + (i + 1)} />
          <span><button type="button" className="nb-timeline__title st-link" onClick={() => go('step-' + (i + 1))}>{s.title}</button>
            {now ? <span className="nb-timeline__detail">You are here</span> : done && s.auto?.(d) ? <span className="nb-timeline__detail">{s.autoLabel}</span> : null}</span>
        </li>
      </React.Fragment>;
    })}
  </ol>;
}

/** The sealed order as a keepsake, with what happens next and a calendar file for it. */
function Sealed({ d, notify }) {
  const a = d.answers, dates = keyDates(d);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(a.sealed), when = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const part = o => when.toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' });
  const who = [a.applicant, a.respondent].filter(Boolean).join(' & ');
  return <section className="nb-stack" aria-labelledby="sealed-title">
    <div className="nb-poster">
      <div className="nb-poster__seal" aria-hidden="true" />
      <p className="nb-poster__what">Consent order sealed{who ? ' · ' + who : ''}</p>
      <ul className="nb-poster__days"><li>
        <h2 className="nb-sr-only" id="sealed-title">Consent order sealed on {longDate(when)}</h2>
        <span className="nb-poster__line" aria-hidden="true">{part({ weekday: 'long' })}</span>
        <span className="nb-poster__day" aria-hidden="true">{when.getUTCDate()}</span>
        <span className="nb-poster__line" aria-hidden="true">{part({ month: 'long', year: 'numeric' })}</span>
        <p className="nb-poster__note">It binds you both. Keep the sealed copy somewhere safe.</p>
      </li></ul>
    </div>
    {dates.length > 0 ? <>
      <p className="nb-eyebrow">What happens next, and when</p>
      <ul className="nb-dates">{dates.map(x => { const [y, mo, da] = x.date.split('-').map(Number), dt = new Date(Date.UTC(y, mo - 1, da)); return <li key={x.date + x.title}>
        <span className="nb-when" aria-hidden="true"><b>{da}</b><span>{dt.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</span></span>
        <span><span className="nb-sr-only">{ukDate(x.date)}: </span><strong>{x.title}</strong><small>{x.detail}</small></span></li>; })}</ul>
      <button type="button" className="nb-button nb-button--block" onClick={() => { download('stead-key-dates.ics', icsFor(dates), 'text/calendar'); notify('Calendar file downloaded. Open it to add the dates, with a reminder a week before each.'); }}><CalendarPlus size={20} aria-hidden="true" />Add these dates to my calendar</button>
      <p className="nb-small">The calendar file stays on your device. Nothing is sent anywhere.</p>
    </> : <p className="nb-small">Dates for transfers and payments appear here once the consent order sets them, or once the Final Order date is in the D81.</p>}
  </section>;
}

export function Journey({ d, change, go, openTool, notify }) {
  const [all, setAll] = useState(false);
  const toggle = useToggle(d, change, notify);
  const done = journeyCount(d), next = nextStep(d), s = STEPS[next];
  return <div className="st-page nb-stack st-journey">
    {d.answers.sealed && <Sealed d={d} notify={notify} />}
    {next >= 0 ? <section className="nb-stack st-hero" aria-labelledby="now-title">
      <p className="nb-eyebrow">Step {next + 1} of {STEPS.length} · {phaseOf(next)}</p>
      <h1 className="nb-display" id="now-title" tabIndex={-1}>{s.title}.</h1>
      <p className="nb-small">{s.who === 'Both' ? 'Both of you' : 'The applicant'} · {s.when.toLowerCase()}</p>
      <p><Rich text={s.detail[0]} /></p>
      {s.tool
        ? <button type="button" className="nb-button nb-button--block nb-button--trailing" onClick={() => openTool(s.tool[0])}>{s.tool[1]}<ArrowRight aria-hidden="true" /></button>
        : <button type="button" className="nb-button nb-button--block nb-button--trailing" onClick={() => go('step-' + (next + 1))}>Open this step<ArrowRight aria-hidden="true" /></button>}
      <div className="st-row-between">
        <button type="button" className="nb-text-button" onClick={() => toggle(next)}><Check aria-hidden="true" />Mark as done</button>
        {s.tool && <button type="button" className="nb-text-button" onClick={() => go('step-' + (next + 1))}>More about this step</button>}
      </div>
    </section> : !d.answers.sealed && <section className="nb-stack st-hero">
      <p className="nb-eyebrow">All fourteen steps</p>
      <h1 className="nb-display" tabIndex={-1}>Done. <em>Well done, both of you.</em></h1>
      <p>Keep the sealed order and your own copies somewhere safe.</p>
    </section>}

    <div className="nb-stack st-progress">
      <div className="st-row-between"><p className="nb-h2">{done} of {STEPS.length} steps done</p><p className="nb-small">Saved on this device</p></div>
      <progress className="nb-progress" value={done} max={STEPS.length} aria-label="Steps done">{done} of {STEPS.length}</progress>
    </div>

    <Timeline d={d} go={go} all={all} />
    <button type="button" className="nb-text-button st-start" onClick={() => setAll(v => !v)} aria-expanded={all}>{all ? 'Show fewer steps' : 'Show all 14 steps'}</button>

    <p className="nb-privacy"><LockKeyhole aria-hidden="true" /><span>Everything stays in this browser unless you share it. General information, not legal advice.</span></p>
    <details className="nb-disclosure"><summary>Sources</summary>
      <ul className="st-sources">{[['https://www.gov.uk/money-property-when-relationship-ends/apply-for-consent-order', 'Apply for a consent order'], ['https://www.gov.uk/government/publications/form-d81-statement-of-information-for-a-consent-order-in-relation-to-a-financial-remedy', 'Form D81'], ['https://www.gov.uk/government/publications/give-notice-of-your-intention-to-proceed-with-an-application-for-a-financial-order-form-a', 'Form A'], ['https://www.gov.uk/government/publications/hmcts-financial-remedy-courts', 'HMCTS financial remedy courts']].map(([h, t]) => <li key={h}><a href={h} target="_blank" rel="noopener noreferrer">GOV.UK: {t}<ArrowUpRight size={14} aria-hidden="true" /></a></li>)}</ul>
      <p className="nb-small">England and Wales · Checked November 2026</p>
    </details>
  </div>;
}

const BADGES = {
  good: ['nb-badge--solid', <Check key="i" aria-hidden="true" />],
  ask: ['nb-badge--ring', <CircleHelp key="i" aria-hidden="true" />],
  hear: ['nb-badge--dashed', <MessageSquare key="i" aria-hidden="true" />],
  no: ['', <X key="i" aria-hidden="true" />],
};

function TickList({ rows, picked, onPick, label }) {
  return <ul className="nb-choices" aria-label={label}>{rows.map((r, i) => <li key={i}><label className="nb-choice"><input type="checkbox" checked={picked.includes(i)} onChange={() => onPick(i)} /><span className="nb-choice__text"><strong>{r[0]}</strong>{r[1] && <small>{r[1]}</small>}</span></label></li>)}</ul>;
}

/** Letters and agreements this step asks you to write, filled from what Stead knows, to copy or download. */
function Templates({ d, step, notify }) {
  const list = templatesFor(d, step);
  if (!list.length) return null;
  const copy = async t => { try { await navigator.clipboard.writeText(templateText(t.text)); notify(t.title + ' copied.'); } catch { notify('Copy did not work here. Use Download instead.'); } };
  return <section className="nb-stack" aria-labelledby="tpl-title">
    <h2 className="nb-h2" id="tpl-title">{list.length > 1 ? 'Templates' : 'A template'} for this step</h2>
    <p className="nb-small">Filled in from your D81 and consent order. Dotted gaps are still to fill. A starting point, not legal advice.</p>
    {list.map(t => <details key={t.id} className="nb-disclosure" data-template={t.id}><summary>{t.title}</summary><div className="nb-stack">
      <p>{t.why}</p>
      <article className="nb-document" aria-label={t.title}>{t.text.trim().split('\n\n').map((para, j) => <p key={j}>{para.split('\n').map((line, k) => <React.Fragment key={k}>{k > 0 && <br />}<Gaps text={line} /></React.Fragment>)}</p>)}</article>
      <div className="st-row-between"><button type="button" className="nb-text-button" onClick={() => copy(t)}><Copy aria-hidden="true" />Copy the text</button><button type="button" className="nb-text-button" onClick={() => { download('stead-' + t.id + '-' + new Date().toISOString().slice(0, 10) + '.txt', templateText(t.text)); notify(t.title + ' downloaded as a text file.'); }}><Download aria-hidden="true" />Download</button></div>
    </div></details>)}
  </section>;
}

/** One step, on its own page, with what it needs. */
export function StepPage({ d, i, change, go, openTool, notify }) {
  const s = STEPS[i], done = stepDone(d, i), auto = s.auto?.(d), toggle = useToggle(d, change, notify);
  const tick = (key, n) => change(x => { const list = x.journey[key], at = list.indexOf(n); if (at >= 0) list.splice(at, 1); else list.push(n); });
  const final = finalOrderDate(d.answers.conditional);
  return <div className="st-page nb-stack">
    <div className="st-row-between"><button type="button" className="nb-text-button st-plain" onClick={() => go('home')}><ArrowLeft aria-hidden="true" />Journey</button><span className="nb-small">Step {i + 1} of {STEPS.length}</span></div>
    <p className="nb-eyebrow">{phaseOf(i)}</p>
    <h1 className="nb-display" tabIndex={-1}>{s.title}.</h1>
    <p className="nb-small">{s.who === 'Both' ? 'Both of you' : 'The applicant'} · {s.when.toLowerCase()}</p>
    {done && <div className="nb-note"><Status state="done" small /><p>{auto ? 'Done: ' + s.autoLabel.toLowerCase() + '.' : 'You marked this step as done.'}</p></div>}
    <ul className="st-bullets">{s.detail.map((x, j) => <li key={j}><Rich text={x} /></li>)}</ul>
    {s.tool && <button type="button" className="nb-button nb-button--block nb-button--trailing" onClick={() => openTool(s.tool[0])}>{s.tool[1]}<ArrowRight aria-hidden="true" /></button>}

    {i === 7 && <div className="nb-field"><label className="nb-field__label" htmlFor="co-date">Date the Conditional Order was granted</label>
      <input className="nb-input" id="co-date" type="date" value={d.answers.conditional || ''} aria-describedby="co-date-hint" onChange={e => change(n => { n.answers.conditional = e.target.value; })} />
      <p className="nb-field__hint" id="co-date-hint">{final ? <>Earliest Final Order application: <strong>{longDate(final)}</strong>. Wait for the sealed consent order first.</> : 'This date also fills in D81 question 3.'}</p></div>}
    {i === 12 && <div className="nb-field"><label className="nb-field__label" htmlFor="sealed-date">Date the consent order was sealed</label>
      <input className="nb-input" id="sealed-date" type="date" value={d.answers.sealed || ''} aria-describedby="sealed-hint" onChange={e => change(n => { n.answers.sealed = e.target.value; })} />
      <p className="nb-field__hint" id="sealed-hint">The journey then shows what happens next and when, and you can add the dates to your calendar.</p></div>}

    {i === 8 && <section className="nb-stack" aria-labelledby="settle-title"><h2 className="nb-h2" id="settle-title">Settle these before you file</h2>
      <TickList rows={SETTLE} picked={d.journey.conf} onPick={n => tick('conf', n)} label="Settle these before you file" /></section>}
    {i === 9 && <section className="nb-stack" aria-labelledby="env-title"><h2 className="nb-h2" id="env-title">What goes in the envelope</h2>
      <p className="nb-preview st-address">HMCTS Financial Remedy{'\n'}PO Box 12746{'\n'}Harlow{'\n'}CM20 9QZ</p>
      <p className="nb-small">This address is for divorce. If you are ending a civil partnership, send it to the court handling your paperwork. The online service is for solicitors, so without one you apply by post.</p>
      <TickList rows={ENVELOPE} picked={d.journey.env} onPick={n => tick('env', n)} label="What goes in the envelope" />
      <div className="nb-sum"><span><span className="nb-sum__label">Court fee</span><span className="nb-sum__working">Check the current figure on GOV.UK before you post.</span></span><strong className="nb-sum__total">£62</strong></div></section>}
    {i === 10 && <section className="nb-stack" aria-labelledby="judge-title"><h2 className="nb-h2" id="judge-title">What the judge can do</h2>
      <p><Rich text="The judge is not bound by your agreement. The court has its own duty to check the order is fair under [[section 25]]." /></p>
      <ul className="nb-icon-list" aria-label="What the judge can do">{OUTCOMES.map(([k, t, what, then]) => <li key={k}><span className={'nb-badge ' + BADGES[k][0]}>{BADGES[k][1]}</span><div><h3>{t}</h3><p><Rich text={what} /></p><p className="nb-icon-list__then"><Rich text={then} /></p></div></li>)}</ul>
      <details className="nb-disclosure"><summary>If the judge asks for a change and you both decline</summary><div className="nb-stack"><p>The court makes no order. You cannot force approval, and the judge will not impose different terms on an application made by consent.</p><p><Rich text="Your agreement then stands as a private arrangement. Financial claims between you stay open with no time limit, so there is no [[clean break]]." /></p></div></details>
      <details className="nb-disclosure"><summary>If it is refused, or later disputed</summary><div className="nb-stack"><p><Rich text="A refusal does not start a [[contested case]]. That only happens if one of you stops agreeing and applies separately on [[Form A]], which costs £321 and needs a [[mediation meeting]] first." /></p><p><Rich text="Once the order is sealed, neither of you can reopen it because you changed your mind. A court will only have it [[set aside]] for reasons such as hidden assets or fraud." /></p></div></details></section>}

    <Templates d={d} step={i + 1} notify={notify} />

    <button type="button" className={'nb-button nb-button--block' + (s.tool && !done ? ' nb-button--secondary' : done ? ' nb-button--secondary' : '')} onClick={() => toggle(i)} aria-pressed={done}><Check aria-hidden="true" />{done ? (auto && !(d.journey.done || []).includes(i + 1) ? 'Done automatically' : 'Mark as not done') : 'Mark as done'}</button>
    <div className="st-row-between">
      {i > 0 ? <button type="button" className="nb-text-button" onClick={() => go('step-' + i)}><ArrowLeft aria-hidden="true" />{pad(i)} · Previous</button> : <span />}
      {i < STEPS.length - 1 && <button type="button" className="nb-text-button" onClick={() => go('step-' + (i + 2))}>Next · {pad(i + 2)}<ArrowRight aria-hidden="true" /></button>}
    </div>
  </div>;
}
