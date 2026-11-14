// Form A and the draft consent order, built from the D81 answers. Pure logic, no React, so it can be unit tested.
// The order follows the usual shape of a financial remedy consent order in England and Wales.
import { formatMoney as gbp, pennies as toPence, ukDate } from './d81.js';

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

