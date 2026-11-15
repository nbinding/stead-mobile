// Shared React pieces built on the nbinding design system (nb- classes, Stead look).
import React, { useEffect, useId, useRef } from 'react';
import { formatMoney, pennies, amountWords } from './d81.js';
import { GLOSSARY } from './steps.js';

/** The reader's display settings, for components that change with them (help with numbers). */
export const Prefs = React.createContext({ numberHelp: false });

/** A money amount in pence. With help with numbers on, the amount is also written in words. */
export function Money({ value }) {
  const { numberHelp } = React.useContext(Prefs);
  return <span className="st-money"><span className="st-digits">{formatMoney(value)}</span>{numberHelp && <span className="nb-field__words">{amountWords(Math.round(value || 0))}</span>}</span>;
}

/** A pounds field: the £ sits outside the input, and with help with numbers on the amount is read back in words. */
export function MoneyInput({ id, label, value, onChange, required, hint }) {
  const { numberHelp } = React.useContext(Prefs);
  const words = numberHelp && value !== '' && value != null && Number.isFinite(Number(value)) ? formatMoney(pennies(value)) + ': ' + amountWords(pennies(value)) : '';
  return <div className="nb-field">
    <label className="nb-field__label" htmlFor={id}>{label}</label>
    {hint && <p className="nb-field__hint">{hint}</p>}
    <div className="nb-money"><span className="nb-money__unit" aria-hidden="true">£</span><input className="nb-money__input" id={id} type="number" inputMode="decimal" min="0" max="1000000000000" step="0.01" placeholder="0.00" required={required} value={value ?? ''} aria-describedby={words ? id + '-words' : undefined} onChange={e => onChange(e.target.value)} /></div>
    {words && <p className="nb-field__words" id={id + '-words'}>{words}</p>}
  </div>;
}

const short = options => options.length <= 3 && options.every(o => o.length <= 14);

/** One D81 or document question: text, date, number, textarea, a single choice or several. */
export function Field({ field, value, onChange }) {
  const { id, label, type, options, hint } = field;
  const hintEl = hint && <p className="nb-field__hint" id={id + '-hint'}>{hint}</p>;
  if (type === 'money') return <MoneyInput id={id} label={label} hint={hint} value={value} onChange={onChange} />;
  if (type === 'choice') return <fieldset className="nb-field">
    <legend className="nb-field__label">{label}</legend>{hintEl}
    {short(options)
      ? <div className="nb-segmented" role="radiogroup" aria-label={label}>{options.map(o => <button type="button" role="radio" key={o} aria-checked={value === o} onClick={() => onChange(o)}>{o}</button>)}</div>
      : <ul className="nb-choices">{options.map(o => <li key={o}><label className="nb-choice"><input type="radio" name={id} checked={value === o} onChange={() => onChange(o)} /><span className="nb-choice__text"><strong>{o}</strong></span></label></li>)}</ul>}
  </fieldset>;
  if (type === 'checks') return <fieldset className="nb-field">
    {label ? <legend className="nb-field__label">{label}</legend> : null}{hintEl}
    <ul className="nb-choices">{options.map(o => <li key={o}><label className="nb-choice"><input type="checkbox" checked={(value || []).includes(o)} onChange={e => onChange(e.target.checked ? [...(value || []), o] : (value || []).filter(x => x !== o))} /><span className="nb-choice__text"><strong>{o}</strong></span></label></li>)}</ul>
  </fieldset>;
  const props = { id, value: value || '', onChange: e => onChange(e.target.value), 'aria-describedby': hint ? id + '-hint' : undefined };
  return <div className="nb-field">
    <label className="nb-field__label" htmlFor={id}>{label}</label>{hintEl}
    {type === 'textarea' ? <textarea className="nb-textarea" rows={4} {...props} /> : <input className="nb-input" type={type} inputMode={type === 'number' ? 'decimal' : undefined} {...props} />}
  </div>;
}

/** A word with a plain-language explanation. terms() from the design system opens it (see app.jsx). */
export function Term({ k, children }) {
  const id = useId();
  const text = GLOSSARY[k];
  if (!text) return <>{children || k}</>;
  return <><button type="button" className="nb-term" data-nb-term aria-expanded="false" aria-controls={id}>{children || k}</button><span className="nb-term-pop" id={id} role="note" hidden><strong>{k.charAt(0).toUpperCase() + k.slice(1)}</strong>{text}</span></>;
}
/** Turns "text with [[term]] markers" into text and terms. */
export function Rich({ text }) {
  const parts = String(text).split(/\[\[([^\]]+)\]\]/g);
  return <>{parts.map((p, i) => i % 2 ? <Term key={i} k={p} /> : <React.Fragment key={i}>{p}</React.Fragment>)}</>;
}

/**
 * A bottom sheet or a centred dialog: scrim, focus trapped inside, Escape and the scrim close it,
 * and focus goes back to whatever opened it.
 */
export function Overlay({ kind = 'dialog', title, onClose, children, actions, wide }) {
  const box = useRef(), titleId = useId();
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const opener = document.activeElement;
    document.body.classList.add('nb-locked');
    const focusables = () => [...box.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled && x.offsetParent !== null);
    (box.current.querySelector('[data-autofocus]') || box.current.querySelector('h2')).focus();
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); close.current(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(); if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); document.body.classList.remove('nb-locked'); opener?.focus?.(); };
  }, []);
  const sheet = kind === 'sheet';
  return <>
    <div className="nb-scrim" onClick={() => close.current()} />
    <section ref={box} className={(sheet ? 'nb-sheet' : 'nb-dialog') + (wide ? ' st-wide-dialog' : '')} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      {sheet && <div className="nb-sheet__grip" aria-hidden="true" />}
      <div className="nb-dialog__head"><h2 className={sheet ? 'nb-sheet__title' : 'nb-dialog__title'} id={titleId} tabIndex={-1}>{title}</h2>
        <button type="button" className="nb-icon-button" aria-label="Close" onClick={() => close.current()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button></div>
      <div className="nb-stack">{children}</div>
      {actions && <div className="nb-dialog__actions">{actions}</div>}
    </section>
  </>;
}

/** Status marks: a plain number, a ring for now, solid with a tick for done, dotted with "?" for come back to this. */
export function Status({ state, n, small, label }) {
  const cls = 'nb-status' + (small ? ' nb-status--sm' : '') + (state ? ' nb-status--' + state : '');
  if (state === 'done') return <span className={cls} role="img" aria-label={label || 'Done'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>;
  if (state === 'later') return <span className={cls} role="img" aria-label={label || 'Come back to this'}>?</span>;
  return <span className={cls} aria-label={label}>{n}</span>;
}

/** Downloads text as a file. */
export function download(name, text, type = 'text/plain') {
  const u = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = u; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

/** Text with [placeholders] shown as dotted gaps still to fill. */
export const Gaps = ({ text }) => String(text).split(/\[([^\]]+)\]/g).map((p, i) => i % 2 ? <span key={i} className="nb-gap">{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>);
