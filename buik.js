/* Taurus Coach — Buikspieren (bron: Patricia's gedeelde chat, via Taurus_Coach_Voedingsschema.docx)
   Eigen voortgang per persoon (Kristiaan / Patricia), opgeslagen op dit apparaat (IndexedDB 'abs'). */
(function(){
'use strict';
const EX={
 deadbug:{n:'Dead bug',m:'reps',side:true,cue:['Lig op je rug, armen recht omhoog, knieën 90° boven je heupen.','Strek tegelijk één arm naar achteren en het andere been naar voren.','Houd je onderrug tegen de vloer; adem uit tijdens het strekken.','Terug naar het midden, dan de andere kant.']},
 crunch:{n:'Crunches',m:'reps',cue:['Lig op je rug, knieën gebogen, voeten plat.','Handen licht achter je hoofd, niet aan je nek trekken.','Krul je schouders van de vloer en adem uit.','Rustig terug zakken.']},
 plank:{n:'Plank',m:'sec',hold:true,cue:['Begin: onderarmen onder je schouders, knieën op de grond.','Vasthouden: knieën los, één rechte lijn van hoofd tot hielen, buik en billen aanspannen.','Loslaten: knieën rustig terug naar de vloer.']},
 heeltaps:{n:'Heel taps',m:'reps',cue:['Lig op je rug, knieën gebogen, schouders iets van de vloer.','Reik met je hand zijdelings naar je hiel, afwisselend links en rechts.','Blijf je buik aanspannen; elke tik telt als één.']},
 bicycle:{n:'Bicycle crunches',m:'reps',cue:['Lig op je rug, handen achter je hoofd, schouders iets omhoog.','Breng één knie naar je borst terwijl je het andere been strekt.','Draai je bovenlichaam licht mee; wissel in een rustig tempo.']},
 legraise:{n:'Leg raises',m:'reps',cue:['Lig op je rug, armen naast je lichaam, benen gestrekt.','Til je benen tot ongeveer 90°, onderrug blijft op de vloer.','Langzaam laten zakken zonder de grond te raken. Te zwaar? Buig je knieën.']},
 sideplank:{n:'Side plank',m:'sec',hold:true,side:true,cue:['Begin: op je zij, onderarm onder je schouder, benen gestrekt.','Vasthouden: heup omhoog tot één rechte lijn, bovenste hand op je heup.','Loslaten: heup rustig terug. Daarna de andere kant.']},
 birddog:{n:'Bird dog',m:'reps',side:true,cue:['Op handen en knieën, handen onder schouders, knieën onder heupen.','Strek één arm naar voren en het andere been naar achteren.','Rug recht, heupen stil; kort vasthouden en terug. Dan de andere kant.']},
 revcrunch:{n:'Reverse crunch',m:'reps',cue:['Lig op je rug, knieën 90° boven je heupen, armen naast je.','Rol je heupen iets van de vloer door je knieën naar je borst te trekken.','Rustig terug, zonder zwaai.']},
 bridge:{n:'Glute bridge',m:'reps',cue:['Lig op je rug, knieën gebogen, voeten op heupbreedte.','Duw je heupen omhoog tot een rechte lijn van knie tot schouder; knijp je billen aan.','Rustig laten zakken.']}};
const MUS={"deadbug": {"p": ["diepe buikspier (transversus)", "rechte buikspier"], "s": ["heupbuigers"], "w": "Leert je romp stabiel houden terwijl armen en benen bewegen; spaart je onderrug."}, "crunch": {"p": ["rechte buikspier (bovenste deel)"], "s": ["schuine buikspieren"], "w": "De klassieke \"sixpack\"-spier: buigt je romp."}, "plank": {"p": ["rechte buikspier", "diepe buikspier (transversus)"], "s": ["schouders", "bilspieren"], "w": "Statische kracht: je hele romp werkt om niet door te zakken."}, "heeltaps": {"p": ["schuine buikspieren"], "s": ["rechte buikspier"], "w": "Zijkant van je buik, door het zijwaarts reiken."}, "bicycle": {"p": ["schuine buikspieren", "rechte buikspier"], "s": ["heupbuigers"], "w": "Draaien plus buigen: zijkant en voorkant samen."}, "legraise": {"p": ["rechte buikspier (onderste deel)"], "s": ["heupbuigers"], "w": "Vooral de onderbuik; houd je onderrug op de mat."}, "sideplank": {"p": ["schuine buikspieren"], "s": ["diepe buikspier", "bilspieren (zijkant)", "schouders"], "w": "Zijwaartse stabiliteit van je romp."}, "birddog": {"p": ["diepe buikspier (transversus)", "onderrug"], "s": ["bilspieren", "schouders"], "w": "Balans en rugstabiliteit; goed voor een sterke, gezonde rug."}, "revcrunch": {"p": ["rechte buikspier (onderste deel)"], "s": ["heupbuigers"], "w": "Onderbuik: het bekken kantelt naar je borst."}, "bridge": {"p": ["bilspieren"], "s": ["hamstrings", "onderrug"], "w": "Billen en achterkant; ondersteunt je buikwerk en houding."}};
const PLAN={A:{n:'Training A',sub:'±12 min · goed vóór een nachtdienst (overdag, uitgerust)',x:[['deadbug',3,10],['crunch',3,15],['plank',3,30],['heeltaps',3,20]]},
 B:{n:'Training B',sub:'12–15 min',x:[['bicycle',3,20],['legraise',3,10],['sideplank',3,20],['birddog',3,10]]},
 C:{n:'Training C',sub:'±10 min · alleen als je genoeg energie hebt',x:[['plank',3,30],['revcrunch',3,12],['deadbug',3,10],['bridge',3,15]]}};
const PEOPLE={k:'Kristiaan',p:'Patricia'};
let A={who:'p',p:{},k:{},view:'home',plan:null,ex:null,run:null};
async function load(){try{const v=await idbGet('abs');if(v)A={...A,...JSON.parse(v),view:'home',run:null}}catch(e){}}
function save(){const{run,...r}=A;idbSet('abs',JSON.stringify(r)).catch(()=>{})}
const me=()=>A[A.who]||(A[A.who]={});
const st=id=>me()[id]||(me()[id]={target:null,step:null,hist:[]});
const unit=id=>EX[id].m==='sec'?'sec':'herh.';const perSide=id=>EX[id].side?' per kant':'';
const defStep=id=>EX[id].m==='sec'?5:EX[id].side?1:2;
const last=id=>{const h=st(id).hist;return h.length?h[h.length-1]:null};
const nextPlan=()=>{const h=Object.values(me()).flatMap(x=>x.hist||[]).sort((a,b)=>b.t-a.t)[0];if(!h||!h.plan)return'A';return{A:'B',B:'C',C:'A'}[h.plan]};
const fmtT=t=>new Date(t).toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'});

/* ---------- animatie (schematisch, zijaanzicht) ---------- */
const SUP={H:[60,126],S:[82,130],P:[150,132]};
const tab=(o)=>({...SUP,E1:[86,104],W1:[90,78],E2:[86,104],W2:[90,78],K1:[154,100],F1:[188,100],K2:[154,100],F2:[188,100],...o});
const knees=(o)=>({...SUP,K1:[178,100],F1:[205,137],K2:[178,100],F2:[205,137],E1:[115,134],W1:[140,136],E2:[115,134],W2:[140,136],...o});
const lift={S:[100,118],H:[80,104]};const hh={E1:[92,94],W1:[78,100],E2:[92,94],W2:[78,100]};
const KNEEL={H:[70,92],S:[92,98],P:[160,118],K1:[196,137],F1:[232,137],K2:[196,137],F2:[232,137],E1:[92,137],W1:[118,137],E2:[92,137],W2:[118,137]};
const PL={...KNEEL,P:[160,110],K1:[200,123],F1:[240,136],K2:[200,123],F2:[240,136]};
const SIDE0={H:[74,116],S:[95,121],E1:[95,137],W1:[120,137],P:[165,132],K1:[205,136],F1:[242,137],K2:[205,135],F2:[242,136],E2:[118,128],W2:[140,130]};
const SIDE1={...SIDE0,P:[165,112],K1:[205,124],F1:[242,136],K2:[205,123],F2:[242,135],E2:[130,104],W2:[158,110]};
const Q={H:[70,88],S:[92,96],P:[165,96],E1:[92,118],W1:[92,138],E2:[92,118],W2:[92,138],K1:[165,137],F1:[200,138],K2:[165,137],F2:[200,138]};
const ANIM={
 deadbug:[[tab(),.6],[tab({E1:[58,112],W1:[32,120],K2:[186,122],F2:[226,128]}),.9],[tab(),.6],[tab({E2:[58,112],W2:[32,120],K1:[186,122],F1:[226,128]}),.9]],
 crunch:[[knees({E1:[64,108],W1:[52,118],E2:[64,108],W2:[52,118]}),.7],[knees({S:[104,113],H:[90,96],E1:[100,84],W1:[84,92],E2:[100,84],W2:[84,92]}),.7]],
 plank:[[KNEEL,.8,'Begin'],[PL,2.4,'Vasthouden'],[PL,.8,'Vasthouden'],[KNEEL,1,'Loslaten']],
 heeltaps:[[knees({...lift,E1:[120,126],W1:[146,132],E2:[120,126],W2:[146,132]}),.4],[knees({...lift,S:[104,117],E1:[140,130],W1:[172,135]}),.5],[knees({...lift,E1:[120,126],W1:[146,132],E2:[120,126],W2:[146,132]}),.4],[knees({...lift,S:[104,117],E2:[140,130],W2:[172,135]}),.5]],
 bicycle:[[knees({...lift,...hh,K1:[140,96],F1:[170,104],K2:[190,118],F2:[232,122]}),.7],[knees({...lift,...hh,K2:[140,96],F2:[170,104],K1:[190,118],F1:[232,122]}),.7]],
 legraise:[[knees({K1:[192,133],F1:[234,134],K2:[192,133],F2:[234,134]}),.9],[knees({K1:[168,96],F1:[180,58],K2:[168,96],F2:[180,58]}),.9]],
 sideplank:[[SIDE0,.8,'Begin'],[SIDE1,2.4,'Vasthouden'],[SIDE1,.8,'Vasthouden'],[SIDE0,1,'Loslaten']],
 birddog:[[Q,.5],[{...Q,E1:[66,92],W1:[40,90],K2:[195,96],F2:[230,94]},1.1],[Q,.5],[{...Q,E2:[66,92],W2:[40,90],K1:[195,96],F1:[230,94]},1.1]],
 revcrunch:[[tab({E1:[115,134],W1:[140,136],E2:[115,134],W2:[140,136]}),.8],[tab({E1:[115,134],W1:[140,136],E2:[115,134],W2:[140,136],P:[150,124],K1:[128,90],F1:[150,78],K2:[128,90],F2:[150,78]}),.8]],
 bridge:[[knees(),.9],[knees({P:[150,104],K1:[180,96],K2:[180,96]}),1]]};
const BONES=[['S','P',1],['S','E2',2],['E2','W2',2],['P','K2',2],['K2','F2',2],['P','K1',0],['K1','F1',0],['S','E1',0],['E1','W1',0]];
let RAF=null,AN={id:null,t0:0,paused:false,pt:0};
const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
function poseAt(id,t){const K=ANIM[id];const tot=K.reduce((a,k)=>a+k[1],0);let x=t%tot;for(let i=0;i<K.length;i++){if(x<K[i][1]){const a=K[i][0],b=K[(i+1)%K.length][0],f=ease(x/K[i][1]);const o={};for(const j in a){const B=b[j]||a[j];o[j]=[a[j][0]+(B[0]-a[j][0])*f,a[j][1]+(B[1]-a[j][1])*f]}return[o,K[i][2]||'']}x-=K[i][1]}return[K[0][0],'']}
function draw(){const svg=document.getElementById('abanim');if(!svg){RAF=null;return}const t=(AN.paused?AN.pt:(performance.now()-AN.t0))/1000;const [p,lab]=poseAt(AN.id,t);
  const col=['#a5b4fc','#e0e7ff','#6d72b8'];let g='';for(const [a,b,c] of BONES)if(p[a]&&p[b])g+=`<line x1="${p[a][0]}" y1="${p[a][1]}" x2="${p[b][0]}" y2="${p[b][1]}" stroke="${col[c]}" stroke-width="${c===1?10:7}" stroke-linecap="round"/>`;
  g+=`<circle cx="${p.H[0]}" cy="${p.H[1]}" r="10" fill="#f9a8d4"/>`;svg.querySelector('g').innerHTML=g;const l=document.getElementById('ablab');if(l)l.textContent=lab;
  RAF=requestAnimationFrame(draw)}
function startAnim(id){AN={id,t0:performance.now(),paused:false,pt:0};if(!RAF)RAF=requestAnimationFrame(draw)}
const animHTML=id=>`<div style="position:relative;background:rgba(255,255,255,.05);border-radius:18px;overflow:hidden"><svg id="abanim" viewBox="0 0 280 160" width="100%" style="display:block"><line x1="10" y1="144" x2="270" y2="144" stroke="rgba(255,255,255,.2)" stroke-width="2"/><g></g></svg><div id="ablab" style="position:absolute;top:10px;left:12px;font-weight:700;color:#f9a8d4"></div>
  <div style="position:absolute;right:8px;bottom:8px;display:flex;gap:6px"><button class="btn sm" data-a="b_ap">${'⏯'}</button><button class="btn sm" data-a="b_ar">↺</button></div></div><div class="tiny mut" style="margin-top:4px">Schematische animatie (zijaanzicht).${EX[id].hold?' Begin, vasthouden en loslaten.':' Eén volledige herhaling in een lus.'}</div>`;

/* ---------- schermen ---------- */
const E=s=>esc(s==null?'':String(s));
function hdrB(sub){return`<div class="hdr"><div><div class="sub">${sub}</div><h1>Buikspieren</h1></div><button class="ibtn" data-a="${A.view==='home'?'home':'b_back'}" aria-label="Terug">${A.view==='home'?IC.home:'‹'}</button></div>`}
function vHome(){const np=nextPlan();return hdrB('Eigen niveau, eigen voortgang')+`<div class="seg" style="margin-bottom:12px">${Object.keys(PEOPLE).map(w=>`<button class="${A.who===w?'on':''}" data-a="b_who" data-k="${w}">${PEOPLE[w]}</button>`).join('')}</div>`+
  Object.keys(PLAN).map(k=>{const P=PLAN[k];return`<div class="card" ${k===np?'style="border-color:rgba(165,180,252,.6)"':''}><div class="row sp"><div><h2 style="margin:0">${P.n}${k===np?' <span class="chip on" style="padding:1px 8px">volgende</span>':''}</h2><div class="small mut">${P.sub}</div><div class="tiny" style="margin-top:4px;color:#ff9b73">${[...new Set(P.x.flatMap(([id])=>MUS[id].p.map(m=>m.replace(/ \(.*\)/,''))))].join(' · ')}</div></div></div>
  <div class="list" style="margin-top:8px">${P.x.map(([id,s,r])=>{const S_=st(id);const l=last(id);return`<div class="li" data-a="b_ex" data-k="${id}" data-p="${k}"><div class="grow"><div>${EX[id].n}</div><div class="small mut">${s} × ${S_.target!=null?S_.target:r} ${unit(id)}${perSide(id)}${l?` · vorige keer ${l.sets.join('/')} ${unit(id)}`:S_.target==null?' · startniveau nog instellen':''}</div></div><span class="mut">›</span></div>`}).join('')}</div>
  <button class="btn ${k===np?'pri':''} full" style="margin-top:10px" data-a="b_plan" data-k="${k}">Start ${P.n}</button></div>`}).join('')+
  `<div class="card small mut">Rustdagen volgens het schema: maandag en zaterdag, en de dag na een nachtdienst (eventueel wandelen of rustig rekken). Uitbreiden als het na een paar weken makkelijker gaat: de app stelt dan een kleine verhoging voor.</div>`+histCard()}
function histCard(){const rows=[];for(const id in me())(me()[id].hist||[]).forEach(h=>rows.push({id,...h}));rows.sort((a,b)=>b.t-a.t);if(!rows.length)return'';
  return`<div class="card"><h2>Geschiedenis ${PEOPLE[A.who]}</h2><div class="list">${rows.slice(0,12).map(h=>`<div class="li"><div class="grow"><div>${EX[h.id].n}</div><div class="small mut">${fmtT(h.t)}${h.plan?' · training '+h.plan:''}</div></div><div class="small">${h.sets.join(' / ')} ${unit(h.id)} <span class="mut">(doel ${h.target})</span></div></div>`).join('')}</div></div>`}
function vEx(){const id=A.ex,S_=st(id),l=last(id);const P=A.plan&&PLAN[A.plan];const pl=P?P.x.find(x=>x[0]===id):null;const sets=pl?pl[1]:3;const def=pl?pl[2]:(EX[id].m==='sec'?30:10);
  const mu=MUS[id];let h=hdrB(PEOPLE[A.who]+(P?' · '+P.n:''))+`<div class="card"><h2>${EX[id].n}</h2>${window.TaurusAnim&&TaurusAnim.has('ab_'+id)?'<div id="ab3d"></div>':animHTML(id)}
   <div style="margin-top:10px"><div class="tiny mut">Spieren die je traint</div><div class="chips" style="margin-top:4px">${mu.p.map(m=>`<span class="chip" style="border-color:#ff5a2a;color:#ff9b73">● ${E(m)}</span>`).join('')}${mu.s.map(m=>`<span class="chip" style="border-color:#ffb26b;color:#ffcf9e">○ ${E(m)}</span>`).join('')}</div><div class="small mut" style="margin-top:6px">${E(mu.w)}</div></div><ol class="small" style="padding-left:18px;margin:10px 0 0">${EX[id].cue.map(c=>`<li style="margin:3px 0">${E(c)}</li>`).join('')}</ol></div>`;
  if(S_.target==null){return h+`<div class="card"><h2>Startniveau</h2><div class="small">${EX[id].m==='sec'?'Hoeveel seconden houd je dit nu vol?':'Hoeveel herhalingen haal je nu?'}${perSide(id)}</div><div class="tiny mut">Schema: ${sets} × ${def} ${unit(id)}${perSide(id)}. Je antwoord wordt je eerste doel.</div>
    <input class="f" id="b_start" type="number" inputmode="numeric" style="margin-top:8px" value="${def}"><button class="btn pri full" style="margin-top:10px" data-a="b_setstart">Opslaan als doel</button></div>`}
  const R=A.run&&A.run.id===id?A.run:null;
  h+=`<div class="card"><div class="stats"><div class="stat"><b>${l?l.sets.join('/'):'–'}</b><span>vorige keer${l?' · '+fmtT(l.t):''}</span></div><div class="stat"><b>${S_.target}</b><span>doel vandaag (${unit(id)}${perSide(id)})</span></div><div class="stat"><b>${R?R.done.length:0}/${sets}</b><span>sets</span></div></div></div>`;
  if(!R)return h+`<button class="btn pri full" data-a="b_go" data-k="${sets}">Start sets</button><div class="row" style="gap:8px;margin-top:8px"><span class="small mut grow">Stapgrootte bij verhogen: ${S_.step||defStep(id)} ${unit(id)}</span><button class="btn sm" data-a="b_step">Wijzig</button></div>`;
  if(R.done.length>=R.sets)return h+resultCard(id,R);
  if(EX[id].m==='sec'){const el=R.tRun?(R.acc+(Date.now()-R.tRun))/1000:R.acc/1000;const f=Math.min(1,el/S_.target);const L=2*Math.PI*62;
    h+=`<div class="card" style="text-align:center"><div class="small mut">Set ${R.done.length+1} van ${R.sets}${EX[id].side?' · '+(R.done.length%2?'andere kant':'eerste kant'):''}</div>
     <svg width="170" height="170" viewBox="0 0 170 170"><circle cx="85" cy="85" r="62" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="12"/><circle id="b_ring" cx="85" cy="85" r="62" fill="none" stroke="${el>=S_.target?'#39d98a':'#a5b4fc'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L*(1-f)}" transform="rotate(-90 85 85)"/><text id="b_sec" x="85" y="92" text-anchor="middle" fill="#fff" font-size="34" font-weight="800">${Math.floor(el)}</text><text x="85" y="114" text-anchor="middle" fill="#a9b0d0" font-size="12">van ${S_.target} sec</text></svg>
     <div class="row" style="gap:8px;justify-content:center">${R.tRun?'<button class="btn" data-a="b_pause">Pauze</button>':`<button class="btn pri" data-a="b_start2">${R.acc?'Verder':'Start'}</button>`}<button class="btn" data-a="b_stop">Stop</button></div></div>`}
  else h+=`<div class="card"><div class="small mut">Set ${R.done.length+1} van ${R.sets}</div><label class="lb">Behaalde herhalingen${perSide(id)}</label><div class="row" style="gap:8px"><button class="btn" data-a="b_rm">−</button><input class="f" id="b_reps" type="number" inputmode="numeric" style="text-align:center;font-size:22px" value="${R.cur!=null?R.cur:S_.target}"><button class="btn" data-a="b_rp">+</button></div><button class="btn pri full" style="margin-top:10px" data-a="b_repset">Set opslaan</button></div>`;
  if(R.done.length)h+=`<div class="small mut" style="margin:0 2px 10px">Gedaan: ${R.done.join(' / ')} ${unit(id)}</div>`;return h}
function resultCard(id,R){const S_=st(id);const ok=R.done.every(v=>v>=S_.target);const stp=S_.step||defStep(id);
  return`<div class="card"><h2>Resultaat</h2><div class="small">Corrigeer een set als dat nodig is, en sla dan op.</div>${R.done.map((v,i)=>`<div class="row" style="gap:8px;margin-top:6px"><span class="small" style="width:60px">Set ${i+1}</span><input class="f b_fix" data-i="${i}" type="number" inputmode="numeric" value="${v}"><span class="small mut">${unit(id)}</span></div>`).join('')}
   <div class="small" style="margin-top:12px">${ok?`<span class="chip ok">doel gehaald</span> Voorstel: volgende keer <b>${S_.target+stp}</b> ${unit(id)}.`:`Doel ${S_.target} ${unit(id)} nog niet in elke set gehaald. Voorstel: herhalen.`}</div>
   <label class="lb">Volgende training</label><div class="seg">${[['up',`Verhogen (${S_.target+stp})`],['same',`Herhalen (${S_.target})`],['down',`Verlagen (${Math.max(1,S_.target-stp)})`]].map(([k,l])=>`<button class="${(R.choice||(ok?'up':'same'))===k?'on':''}" data-a="b_choice" data-k="${k}">${l}</button>`).join('')}</div>
   <button class="btn pri full" style="margin-top:12px" data-a="b_save">Opslaan</button></div>`}
let TK=null;
function tickTimer(){clearInterval(TK);TK=setInterval(()=>{const R=A.run;if(!R||!R.tRun){clearInterval(TK);return}const S_=st(R.id);const el=(R.acc+(Date.now()-R.tRun))/1000;const t=document.getElementById('b_sec');if(t)t.textContent=Math.floor(el);
  const r=document.getElementById('b_ring');if(r){const L=2*Math.PI*62;r.setAttribute('stroke-dashoffset',L*(1-Math.min(1,el/S_.target)));if(el>=S_.target)r.setAttribute('stroke','#39d98a')}
  if(el>=S_.target&&!R.rang){R.rang=true;try{chime()}catch(e){}try{speak('Doel gehaald. Je mag doorgaan of stoppen.',true)}catch(e){}}},200)}
function view(){const v=A.view==='ex'?vEx():vHome();if(A.view==='ex')setTimeout(()=>{const el=document.getElementById('ab3d');if(el&&window.TaurusAnim)TaurusAnim.mount(el,'ab_'+A.ex);else if(document.getElementById('abanim'))startAnim(A.ex)},0);return v}
document.addEventListener('click',ev=>{const t=ev.target.closest('[data-a^="b_"]');if(!t)return;const a=t.dataset.a,k=t.dataset.k;const R=A.run;
  if(a==='b_who'){A.who=k;save();render()}
  else if(a==='b_plan'){A.plan=k;A.ex=PLAN[k].x[0][0];A.view='ex';A.run=null;render();scrollTo(0,0)}
  else if(a==='b_ex'){A.plan=t.dataset.p;A.ex=k;A.view='ex';A.run=null;render();scrollTo(0,0)}
  else if(a==='b_back'){if(R&&R.done.length&&!confirm('Sets nog niet opgeslagen. Toch terug?'))return;A.view='home';A.run=null;clearInterval(TK);render()}
  else if(a==='b_ap'){if(AN.paused){AN.t0=performance.now()-AN.pt;AN.paused=false}else{AN.pt=performance.now()-AN.t0;AN.paused=true}}
  else if(a==='b_ar'){AN.t0=performance.now();AN.pt=0}
  else if(a==='b_setstart'){const v=parseInt(document.getElementById('b_start').value,10);if(!(v>0)){toast('Vul een getal in.');return}const S_=st(A.ex);S_.target=v;S_.start=v;S_.step=S_.step||defStep(A.ex);save();render()}
  else if(a==='b_step'){const v=prompt('Verhoging per keer ('+unit(A.ex)+')',st(A.ex).step||defStep(A.ex));if(v&&+v>0){st(A.ex).step=+v;save();render()}}
  else if(a==='b_go'){audio&&audio();A.run={id:A.ex,sets:+k*(EX[A.ex].side&&EX[A.ex].m==='sec'?2:1),done:[],acc:0,tRun:null};render()}
  else if(a==='b_start2'){audio&&audio();R.tRun=Date.now();render();tickTimer()}
  else if(a==='b_pause'){R.acc+=Date.now()-R.tRun;R.tRun=null;clearInterval(TK);render()}
  else if(a==='b_stop'){if(R.tRun){R.acc+=Date.now()-R.tRun;R.tRun=null}clearInterval(TK);const sec=Math.round(R.acc/1000);if(sec<1){toast('Nog niet gestart.');return}R.done.push(sec);R.acc=0;R.rang=false;render()}
  else if(a==='b_rm'||a==='b_rp'){const i=document.getElementById('b_reps');R.cur=Math.max(0,(+i.value||0)+(a==='b_rp'?1:-1));i.value=R.cur}
  else if(a==='b_repset'){const v=parseInt(document.getElementById('b_reps').value,10);if(!(v>=0)){toast('Vul het aantal in.');return}R.done.push(v);R.cur=null;render()}
  else if(a==='b_choice'){R.choice=k;document.querySelectorAll('.b_fix').forEach(i=>R.done[+i.dataset.i]=+i.value||0);render()}
  else if(a==='b_save'){document.querySelectorAll('.b_fix').forEach(i=>R.done[+i.dataset.i]=Math.max(0,+i.value||0));const S_=st(R.id);const stp=S_.step||defStep(R.id);const ok=R.done.every(v=>v>=S_.target);const ch=R.choice||(ok?'up':'same');
    S_.hist.push({t:Date.now(),plan:A.plan,sets:[...R.done],target:S_.target});S_.target=ch==='up'?S_.target+stp:ch==='down'?Math.max(1,S_.target-stp):S_.target;A.run=null;save();
    const P=A.plan&&PLAN[A.plan];const i=P?P.x.findIndex(x=>x[0]===R.id):-1;if(P&&i>=0&&i<P.x.length-1){A.ex=P.x[i+1][0];toast('Opgeslagen. Volgende: '+EX[A.ex].n)}else{A.view='home';toast('Training opgeslagen. Goed gedaan!');try{confetti()}catch(e){}}render();scrollTo(0,0)}});
window.BUIK={load,view,EX,PLAN,get A(){return A},exportData:()=>{const{run,...r}=A;return r},importData:d=>{if(d){A={...A,...d};save()}}};
})();
