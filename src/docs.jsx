import React from 'react';
import {Button} from './button';
import {Field,gbp,toPence,ukDate} from './ui';
import {Rich} from './journey';
import {ArrowLeft,ArrowRight,Check,Copy,Printer,FileText,Download,House,Scale,PencilLine} from 'lucide-react';

const yes=['Yes','No'];
const PARTY=['applicant','respondent'];
const name=(d,p)=>d.answers[PARTY[p]]||(p?'the respondent':'the applicant');
const roleName=(d,p)=>(p?'the respondent':'the applicant')+(d.answers[PARTY[p]]?' ('+d.answers[PARTY[p]]+')':'');
const blank=(v,label)=>v?v:'['+label+']';
const money=v=>gbp(toPence(v)).replace('.00','');

// What the D81 says each person owns in a property today, after the mortgage.
export function equityShares(p){
  const equity=toPence(p.value)-toPence(p.mortgage);
  return [Math.round(equity*Number(p.a||0)/100),Math.round(equity*Number(p.b||0)/100),equity];
}

export const FORM_A_ORDERS=['A lump sum order','A property adjustment order','A pension sharing order','A pension compensation sharing order','A pension attachment order','A periodical payments order','A secured provision order','An order for maintenance pending suit'];

export function suggestedFormAOrders(d){
  const o=d.order||{},out=[];
  if(o.lump&&toPence(o.lump)>0)out.push('A lump sum order');
  if(o.home==='transfer'||o.home==='sale')out.push('A property adjustment order');
  if(o.pension==='Yes')out.push('A pension sharing order');
  return out;
}

// The Form A answers, in the order they appear on the form.
export function formAAnswers(d){
  const a=d.answers,f=d.formA||{},proceeding=a.proceeding==='dissolution'?'dissolution':'divorce';
  const props=d.before.properties.filter(p=>p.address);
  const orders=f.orders||[];
  return [
    ['Page 1',[
      ['The Family Court sitting at',a.court||'Leave blank. Consent applications by post go to the central financial remedy centre.'],
      ['Case number',blank(a.case,'your divorce case number')],
      ['Help with Fees reference',f.helpRef||'Leave blank unless you have one'],
      ['Applicant’s full name',blank(a.applicant,'applicant’s full name')],
      ['Respondent’s full name',blank(a.respondent,'respondent’s full name')]]],
    ['Page 2',[
      ['Are you applying for an order by consent?','Yes. Attach the draft order and the D81.'],
      ['The applicant intends',(f.askedInDivorce==='No'?'to apply to the Court for':'to proceed with the application in the')+' '+proceeding],
      ['Orders ticked',orders.length?orders.join('\n'):'None ticked yet']]],
    ['Section 1 · Further details',[
      ['Address of the property',orders.includes('A property adjustment order')?(props.map(p=>p.address).join('\n')||'[property address, as on the Land Registry title]'):'Not needed. No property adjustment order ticked.'],
      ['Name and address of any mortgage lender',orders.includes('A property adjustment order')?blank(f.mortgagee,'lender’s registered name and address'):'Not needed'],
      ['Periodical payments for children','N/A']]],
    ['Sections 2 to 4 · Mediation meeting',[
      ['Mediation Information and Assessment Meeting','Not required for a consent order. Mark these sections N/A.']]],
    ['Section 5 · Statement of truth',[
      ['Signed by','The applicant, in ink, on the day you post the application'],
      ['Full name',blank(a.applicant,'applicant’s full name')]]],
    ['Section 6 · Checklist',[
      ['Sections 1 to 5 complete','Yes, once the statement of truth is signed']]]
  ];
}

export function FormA({d,change,go,notify}){
  const f=d.formA,a=d.answers;
  const set=(k,v)=>change(n=>{n.formA[k]=v});
  const suggestions=suggestedFormAOrders(d);
  const missing=suggestions.filter(x=>!(f.orders||[]).includes(x));
  const sections=formAAnswers(d);
  return <div className="wizard wide doc-view">
    <div className="wizard-kicker"><span>Form A</span><span>Application notice</span></div>
    <div className="eyebrow form-ref">FORM A · CONSENT APPLICATION</div>
    <h1 tabIndex={-1}>The application notice.</h1>
    <p className="lead form-lead">For a consent order you complete only a few parts of <Rich text="[[Form A]]"/>. Your names and case details come from the D81, so you enter them once.</p>

    <div className="shared-card">
      <div className="shared-head"><strong>From your D81</strong><Button variant="outline" onClick={()=>go('case')}><PencilLine size={15}/> Edit in the D81</Button></div>
      <dl>{[['Applicant',a.applicant],['Respondent',a.respondent],['Court',a.court],['Case number',a.case]].map(([k,v])=><div key={k}><dt>{k}</dt><dd className={v?'':'missing'}>{v||'Not entered yet'}</dd></div>)}</dl>
    </div>

    <Field field={{id:'proceeding',label:'Which proceedings is this part of?',type:'choice',options:['Divorce','Dissolution of a civil partnership']}} value={a.proceeding==='dissolution'?'Dissolution of a civil partnership':'Divorce'} onChange={v=>change(n=>{n.answers.proceeding=v==='Divorce'?'divorce':'dissolution'})}/>
    <Field field={{id:'askedInDivorce',label:'Did the divorce or dissolution application say you intended to apply for a financial order?',type:'choice',options:['Yes','No','Not sure'],hint:'This decides which statement you tick on page 2. Check the application you submitted. If you are not sure, Stead assumes yes, which is the usual case.'}} value={f.askedInDivorce} onChange={v=>set('askedInDivorce',v)}/>
    <Field field={{id:'helpRef',label:'Help with Fees reference (optional)',type:'text'}} value={f.helpRef} onChange={v=>set('helpRef',v)}/>
    <div className="field">
      <label>Which orders should Form A list?</label>
      <p className="field-hint">Tick the orders your consent order makes. Many people also tick the claims the order dismisses, so every claim is formally before the court. Ask whoever checks your order.</p>
      {missing.length>0&&<div className="note suggest"><Scale size={18}/><div><strong>Suggested from your consent order</strong><p>{missing.join(', ')}</p><Button variant="outline" onClick={()=>change(n=>{n.formA.orders=[...new Set([...(n.formA.orders||[]),...missing])]})}>Add these</Button></div></div>}
      <Field field={{id:'orders',label:'',type:'checks',options:FORM_A_ORDERS}} value={f.orders} onChange={v=>set('orders',v)}/>
    </div>
    {(f.orders||[]).includes('A property adjustment order')&&<Field field={{id:'mortgagee',label:'Mortgage lender’s registered name and address',type:'textarea',hint:'Use the name and address on your mortgage statement or the title register. Write None if there is no mortgage.'}} value={f.mortgagee} onChange={v=>set('mortgagee',v)}/>}

    <h2 className="section-title">Your Form A answers</h2>
    <p className="hint">Copy these onto the official Form A (05.26), in the same order. Leave the signature and date until the day you post.</p>
    <div className="answer-sheet">{sections.map(([title,rows])=><section key={title}><h3>{title}</h3><dl>{rows.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>)}</div>
    <div className="review-actions">
      <Button className="primary" onClick={()=>window.print()}><Printer size={16}/> Print / save PDF</Button>
      <Button variant="outline" onClick={()=>{set('complete',f.complete==='Yes'?'':'Yes');notify(f.complete==='Yes'?'Form A marked as not checked.':'Form A marked as checked. Journey step 7 is now ticked.')}}><Check size={16}/> {f.complete==='Yes'?'Checked':'Mark as checked'}</Button>
    </div>
    <div className="wizard-bottom"><Button variant="ghost" onClick={()=>go('home')}><ArrowLeft size={16}/> Journey</Button><span/><Button className="primary" onClick={()=>go('order')}>Consent order <ArrowRight size={17}/></Button></div>
  </div>;
}

// Builds the draft consent order as a list of blocks.
// Wording follows the usual shape of a financial remedy consent order in England and Wales.
export function draftOrder(d){
  const a=d.answers,o=d.order||{},out=[];
  const civil=a.proceeding==='dissolution';
  const act=civil?'Civil Partnership Act 2004':'Matrimonial Causes Act 1973';
  const finalWord='final order';
  const props=d.before.properties;
  const prop=props[Number(o.propertyIndex||0)];
  const address=prop?.address||'[property address]';
  const keeper=Number(o.keeper||0),leaver=1-keeper;
  const kids=d.children.filter(c=>c.name);
  const H=t=>out.push({t:'h',text:t}),P=t=>out.push({t:'p',text:t}),C=t=>out.push({t:'c',text:t});
  let n=0;const N=t=>out.push({t:'n',n:++n,text:t});

  C('IN THE FAMILY COURT');
  C('sitting at '+(a.court||'[court]'));
  C('Case number: '+(a.case||'[case number]'));
  C('THE '+act.toUpperCase());
  C('BETWEEN');
  C((a.applicant||'[applicant’s full name]')+'  Applicant');
  C('and');
  C((a.respondent||'[respondent’s full name]')+'  Respondent');
  C('FINANCIAL REMEDY ORDER MADE BY CONSENT');

  H('Definitions');
  N('In this order “the applicant” means '+blank(a.applicant,'applicant’s full name')+' and “the respondent” means '+blank(a.respondent,'respondent’s full name')+'.');
  if(prop&&o.home&&o.home!=='none')N('“The property” means '+address+(o.title?', registered at HM Land Registry under title number '+o.title:', registered at HM Land Registry under title number [title number]')+'.');

  H('Recitals');
  P('The parties record that:');
  N('The parties '+(civil?'formed a civil partnership':'married')+' on '+blank(ukDate(a.married),'date')+' and separated on '+blank(ukDate(a.separated),'date')+'.');
  N('A conditional order was made on '+blank(ukDate(a.conditional),'date')+' in the '+(civil?'dissolution':'divorce')+' proceedings.');
  N('The parties agree that the terms of this order are accepted in full and final satisfaction of all claims for income, capital and pension provision, and of all other claims arising from the '+(civil?'civil partnership':'marriage')+', whether in England and Wales or elsewhere, which either has or may have against the other or against the other’s estate.');
  if(o.home==='done'&&prop)N('On '+blank(ukDate(o.doneDate),'date')+' '+roleName(d,leaver)+' transferred to '+roleName(d,keeper)+' all of their legal and beneficial interest in the property'+(o.lump&&toPence(o.lump)>0?', and '+roleName(d,keeper)+' paid '+name(d,leaver)+' '+money(o.lump):'')+'. '+(o.releaseMortgage!=='No'?name(d,leaver)+' has been released from all liability under the mortgage secured on the property.':''));
  if(o.chattels!=='No')N('The parties have divided the contents of the property and their personal belongings between them by agreement, and neither will make any further claim in respect of them.');
  if(kids.length)N('The parties have agreed the arrangements for '+kids.map(c=>c.name).join(', ')+' between themselves. Child maintenance is not dealt with in this order.');
  if(o.extra)o.extra.split(/\n+/).filter(Boolean).forEach(x=>N(x.trim()));

  if(o.home==='transfer'&&prop&&o.releaseMortgage!=='No'){
    H('Undertakings');
    P(roleName(d,keeper)[0].toUpperCase()+roleName(d,keeper).slice(1)+' undertakes to the court:');
    N('to use their best endeavours to secure the release of '+name(d,leaver)+' from all liability under the mortgage secured on the property by the date of the transfer; and');
    N('until that release, to pay the mortgage and all other outgoings on the property, and to indemnify '+name(d,leaver)+' against all liability under the mortgage.');
  }

  H('It is ordered that');
  const when=o.transferDate?'by '+ukDate(o.transferDate):'within 28 days of the '+finalWord;
  if(o.home==='transfer'&&prop){
    N(roleName(d,leaver)[0].toUpperCase()+roleName(d,leaver).slice(1)+' shall '+when+' transfer to '+roleName(d,keeper)+' all of their legal and beneficial interest in the property, subject to the mortgage secured on it. '+name(d,keeper)+' shall pay the costs of the transfer.');
  }
  if(o.home==='sale'&&prop){
    const pa=Number(o.saleA||50),pb=Math.round((100-pa)*100)/100;
    N('The property shall be sold on the open market as soon as reasonably practicable after the '+finalWord+', at a price the parties agree or, if they cannot agree, at the price recommended by the selling agent. '+(o.saleConduct==='1'?name(d,1):o.saleConduct==='0'?name(d,0):'The parties jointly')+' shall have conduct of the sale.');
    N('The net proceeds of sale, after repaying the mortgage and paying the agent’s fees and the conveyancing costs of the sale, shall be divided '+pa+'% to '+name(d,0)+' and '+pb+'% to '+name(d,1)+'.');
    N('Until completion of the sale, '+(o.salePayer==='1'?name(d,1):o.salePayer==='both'?'the parties equally':name(d,0))+' shall pay the mortgage and the outgoings on the property.');
  }
  if(o.lump&&toPence(o.lump)>0&&o.home!=='done'){
    const payer=o.home==='transfer'?keeper:Number(o.lumpPayer||0);
    N(roleName(d,payer)[0].toUpperCase()+roleName(d,payer).slice(1)+' shall pay '+roleName(d,1-payer)+' a lump sum of '+money(o.lump)+' '+(o.home==='transfer'&&prop?'on completion of the transfer of the property, and in any event '+when:o.lumpDate?'by '+ukDate(o.lumpDate):'within 28 days of the '+finalWord)+'.');
  }
  if(o.pension==='Yes'){
    const from=Number(o.pensionFrom||0);
    N('Provision shall be made in favour of '+roleName(d,1-from)+' by means of pension sharing, in relation to the rights of '+name(d,from)+' under '+blank(o.pensionProvider,'pension scheme name and reference')+', in accordance with the pension sharing annex to this order. The specified percentage is '+blank(o.pensionPct,'percentage')+'%.');
  }
  const clean=(a.cleanBreak||'Yes')!=='No';
  if(clean){
    N('The applicant’s and the respondent’s claims against each other for periodical payments and secured periodical payments are dismissed, and neither shall be entitled to apply to the court for an order under '+(civil?'paragraph 2(1)(a) or (b) of Schedule 5 to the Civil Partnership Act 2004':'section 23(1)(a) or (b) of the Matrimonial Causes Act 1973')+'.');
    N('Upon compliance with this order, the applicant’s and the respondent’s claims against each other for lump sum orders, property adjustment orders, pension sharing orders, pension attachment orders and pension compensation sharing and attachment orders are dismissed.');
    N('Neither party shall be entitled on the death of the other to apply for an order under section 2 of the Inheritance (Provision for Family and Dependants) Act 1975.');
  }
  N('The financial provisions of this order take effect on the making of the '+finalWord+'.');
  N('The parties have liberty to apply as to the implementation and timing of the terms of this order.');
  N('There shall be no order as to costs.');

  H('Consent');
  P('We agree to an order in these terms.');
  P('Signed ............................................  Applicant      Date ....................');
  P('Signed ............................................  Respondent     Date ....................');
  return out;
}

export function orderText(blocks){
  return blocks.map(b=>b.t==='n'?b.n+'. '+b.text:b.t==='h'?'\n'+b.text.toUpperCase():b.text).join('\n')+'\n\nDraft prepared with Stead. Not legal advice. Have a solicitor check it before you sign.\n';
}

export function Order({d,change,go,notify}){
  const o=d.order,a=d.answers;
  const set=(k,v)=>change(n=>{n.order[k]=v});
  const props=d.before.properties;
  const prop=props[Number(o.propertyIndex||0)];
  const keeper=Number(o.keeper||0);
  const shares=prop?equityShares(prop):null;
  const suggest=shares?shares[1-keeper]:0;
  const names=[a.applicant||'Applicant',a.respondent||'Respondent'];
  const blocks=draftOrder(d);
  const pick=(id,label,options,value,onChange,hint)=><Field field={{id,label,type:'choice',options:options.map(x=>x[1]),hint}} value={(options.find(x=>x[0]===value)||[])[1]} onChange={v=>onChange(options.find(x=>x[1]===v)[0])}/>;
  const copy=async()=>{try{await navigator.clipboard.writeText(orderText(blocks));notify('Draft order copied.')}catch{notify('Copy did not work here. Use Download instead.')}};
  const download=()=>{const u=URL.createObjectURL(new Blob([orderText(blocks)],{type:'text/plain'}));const x=document.createElement('a');x.href=u;x.download='stead-consent-order-draft-'+new Date().toISOString().slice(0,10)+'.txt';x.click();setTimeout(()=>URL.revokeObjectURL(u),1000);notify('Draft order downloaded as a text file.')};
  const cleanNo=a.cleanBreak==='No';
  return <div className="wizard wide doc-view">
    <div className="wizard-kicker"><span>Consent order</span><span>Draft for checking</span></div>
    <div className="eyebrow form-ref">THE AGREEMENT, IN COURT WORDING</div>
    <h1 tabIndex={-1}>Your draft consent order.</h1>
    <p className="lead form-lead">Answer a few questions and Stead builds a draft from your D81 in the usual wording. It is a starting point. Have a solicitor check it before you both sign.</p>

    <div className="shared-card">
      <div className="shared-head"><strong>From your D81</strong><Button variant="outline" onClick={()=>go('case')}><PencilLine size={15}/> Edit in the D81</Button></div>
      <dl>{[['Applicant',a.applicant],['Respondent',a.respondent],['Married',ukDate(a.married)],['Separated',ukDate(a.separated)],['Conditional Order',ukDate(a.conditional)],['Properties',props.length?props.map(p=>p.address||'Unnamed').join(', '):'']].map(([k,v])=><div key={k}><dt>{k}</dt><dd className={v?'':'missing'}>{v||'Not entered yet'}</dd></div>)}</dl>
    </div>

    <h2 className="section-title"><House size={20}/> The home</h2>
    {pick('home','What happens to the home?',[['transfer','One of us keeps it, and the order transfers it'],['done','One of us has already taken it over'],['sale','It will be sold and the money split'],['none','There is no property to deal with']],o.home,v=>set('home',v))}
    {props.length>1&&o.home&&o.home!=='none'&&<Field field={{id:'propertyIndex',label:'Which property?',type:'choice',options:props.map((p,i)=>(i+1)+'. '+(p.address||'Unnamed'))}} value={prop?(Number(o.propertyIndex||0)+1)+'. '+(prop.address||'Unnamed'):''} onChange={v=>set('propertyIndex',String(Number(v.split('.')[0])-1))}/>}
    {o.home&&o.home!=='none'&&!prop&&<div className="note"><House size={18}/><div><strong>Add the property in the D81 first</strong><p>The order uses the address and figures from D81 question 8.</p><Button variant="outline" onClick={()=>go('before-property')}>Add it in the D81</Button></div></div>}
    {(o.home==='transfer'||o.home==='done')&&prop&&<>
      {pick('keeper','Who keeps it?',[['0',names[0]],['1',names[1]]],o.keeper||'0',v=>set('keeper',v))}
      <Field field={{id:'title',label:'Land Registry title number (optional)',type:'text',hint:'On the title register, for example EX123456.'}} value={o.title} onChange={v=>set('title',v)}/>
      {o.home==='transfer'&&<Field field={{id:'transferDate',label:'Latest date for the transfer (optional)',type:'date',hint:'Leave blank for “within 28 days of the final order”. A fixed date acts as a longstop.'}} value={o.transferDate} onChange={v=>set('transferDate',v)}/>}
      {o.home==='done'&&<Field field={{id:'doneDate',label:'Date the transfer completed',type:'date'}} value={o.doneDate} onChange={v=>set('doneDate',v)}/>}
      {pick('releaseMortgage',o.home==='done'?'Has '+names[1-keeper]+' been released from the mortgage?':'Should '+names[keeper]+' undertake to get '+names[1-keeper]+' released from the mortgage?',[['Yes','Yes'],['No','No, or there is no mortgage']],o.releaseMortgage||'Yes',v=>set('releaseMortgage',v))}
    </>}
    {o.home==='sale'&&prop&&<>
      <Field field={{id:'saleA',label:'Share of the net proceeds for '+names[0]+' (%)',type:'number',hint:names[1]+' receives the rest: '+(Math.round((100-Number(o.saleA||50))*100)/100)+'%.'}} value={o.saleA||'50'} onChange={v=>set('saleA',v)}/>
      {pick('saleConduct','Who handles the sale?',[['joint','Both of us'],['0',names[0]],['1',names[1]]],o.saleConduct||'joint',v=>set('saleConduct',v))}
      {pick('salePayer','Who pays the mortgage until it sells?',[['0',names[0]],['1',names[1]],['both','Both, equally']],o.salePayer||'0',v=>set('salePayer',v))}
    </>}

    <h2 className="section-title"><Scale size={20}/> Money</h2>
    <Field field={{id:'lump',label:o.home==='transfer'||o.home==='done'?'Payment to '+names[1-keeper]+' for their share (£)':'Lump sum, if any (£)',type:'number',hint:'Leave blank if no lump sum is paid.'}} value={o.lump} onChange={v=>set('lump',v)}/>
    {(o.home==='transfer'||o.home==='done')&&prop&&suggest>0&&<div className="calculation"><span>{names[1-keeper]}’s share of the equity in your D81 today<small className="equation-help">{gbp(toPence(prop.value))} value, less {gbp(toPence(prop.mortgage))} mortgage, × {(1-keeper)?prop.b:prop.a}%</small></span><strong>{gbp(suggest)}</strong></div>}
    {(o.home==='transfer'||o.home==='done')&&prop&&suggest>0&&toPence(o.lump)!==suggest&&<Button variant="outline" className="add-button" onClick={()=>set('lump',(suggest/100).toFixed(2))}>Use {gbp(suggest)}</Button>}
    {o.home!=='transfer'&&o.home!=='done'&&toPence(o.lump)>0&&<>
      {pick('lumpPayer','Who pays it?',[['0',names[0]],['1',names[1]]],o.lumpPayer||'0',v=>set('lumpPayer',v))}
      <Field field={{id:'lumpDate',label:'Pay by (optional)',type:'date',hint:'Leave blank for “within 28 days of the final order”.'}} value={o.lumpDate} onChange={v=>set('lumpDate',v)}/>
    </>}
    {pick('pension','Will a pension be shared?',[['No','No'],['Yes','Yes']],o.pension||'No',v=>set('pension',v),'Pension sharing needs a separate annex, Form P1, for each pension.')}
    {o.pension==='Yes'&&<>
      {pick('pensionFrom','Whose pension is shared?',[['0',names[0]],['1',names[1]]],o.pensionFrom||'0',v=>set('pensionFrom',v))}
      <Field field={{id:'pensionProvider',label:'Pension scheme name and reference',type:'text'}} value={o.pensionProvider} onChange={v=>set('pensionProvider',v)}/>
      <Field field={{id:'pensionPct',label:'Percentage to share (%)',type:'number'}} value={o.pensionPct} onChange={v=>set('pensionPct',v)}/>
    </>}

    <h2 className="section-title"><FileText size={20}/> Everything else</h2>
    {pick('cleanBreak','Clean break: end all financial claims between you?',[['Yes','Yes'],['No','No, maintenance continues']],a.cleanBreak||'Yes',v=>change(n=>{n.answers.cleanBreak=v}),'This is the same answer as D81 question 14. A clean break cannot stop claims for child maintenance.')}
    {cleanNo&&<div className="note"><Scale size={18}/><p>Stead does not draft maintenance orders. If maintenance continues, have a solicitor draft that part.</p></div>}
    {pick('chattels','Have you divided the contents of the home between you?',[['Yes','Yes'],['No','Not yet']],o.chattels||'Yes',v=>set('chattels',v))}
    <Field field={{id:'extra',label:'Anything else to record (optional)',type:'textarea',hint:'One point per line. Each becomes a numbered recital, for example who keeps each car.'}} value={o.extra} onChange={v=>set('extra',v)}/>

    <h2 className="section-title">The draft</h2>
    <article className="order-doc" aria-label="Draft consent order">
      {blocks.map((b,i)=>b.t==='c'?<p key={i} className="order-centre">{b.text}</p>:b.t==='h'?<h3 key={i}>{b.text}</h3>:b.t==='n'?<p key={i} className="order-num"><span>{b.n}.</span>{b.text}</p>:<p key={i}>{b.text}</p>)}
      <p className="order-footnote">Draft prepared with Stead. Not legal advice. Have a solicitor check it before you sign.</p>
    </article>
    <div className="review-actions">
      <Button className="primary" onClick={()=>window.print()}><Printer size={16}/> Print / save PDF</Button>
      <Button variant="outline" onClick={copy}><Copy size={16}/> Copy text</Button>
      <Button variant="outline" onClick={download}><Download size={16}/> Download</Button>
      <Button variant="outline" onClick={()=>{set('complete',o.complete==='Yes'?'':'Yes');notify(o.complete==='Yes'?'Order marked as not checked.':'Order marked as checked. Journey step 5 is now ticked.')}}><Check size={16}/> {o.complete==='Yes'?'Checked':'Mark as checked'}</Button>
    </div>
    <div className="wizard-bottom"><Button variant="ghost" onClick={()=>go('forma')}><ArrowLeft size={16}/> Form A</Button><span/><Button className="primary" onClick={()=>go('home')}>Journey <ArrowRight size={17}/></Button></div>
  </div>;
}
