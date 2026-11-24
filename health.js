/* Taurus Coach 2.0 — Gezondheid
   Bron: jouw eigen Home Assistant (FITAGE-weegschaal + Apple Gezondheid via de HA Companion-app).
   - Alleen HTTPS. Het token staat alleen op dit apparaat (IndexedDB) en gaat nooit mee in back-ups.
   - Geen fictieve waarden: zonder koppeling of metingen toont de app niets.
   - Sophie werkt met vaste regels; geen medische diagnoses. */
(function(){
'use strict';
const DAY=864e5;
const METRICS={
  weight:  {l:'Gewicht',u:'kg',grp:'body',src:'FITAGE-weegschaal',kw:['weight','gewicht'],units:['kg','lb','lbs'],excl:['bmi','estimat','ideal','target','doel','goal','recommend','control','profile','fat','vet','muscle','spier','bone','bot','water','lean','vetvrij'],dec:1,agg:'mean',thr:.2},
  fat:     {l:'Vetpercentage',u:'%',grp:'body',src:'FITAGE-weegschaal',kw:['body_fat','bodyfat','fat_percent','vetpercentage','lichaamsvet',' fat','_fat'],units:['%'],excl:['visceral','visceraal','mass','massa'],dec:1,agg:'mean',thr:.3,est:true},
  fatmass: {l:'Vetmassa',u:'kg',grp:'body',src:'FITAGE-weegschaal',kw:['body_fat_mass','fat_mass','vetmassa'],units:['kg'],dec:1,agg:'mean',thr:.2,est:true},
  lean:    {l:'Vetvrije massa',u:'kg',grp:'body',src:'FITAGE-weegschaal',kw:['fat_free','lean_mass','vetvrij'],units:['kg'],dec:1,agg:'mean',thr:.2,est:true},
  muscle:  {l:'Spiermassa',u:'kg',grp:'body',src:'FITAGE-weegschaal',kw:['muscle','spier'],units:['kg','%'],excl:['skeletal_muscle_rate'],dec:1,agg:'mean',thr:.2,est:true},
  water:   {l:'Lichaamsvocht',u:'%',grp:'body',src:'FITAGE-weegschaal',kw:['water','vocht'],units:['%'],dec:1,agg:'mean',thr:.4,est:true},
  visceral:{l:'Visceraal vet',u:'',grp:'body',src:'FITAGE-weegschaal',kw:['visceral','visceraal'],units:['','level','niveau'],dec:0,agg:'mean',thr:.3,est:true},
  hr:      {l:'Hartslag',u:'bpm',grp:'heart',src:'Apple Watch via HA',kw:['heart_rate','heartrate','hartslag'],units:['bpm','beats/min','count/min','/min','slagen/min'],excl:['resting','rust','walking','lopen','wandel','variab','hrv','average','gemiddel','weegschaal','scale','fitage'],dec:0,agg:'mean',thr:9e9},
  rhr:     {l:'Rusthartslag',u:'bpm',grp:'heart',src:'Apple Watch via HA',kw:['resting_heart','resting heart','rusthartslag','resting'],units:['bpm','beats/min','count/min','/min','slagen/min'],dec:0,agg:'last',thr:1},
  hrv:     {l:'Hartslagvariabiliteit (HRV)',u:'ms',grp:'heart',src:'Apple Watch via HA',kw:['variability','hrv'],units:['ms'],dec:0,agg:'last',thr:2},
  sleep:   {l:'Slaap',u:'u',grp:'sleep',src:'Apple Watch via HA',kw:['sleep','slaap'],units:['h','hr','hrs','uur','min','s'],excl:['awake','wakker','in_bed','in bed','core','deep','diep','rem','start','end','eind'],dec:1,agg:'last',thr:.25},
  steps:   {l:'Stappen',u:'',grp:'activity',src:'iPhone/Apple Watch via HA',kw:['steps','stappen'],units:['steps','stappen',''],excl:['floor','verdieping'],dec:0,agg:'max',thr:500},
  energy:  {l:'Actieve energie',u:'kcal',grp:'activity',src:'Apple Watch via HA',kw:['active_energy','active energy','actieve energie','actieve_energie'],units:['kcal','cal','kj'],dec:0,agg:'max',thr:50}
};
const ORDER=['weight','fat','fatmass','lean','muscle','water','visceral','rhr','hrv','sleep','hr','steps','energy'];
let CFG=null,HD=null,PID=null,busy=false,lastErr='';
const emptyCfg=()=>({url:'',token:'',consent:null,map:{},units:{},cands:null});
const emptyHD=()=>({v:1,series:{},daily:{},lastOk:null,lastTry:null,lastErr:'',log:[],shown:{}});
const k1=id=>'hacfg:'+id,k2=id=>'hdata:'+id;
const nf=(v,d)=>v==null||isNaN(v)?'–':(+v).toLocaleString('nl-NL',{minimumFractionDigits:d,maximumFractionDigits:d});
const dkey=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const ago=t=>{if(!t)return'nooit';const m=Math.round((Date.now()-t)/6e4);if(m<1)return'zojuist';if(m<60)return m+' min geleden';const h=Math.round(m/60);if(h<24)return h+' uur geleden';return Math.round(h/24)+' d geleden'};
const fmtT=t=>new Date(t).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const E=s=>typeof esc==='function'?esc(s):String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- opslag ---------- */
async function load(id){PID=id;CFG=emptyCfg();HD=emptyHD();if(!id)return;
  try{const c=await idbGet(k1(id));if(c)CFG={...emptyCfg(),...JSON.parse(c)}}catch(e){}
  try{const d=await idbGet(k2(id));if(d)HD={...emptyHD(),...JSON.parse(d)}}catch(e){}}
function saveCfg(){if(PID)return idbSet(k1(PID),JSON.stringify(CFG)).catch(()=>{})}
function saveHD(){if(PID)return idbSet(k2(PID),JSON.stringify(HD)).catch(()=>{})}
const configured=()=>!!(CFG&&CFG.url&&CFG.token&&CFG.consent&&Object.values(CFG.map||{}).some(Boolean));

/* ---------- Home Assistant ---------- */
function normUrl(u){u=(u||'').trim().replace(/\/+$/,'');if(!u)throw new Error('Vul de URL van je Home Assistant in.');
  let x;try{x=new URL(u)}catch(e){throw new Error('Dit is geen geldige URL.')}
  if(x.protocol!=='https:')throw new Error('Alleen een beveiligde https://-verbinding is toegestaan. Gebruik je externe HA-adres (bijv. Nabu Casa of je eigen domein met certificaat).');
  if(x.username||x.password)throw new Error('Zet geen gebruikersnaam of wachtwoord in de URL.');
  return x.origin+x.pathname.replace(/\/+$/,'')}
async function ha(path,c=CFG,body){const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),20000);let r;
  try{r=await fetch(c.url+path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined,headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},signal:ctl.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'})}
  catch(e){throw new Error(e.name==='AbortError'?'Home Assistant reageert niet binnen 20 seconden.':'Geen verbinding met Home Assistant. Controleer de URL, je internetverbinding en of dit adres in cors_allowed_origins staat.')}
  finally{clearTimeout(to)}
  if(r.status===401||r.status===403)throw new Error('Het token wordt geweigerd ('+r.status+'). Maak een nieuw langlevend toegangstoken.');
  if(!r.ok)throw new Error('Home Assistant gaf foutcode '+r.status+'.');
  return r.json()}
function wsStats(ids,start){return new Promise((res,rej)=>{let ws,done=false;const fin=(f,v)=>{if(done)return;done=true;clearTimeout(to);try{ws.close()}catch(e){}f(v)};
  const to=setTimeout(()=>fin(rej,new Error('time-out')),25000);
  try{ws=new WebSocket(CFG.url.replace(/^https:/,'wss:')+'/api/websocket')}catch(e){return fin(rej,e)}
  ws.onerror=()=>fin(rej,new Error('websocket'));
  ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
    if(m.type==='auth_required')ws.send(JSON.stringify({type:'auth',access_token:CFG.token}));
    else if(m.type==='auth_invalid')fin(rej,new Error('token'));
    else if(m.type==='auth_ok')ws.send(JSON.stringify({id:1,type:'recorder/statistics_during_period',start_time:new Date(start).toISOString(),statistic_ids:ids,period:'day',types:['mean','max'],units:{}}));
    else if(m.id===1)m.success?fin(res,m.result||{}):fin(rej,new Error((m.error&&m.error.message)||'statistiek'))}})}

/* ---------- sensoren herkennen ---------- */
function score(m,st){const M=METRICS[m];const id=st.entity_id.toLowerCase();if(!id.startsWith('sensor.')&&!id.startsWith('input_number.'))return 0;
  const fn=((st.attributes&&st.attributes.friendly_name)||'').toLowerCase();const hay=id+' '+fn;const unit=((st.attributes&&st.attributes.unit_of_measurement)||'').toLowerCase().trim();
  if(!M.kw.some(k=>hay.includes(k)))return 0;if((M.excl||[]).some(k=>hay.includes(k)))return 0;
  let s=2;if(M.units.includes(unit))s+=2;else if(unit&&!M.units.includes(''))return 0;
  if(M.grp==='body'&&/fitage|scale|weegschaal/.test(hay))s+=3;
  if(M.grp!=='body'&&/health|gezondheid|watch|iphone/.test(hay))s+=1;
  if(isNaN(parseFloat(st.state))&&!['unavailable','unknown'].includes(st.state))s-=2;
  return s}
function discover(states){const out={};for(const m of ORDER){out[m]=states.map(st=>({id:st.entity_id,name:(st.attributes&&st.attributes.friendly_name)||st.entity_id,unit:(st.attributes&&st.attributes.unit_of_measurement)||'',state:st.state,sc:score(m,st),stat:!!(st.attributes&&st.attributes.state_class)})).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,8)}return out}

/* ---------- waarden ---------- */
function conv(m,v,unit){unit=(unit||'').toLowerCase();
  if(m==='weight'&&/^lbs?$/.test(unit))return v*0.45359237;
  if(m==='sleep'){if(unit==='min')return v/60;if(unit==='s')return v/3600}
  if(m==='energy'&&unit==='kj')return v/4.184;
  if(m==='energy'&&unit==='cal'&&v>20000)return v/1000;
  return v}
function plausible(m,v){const R={fatmass:[1,150],lean:[15,150],weight:[25,300],fat:[2,70],muscle:[5,150],water:[20,85],visceral:[0,60],hr:[25,240],rhr:[25,140],hrv:[1,400],sleep:[0,18],steps:[0,150000],energy:[0,10000]}[m];return R?v>=R[0]&&v<=R[1]:true}
function addSamples(m,arr){const s=HD.series[m]||(HD.series[m]=[]);const seen=new Set(s.map(p=>p[0]));let n=0;
  for(const [t,v] of arr){const tt=Math.round(t/1000)*1000;if(seen.has(tt))continue;
    if(m==='weight'&&s.some(p=>Math.abs(p[0]-tt)<180e3&&Math.abs(p[1]-v)<0.05))continue; // zelfde weging dubbel gemeld
    s.push([tt,v]);seen.add(tt);n++}
  s.sort((a,b)=>a[0]-b[0]);return n}
/* Geen vetpercentage-sensor, wel vetmassa + gewicht: percentage berekenen per weging (gelabeld als berekend). */
function deriveFat(){if(CFG.map.fat||!HD.series.fatmass||!HD.series.weight)return;const W=HD.series.weight;const pts=[];
  for(const [t,m] of HD.series.fatmass){const w=W.find(p=>Math.abs(p[0]-t)<10*6e4);if(w&&w[1]>0)pts.push([t,m/w[1]*100])}
  if(pts.length){addSamples('fat',pts);HD.fatDerived=true}}
function prune(){const cut=Date.now()-120*DAY;const s=HD.series.hr;if(!s||!s.length||s[0][0]>=cut)return;
  const old=s.filter(p=>p[0]<cut);const by={};old.forEach(p=>{const k=dkey(p[0]);(by[k]=by[k]||[]).push(p[1])});
  const d=HD.daily.hr||(HD.daily.hr={});for(const k in by)if(!d[k])d[k]=by[k].reduce((a,b)=>a+b,0)/by[k].length;
  HD.series.hr=s.filter(p=>p[0]>=cut)}
/* dagwaarden: eigen metingen eerst, HA-langetermijnstatistiek alleen voor dagen zonder metingen */
function days(m){const M=METRICS[m];const s=HD.series[m]||[];const by={};s.forEach(p=>{const k=dkey(p[0]);(by[k]=by[k]||[]).push(p[1])});
  const out={};for(const k in by){const a=by[k];out[k]={v:M.agg==='max'?Math.max(...a):M.agg==='last'?a[a.length-1]:a.reduce((x,y)=>x+y,0)/a.length,n:a.length,src:'meting'}}
  const st=HD.daily[m]||{};for(const k in st)if(!out[k])out[k]={v:st[k],n:0,src:'HA-statistiek'};
  return Object.keys(out).sort().map(k=>({d:k,t:new Date(k+'T12:00:00').getTime(),...out[k]}))}
function latest(m){const s=HD.series[m];if(s&&s.length)return{t:s[s.length-1][0],v:s[s.length-1][1]};const d=days(m);return d.length?{t:d[d.length-1].t,v:d[d.length-1].v,stat:true}:null}
function inRange(m,from){return days(m).filter(x=>x.t>=from)}
function trend(m,from){const pts=inRange(m,from);if(pts.length<4)return null;const t0=pts[0].t;
  const xs=pts.map(p=>(p.t-t0)/(7*DAY)),ys=pts.map(p=>p.v);const n=xs.length,mx=xs.reduce((a,b)=>a+b)/n,my=ys.reduce((a,b)=>a+b)/n;
  let sxy=0,sxx=0;for(let i=0;i<n;i++){sxy+=(xs[i]-mx)*(ys[i]-my);sxx+=(xs[i]-mx)**2}if(!sxx)return null;const sl=sxy/sxx;
  const span=xs[n-1];if(span<1)return null;const thr=METRICS[m].thr;
  return{slope:sl,n,label:Math.abs(sl)<thr?'stabiel':sl>0?'stijgend':'dalend'}}
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const median=a=>{if(!a.length)return null;const b=[...a].sort((x,y)=>x-y);const i=b.length>>1;return b.length%2?b[i]:(b[i-1]+b[i])/2};

/* weegbereik per profiel: standaard rond je profielgewicht */
function range(){if(CFG.wr&&CFG.wr[0]<CFG.wr[1])return CFG.wr;const w=(typeof S!=='undefined'&&S.profile&&+S.profile.weight)||75;return w>=78?[78,115]:[Math.max(40,Math.round(w-12)),Math.round(w+10)]}
/* ---------- synchronisatie ---------- */
async function sync(opts={}){if(busy)return{skip:true};if(!configured()){return{err:'Niet gekoppeld'}}
  busy=true;HD.lastTry=Date.now();refreshStatus();const now=Date.now();const map=CFG.map;const ids=Object.values(map).filter(Boolean);const added={};
  try{
    const first=!HD.lastOk||opts.full;const since=first?now-10*DAY:HD.lastOk-3*3600e3;
    const path='/api/history/period/'+encodeURIComponent(new Date(since).toISOString())+'?filter_entity_id='+encodeURIComponent(ids.join(','))+'&end_time='+encodeURIComponent(new Date(now).toISOString())+'&minimal_response&no_attributes';
    const res=await ha(path);
    /* Gedeelde weegschaal: alleen wegingen binnen MIJN weegbereik horen bij mij; vet-/spierwaarden alleen als ze bij zo'n weging horen. */
    const wr=range();const wArr=(res||[]).find(a=>a&&a.length&&a[0].entity_id===map.weight)||[];const rawW=[];
    for(const r of wArr){const v=conv('weight',parseFloat(r.state),CFG.units.weight);const t=Date.parse(r.last_changed||r.last_updated);if(!isNaN(v)&&t&&v>0)rawW.push([t,v])}
    const shared=id=>/weegschaal|fitage|scale|account/i.test(id)||!/iphone|ipad|watch|health/i.test(id);
    const mine=t=>{const near=rawW.filter(p=>Math.abs(p[0]-t)<10*6e4);return near.length&&near.some(p=>p[1]>=wr[0]&&p[1]<=wr[1])};let skipped=0;
    for(const arr of (res||[])){if(!arr||!arr.length)continue;const eid=arr[0].entity_id;const ms=Object.keys(map).filter(k=>map[k]===eid);
      for(const m of ms){const unit=CFG.units[m]||'';const pts=[];for(const r of arr){const v=parseFloat(r.state);if(isNaN(v))continue;const t=Date.parse(r.last_changed||r.last_updated);if(!t)continue;const cv=conv(m,v,unit);if(!plausible(m,cv))continue;
          if(METRICS[m].grp==='body'&&map.weight&&shared(eid)){if(m==='weight'?(cv<wr[0]||cv>wr[1]):!mine(t)){skipped++;continue}}pts.push([t,cv])}
        added[m]=(added[m]||0)+addSamples(m,pts)}}
    if(skipped)HD.log.unshift({t:now,msg:skipped+' weegwaarden van andere gezinsleden overgeslagen (buiten '+wr[0]+'–'+wr[1]+' kg).'});
    if(first){try{const sids=ORDER.filter(m=>map[m]&&m!=='hr'&&METRICS[m].grp!=='body');const st=await wsStats(sids.map(m=>map[m]),now-730*DAY);
        for(const m of sids){const rows=st[map[m]]||[];const d=HD.daily[m]||(HD.daily[m]={});const M=METRICS[m];
          rows.forEach(r=>{const t=typeof r.start==='number'?r.start:Date.parse(r.start);const raw=M.agg==='max'?(r.max!=null?r.max:r.mean):(r.mean!=null?r.mean:r.max);if(raw==null||!t)return;const v=conv(m,raw,CFG.units[m]);if(plausible(m,v))d[dkey(t)]=v})}
        HD.log.unshift({t:now,msg:'Langetermijnstatistiek opgehaald (daggemiddelden).'})}
      catch(e){HD.log.unshift({t:now,msg:'Geen langetermijnstatistiek beschikbaar ('+e.message+'); alleen recente historie (HA bewaart standaard 10 dagen).'})}}
    deriveFat();prune();linkAll();HD.lastOk=now;HD.lastErr='';lastErr='';
    const tot=Object.values(added).reduce((a,b)=>a+b,0);HD.log.unshift({t:now,msg:tot?tot+' nieuwe metingen: '+Object.keys(added).filter(k=>added[k]).map(k=>METRICS[k].l.toLowerCase()+' '+added[k]).join(', '):'Geen nieuwe metingen.'});
    HD.log=HD.log.slice(0,20);await saveHD();busy=false;refreshStatus();return{ok:true,added:tot}}
  catch(e){HD.lastErr=e.message;lastErr=e.message;HD.log.unshift({t:now,msg:'Fout: '+e.message});HD.log=HD.log.slice(0,20);await saveHD();busy=false;refreshStatus();return{err:e.message}}}
function refreshStatus(){const el=document.getElementById('hsync');if(el)el.outerHTML=statusLine();}
function statusLine(){if(!CFG||!CFG.url)return'<span id="hsync" class="small mut">Niet gekoppeld</span>';
  const col=busy?'var(--acc2)':HD.lastErr?'var(--bad)':HD.lastOk&&Date.now()-HD.lastOk<26*3600e3?'var(--ok)':'var(--acc2)';
  const txt=busy?'Synchroniseren…':HD.lastErr?'Synchronisatie mislukt':HD.lastOk?'Gesynchroniseerd '+ago(HD.lastOk):'Nog niet gesynchroniseerd';
  return`<span id="hsync" class="small" style="display:inline-flex;align-items:center;gap:6px"><i style="width:8px;height:8px;border-radius:50%;background:${col};display:inline-block"></i>${txt}</span>`}

/* ---------- hartslag aan trainingen ---------- */
function wWindow(w){let st=w.start||null,en=w.end||null;if(!st&&w.date&&/T\d\d:\d\d/.test(w.date))st=new Date(w.date).getTime();
  if(st&&!en&&w.durationMin)en=st+w.durationMin*6e4;return st&&en?[st,en]:null}
function hrFor(w){const win=wWindow(w);if(!win)return null;const s=(HD.series.hr||[]).filter(p=>p[0]>=win[0]-60e3&&p[0]<=win[1]+60e3).map(p=>p[1]);return{n:s.length,avg:avg(s),max:s.length?Math.max(...s):null,min:s.length?Math.min(...s):null}}
function linkAll(){if(!CFG.map.hr||typeof S==='undefined')return 0;let n=0;const from=Date.now()-120*DAY;
  for(const w of S.workouts){if(w.test||w.source==='ref')continue;const win=wWindow(w);if(!win||win[0]<from)continue;const h=hrFor(w);if(!h)continue;
    if(h.n>=3){const nw={avg:Math.round(h.avg),max:Math.round(h.max),n:h.n,src:'Apple Watch via Home Assistant'};if(!w.hr||w.hr.n<nw.n){w.hr=nw;n++}}
    else if(!w.hr&&Date.now()-win[1]>3*3600e3)w.hrNote=h.n?'te weinig hartslagmetingen ('+h.n+')':'geen hartslagmetingen in dit tijdvak'}
  if(n&&typeof save==='function')save();return n}
async function linkWorkout(w){if(!configured()||!CFG.map.hr)return;const win=wWindow(w);if(!win)return;
  try{const path='/api/history/period/'+encodeURIComponent(new Date(win[0]-60e3).toISOString())+'?filter_entity_id='+encodeURIComponent(CFG.map.hr)+'&end_time='+encodeURIComponent(new Date(win[1]+60e3).toISOString())+'&minimal_response&no_attributes';
    const res=await ha(path);const pts=[];(res[0]||[]).forEach(r=>{const v=parseFloat(r.state);const t=Date.parse(r.last_changed||r.last_updated);if(!isNaN(v)&&t&&plausible('hr',v))pts.push([t,v])});addSamples('hr',pts);await saveHD();
    linkAll();const el=document.getElementById('sumhr');if(el)el.innerHTML=hrBlock(w)}catch(e){const el=document.getElementById('sumhr');if(el)el.innerHTML='<div class="small mut">Hartslag ophalen mislukte: '+E(e.message)+' Hij wordt bij de volgende synchronisatie opnieuw geprobeerd.</div>'}}
function hrBlock(w){if(w.hr)return`<div class="card" style="margin:10px 0"><div class="row sp"><b>Hartslag</b><span class="chip ok">gemeten</span></div><div class="stats" style="margin-top:8px"><div class="stat"><b>${w.hr.avg}</b><span>gem. bpm</span></div><div class="stat"><b>${w.hr.max}</b><span>max. bpm</span></div><div class="stat"><b>${w.hr.n}</b><span>metingen</span></div></div><div class="tiny mut" style="margin-top:6px">${E(w.hr.src)}. Gekoppeld op begin- en eindtijd. De Companion-app levert hooguit elke ±30 s een waarde, dus dit is een benadering, geen volledige workoutregistratie.</div></div>`;
  if(w.hrNote)return`<div class="small mut" style="margin:8px 0">Hartslag: ${E(w.hrNote)}.</div>`;
  if(configured()&&CFG.map.hr)return'<div class="small mut" style="margin:8px 0">Hartslag wordt opgehaald…</div>';return''}

/* ---------- herstel & inzichten (vaste regels) ---------- */
function recovery(){const r={flags:[],ok:[],have:0};const now=Date.now();
  const rd=inRange('rhr',now-35*DAY);if(rd.length>=8){r.have++;const last=rd[rd.length-1];const base=median(rd.slice(0,-1).map(x=>x.v));if(now-last.t<2*DAY){const df=last.v-base;(df>=5?r.flags:r.ok).push({m:'rhr',t:df>=5?`Rusthartslag ${nf(last.v,0)} bpm, ${nf(df,0)} boven je gebruikelijke ${nf(base,0)}`:`Rusthartslag ${nf(last.v,0)} bpm (gebruikelijk ${nf(base,0)})`})}}
  const hv=inRange('hrv',now-35*DAY);if(hv.length>=8){r.have++;const rec=hv.filter(x=>x.t>=now-3*DAY);const base=median(hv.filter(x=>x.t<now-3*DAY).map(x=>x.v));if(rec.length&&base){const a=avg(rec.map(x=>x.v));const pc=(a-base)/base*100;(pc<=-15?r.flags:r.ok).push({m:'hrv',t:`HRV ${nf(a,0)} ms (laatste dagen), ${pc<=-15?nf(-pc,0)+'% lager dan':'vergelijkbaar met'} je gebruikelijke ${nf(base,0)} ms`})}}
  const sl=inRange('sleep',now-2*DAY);if(sl.length){r.have++;const v=sl[sl.length-1].v;(v<6?r.flags:r.ok).push({m:'sleep',t:`Slaap afgelopen nacht ${nf(v,1)} uur`})}
  let sets=0;try{S.workouts.filter(w=>!w.test&&w.source!=='ref'&&Date.now()-new Date(w.date)<2*DAY).forEach(w=>w.exercises.forEach(e=>sets+=e.sets.filter(s=>s.type!=='w').length))}catch(e){}
  r.sets48=sets;
  if(!r.have){r.level=null;r.sum='Nog geen hersteldata. Rusthartslag en HRV hebben minimaal 8 dagen metingen nodig; slaap moet van afgelopen nacht zijn.'}
  else if(r.flags.length>=2||(r.flags.length===1&&sets>=40)){r.level='licht';r.sum='Suggestie: houd het vandaag lichter (minder sets of ±10% minder weerstand) of neem een rustdag.'}
  else if(r.flags.length===1){r.level='let';r.sum='Suggestie: train normaal, maar luister naar je lichaam en stop een set eerder als het zwaar voelt.'}
  else{r.level='goed';r.sum='Je gemeten waarden liggen binnen je normale bereik. Suggestie: train volgens schema.'}
  return r}
/* Readiness 0–100: BEREKEND met vaste formule uit je eigen metingen t.o.v. je eigen mediaan. Geen diagnose, geen AI. */
function weekStats(from,to){if(!configured())return null;const o={};for(const m of ['sleep','rhr','hrv','steps','weight']){if(!CFG.map[m])continue;const pts=days(m).filter(x=>x.t>=from&&x.t<to);if(!pts.length)continue;o[m]={avg:avg(pts.map(x=>x.v)),n:pts.length,first:pts[0].v,last:pts[pts.length-1].v}}return o}
function readiness(){const now=Date.now();const parts=[];const cl=v=>Math.max(0,Math.min(100,v));
  const hv=inRange('hrv',now-35*DAY);if(hv.length>=8){const rec=hv.filter(x=>x.t>=now-3*DAY);const base=median(hv.filter(x=>x.t<now-3*DAY).map(x=>x.v));if(rec.length&&base){const pc=(avg(rec.map(x=>x.v))-base)/base*100;parts.push({m:'hrv',l:'HRV',w:.35,s:cl(80+pc*2.5),t:(pc>=0?'+':'')+nf(pc,0)+'% t.o.v. normaal'})}}
  const rd=inRange('rhr',now-35*DAY);if(rd.length>=8){const last=rd[rd.length-1];if(now-last.t<2*DAY){const base=median(rd.slice(0,-1).map(x=>x.v));const df=last.v-base;parts.push({m:'rhr',l:'Rusthartslag',w:.3,s:cl(80-df*8),t:(df>=0?'+':'')+nf(df,0)+' bpm t.o.v. normaal'})}}
  const sl=inRange('sleep',now-2*DAY);if(sl.length){const v=sl[sl.length-1].v;parts.push({m:'sleep',l:'Slaap',w:.35,s:cl((v-4)/4*100),t:nf(v,1)+' uur'})}
  if(!parts.length)return null;
  let sets=0;try{S.workouts.filter(w=>!w.test&&w.source!=='ref'&&now-new Date(w.date)<2*DAY).forEach(w=>w.exercises.forEach(e=>sets+=e.sets.filter(s=>s.type!=='w').length))}catch(e){}
  const W=parts.reduce((a,p)=>a+p.w,0);const phys=parts.reduce((a,p)=>a+p.s*p.w,0)/W;const load=cl(100-Math.max(0,sets-20)*2);
  let score=Math.round(phys*.85+load*.15);const rc=recovery();if(rc.level==='licht')score=Math.min(score,49);else if(rc.level==='let')score=Math.min(score,74);parts.push({m:'load',l:'Belasting 48 u',w:0,s:Math.round(load),t:sets+' sets'});
  const lvl=score>=75?'zwaar':score>=50?'normaal':'licht';
  const adv={zwaar:'Je kunt vandaag volgens schema of zwaar trainen.',normaal:'Train normaal; stop een set eerder als het zwaar voelt.',licht:'Houd het licht (minder sets of ±10% minder weerstand) of neem rust.'}[lvl];
  return{score,lvl,adv,parts,n:parts.length-1}}
function readyRing(R,big){const sz=big?96:64,r=sz/2-7,c=2*Math.PI*r;const col=R.lvl==='zwaar'?'var(--ok,#34d399)':R.lvl==='normaal'?'var(--acc,#a5b4fc)':'var(--warn,#fbbf24)';
  return`<svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" style="flex:none"><circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="7"/><circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c*R.score/100} ${c}" transform="rotate(-90 ${sz/2} ${sz/2})"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="currentColor" font-size="${big?26:18}" font-weight="800">${R.score}</text></svg>`}
function readyCard(big){const R=readiness();if(!R)return'';
  return`<div class="row" style="gap:12px;align-items:center;margin-top:8px">${readyRing(R,big)}<div class="grow"><div class="row sp"><b>Readiness · ${R.lvl==='zwaar'?'zwaar mag':R.lvl}</b><span class="chip">berekend</span></div><div class="small" style="margin-top:3px">${E(R.adv)}</div>
  ${big?`<div class="tiny mut" style="margin-top:6px">${R.parts.map(p=>`${E(p.l)} ${Math.round(p.s)} (${E(p.t)})`).join(' · ')}</div><div class="tiny mut" style="margin-top:4px">Vaste formule: HRV 35%, rusthartslag 30%, slaap 35% t.o.v. je eigen normaal, gecorrigeerd voor sets in 48 uur. Ontbrekende metingen tellen niet mee (nu ${R.n} van 3). Geen diagnose.</div>`:''}</div></div>`}
function strengthTrend(){const out=[];try{const from=Date.now()-42*DAY;const seen=new Set();
  S.workouts.filter(w=>typeof real!=='function'||real(w)).forEach(w=>w.exercises.forEach(e=>{if(e.ex!=null)seen.add(e.ex)}));
  for(const n of seen){const ss=sessionsFor(n,{ref:false}).filter(s=>new Date(s.w.date)>=from).sort((a,b)=>a.w.date.localeCompare(b.w.date));if(ss.length<2)continue;
    const b=s=>Math.max(...s.sets.filter(x=>x.type!=='w').map(x=>e1rm(eff(x),x.reps)).filter(isFinite));const a0=b(ss[0]),a1=b(ss[ss.length-1]);if(!(a0>0&&a1>0))continue;out.push({ex:n,pc:(a1-a0)/a0*100,n:ss.length})}}catch(e){}
  return out.sort((a,b)=>b.n-a.n)}
function insights(){const L=[];const now=Date.now();const p=(typeof S!=='undefined'&&S.profile)||{};
  const w=latest('weight');if(w){const t30=trend('weight',now-30*DAY);const a7=avg(inRange('weight',now-7*DAY).map(x=>x.v));
    L.push({id:'w',kind:'gemeten',text:`Laatste weging ${nf(w.v,1)} kg (${fmtT(w.t)}).`});
    if(a7!=null)L.push({id:'w7',kind:'berekend',text:`Gemiddeld ${nf(a7,1)} kg over 7 dagen${p.targetWeight?`; doel ${nf(p.targetWeight,1)} kg (${a7<p.targetWeight?'nog '+nf(p.targetWeight-a7,1)+' kg erbij':a7>p.targetWeight+0.5?nf(a7-p.targetWeight,1)+' kg boven doel':'op doel'})`:''}.`});
    if(t30)L.push({id:'wt',kind:'berekend',text:`Gewichtstrend 30 dagen: ${t30.label} (${t30.slope>=0?'+':''}${nf(t30.slope,2)} kg/week, ${t30.n} dagen).`});
    if(t30&&p.goal==='spier'&&p.targetWeight&&w.v<p.targetWeight&&t30.label!=='stijgend')L.push({id:'ws',kind:'suggestie',text:'Je wilt aankomen maar je gewicht stijgt niet. Voor spieropbouw is een rustige stijging van ±0,1–0,25 kg per week gebruikelijk; kijk eerst naar je dagelijkse eetpatroon.'})}
  const f=trend('fat',now-60*DAY);if(f)L.push({id:'f',kind:'berekend',text:`Vetpercentage 60 dagen: ${f.label} (${f.slope>=0?'+':''}${nf(f.slope,2)} %-punt/week). Dit is een schatting van de weegschaal (bio-impedantie) en schommelt met je vochtbalans; alleen de trend over weken is zinvol.`});
  const st=strengthTrend();if(st.length){const up=st.filter(x=>x.pc>2).length,dn=st.filter(x=>x.pc<-3).length;const wt=trend('weight',now-42*DAY);
    L.push({id:'s',kind:'berekend',text:`Kracht (geschatte 1RM, 6 weken): ${up} van ${st.length} oefeningen vooruit${dn?', '+dn+' achteruit':''}${wt?`, gewicht ${wt.label}`:''}.`});
    if(wt&&up>st.length/2&&wt.label!=='dalend')L.push({id:'s2',kind:'suggestie',text:'Je kracht stijgt bij een stabiel of stijgend gewicht: je schema werkt. Houd de dubbele progressie vast.'});
    if(dn>st.length/2&&recovery().flags.length)L.push({id:'s3',kind:'suggestie',text:'Je kracht daalt en je herstelwaarden zijn minder dan normaal. Overweeg een lichtere week (deload).'})}
  const r=recovery();if(r.level){r.flags.concat(r.ok).forEach((x,i)=>L.push({id:'r'+i,kind:'gemeten',text:x.t+'.'}));L.push({id:'r',kind:'suggestie',text:r.sum})}
  const sl7=avg(inRange('sleep',now-7*DAY).map(x=>x.v)),sl30=avg(inRange('sleep',now-30*DAY).map(x=>x.v));if(sl7!=null&&sl30!=null&&inRange('sleep',now-30*DAY).length>=10)L.push({id:'sl',kind:'berekend',text:`Slaap gemiddeld ${nf(sl7,1)} uur (7 d) tegen ${nf(sl30,1)} uur (30 d).`});
  return L}
const KCH={gemeten:'<span class="chip ok">gemeten</span>',berekend:'<span class="chip">berekend</span>',suggestie:'<span class="chip acc">suggestie</span>'};
function answer(t){if(!/gezond|herstel|hersteld|slaap|hartslag|hrv|gewicht|weeg|vetpercentage|vet%|lichaam|rustdag|moe\b/.test(t))return null;
  if(!configured())return'Ik heb nog geen gezondheidsgegevens. Koppel je Home Assistant via Gezondheid → Koppelen; daarna kan ik je gewicht, slaap, hartslag en herstel meenemen.';
  let L=insights();if(/slaap/.test(t))L=L.filter(x=>/^(sl|r)/.test(x.id));else if(/gewicht|weeg|vet/.test(t))L=L.filter(x=>/^(w|f)/.test(x.id));else if(/herstel|hartslag|hrv|moe|rustdag/.test(t))L=L.filter(x=>/^r/.test(x.id));
  if(!L.length)return'Daarvoor heb ik nog te weinig metingen.';return L.map(x=>`(${x.kind}) ${x.text}`).join(' ')+' Ik werk met vaste regels en geef geen medisch advies.'}

/* ---------- UI ---------- */
const PER=[['7','7 d',7],['30','30 d',30],['90','90 d',90],['365','1 jaar',365],['all','Alles',null]];
function series(m,per){const from=per?Date.now()-per*DAY:0;let pts=inRange(m,from);
  if(pts.length>120){const by={};pts.forEach(p=>{const d=new Date(p.t);const wk=new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7)).getTime();(by[wk]=by[wk]||[]).push(p.v)});pts=Object.keys(by).sort().map(k=>({t:+k,v:avg(by[k])}))}
  return pts}
function metricCard(m,per){const M=METRICS[m];const lt=latest(m);if(!lt)return'';const pts=series(m,per);const from=per?Date.now()-per*DAY:0;const a=avg(inRange(m,from).map(x=>x.v));const tr=trend(m,from);
  const unit=m==='sleep'?' uur':M.u?' '+M.u:'';const derived=m==='fat'&&HD.fatDerived&&!CFG.map.fat;const fmt=v=>nf(v,M.dec);
  const statOnly=pts.length&&pts.every(p=>p.src==='HA-statistiek');
  return`<div class="card"><div class="row sp"><h2 style="margin:0">${M.l}</h2><span class="chip">${derived?'berekend':E(M.src)}</span></div>
  <div class="stats" style="margin-top:10px"><div class="stat"><b>${fmt(lt.v)}</b><span>laatste meting${lt.stat?' (dag)':''}</span></div><div class="stat"><b>${a!=null?fmt(a):'–'}</b><span>gemiddelde</span></div><div class="stat"><b style="font-size:15px">${tr?tr.label:'–'}</b><span>trend${tr?' '+(tr.slope>=0?'+':'')+nf(tr.slope,M.dec+1)+'/wk':''}</span></div></div>
  ${typeof chart==='function'?chart(pts.map(p=>({x:new Date(p.t).toISOString(),y:p.v})),{h:120,fmt}):''}
  <div class="tiny mut" style="margin-top:4px">Laatste meting: ${fmtT(lt.t)}${unit?' · eenheid'+unit:''}. ${M.agg==='max'?'Dagwaarde = hoogste stand van de dag.':M.agg==='last'?'Dagwaarde = laatste waarde van de dag.':'Dagwaarde = daggemiddelde.'}${statOnly?' Oudere punten komen uit de HA-langetermijnstatistiek.':''}${derived?' Berekend uit vetmassa ÷ gewicht van dezelfde weging.':''}${M.est?' Schatting van de weegschaal; kijk naar de trend.':''}${!tr?' Trend: minimaal 4 dagen over ruim een week nodig.':''}</div></div>`}
function view(){const per=(S.ui.hp||'30');const P=PER.find(x=>x[0]===per)||PER[1];
  let h=hdr('Gezondheid','Lichaam, hartslag, slaap en herstel');
  if(!CFG||!CFG.url||!CFG.consent){return h+`<div class="card"><h2>Nog niet gekoppeld</h2><div class="small mut" style="margin-bottom:10px">Hier komen je FITAGE-metingen (gewicht, vetpercentage, spiermassa) en je Apple Watch-gegevens (rusthartslag, HRV, slaap, stappen). Ze komen uit je eigen Home Assistant en blijven op deze iPhone. Er worden geen voorbeeld- of nepwaarden getoond.</div><button class="btn pri full" data-a="h_setup">Koppelen met Home Assistant</button></div>
   <div class="card"><h2>Hoe het werkt</h2><div class="small mut">1. FITAGE-weegschaal → Home Assistant (heb je al).<br>2. Apple Watch → Apple Gezondheid → HA Companion-app (Apple Health-sensoren aanzetten).<br>3. Deze app haalt de waarden via een beveiligde https-verbinding op uit Home Assistant, bij openen en met "Nu synchroniseren".<br><br>Een website kan Apple Gezondheid niet rechtstreeks of live uitlezen; daarom loopt het via Home Assistant.</div></div>`}
  const r=recovery();const ms=ORDER.filter(m=>(CFG.map[m]||(m==='fat'&&HD.fatDerived))&&m!=='hr');
  h+=`<div class="card"><div class="row sp">${statusLine()}<button class="btn sm" data-a="h_sync">Nu synchroniseren</button></div>${HD.lastErr?`<div class="banner warn" style="margin-top:8px">${E(HD.lastErr)} Je opgeslagen gegevens blijven bewaard.</div>`:''}</div>`;
  h+=`<div class="card"><div class="row sp"><h2 style="margin:0">Herstel vandaag</h2><span class="chip acc">suggestie</span></div>${readyCard(true)}${r.flags.concat(r.ok).map(x=>`<div class="small" style="margin-top:6px">${r.flags.includes(x)?'⚠️':'✓'} ${E(x.t)}</div>`).join('')}<div class="small" style="margin-top:8px"><b>${E(r.sum)}</b></div>${r.sets48?`<div class="tiny mut" style="margin-top:4px">Trainingsbelasting laatste 48 uur: ${r.sets48} sets.</div>`:''}<div class="tiny mut" style="margin-top:6px">Vaste regels: rusthartslag ≥5 bpm boven je mediaan, HRV ≥15% onder je mediaan, of minder dan 6 uur slaap. Geen diagnose.</div></div>`;
  h+=`<div class="seg" style="margin:4px 0 10px">${PER.map(x=>`<button class="${x[0]===P[0]?'on':''}" data-a="h_per" data-k="${x[0]}">${x[1]}</button>`).join('')}</div>`;
  const cards=ms.map(m=>metricCard(m,P[2])).filter(Boolean);h+=cards.length?cards.join(''):'<div class="card small mut">Nog geen metingen opgehaald. Tik op "Nu synchroniseren".</div>';
  const wl=(S.workouts||[]).filter(w=>w.hr).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  if(CFG.map.hr)h+=`<div class="card"><h2>Hartslag tijdens trainingen</h2>${wl.length?`<div class="list">${wl.map(w=>`<div class="li"><div class="grow"><div>${E(w.name)}</div><div class="small mut">${fmtT(new Date(w.date).getTime())}</div></div><div style="text-align:right"><b>${w.hr.avg}</b> <span class="small mut">gem.</span> · <b>${w.hr.max}</b> <span class="small mut">max</span></div></div>`).join('')}</div>`:'<div class="small mut">Nog geen trainingen met hartslag. Draag je Apple Watch tijdens het trainen; na afloop koppelt de app de metingen op begin- en eindtijd.</div>'}</div>`;
  const L=insights().filter(x=>x.kind!=='gemeten');if(L.length)h+=`<div class="card"><div class="soph" style="margin-bottom:8px">${typeof avatar==='function'?avatar():''}<div><b>Sophie</b><div class="tiny mut">Vaste regels op basis van je gegevens · geen medisch advies</div></div></div>${L.map(x=>`<div class="small" style="margin:8px 0">${KCH[x.kind]} ${E(x.text)}</div>`).join('')}</div>`;
  h+=`<div class="card"><div class="row sp"><h2 style="margin:0">Koppeling</h2><button class="btn sm" data-a="h_setup">Beheren</button></div><div class="tiny mut" style="margin-top:6px">${ms.length} lichaams-/gezondheidsmetingen gekoppeld${CFG.map.hr?' + hartslag':''}. Laatste acties:<br>${HD.log.slice(0,4).map(x=>fmtT(x.t)+' — '+E(x.msg)).join('<br>')||'—'}</div></div>`;
  return h}
function todayCard(){if(!configured())return'';const r=recovery();const w=latest('weight');if(!r.level&&!w&&!readiness())return'';
  const t=w?trend('weight',Date.now()-30*DAY):null;
  return`<div class="card"><div class="row sp"><h2 style="margin:0">Gezondheid</h2>${statusLine()}</div>
  ${w?`<div class="small" style="margin-top:8px">${KCH.gemeten} ${nf(w.v,1)} kg · ${ago(w.t)}${t?` · trend ${t.label}`:''}</div>`:''}
  ${readiness()?readyCard(false):r.level?`<div class="small" style="margin-top:6px">${KCH.suggestie} ${E(r.sum)}</div>`:''}
  <button class="btn sm" style="margin-top:8px" data-a="tab" data-k="gezondheid">Bekijk details</button></div>`}
function settingsCard(){return`<div class="card"><div class="row sp"><h2 style="margin:0">Back-up in Home Assistant</h2><span class="small ${CFG&&CFG.haBackupOk&&!CFG.haBackupErr?'':'mut'}">${CFG&&CFG.haBackup?(CFG.haBackupOk?'✓ '+ago(CFG.haBackupOk):'nog niet gelukt'):'uit'}</span></div>
  <div class="tiny mut" style="margin:6px 0 8px">${CFG&&CFG.haBackup?'Na elke training gaat er automatisch een back-up naar je eigen Home Assistant.'+(CFG.haBackupErr?' Laatste poging mislukt: '+E(CFG.haBackupErr):''):'Zet aan via "Koppeling beheren". Dan ben je niet meer afhankelijk van iCloud.'}</div>${CFG&&CFG.haBackup?'<button class="btn sm" data-a="h_bknow">Nu back-up maken</button>':''}</div>
  <div class="card"><div class="row sp"><h2 style="margin:0">Gezondheid (Home Assistant)</h2>${statusLine()}</div><div class="tiny mut" style="margin:6px 0 8px">FITAGE-weegschaal en Apple Watch via je eigen Home Assistant. Token staat alleen op dit apparaat en gaat niet mee in back-ups.</div><button class="btn full" data-a="h_setup">${CFG&&CFG.url?'Koppeling beheren':'Koppelen'}</button></div>`}

let DRAFT=null;
function setupSheet(){DRAFT=DRAFT||{...emptyCfg(),...CFG,map:{...CFG.map},units:{...CFG.units}};const c=DRAFT;const origin=location.origin;
  const cand=c.cands;
  sheet(`<h2>Home Assistant koppelen</h2>
  <div class="small mut">Je hebt nodig: (1) het externe <b>https</b>-adres van je Home Assistant, (2) een langlevend toegangstoken (HA → je profiel → Beveiliging → Langlevende toegangstokens), (3) deze regel in <code>configuration.yaml</code> en daarna HA herstarten:</div>
  <textarea class="f" readonly style="min-height:70px;font-size:12px;margin-top:6px" id="h_yaml">http:\n  cors_allowed_origins:\n    - ${E(origin)}</textarea>
  <div class="small mut" style="margin-top:6px">Voor Apple Watch-gegevens: HA Companion-app → Instellingen → Companion-app → Sensoren → Apple Health-sensoren aanzetten en toestemming geven in iOS.</div>
  <label class="lb">URL van Home Assistant</label><input class="f" id="h_url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://xxxx.ui.nabu.casa" value="${E(c.url)}">
  <label class="lb">Toegangstoken</label><input class="f" id="h_tok" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${c.token?'•••••• (opgeslagen, laat leeg om te behouden)':'plak je token'}">
  <label class="row" style="gap:8px;margin-top:12px;align-items:flex-start"><input type="checkbox" id="h_cons" ${c.consent?'checked':''} style="margin-top:3px"><span class="small">Ik geef toestemming om mijn gezondheidsgegevens (gewicht en lichaamssamenstelling, hartslag, rusthartslag, HRV, slaap, stappen, actieve energie) uit mijn Home Assistant op te halen. Ze worden alleen op dit apparaat opgeslagen.</span></label>
  <label class="lb">Mijn weegbereik (kg)</label><div class="row" style="gap:8px"><input class="f" id="h_wr0" type="number" inputmode="decimal" value="${range()[0]}" style="flex:1"><span class="mut">tot</span><input class="f" id="h_wr1" type="number" inputmode="decimal" value="${range()[1]}" style="flex:1"></div>
  <div class="tiny mut" style="margin-top:4px">De weegschaal wordt door het hele gezin gebruikt. Alleen wegingen binnen dit bereik (en de vet-/spierwaarden van diezelfde weging) worden aan dit profiel gekoppeld; andere wegingen worden niet bewaard.</div>
  <button class="btn pri full" style="margin-top:12px" data-a="h_test">Verbinding testen en sensoren zoeken</button>
  <div id="h_msg" class="small" style="margin-top:8px"></div>
  ${cand?`<h2 style="margin-top:14px">Gevonden sensoren</h2><div class="tiny mut" style="margin-bottom:6px">Controleer de keuzes. Kies bij gewicht de echte gemeten waarde van de weegschaal, niet een berekende of BMI-schatting.</div>
   ${ORDER.map(m=>{const opts=cand[m]||[];const sel=c.map[m]||'';const extra=sel&&!opts.some(o=>o.id===sel)?[{id:sel,name:sel,unit:c.units[m]||'',state:'?'}]:[];
     return`<label class="lb">${METRICS[m].l}</label><select class="f h_map" data-m="${m}"><option value="">— niet koppelen —</option>${opts.concat(extra).map(o=>`<option value="${E(o.id)}" ${o.id===sel?'selected':''}>${E(o.name)} · ${E(o.state)} ${E(o.unit)} (${E(o.id)})</option>`).join('')}</select>`}).join('')}
   <label class="lb">Andere sensor handmatig (entity_id → meting)</label><div class="row" style="gap:6px"><input class="f" id="h_man" placeholder="sensor.fitage_weight" style="flex:1.4" autocapitalize="off"><select class="f" id="h_manm" style="flex:1">${ORDER.map(m=>`<option value="${m}">${METRICS[m].l}</option>`).join('')}</select></div><button class="btn sm" style="margin-top:6px" data-a="h_manadd">Toevoegen</button>
   <button class="btn pri full" style="margin-top:14px" data-a="h_save">Opslaan en synchroniseren</button>`:''}
  ${c.url&&c.token?`<h2 style="margin-top:16px">Back-up in Home Assistant</h2><label class="row" style="gap:8px;align-items:flex-start"><input type="checkbox" id="h_bk" ${c.haBackup?'checked':''} style="margin-top:3px"><span class="small">Na elke training (en minstens dagelijks) een volledige back-up van mijn trainingen, schema's, voeding en buikspieren in mijn eigen Home Assistant bewaren. Terugzetten kan via het welkomstscherm met je URL en token.</span></label>
   <div class="tiny mut" style="margin-top:4px">${CFG.haBackupOk?'Laatste back-up: '+fmtT(CFG.haBackupOk)+(CFG.haBackupKB?' ('+CFG.haBackupKB+' kB)':''):'Nog geen back-up in Home Assistant.'}${CFG.haBackupErr?' · fout: '+E(CFG.haBackupErr):''}</div>
   <h2 style="margin-top:16px">Herinneringen op je iPhone</h2><div class="small mut">Een website kan zelf geen meldingen sturen als hij dicht is. Via Home Assistant wel: de app zet de sensor <code>sensor.taurus_coach</code> in HA (laatste training, weekdoel, tekst van Sophie), en een automatisering stuurt om 18:30 een melding als je die dag nog moet trainen.</div>
   <label class="row" style="gap:8px;margin-top:10px;align-items:flex-start"><input type="checkbox" id="h_rem" ${c.remind?'checked':''} style="margin-top:3px"><span class="small">Ja, zet mijn trainingsstatus in Home Assistant (alleen datum, aantal trainingen en de herinneringstekst; geen gezondheidswaarden).</span></label>
   <div class="tiny mut" style="margin-top:6px">${CFG.remindOk?'Laatst bijgewerkt in HA: '+fmtT(CFG.remindOk):''}${CFG.remindErr?' · fout: '+E(CFG.remindErr):''}</div>
   <label class="lb">Automatisering (plakken in HA → Instellingen → Automatiseringen → Nieuw → YAML). Vervang JOUW_IPHONE door de naam uit Ontwikkelaarshulpmiddelen → Acties → zoek "notify.mobile_app".</label><textarea class="f" readonly style="min-height:150px;font-size:11px">${E(YAML())}</textarea>
   <div class="tiny mut" style="margin-top:4px">Na een herstart van HA is de sensor even leeg tot je de app weer opent.</div>`:''}
  ${!cand&&CFG.url?'<button class="btn pri full" style="margin-top:12px" data-a="h_save">Opslaan</button>':''}
  ${CFG.url?`<div class="grid2" style="margin-top:16px"><button class="btn" data-a="h_unlink">Koppeling verwijderen</button><button class="btn" data-a="h_wipe" style="color:var(--bad)">Gezondheidsdata wissen</button></div>`:''}
  <button class="btn full" style="margin-top:10px" data-a="h_close">Sluiten</button>`)}
function readForm(){const c=DRAFT;const u=document.getElementById('h_url');const tk=document.getElementById('h_tok');const cs=document.getElementById('h_cons');
  const rm=document.getElementById('h_rem');if(rm)c.remind=rm.checked;const bk=document.getElementById('h_bk');if(bk)c.haBackup=bk.checked;const w0=document.getElementById('h_wr0'),w1=document.getElementById('h_wr1');if(w0&&w1&&+w0.value<+w1.value)c.wr=[+w0.value,+w1.value];if(u)c.url=u.value.trim();if(tk&&tk.value.trim())c.token=tk.value.trim();if(cs)c.consent=cs.checked?(c.consent||new Date().toISOString()):null;
  document.querySelectorAll('.h_map').forEach(s=>{c.map[s.dataset.m]=s.value||null;const o=(c.cands&&c.cands[s.dataset.m]||[]).find(x=>x.id===s.value);if(o)c.units[s.dataset.m]=o.unit})}
const msg=(t,bad)=>{const el=document.getElementById('h_msg');if(el){el.innerHTML=t;el.style.color=bad?'var(--bad)':''}};
async function doTest(){readForm();const c=DRAFT;try{c.url=normUrl(c.url)}catch(e){return msg(E(e.message),1)}
  if(!c.token)return msg('Plak eerst je toegangstoken.',1);if(!c.consent)return msg('Geef eerst toestemming om gezondheidsgegevens op te halen.',1);
  msg('Verbinden…');try{const a=await ha('/api/',c);if(!a||!/API running/i.test(a.message||''))throw new Error('Onverwacht antwoord; is dit het adres van Home Assistant?');
    const states=await ha('/api/states',c);c.cands=discover(states);for(const m of ORDER){if(!c.map[m]){const top=(c.cands[m]||[])[0];if(top&&top.sc>=4){c.map[m]=top.id;c.units[m]=top.unit}}}
    const n=ORDER.filter(m=>c.map[m]).length;setupSheet();msg(`Verbonden. ${states.length} entiteiten gelezen, ${n} metingen automatisch herkend. Controleer de keuzes hieronder.`)}
  catch(e){msg(E(e.message),1)}}
async function doSave(){readForm();const c=DRAFT;try{c.url=normUrl(c.url)}catch(e){return msg(E(e.message),1)}if(!c.consent)return msg('Toestemming is nodig.',1);
  const changed=JSON.stringify(c.map)!==JSON.stringify(CFG.map);CFG={...c};delete CFG.cands;await saveCfg();DRAFT=null;closeSheet();if(typeof render==='function')render();
  pushT=0;pushState();if(CFG.haBackup)haBackup(true);toast('Synchroniseren…',3000);const r=await sync({full:changed||!HD.lastOk});toast(r.err?'Synchronisatie mislukt: '+r.err:`Gesynchroniseerd: ${r.added||0} nieuwe metingen.`,4500);if(S.ui.tab==='gezondheid'||S.ui.tab==='vandaag')render()}
document.addEventListener('click',async ev=>{const t=ev.target.closest('[data-a^="h_"]');if(!t)return;const a=t.dataset.a;
  if(a==='h_setup'){DRAFT=null;setupSheet()}
  else if(a==='h_close'){DRAFT=null;closeSheet()}
  else if(a==='h_test')doTest();
  else if(a==='h_save')doSave();
  else if(a==='h_manadd'){readForm();const id=(document.getElementById('h_man').value||'').trim();const m=document.getElementById('h_manm').value;if(!/^[a-z_]+\.[a-z0-9_]+$/.test(id))return msg('Ongeldige entity_id.',1);DRAFT.map[m]=id;setupSheet();msg('Toegevoegd; eenheid wordt bij opslaan overgenomen zoals HA hem meldt.')}
  else if(a==='h_per'){S.ui.hp=t.dataset.k;save();render()}
  else if(a==='h_sync'){const r=await sync();toast(r.err?'Mislukt: '+r.err:r.skip?'Bezig…':`${r.added} nieuwe metingen.`,4000);render()}
  else if(a==='h_unlink'){if(!confirm('Koppeling en token van dit apparaat verwijderen? Je opgehaalde metingen blijven bewaard.'))return;CFG=emptyCfg();await idbDel(k1(PID)).catch(()=>{});DRAFT=null;closeSheet();render();toast('Koppeling verwijderd.')}
  else if(a==='h_wipe'){if(!confirm('Alle opgehaalde gezondheidsmetingen op dit apparaat wissen? Je trainingen blijven bewaard.'))return;HD=emptyHD();await saveHD();(S.workouts||[]).forEach(w=>{delete w.hr;delete w.hrNote});save();DRAFT=null;closeSheet();render();toast('Gezondheidsdata gewist.')}});
/* unit uit states halen bij handmatige koppeling: bij eerste sync */
async function fillUnits(){const miss=ORDER.filter(m=>CFG.map[m]&&CFG.units[m]==null);for(const m of miss){try{const st=await ha('/api/states/'+encodeURIComponent(CFG.map[m]));CFG.units[m]=(st.attributes&&st.attributes.unit_of_measurement)||''}catch(e){}}if(miss.length)saveCfg()}
async function autoSync(){if(!configured())return;if(HD.lastOk&&Date.now()-HD.lastOk<15*6e4)return;await fillUnits();const r=await sync();if(!r.err&&r.added&&typeof render==='function'&&['gezondheid','vandaag'].includes(S.ui.tab))render()}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')autoSync()});

/* ---------- herinneringen via HA (optioneel, standaard uit) ---------- */
const YAML=()=>`alias: Taurus Coach – trainingsherinnering
triggers:
  - trigger: time
    at: "18:30:00"
conditions:
  - condition: template
    value_template: >
      {{ is_state_attr('sensor.taurus_coach','due', true)
         and (state_attr('sensor.taurus_coach','last_workout') or '') != now().strftime('%Y-%m-%d') }}
actions:
  - action: notify.mobile_app_JOUW_IPHONE
    data:
      title: Sophie · Taurus Coach
      message: "{{ state_attr('sensor.taurus_coach','message') }}"
      data:
        url: ${location.origin}${location.pathname}
mode: single`;
let pushT=0;
async function pushState(){if(!CFG||!CFG.url||!CFG.token||!CFG.remind||typeof coachState!=='function')return;if(Date.now()-pushT<60e3)return;pushT=Date.now();
  try{const c=coachState();await ha('/api/states/sensor.taurus_coach',CFG,{state:c.state,attributes:{friendly_name:'Taurus Coach',icon:'mdi:dumbbell',last_workout:c.last_workout,week_done:c.week_done,week_goal:c.week_goal,next_plan:c.next_plan,next_minutes:c.next_minutes,due:c.due,message:c.message,updated:new Date().toISOString()}});CFG.remindOk=Date.now();saveCfg()}catch(e){CFG.remindErr=e.message;saveCfg()}}
/* ---------- back-up in Home Assistant (blijft thuis, versleuteld verkeer, alleen met jouw token leesbaar) ----------
   Opslag: HA 'frontend user data' van de HA-gebruiker van het token (bewaard in HA's .storage, overleeft herstarts). */
function wsRun(c,msg){return new Promise((res,rej)=>{let ws,done=false;const fin=(f,v)=>{if(done)return;done=true;clearTimeout(to);try{ws.close()}catch(e){}f(v)};
  const to=setTimeout(()=>fin(rej,new Error('Home Assistant reageert niet (time-out).')),25000);
  try{ws=new WebSocket(c.url.replace(/^https:/,'wss:')+'/api/websocket')}catch(e){return fin(rej,e)}
  ws.onerror=()=>fin(rej,new Error('Geen verbinding met Home Assistant.'));
  ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
    if(m.type==='auth_required')ws.send(JSON.stringify({type:'auth',access_token:c.token}));
    else if(m.type==='auth_invalid')fin(rej,new Error('Token geweigerd.'));
    else if(m.type==='auth_ok')ws.send(JSON.stringify({id:1,...msg}));
    else if(m.id===1)m.success?fin(res,m.result):fin(rej,new Error((m.error&&m.error.message)||'Home Assistant gaf een fout.'))}})}
const slug=x=>(x||'profiel').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'profiel';
function backupPayload(){return{...S,photos:[],active:null,type:'taurus-backup',exported:(typeof localISO==='function'?localISO():new Date().toISOString()),via:'homeassistant',
  family:window.VOED?VOED.exportData():null,abs:window.BUIK?BUIK.exportData():null}}
let bkBusy=false;
async function haBackup(force){if(!CFG||!CFG.url||!CFG.token||!CFG.haBackup||bkBusy||typeof S==='undefined'||!S.profile)return{skip:true};
  if(!force&&CFG.haBackupOk&&Date.now()-CFG.haBackupOk<20*3600e3)return{skip:true};bkBusy=true;
  try{const key='taurus_coach_'+slug(S.profile.name);const n=(S.workouts||[]).length;if(!n)throw new Error('Nog geen trainingen; er wordt niets overschreven.');
    const prev=await wsRun(CFG,{type:'frontend/get_user_data',key});if(prev&&prev.value){try{const pn=(JSON.parse(prev.value).workouts||[]).length;if(pn>n)throw new Error(`Home Assistant heeft een vollere back-up (${pn} trainingen, hier ${n}). Herstel die eerst via het welkomstscherm of Instellingen.`)}catch(e){if(/vollere/.test(e.message))throw e}}
    const txt=JSON.stringify(backupPayload());await wsRun(CFG,{type:'frontend/set_user_data',key,value:txt});
    CFG.haBackupOk=Date.now();CFG.haBackupErr='';CFG.haBackupKB=Math.round(txt.length/1024);await saveCfg();bkBusy=false;return{ok:true,kb:CFG.haBackupKB}}
  catch(e){CFG.haBackupErr=e.message;await saveCfg();bkBusy=false;return{err:e.message}}}
async function listHABackups(url,token){const c={url:normUrl(url),token:(token||'').trim()};if(!c.token)throw new Error('Plak je toegangstoken.');
  const r=await wsRun(c,{type:'frontend/get_user_data'});const all=(r&&r.value)||{};const out=[];
  for(const k in all){if(!k.startsWith('taurus_coach_'))continue;try{const d=JSON.parse(all[k]);out.push({key:k,name:(d.profile&&d.profile.name)||k.slice(13),at:d.exported,n:(d.workouts||[]).length,data:all[k]})}catch(e){}}
  return{c,list:out}}
let RB=null;
function restoreSheet(){sheet(`<h2>Herstellen uit Home Assistant</h2><div class="small mut">Werkt als de automatische back-up naar Home Assistant aan stond. Je token staat in Home Assistant onder je profiel → Beveiliging (maak zo nodig een nieuw).</div>
  <label class="lb">URL van Home Assistant</label><input class="f" id="r_url" inputmode="url" autocapitalize="off" spellcheck="false" placeholder="https://xxxx.ui.nabu.casa" value="${E((CFG&&CFG.url)||'')}">
  <label class="lb">Toegangstoken</label><input class="f" id="r_tok" type="password" autocomplete="off" autocapitalize="off" spellcheck="false">
  <button class="btn pri full" style="margin-top:12px" data-a="h_rlist">Back-ups zoeken</button><div id="r_out" class="small" style="margin-top:10px"></div>
  <button class="btn full" style="margin-top:10px" data-a="h_close">Sluiten</button>`)}
document.addEventListener('click',async ev=>{const t=ev.target.closest('[data-a="h_restore"],[data-a="h_rlist"],[data-a="h_rpick"],[data-a="h_bknow"]');if(!t)return;const a=t.dataset.a;
  if(a==='h_restore')restoreSheet();
  else if(a==='h_rlist'){const o=document.getElementById('r_out');o.textContent='Zoeken…';o.style.color='';
    try{RB=await listHABackups(document.getElementById('r_url').value,document.getElementById('r_tok').value);
      o.innerHTML=RB.list.length?RB.list.map((b,i)=>`<button class="li" style="width:100%" data-a="h_rpick" data-k="${i}"><div class="grow" style="text-align:left"><b>${E(b.name)}</b><div class="small mut">${b.n} trainingen · ${E((b.at||'').replace('T',' ').slice(0,16))}</div></div><span>›</span></button>`).join(''):'Geen Taurus-back-ups gevonden voor deze Home Assistant-gebruiker.'}
    catch(e){o.textContent=e.message;o.style.color='var(--bad)'}}
  else if(a==='h_rpick'){const b=RB&&RB.list[+t.dataset.k];if(!b)return;closeSheet();
    fileKind=(typeof META!=='undefined'&&META.current)?'json':'welkom';await onFile({name:'Home Assistant ('+b.name+')',text:async()=>b.data});
    if(META.current){CFG={...CFG,url:RB.c.url,token:RB.c.token,haBackup:true};await saveCfg();toast('Hersteld uit Home Assistant. Automatische back-up staat aan.',5000)}if(typeof render==='function')render()}
  else if(a==='h_bknow'){const r=await haBackup(true);toast(r.err?'Back-up mislukt: '+r.err:r.ok?`Back-up opgeslagen in Home Assistant (${r.kb} kB).`:'Zet eerst de back-up naar Home Assistant aan.',5000);if(typeof render==='function')render()}});
/* ---------- back-up (zonder token) ---------- */
function exportData(){return HD?{v:1,series:HD.series,daily:HD.daily}:null}
async function importData(d){if(!d||!d.series)return 0;let n=0;for(const m in d.series){if(!METRICS[m]||!Array.isArray(d.series[m]))continue;n+=addSamples(m,d.series[m].filter(p=>Array.isArray(p)&&isFinite(p[0])&&isFinite(p[1])))}
  for(const m in (d.daily||{})){if(!METRICS[m])continue;const t=HD.daily[m]||(HD.daily[m]={});for(const k in d.daily[m])if(t[k]==null&&isFinite(d.daily[m][k]))t[k]=d.daily[m][k]}await saveHD();return n}

window.HEALTH={haWS:async msg=>{if(!CFG||!CFG.url||!CFG.token)throw new Error('Niet gekoppeld met Home Assistant.');return wsRun(CFG,msg)},hasHA:()=>!!(CFG&&CFG.url&&CFG.token),range,haBackup,restoreSheet,METRICS,haGet:async p=>{if(!CFG||!CFG.url||!CFG.token)throw new Error('Koppel eerst Home Assistant (Gezondheid → Koppelen).');return ha(p)},pushState,load,sync,autoSync,view,todayCard,settingsCard,answer,insights,recovery,readiness,weekStats,hrBlock,linkWorkout,exportData,importData,configured,
  _t:{normUrl,discover,score,addSamples,days,trend,conv,plausible,wWindow,hrFor,linkAll,setState:(c,h)=>{CFG={...emptyCfg(),...c};HD={...emptyHD(),...h}},get HD(){return HD},get CFG(){return CFG}}};
})();
