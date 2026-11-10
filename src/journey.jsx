import React from 'react';
import {Popover} from '@base-ui/react/popover';
import {Button} from './button';
import {Check,ArrowRight,ArrowUpRight,Share2,Upload,Download,LockKeyhole,CalendarDays,Mail,ListChecks,Scale} from 'lucide-react';

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

export function Term({k,children}){
  const text=GLOSSARY[k];
  if(!text)return <>{children||k}</>;
  return <Popover.Root><Popover.Trigger className={'term'+(k==='D81'||k==='Form A'?' term-code':'')} openOnHover delay={200} closeDelay={100}>{children||k}</Popover.Trigger><Popover.Portal><Popover.Positioner sideOffset={8} collisionPadding={12} className="term-positioner"><Popover.Popup className="term-pop"><Popover.Title className="term-title">{k.charAt(0).toUpperCase()+k.slice(1)}</Popover.Title><Popover.Description className="term-text">{text}</Popover.Description></Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root>;
}

// Turns "text with [[term]] markers" into text and Term buttons.
export function Rich({text}){
  const parts=String(text).split(/\[\[([^\]]+)\]\]/g);
  return <>{parts.map((p,i)=>i%2?<Term key={i} k={p}/>:<React.Fragment key={i}>{p}</React.Fragment>)}</>;
}

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
    'Use the envelope checklist further down this page.',
    'Keep your own copies of everything.',
    'If you are on a low income, look at [[Help with Fees]] before you pay.']},
  {who:'Both',when:'The following weeks',title:'Wait for the judge',detail:[
    'There is usually no hearing.',
    'Timings vary with court workload. Allow several weeks.']},
  {who:'Both',when:'If the court writes to you',title:'Answer any questions',detail:[
    'Reply in writing by the date given.',
    'You can amend the order, or keep the terms and explain why you both consider them fair.',
    'The section below covers each possible response.']},
  {who:'Applicant',when:'Once the sealed order arrives',title:'Apply for the Final Order',auto:d=>d.answers.final==='Yes',autoLabel:'Final Order recorded in the D81',detail:[
    'The earliest date for the [[Final Order]] is six weeks and one day after the Conditional Order.',
    'Wait until the consent order is [[sealed]]. Finalising the divorce first can remove rights you would otherwise keep, such as pension benefits on death.']},
  {who:'Both',when:'By the dates in the order',title:'Carry out the order',detail:[
    'Complete any [[transfer of equity]], sale, payment or pension share by its deadline.',
    'Close joint accounts and remove each other from bills, insurance and anything else still shared.']}
];

const OUTCOMES=[
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
const longDate=d=>d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});

export function stepDone(d,i){const s=STEPS[i];return (d.journey?.done||[]).includes(i+1)||!!(s.auto&&s.auto(d))}
export function journeyCount(d){return STEPS.filter((_,i)=>stepDone(d,i)).length}

function Tick({on,label,onClick,auto}){
  return <button type="button" className={'step-check'+(on?' on':'')+(auto?' auto':'')} aria-pressed={on} aria-label={label} onClick={onClick}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>;
}

export function Journey({d,change,go,openTool,onShare,onImport,onExport,notify}){
  const [overrides,setOverrides]=React.useState(()=>new Map());
  const done=journeyCount(d);
  const next=STEPS.findIndex((_,i)=>!stepDone(d,i));
  const toggle=i=>{
    const s=STEPS[i];
    if(s.auto&&s.auto(d)&&!(d.journey.done||[]).includes(i+1)){notify('This step ticks itself: '+s.autoLabel.toLowerCase()+'.');return}
    change(n=>{const list=n.journey.done;const at=list.indexOf(i+1);if(at>=0)list.splice(at,1);else list.push(i+1)});
  };
  const listTick=(key,i)=>change(n=>{const list=n.journey[key];const at=list.indexOf(i);if(at>=0)list.splice(at,1);else list.push(i)});
  // Steps open by default when they are next up. A tap on a step's title overrides that.
  const shown=i=>overrides.has(i)?overrides.get(i):!stepDone(d,i)&&(i===next||i===next+1);
  const setShown=(i,v)=>setOverrides(prev=>{const n=new Map(prev);n.set(i,v);return n});
  const flip=i=>setShown(i,!shown(i));
  const final=finalOrderDate(d.answers.conditional);
  const names=[d.answers.applicant,d.answers.respondent].filter(Boolean);
  return <div className="journey">
    <div className="eyebrow"><span/> YOUR CONSENT ORDER, STEP BY STEP</div>
    <h1>One agreement.<br/><em>Fourteen steady steps.</em></h1>
    <p className="lead">For two people who agree how to divide their money and property on divorce and want a court to make that agreement binding. Tap any underlined term for a plain explanation.</p>

    <section className="journey-card" aria-labelledby="progress-title">
      <div className="journey-card-head">
        <div><h2 id="progress-title">{done} of {STEPS.length} steps done</h2><p>{names.length===2?names.join(' and '):'Saved on this device as you go'}</p></div>
        <div className="ring" style={{'--p':done/STEPS.length}} aria-hidden="true"><span>{Math.round(done/STEPS.length*100)}%</span></div>
      </div>
      <div className="journey-progress"><span style={{width:done/STEPS.length*100+'%'}}/></div>
      {next>=0&&<button type="button" className="next-up" onClick={()=>{document.getElementById('step-'+(next+1))?.scrollIntoView({behavior:'smooth',block:'center'});setShown(next,true)}}><span>Next up</span><strong>{String(next+1).padStart(2,'0')} · {STEPS[next].title}</strong><ArrowRight size={18}/></button>}
      <div className="journey-actions">
        <Button className="primary" onClick={onShare}><Share2 size={17}/> Share with the other person</Button>
        <div className="journey-actions-row">
          <Button variant="outline" onClick={onImport}><Upload size={16}/> Import</Button>
          <Button variant="outline" onClick={onExport}><Download size={16}/> Export</Button>
        </div>
      </div>
      <p className="journey-fine"><LockKeyhole size={13}/> Everything stays in this browser unless you share or export it. Share links are locked with a passphrase.</p>
    </section>

    <div className="section-rule"><span>THE TOOLS</span><span>01 — 03</span></div>
    <div className="tool-cards">
      {[['welcome','D81 statement','Both of your finances today and after the order, with the sums done for you.',d.reviewed.includes('review')],['forma','Form A','The few answers a consent application needs, filled from your D81.',d.formA?.complete==='Yes'],['order','Consent order','A draft in the court’s usual wording, built from your answers.',d.order?.complete==='Yes']].map(([id,t,p,ok],i)=><button type="button" key={id} className="tool-card" onClick={()=>openTool(id)}><span className="tool-num">{ok?<Check size={15}/>:'0'+(i+1)}</span><span><strong>{t}</strong><small>{p}</small></span><ArrowRight size={18}/></button>)}
    </div>

    <div className="section-rule"><span>THE FOURTEEN STEPS</span><span>{done} / {STEPS.length}</span></div>
    <ol className="steps-list">
      {STEPS.map((s,i)=>{
        const on=stepDone(d,i),auto=s.auto&&s.auto(d),body=shown(i);
        return <React.Fragment key={i}>
          {s.phase&&<li className="phase-label" aria-hidden="true">{s.phase}</li>}
          <li id={'step-'+(i+1)} className={'step-card'+(on?' done':'')+(i===next?' current':'')}>
            <div className="step-head">
              <span className="step-num">{String(i+1).padStart(2,'0')}</span>
              <button type="button" className="step-toggle" aria-expanded={body} aria-controls={'step-body-'+(i+1)} onClick={()=>flip(i)}>
                <h3>{s.title}</h3>
                <span className="step-meta"><span className="chip who">{s.who}</span><span className="chip">{s.when}</span></span>
              </button>
              <Tick on={on} auto={auto} label={'Step '+(i+1)+' done'} onClick={()=>toggle(i)}/>
            </div>
            <div className={'step-body'+(body?'':' shut')} id={'step-body-'+(i+1)}><div>
              <ul>{s.detail.map((x,j)=><li key={j}><Rich text={x}/></li>)}</ul>
              {(s.tool||auto)&&<div className="step-foot">{auto&&<span className="auto-note"><Check size={14}/> {s.autoLabel}</span>}{s.tool&&<Button variant="outline" onClick={()=>openTool(s.tool[0])}>{s.tool[1]} <ArrowRight size={15}/></Button>}</div>}
              {i===7&&<div className="date-helper">
                <label htmlFor="co-date">Date the Conditional Order was granted</label>
                <input id="co-date" type="date" value={d.answers.conditional||''} onChange={e=>change(n=>{n.answers.conditional=e.target.value})}/>
                <p>{final?<>Earliest Final Order application: <strong>{longDate(final)}</strong>. Wait for the sealed consent order first.</>:'This date also fills in D81 question 3.'}</p>
              </div>}
            </div></div>
          </li>
        </React.Fragment>})}
    </ol>

    <div className="section-rule"><span>WHAT THE JUDGE CAN DO</span><span><Scale size={14}/></span></div>
    <p className="lead small-lead"><Rich text="The judge is not bound by your agreement. The court has its own duty to check the order is fair under [[section 25]]."/></p>
    <div className="outcomes">{OUTCOMES.map(o=><div key={o[0]} className={'outcome '+o[0]}><h3>{o[1]}</h3><p><Rich text={o[2]}/></p><p className="outcome-do"><Rich text={o[3]}/></p></div>)}</div>
    <div className="standoff"><h3>If the judge asks for a change and you both decline</h3><p>The court makes no order. You cannot force approval, and the judge will not impose different terms on an application made by consent.</p><p><Rich text="Your agreement then stands as a private arrangement. Financial claims between you stay open with no time limit, so there is no [[clean break]]."/></p></div>
    <div className="plain-notes">
      <p><Rich text="A refusal does not start a [[contested case]]. That only happens if one of you stops agreeing and applies separately on [[Form A]], which costs £321 and requires a [[mediation meeting]] first."/></p>
      <p><Rich text="Once the order is sealed, neither of you can reopen it because you changed your mind. A court will only have it [[set aside]] for reasons such as hidden assets or fraud."/></p>
    </div>

    <div className="section-rule"><span>WHAT GOES IN THE ENVELOPE</span><span><Mail size={14}/></span></div>
    <div className="list-card">
      <p className="address">HMCTS Financial Remedy<br/>PO Box 12746<br/>Harlow<br/>CM20 9QZ</p>
      <p className="hint">This address is for divorce. If you are ending a civil partnership, send it to the court handling your paperwork. The online service is for solicitors, so without one you apply by post.</p>
      <ul className="tick-list">{ENVELOPE.map((r,i)=>{const on=d.journey.env.includes(i);return <li key={i}><button type="button" aria-pressed={on} className={on?'on':''} onClick={()=>listTick('env',i)}><span className="tick-box"><Check size={14}/></span><span><span className="tick-text">{r[0]}</span>{r[1]&&<small>{r[1]}</small>}</span></button></li>})}</ul>
      <div className="fee-row"><span>Court fee. Check the current figure on GOV.UK before you post.</span><strong>£62</strong></div>
    </div>

    <div className="section-rule"><span>SETTLE THESE BEFORE YOU FILE</span><span><ListChecks size={14}/></span></div>
    <div className="list-card">
      <ul className="tick-list">{SETTLE.map((r,i)=>{const on=d.journey.conf.includes(i);return <li key={i}><button type="button" aria-pressed={on} className={on?'on':''} onClick={()=>listTick('conf',i)}><span className="tick-box"><Check size={14}/></span><span><span className="tick-text">{r[0]}</span><small>{r[1]}</small></span></button></li>})}</ul>
    </div>

    <section className="journey-card done-card">
      <h2>Done for now?</h2>
      <p>Your work is saved on this device. Send it on, or keep a copy.</p>
      <div className="journey-actions-row">
        <Button className="primary" onClick={onShare}><Share2 size={16}/> Share</Button>
        <Button variant="outline" onClick={onExport}><Download size={16}/> Export a backup</Button>
      </div>
    </section>

    <div className="sources">
      <p>Sources</p>
      <ul>
        <li><a href="https://www.gov.uk/money-property-when-relationship-ends/apply-for-consent-order" target="_blank" rel="noopener noreferrer">GOV.UK: Apply for a consent order <ArrowUpRight size={12}/></a></li>
        <li><a href="https://www.gov.uk/government/publications/form-d81-statement-of-information-for-a-consent-order-in-relation-to-a-financial-remedy" target="_blank" rel="noopener noreferrer">GOV.UK: Form D81 <ArrowUpRight size={12}/></a></li>
        <li><a href="https://www.gov.uk/government/publications/give-notice-of-your-intention-to-proceed-with-an-application-for-a-financial-order-form-a" target="_blank" rel="noopener noreferrer">GOV.UK: Form A <ArrowUpRight size={12}/></a></li>
        <li><a href="https://www.gov.uk/government/publications/hmcts-financial-remedy-courts" target="_blank" rel="noopener noreferrer">GOV.UK: HMCTS financial remedy courts <ArrowUpRight size={12}/></a></li>
      </ul>
    </div>
    <footer><span>England and Wales · Checked November 2026</span><span>General information, not legal advice.</span></footer>
  </div>;
}
