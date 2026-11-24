/* Taurus Coach — Voeding & rooster
   Opbouw: (1) ROOSTER: diensten (handmatig of via HA-agenda)  (2) PLANNER: pure functies, los van de bron
   (3) UI. Alle tijden zijn Europe/Amsterdam-lokale tekst 'YYYY-MM-DDTHH:MM'. Gegevens: IndexedDB 'family' (dit apparaat). */
(function(){
'use strict';
/* ---------- ingrediënten ---------- */
const ING={havermout:['Havermout','granen',{g:1}],melk:['Halfvolle melk','zuivel',{l:1}],whey:['Whey','zuivel',{l:1}],skyr:['Skyr / magere kwark','zuivel',{l:1}],lfkwark:['Lactosevrije kwark','zuivel'],
 kaas:['Kaas 30+','zuivel'],geraspt:['Geraspte kaas','zuivel'],lfroom:['Lactosevrije room','zuivel'],spread:['Plantaardige spread','vet'],
 volkoren:['Volkoren brood','granen',{g:1}],wrap:['Volkoren wraps','granen',{g:1}],pasta:['Pasta','granen',{g:1}],gfpasta:['Glutenvrije pasta','granen'],rijst:['Rijst (gekookt)','granen'],aardappel:['Aardappelen','granen'],
 gfcracker:['Glutenvrije crackers','granen'],zadencracker:['Zadencrackers (zelfgemaakt)','granen'],rijstwafel:['Rijstwafels','granen'],maiswafel:['Maiswafels','granen'],
 kip:['Kipfilet','vlees'],zalm:['Zalm','vlees'],kabeljauw:['Kabeljauw','vlees'],tonijn:['Tonijn (blik)','vlees'],kipbeleg:['Kipfilet (beleg)','vlees'],kalkoen:['Kalkoen','vlees'],rund:['Mager rundvlees','vlees'],gehakt:['Mager gehakt','vlees'],kipgehakt:['Kipgehakt','vlees'],ei:['Ei','vlees'],
 courgette:['Courgette','groente'],paprika:['Paprika','groente'],champignons:['Champignons','groente'],broccoli:['Broccoli','groente'],sperzie:['Sperziebonen','groente'],wortel:['Wortel','groente'],komkommer:['Komkommer','groente'],sla:['Sla','groente'],tomaat:['Tomaat','groente'],spinazie:['Spinazie','groente'],wok:['Wokgroente','groente'],rauwkost:['Rauwkost','groente'],passata:['Passata','groente'],ui:['Ui','groente'],knoflook:['Knoflook','groente'],olijven:['Olijven','groente'],
 banaan:['Banaan','fruit'],druiven:['Druiven','fruit'],appel:['Appel','fruit'],aardbei:['Aardbeien','fruit'],sinaas:['Sinaasappel','fruit'],mango:['Mango','fruit'],kiwi:['Kiwi','fruit'],fruit:['Stuk fruit','fruit'],
 pindakaas:['Pindakaas','vet'],kruiden:['Kruiden en specerijen','overig'],citroen:['Citroen','fruit'],noten:['Noten','vet'],amandel:['Amandelen','vet'],avocado:['Avocado','vet'],olie:['Olijfolie','vet'],hummus:['Hummus','vet'],honing:['Honing','overig'],crunchy:['Crunchy beans','overig'],
 kipsoep:['Kippensoep (zelfgemaakt)','soep'],paprikasoep:['Paprika-tomatensoep','soep'],courgettesoep:['Courgettesoep','soep']};
const CATS=[['vlees','Vlees, vis & ei'],['zuivel','Zuivel'],['granen','Brood, granen & aardappel'],['groente','Groente'],['fruit','Fruit'],['vet','Vetten, noten & smeersels'],['soep','Soepen'],['overig','Overig']];
const iN=k=>ING[k]?ING[k][0]:k;const iF=k=>(ING[k]&&ING[k][2])||{};
/* ---------- maaltijden (bron: Taurus_Coach_Voedingsschema.docx; 'wissel' = samengesteld uit de wissellijst) ---------- */
const M={
 k_haver:{n:'Havermout-bowl',t:'ontbijt',k:[['havermout',80,'g'],['melk',300,'ml'],['whey',30,'g'],['banaan',1,'st'],['pindakaas',15,'g']],kk:650,src:'schema'},
 k_skyrbowl:{n:'Skyr met havermout en fruit',t:'ontbijt',k:[['skyr',300,'g'],['havermout',60,'g'],['aardbei',150,'g'],['pindakaas',15,'g']],src:'wissel'},
 k_brood:{n:'Volkoren boterhammen met kip en ei',t:'lunch',k:[['volkoren',4,'snee'],['kipbeleg',150,'g'],['ei',2,'st'],['rauwkost',100,'g'],['fruit',1,'st']],kk:650,src:'schema'},
 k_wrap:{n:'Wraps met kalkoen en rauwkost',t:'lunch',k:[['wrap',3,'st'],['kalkoen',150,'g'],['rauwkost',150,'g'],['avocado',50,'g'],['fruit',1,'st']],src:'wissel'},
 k_pre:{n:'Skyr met banaan en honing',t:'pre',k:[['skyr',250,'g'],['banaan',1,'st'],['honing',20,'g']],kk:300,src:'schema'},
 k_post:{n:'Whey-shake met banaan',t:'post',k:[['whey',30,'g'],['melk',300,'ml'],['banaan',1,'st']],kk:350,src:'schema'},
 k_post2:{n:'Rijstwafels met kipfilet',t:'post',k:[['rijstwafel',3,'st'],['kipbeleg',60,'g'],['fruit',1,'st']],src:'schema'},
 p_cracker:{n:'Glutenvrije crackers met kip en kaas',t:'ontbijt',p:[['gfcracker',20,'g'],['kipbeleg',40,'g'],['kaas',20,'g']],src:'schema'},
 p_druiven:{n:'Druiven',t:'snack',p:[['druiven',150,'g']],src:'schema'},
 p_groentesnack:{n:'Wortel en komkommer met hummus',t:'snack',p:[['wortel',100,'g'],['komkommer',100,'g'],['hummus',30,'g']],src:'schema'},
 p_salade:{n:'Salade met kip, hummus en kaas',t:'lunch',p:[['kip',120,'g'],['sla',100,'g'],['paprika',100,'g'],['kaas',20,'g'],['hummus',30,'g']],src:'schema'},
 p_kipsoep:{n:'Kippensoep met extra kip en zadencrackers',t:'lunch',p:[['kipsoep',350,'ml'],['kip',75,'g'],['zadencracker',2,'st']],src:'schema'},
 p_paprikasoep:{n:'Paprika-tomatensoep met kaas en kip',t:'lunch',p:[['paprikasoep',350,'ml'],['zadencracker',2,'st'],['kaas',30,'g'],['kipbeleg',75,'g']],src:'schema'},
 p_courgettesoep:{n:'Courgettesoep met kip',t:'lunch',p:[['courgettesoep',350,'ml'],['kip',100,'g'],['zadencracker',2,'st']],src:'schema'},
 p_kwark:{n:'Lactosevrije kwark met druiven',t:'avond',p:[['lfkwark',200,'g'],['druiven',100,'g']],src:'schema'},
 p_box:{n:'Lunchbox voor het werk',t:'pauze',p:[['hummus',35,'g'],['wortel',100,'g'],['komkommer',100,'g'],['paprika',100,'g'],['kaas',25,'g'],['kipbeleg',40,'g'],['druiven',100,'g'],['crunchy',15,'g']],src:'schema'},
 p_nacht:{n:'Nachtpauze',t:'pauze',p:[['gfcracker',20,'g'],['kaas',20,'g'],['noten',15,'g'],['lfkwark',150,'g']],src:'schema'},
 p_nathuis:{n:'Klein hapje na thuiskomst',t:'nathuis',p:[['gfcracker',20,'g'],['kipbeleg',40,'g'],['kaas',20,'g']],src:'schema'},
 p_wakker:{n:'Kwark met druiven na het slapen',t:'wakker',p:[['lfkwark',200,'g'],['druiven',100,'g']],src:'schema'},
 g_kipgroente:{n:'Kip met courgette, paprika en champignons',t:'diner',k:[['kip',200,'g'],['courgette',100,'g'],['paprika',75,'g'],['champignons',75,'g'],['rijst',325,'g'],['olie',5,'g']],p:[['kip',150,'g'],['courgette',150,'g'],['paprika',100,'g'],['champignons',100,'g'],['olie',10,'g']],kk:750,src:'schema'},
 g_gehakt:{n:'Gehakt-passatapan met courgette',t:'diner',k:[['gehakt',200,'g'],['passata',150,'g'],['courgette',200,'g'],['champignons',100,'g'],['pasta',100,'g droog']],p:[['gehakt',150,'g'],['passata',150,'g'],['courgette',200,'g'],['champignons',100,'g'],['geraspt',15,'g']],src:'schema'},
 g_kipgehakt:{n:'Kipgehakt met passata en groente',t:'diner',k:[['kipgehakt',200,'g'],['passata',150,'g'],['courgette',150,'g'],['champignons',100,'g'],['rijst',300,'g']],p:[['kipgehakt',150,'g'],['passata',150,'g'],['courgette',200,'g'],['champignons',100,'g'],['geraspt',15,'g']],src:'schema'},
 g_kiproom:{n:'Kip in lactosevrije roomsaus met groente',t:'diner',k:[['kip',200,'g'],['courgette',125,'g'],['paprika',125,'g'],['lfroom',30,'g'],['aardappel',475,'g']],p:[['kip',150,'g'],['courgette',150,'g'],['paprika',75,'g'],['champignons',75,'g'],['lfroom',30,'g'],['olie',5,'g']],src:'schema'},
 g_rundwok:{n:'Mager rund met broccoli en sperziebonen',t:'diner',k:[['rund',200,'g'],['broccoli',125,'g'],['sperzie',125,'g'],['rijst',325,'g'],['olie',5,'g']],p:[['rund',150,'g'],['broccoli',150,'g'],['sperzie',150,'g'],['olie',5,'g']],kk:750,src:'wissel'},
 g_kipaardappel:{n:'Kip met aardappelen en sperziebonen',t:'diner',k:[['kip',200,'g'],['aardappel',475,'g'],['sperzie',250,'g']],p:[['kip',150,'g'],['sperzie',250,'g'],['wortel',100,'g'],['olie',5,'g']],kk:750,src:'wissel'},
 g_kalkoenwok:{n:'Kalkoenwok met paprika en sperziebonen',t:'diner',k:[['kalkoen',200,'g'],['paprika',125,'g'],['sperzie',125,'g'],['rijst',325,'g'],['olie',5,'g']],p:[['kalkoen',150,'g'],['paprika',150,'g'],['sperzie',150,'g'],['wortel',75,'g'],['olie',5,'g']],src:'voorstel'},
 g_kipspies:{n:'Kipspiesjes met courgette uit de oven',t:'diner',k:[['kip',200,'g'],['courgette',150,'g'],['paprika',100,'g'],['aardappel',450,'g'],['olie',8,'g'],['kruiden',1,'tl']],p:[['kip',150,'g'],['courgette',200,'g'],['paprika',150,'g'],['olie',8,'g'],['kruiden',1,'tl']],src:'voorstel'},
 g_balletjes:{n:'Gehaktballetjes in tomatensaus (zonder ui en ei)',t:'diner',k:[['gehakt',200,'g'],['passata',200,'g'],['courgette',150,'g'],['pasta',100,'g droog'],['kruiden',1,'tl']],p:[['gehakt',150,'g'],['passata',150,'g'],['courgette',250,'g'],['geraspt',15,'g'],['kruiden',1,'tl']],src:'voorstel'},
 g_ovenschotel:{n:'Kip-broccoli ovenschotel',t:'diner',k:[['kip',200,'g'],['broccoli',250,'g'],['lfroom',30,'g'],['aardappel',450,'g']],p:[['kip',150,'g'],['broccoli',250,'g'],['lfroom',30,'g'],['geraspt',20,'g']],src:'voorstel'},
 g_bowl:{n:'Kip-bowl met avocado en rauwkost',t:'diner',k:[['kip',200,'g'],['rijst',300,'g'],['avocado',60,'g'],['komkommer',100,'g'],['paprika',100,'g'],['tomaat',75,'g']],p:[['kip',150,'g'],['sla',75,'g'],['avocado',50,'g'],['komkommer',100,'g'],['paprika',100,'g'],['tomaat',75,'g']],src:'voorstel'},
 g_zalm:{n:'Zalm uit de oven met broccoli en citroen',t:'diner',k:[['zalm',180,'g'],['broccoli',250,'g'],['aardappel',450,'g'],['citroen',.5,'st']],p:[['zalm',125,'g'],['broccoli',250,'g'],['wortel',100,'g'],['citroen',.5,'st']],src:'voorstel'},
 g_curry:{n:'Milde kipcurry met lactosevrije room',t:'diner',k:[['kip',200,'g'],['broccoli',125,'g'],['paprika',125,'g'],['lfroom',30,'g'],['rijst',325,'g'],['kruiden',1,'tl']],p:[['kip',150,'g'],['broccoli',150,'g'],['paprika',150,'g'],['lfroom',30,'g'],['kruiden',1,'tl']],src:'voorstel'},
 g_rundspinazie:{n:'Rundreepjes met spinazie en champignons',t:'diner',k:[['rund',200,'g'],['spinazie',150,'g'],['champignons',150,'g'],['aardappel',450,'g'],['olie',5,'g']],p:[['rund',150,'g'],['spinazie',150,'g'],['champignons',150,'g'],['courgette',100,'g'],['olie',5,'g']],src:'voorstel'},
 g_kabeljauw:{n:'Kabeljauw met sperziebonen en tomaat',t:'diner',k:[['kabeljauw',200,'g'],['sperzie',250,'g'],['tomaat',100,'g'],['aardappel',450,'g'],['olie',5,'g']],p:[['kabeljauw',150,'g'],['sperzie',250,'g'],['tomaat',100,'g'],['olie',5,'g']],src:'voorstel'},
 k_oats:{n:'Overnight oats met whey en banaan',t:'ontbijt',k:[['havermout',80,'g'],['melk',250,'ml'],['whey',30,'g'],['banaan',1,'st'],['pindakaas',15,'g']],src:'voorstel'},
 k_omelet:{n:'Omelet met spinazie en volkoren brood',t:'ontbijt',k:[['ei',3,'st'],['spinazie',75,'g'],['volkoren',2,'snee'],['kalkoen',50,'g'],['fruit',1,'st']],src:'voorstel'},
 k_rijstsalade:{n:'Rijstsalade met kip en paprika',t:'lunch',k:[['rijst',250,'g'],['kip',150,'g'],['paprika',100,'g'],['komkommer',100,'g'],['olie',5,'g'],['fruit',1,'st']],src:'voorstel'},
 k_tonijn:{n:'Volkoren boterhammen met tonijn en avocado',t:'lunch',k:[['volkoren',4,'snee'],['tonijn',120,'g'],['avocado',60,'g'],['rauwkost',100,'g'],['fruit',1,'st']],src:'voorstel'},
 p_kwarkaardbei:{n:'Lactosevrije kwark met aardbeien en noten',t:'ontbijt',p:[['lfkwark',200,'g'],['aardbei',100,'g'],['noten',10,'g']],src:'voorstel'},
 p_maiswafel:{n:'Maiswafels met kip en avocado',t:'ontbijt',p:[['maiswafel',3,'st'],['kipbeleg',40,'g'],['avocado',40,'g']],src:'voorstel'},
 p_zalmsalade:{n:'Salade met zalm en komkommer',t:'lunch',p:[['zalm',100,'g'],['sla',100,'g'],['komkommer',100,'g'],['tomaat',75,'g'],['olie',5,'g'],['zadencracker',1,'st']],src:'voorstel'},
 p_appel:{n:'Appel met pindakaas',t:'snack',p:[['appel',1,'st'],['pindakaas',10,'g']],src:'voorstel'},
 g_soep:{n:'Soepavond met kip',t:'diner',k:[['kipsoep',500,'ml'],['kip',150,'g'],['volkoren',3,'snee']],p:[['kipsoep',350,'ml'],['kip',100,'g'],['zadencracker',2,'st']],src:'wissel'}};
const SLOT={ontbijt:'Ontbijt',lunch:'Lunch',diner:'Avondeten',snack:'Tussendoor',pre:'Vóór training',post:'Na training',avond:'Avondsnack',pauze:'Pauze',nathuis:'Na thuiskomst',wakker:'Na het slapen'};
const PN={k:'Kristiaan',p:'Patricia'};
/* ---------- staat ---------- */
const DEF=()=>({v:1,people:{k:{excl:['kaas','geraspt','olijven','kiwi','amandel'],kcalTrain:2800,kcalRest:2650,prot:180,trainDays:[0,2,4]},
  p:{excl:['ei','ui','knoflook','aardappel','pasta','rijst','melk','whey','skyr'],gluten:true,kcal:1500,prot:110}},
 taste:{k:{ing:{},meal:{}},p:{ing:{},meal:{}}},base:null,over:{},shifts:[],shiftExtra:{},
 pp:{travel:30,eatLead:45,breakEvening:'19:30',breakNight:'02:00',wake:'',dinner:'18:00',winFrom:'17:00',winTo:'19:00',avond:['15:00','23:00'],nacht:['22:00','07:00']},
 roster:{src:'manual',entity:'calendar.werk',allShifts:true,kw:{avond:'avond',nacht:'nacht',dag:'dag'},consent:null,lastSync:null,err:''},ui:{seg:'week',wk:0,tp:'k'},abs:null,vary:true,updated:0,
 kroster:{entities:'calendar.kristiaan_indexpay_nl, calendar.indexpay_kristiaan',on:true,lastSync:null,err:'',events:[]},sync:{on:true,lastPull:null,lastPush:null,err:'',ro:false}});
let F=DEF();
async function load(){try{const v=await idbGet('family');if(v){const d=JSON.parse(v);F={...DEF(),...d,pp:{...DEF().pp,...(d.pp||{})},roster:{...DEF().roster,...(d.roster||{})},ui:{...DEF().ui,...(d.ui||{})}}}}catch(e){}if(!F.base)F.base=genBase();}
let svT=null,pushT=null;function save(local){if(!local){F.updated=Date.now();clearTimeout(pushT);pushT=setTimeout(push,2500)}clearTimeout(svT);svT=setTimeout(()=>idbSet('family',JSON.stringify(F)).catch(()=>{}),200)}
/* ---------- gedeeld gezinsschema via Home Assistant (systeemgegevens, alleen met token leesbaar) ---------- */
const SHARED=['base','over','shifts','shiftExtra','pp','people','taste','roster','kroster','vary','updated'];
async function push(){if(!F.sync.on||!window.HEALTH||!HEALTH.hasHA||!HEALTH.hasHA())return;try{const d={};SHARED.forEach(k=>d[k]=F[k]);d.by=(typeof S!=='undefined'&&S.profile&&S.profile.name)||'';
  await HEALTH.haWS({type:'frontend/set_system_data',key:'taurus_family',value:JSON.stringify(d)});F.sync.lastPush=Date.now();F.sync.err='';F.sync.ro=false}catch(e){F.sync.err=e.message;if(/admin|unauthor|permission/i.test(e.message))F.sync.ro=true}save(true)}
async function pull(){if(!F.sync.on||!window.HEALTH||!HEALTH.hasHA||!HEALTH.hasHA())return false;try{const r=await HEALTH.haWS({type:'frontend/get_system_data',key:'taurus_family'});F.sync.lastPull=Date.now();F.sync.err='';
  if(r&&r.value){const d=JSON.parse(r.value);if((d.updated||0)>(F.updated||0)){SHARED.forEach(k=>{if(d[k]!==undefined)F[k]=d[k]});F.sync.from=d.by||'';save(true);return true}
    else if((d.updated||0)<(F.updated||0))push()}else{if(!F.updated)F.updated=Date.now();push()}save(true);return false}catch(e){F.sync.err=e.message;save(true);return false}}
function saveNow(){clearTimeout(svT);return idbSet('family',JSON.stringify(F)).catch(()=>{})}

/* ---------- tijd (naïeve Amsterdam-lokale tekst, rekenen in minuten) ---------- */
const pad=n=>String(n).padStart(2,'0');
const tm=s=>{if(!s)return null;const [h,m]=s.split(':').map(Number);return h*60+m};
const hm=m=>{m=((m%1440)+1440)%1440;return pad(Math.floor(m/60))+':'+pad(m%60)};
const absMin=iso=>{const [d,t]=iso.split('T');const [y,mo,da]=d.split('-').map(Number);return Date.UTC(y,mo-1,da)/6e4+tm(t||'00:00')};
const fromAbs=m=>{const d=new Date(m*6e4);return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate())+'T'+pad(d.getUTCHours())+':'+pad(d.getUTCMinutes())};
const addDays=(ds,n)=>fromAbs(absMin(ds+'T00:00')+n*1440).slice(0,10);
const dowOf=ds=>(new Date(ds+'T12:00:00Z').getUTCDay()+6)%7;
const ams=d=>{const p=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d);return p.replace(' ','T').slice(0,16)};
const today=()=>ams(new Date()).slice(0,10);
const monday=ds=>addDays(ds,-dowOf(ds));
const DN=['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'],DS=['ma','di','wo','do','vr','za','zo'];
const fmtD=ds=>{const [y,m,d]=ds.split('-').map(Number);return d+' '+['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'][m-1]};

/* ---------- regels: wat mag / wat vindt iemand lekker ---------- */
function variant(meal,who,custom){if(custom)return custom;const m=M[meal];if(!m)return[];return(who==='k'?m.k:m.p)||m.k||m.p||[]}
function allowed(meal,who){const P=F.people[who];const v=variant(meal,who);if(!v.length)return false;return v.every(([i])=>!P.excl.includes(i)&&!(P.gluten&&iF(i).g))}
function score(meal,who){const T=F.taste[who];let s=(T.meal[meal]||0)*3;for(const [i] of variant(meal,who)){const t=T.ing[i]||0;if(t<0)return-99;s+=t}return s}
function pick(type,who,n,seed){const ids=Object.keys(M).filter(id=>M[id].t===type&&(who==='g'?allowed(id,'k')&&allowed(id,'p'):allowed(id,who)&&(who==='k'?M[id].k:M[id].p)));
  const sc=id=>who==='g'?Math.min(score(id,'k'),score(id,'p'))+(score(id,'k')+score(id,'p'))/10:score(id,who);
  let ok=ids.filter(id=>sc(id)>-50&&(who==='g'?(F.taste.k.meal[id]||0)>=0&&(F.taste.p.meal[id]||0)>=0:(F.taste[who].meal[id]||0)>=0));if(!ok.length)ok=ids;ok.sort((a,b)=>sc(b)-sc(a)||a.localeCompare(b));
  const out=[];for(let i=0;i<n;i++)out.push(ok.length?ok[(i+seed)%ok.length]:null);return out}
/* basisweek: 7 dagen, maaltijden afwisselend; geliefde maaltijden eerst */
function genBase(){const g=pick('diner','g',7,0),kb=pick('ontbijt','k',7,0),kl=pick('lunch','k',7,0),kpo=pick('post','k',7,0),pb=pick('ontbijt','p',7,0),pl=pick('lunch','p',7,0),ps=pick('snack','p',7,0);
  const kbF=kb.map((x,i)=>i<5?kb[0]:x),klF=kl.map((x,i)=>kl[i%Math.max(1,new Set(kl).size)]);
  return Array.from({length:7},(_,d)=>[
   {id:'k-ontbijt',t:'ontbijt',time:'07:00',meal:kbF[d],who:['k']},
   {id:'p-ontbijt',t:'ontbijt',time:'08:30',meal:pb[d],who:['p']},
   {id:'p-snack1',t:'snack',time:'10:30',meal:'p_druiven',who:['p']},
   {id:'k-lunch',t:'lunch',time:'12:30',meal:klF[d],who:['k'],mee:{k:d<5}},
   {id:'p-lunch',t:'lunch',time:'12:30',meal:pl[d],who:['p']},
   {id:'p-snack2',t:'snack',time:'15:30',meal:ps[(d+1)%7]||'p_groentesnack',who:['p']},
   {id:'diner',t:'diner',time:F.pp.dinner,meal:g[d],who:['k','p'],gezin:true},
   {id:'p-avond',t:'avond',time:'20:30',meal:'p_kwark',who:['p']},
   {id:'k-pre',t:'pre',time:'21:15',meal:'k_pre',who:['k'],train:true},
   {id:'k-post',t:'post',time:'23:30',meal:kpo[d],who:['k'],train:true}].filter(x=>x.meal))}

/* ---------- rooster ---------- */
function shiftsAll(){return F.shifts.filter(s=>!s.cancelled&&(s.src!=='ha'||isWork(s.title))).map(s=>({...s,...(F.shiftExtra[s.id]||{})}))}
const TL={avond:'avonddienst',nacht:'nachtdienst',dag:'dagdienst'};
function breakFor(s){const st=absMin(s.start),en=absMin(s.end);let b=s.brk||(s.type==='nacht'?F.pp.breakNight:F.pp.breakEvening);let bm=absMin(s.start.slice(0,10)+'T'+b);if(bm<st)bm+=1440;if(bm<st||bm>en)bm=Math.round((st+en)/2);return bm}

/* ---------- PLANNER (puur: zelfde invoer → zelfde dag) ---------- */
/* wisselen per week: elke week een andere volgorde; lekker gevonden maaltijden komen vaker terug. Wat je in het basisschema vastlegt (fixed) wisselt niet. */
const ROT={};function rotList(type,who){const key=type+who+JSON.stringify(F.taste)+JSON.stringify(F.people);if(ROT[key])return ROT[key];
  const ids=pick(type,who,99,0).filter((v,i,a)=>v&&a.indexOf(v)===i);const sc=id=>who==='g'?(F.taste.k.meal[id]||0)+(F.taste.p.meal[id]||0):(F.taste[who].meal[id]||0);
  const out=[];ids.forEach(id=>{out.push(id);if(sc(id)>0)out.push(id)});return ROT[key]=out}
function rotate(x,ds){if(!F.vary||x.fixed)return x.meal;const who=x.id==='diner'?'g':x.who[0];const L=rotList(x.t,who);if(L.length<2)return x.meal;
  const wk=Math.floor((absMin(ds+'T00:00')/1440+3)/7);const dow=dowOf(ds);const step=x.id==='diner'?dow+wk*3:x.t==='ontbijt'&&who==='k'?wk:dow+wk*2;let m=L[((step%L.length)+L.length)%L.length];
  if(x.id==='diner'){const prev=L[(((step-1)%L.length)+L.length)%L.length];if(m===prev)m=L[((step+1)%L.length+L.length)%L.length]}return m}
function dayPlan(ds){const dow=dowOf(ds),pp=F.pp,dayAbs=absMin(ds+'T00:00');const trainDay=F.people.k.trainDays.includes(dow);
  let it=(F.base[dow]||[]).filter(x=>!x.train||trainDay).map(x=>({...x,meal:['diner','ontbijt','lunch','snack'].includes(x.t)?rotate(x,ds):x.meal,who:[...x.who],mee:{...(x.mee||{})},reason:[],src:'basis'}));
  const notes=[];const sh=shiftsAll();
  const starting=sh.filter(s=>s.start.slice(0,10)===ds&&s.type!=='dag'||s.start.slice(0,10)===ds&&s.type==='dag');
  const ending=sh.filter(s=>s.type==='nacht'&&s.start.slice(0,10)<ds&&s.end.slice(0,10)===ds);
  for(const s of starting){const st=absMin(s.start),en=absMin(s.end),leave=st-pp.travel,eat=leave-pp.eatLead-dayAbs;const lab=`${TL[s.type]} ${s.start.slice(11)}–${s.end.slice(11)}`;notes.push({s,lab});
    const din=it.find(x=>x.id==='diner');let boxMeal=s.type==='nacht'?'p_nacht':'p_box',boxNote=s.type==='nacht'?'Glutenvrije maaltijd voor haar nachtpauze':'Meeneembox voor haar pauze';
    if(din){const ft=tm(din.time);
      if(leave-dayAbs<=ft+30){ // ze is weg vóór het gewone avondeten
        if(eat>=tm(pp.winFrom)&&eat<=tm(pp.winTo)){din.reason.push(`Samen eten vóór vertrek (${lab}); verschoven van ${din.time}`);din.time=hm(eat);din.src='auto'}
        else{din.who=din.who.filter(w=>w!=='p');din.pAway=true;din.reason.push(`Patricia werkt (${lab}); zij krijgt een glutenvrije meeneemportie`);
          if(s.type==='avond'||allowed(din.meal,'p')){boxMeal=din.meal;boxNote='Glutenvrije meeneemportie van het avondeten, voor haar pauze'}}}
      else din.reason.push(`Samen eten; Patricia vertrekt om ${hm(leave-dayAbs)}`)}
    const bm=breakFor(s);it.push({id:'p-pauze-'+s.id,t:'pauze',time:hm(bm),at:fromAbs(bm),meal:boxMeal,variant:'p',who:['p'],mee:{p:true},reason:[boxNote+(s.brk?' (geregistreerde pauze)':' (jouw voorkeursmoment)')],src:'auto'});
    it=it.filter(x=>!(x.who.length===1&&x.who[0]==='p'&&x.src==='basis'&&absMin(ds+'T'+x.time)>=leave&&absMin(ds+'T'+x.time)<=en))}
  for(const s of ending){const en=absMin(s.end)-dayAbs;const wake=s.wake||pp.wake;
    it=it.filter(x=>!(x.who.length===1&&x.who[0]==='p'&&x.src==='basis'&&['ontbijt','snack'].includes(x.t)&&tm(x.time)<(wake?tm(wake):720)));
    it.push({id:'p-nathuis-'+s.id,t:'nathuis',time:hm(en+20),meal:'p_nathuis',who:['p'],reason:[`Na de ${TL.nacht}, vóór het slapen`],src:'auto'});
    it.push({id:'p-wakker-'+s.id,t:'wakker',time:wake||null,meal:'p_wakker',who:['p'],reason:[wake?`Eerste maaltijd na het slapen, rond je wektijd ${wake}`:'Tijd open: wektijd na de nachtdienst nog onbekend'],src:'auto'});
    const ln=it.find(x=>x.id==='p-lunch');if(ln&&wake&&tm(ln.time)<tm(wake)+120){ln.time=hm(tm(wake)+150);ln.reason.push('Later gezet: na je wektijd');ln.src='auto'}}
  /* Kristiaan: op pad = lunch mee; 'Kristiaan thuis' = avondeten na thuiskomst */
  const K=F.kroster||{};const kev=(K.events||[]).filter(e=>e.start.slice(0,10)===ds);const kNotes=[];
  if(K.on&&K.lastSync){const outs=kev.filter(e=>e.kind==='out');const kl=it.find(x=>x.id==='k-lunch');const places=[...new Set(outs.map(e=>e.place))];
    if(outs.length){kNotes.push('op pad: '+places.join(', '));if(kl){kl.mee={...kl.mee,k:true};kl.reason.push('Op pad ('+places.join(', ')+'): lunch mee');kl.src='auto'}}
    else if(dow<5&&kl&&kl.mee&&kl.mee.k){kl.mee={...kl.mee,k:false};kl.reason.push('Geen afspraken buiten de deur: lunch thuis');kl.src='auto'}
    const home=kev.filter(e=>e.kind==='home').pop();const din=it.find(x=>x.id==='diner');
    if(home&&din&&din.who.includes('k')){const ht=tm(home.start.slice(11))+15;kNotes.push('thuis rond '+home.start.slice(11));
      if(tm(din.time)<ht){if(din.src==='auto'&&din.who.includes('p')){din.who=din.who.filter(w=>w!=='k');it.push({id:'k-diner',t:'diner',time:hm(ht),meal:din.meal,who:['k'],reason:['Patricia eet eerder (dienst); jij bent pas om '+home.start.slice(11)+' thuis: eigen bord'],src:'auto'})}
        else{din.reason.push('Kristiaan is om '+home.start.slice(11)+' thuis; verschoven van '+din.time);din.time=hm(ht);din.src='auto'}}}}
  const ov=F.over[ds]||{};for(const id in ov){const o=ov[id];const i=it.findIndex(x=>x.id===id);
    if(o.deleted){if(i>=0)it.splice(i,1);continue}
    const v={...(i>=0?it[i]:{}),...o,reason:[o.pinned?'Vastgezet':'Aangepast voor deze dag'],src:o.pinned?'vast':'dag'};if(i>=0)it[i]=v;else it.push(v)}
  it.sort((a,b)=>(a.time?tm(a.time)+(a.at&&a.at.slice(0,10)>ds?1440:0):2000)-(b.time?tm(b.time)+(b.at&&b.at.slice(0,10)>ds?1440:0):2000));
  return{date:ds,dow,trainDay,items:it,shifts:notes,ending:ending.map(s=>s.id),kNotes}}
/* ---------- recepten: kruiden, bereiding en ovenstand (Bosch: oven CMG8764C7, stoomoven CSG856RC7 via Home Connect) ---------- */
const PROG={hot_air:'Hetelucht',top_bottom_heating:'Boven- en onderwarmte',hot_air_grilling:'Hetelucht grillen',pizza_setting:'Pizzastand',steam:'Stomen'};
const OV=(dev,prog,temp,min,pre)=>({dev,prog,temp,min,pre:pre!==false});
const REC={
 g_kipspies:{tijd:40,kr:'1 tl paprikapoeder, ½ tl oregano, ½ tl tijm, peper, zout, rasp van ½ citroen',oven:OV('oven','hot_air',200,25),st:['Oven voorverwarmen op 200 °C hetelucht (knop hieronder).','Aardappels (Kristiaan) in partjes, 1 el olie en een snuf zout erover; alvast 10 min in de oven.','Kip in blokjes, courgette en paprika in grove stukken; rijg om en om aan spiesjes.','Meng olie met de kruiden en citroenrasp en kwast de spiesjes in.','Spiesjes naast de aardappels leggen, nog 20–25 min tot de kip gaar is (kern 74 °C), halverwege keren.']},
 g_ovenschotel:{stoom:{...OV('stoomoven','steam',100,6),wat:'Broccoli (vóór het de ovenschaal in gaat)'},tijd:45,kr:'1 tl Italiaanse kruiden (zonder knoflook), nootmuskaat, peper, zout',oven:OV('oven','hot_air',190,25),st:['Oven voorverwarmen op 190 °C hetelucht.','Aardappels (Kristiaan) schillen, in plakjes 10 min koken.','Broccoli in roosjes 3 min koken of 6 min stomen.','Kip in blokjes bakken tot bruin, op smaak met kruiden.','Alles in een ovenschaal, lactosevrije room erover, Patricia’s kant met geraspte kaas.','25 min in de oven tot goudbruin.']},
 g_zalm:{stoom:{...OV('stoomoven','steam',100,9),wat:'Broccoli en wortel'},tijd:30,kr:'Dille, rasp en sap van ½ citroen, peper, zout, eventueel 1 tl mosterd (glutenvrij)',oven:OV('oven','hot_air',200,15),st:['Oven voorverwarmen op 200 °C hetelucht.','Aardappels (Kristiaan) koken, ca. 20 min.','Zalm op bakpapier, met citroenrasp, dille, peper en zout; schijfjes citroen erop.','15 min in de oven (zalm is goed als hij net uit elkaar valt).','Broccoli en wortel ondertussen koken of in de stoomoven: 100 °C stomen, 8–10 min.']},
 g_balletjes:{tijd:35,kr:'1 tl oregano, ½ tl paprikapoeder, verse basilicum, peper, zout (geen ui of ei: binden met 1 el passata)',oven:OV('oven','hot_air',200,15),st:['Oven voorverwarmen op 200 °C hetelucht.','Gehakt kneden met kruiden, peper, zout en 1 el passata; draai er kleine balletjes van.','Balletjes op bakpapier, 15 min in de oven (geen spetteren, minder vet).','Courgette in blokjes 5 min bakken, passata erbij, 5 min laten pruttelen.','Balletjes in de saus. Pasta (Kristiaan) volgens de verpakking; Patricia met extra courgette en geraspte kaas.']},
 g_kipaardappel:{stoom:{...OV('stoomoven','steam',100,10),wat:'Sperziebonen en wortel'},tijd:45,kr:'Rozemarijn, tijm, paprikapoeder, peper, zout',oven:OV('oven','hot_air',200,35),st:['Oven voorverwarmen op 200 °C hetelucht.','Aardappels (Kristiaan) in partjes met olie, rozemarijn en zout; 35 min in de oven, halverwege omscheppen.','Kipfilet met paprikapoeder, tijm, peper en zout; in de pan 6–8 min per kant, of de laatste 20 min mee in de oven.','Sperziebonen en wortel 8 min koken of 10 min stomen (stoomoven 100 °C).']},
 g_kabeljauw:{stoom:{...OV('stoomoven','steam',100,8),wat:'Sperziebonen'},tijd:30,kr:'Peterselie, citroen, ½ tl paprikapoeder, peper, zout',oven:OV('oven','hot_air',200,14),st:['Oven voorverwarmen op 200 °C hetelucht.','Aardappels (Kristiaan) koken, ca. 20 min.','Kabeljauw in een ovenschaal, tomaat in partjes eromheen, scheutje olie, kruiden en citroen.','12–15 min in de oven tot de vis wit en schilferig is.','Sperziebonen 8 min koken of stomen; peterselie erover.']},
 g_kipgroente:{tijd:25,kr:'1 tl paprikapoeder, ½ tl oregano, peper, zout',st:['Rijst (Kristiaan) koken volgens de verpakking.','Kip in reepjes in olie 5–6 min bakken tot gaar; kruiden erbij.','Courgette, paprika en champignons erbij, 5 min roerbakken.','Proeven, op smaak brengen.']},
 g_gehakt:{tijd:25,kr:'1 tl oregano, ½ tl tijm, basilicum, peper, zout',st:['Pasta (Kristiaan) koken.','Gehakt rul bakken, vet afgieten.','Courgette en champignons erbij, 5 min bakken.','Passata en kruiden erbij, 10 min zacht laten pruttelen.','Patricia zonder pasta, met geraspte kaas.']},
 g_kipgehakt:{tijd:25,kr:'Paprikapoeder, oregano, peper, zout',st:['Rijst (Kristiaan) koken.','Kipgehakt rul bakken.','Courgette en champignons erbij, 5 min.','Passata en kruiden erbij, 10 min laten pruttelen.']},
 g_kiproom:{tijd:30,kr:'Tijm, peterselie, nootmuskaat, peper, zout',st:['Aardappels (Kristiaan) koken.','Kip in blokjes bakken tot gaar.','Groente erbij, 5 min bakken.','Lactosevrije room erbij, kort laten indikken; kruiden erdoor.']},
 g_rundwok:{tijd:20,kr:'Gember (vers of poeder), glutenvrije tamari i.p.v. sojasaus, peper',st:['Rijst (Kristiaan) koken.','Broccoli en sperziebonen 3 min voorkoken.','Rundreepjes op hoog vuur 2 min wokken, uit de pan.','Groente 3 min wokken, vlees terug, gember en tamari erbij.']},
 g_kalkoenwok:{tijd:20,kr:'Paprikapoeder, gember, glutenvrije tamari, peper',st:['Rijst (Kristiaan) koken.','Kalkoen in reepjes 4–5 min wokken.','Paprika, sperziebonen en wortel erbij, 4 min.','Op smaak met gember en tamari.']},
 g_bowl:{tijd:20,kr:'Paprikapoeder, komijn, limoen of citroen, peper, zout',st:['Rijst (Kristiaan) koken en laten afkoelen.','Kip met kruiden bakken, in plakjes.','Komkommer, paprika en tomaat in blokjes, avocado in plakjes.','Bowl vullen; Patricia met sla i.p.v. rijst. Scheutje citroen erover.']},
 g_curry:{tijd:25,kr:'1 tl milde kerrie, ½ tl kurkuma, ½ tl komijn, gember (controleer kerrie op gluten)',st:['Rijst (Kristiaan) koken.','Kip in blokjes bakken, kruiden 1 min meebakken.','Broccoli en paprika erbij, 5 min.','Lactosevrije room erbij, 5 min zacht laten pruttelen.']},
 g_rundspinazie:{tijd:25,kr:'Tijm, nootmuskaat, peper, zout',st:['Aardappels (Kristiaan) koken.','Rundreepjes op hoog vuur 2 min bakken, uit de pan.','Champignons 4 min bakken, (courgette voor Patricia erbij).','Spinazie erbij laten slinken, vlees terug, op smaak.']},
 g_soep:{tijd:15,kr:'Peterselie, peper',st:['Soep verwarmen.','Kip in reepjes bakken of meekoken tot gaar, in de soep.','Kristiaan met volkoren brood, Patricia met zadencrackers.']},
 k_omelet:{tijd:10,kr:'Peper, zout, bieslook',st:['Eieren loskloppen met peper en zout.','Spinazie in de pan laten slinken, eieren erover.','Op laag vuur gaar laten worden, kalkoen erop.','Met volkoren brood en een stuk fruit.']},
 k_oats:{tijd:5,kr:'Kaneel',st:['’s Avonds: havermout, melk en whey mengen in een bak.','Afgedekt in de koelkast.','’s Ochtends banaan en pindakaas erop, kaneel erover.']},
 k_haver:{tijd:8,kr:'Kaneel',st:['Havermout met melk 3–4 min verwarmen (of 2 min magnetron).','Whey erdoor roeren als het iets is afgekoeld.','Banaan en pindakaas erop.']},
 k_rijstsalade:{tijd:15,kr:'Peterselie, paprikapoeder, citroensap, peper, zout',st:['Rijst koken en afkoelen (of restje).','Kip bakken en in blokjes.','Paprika en komkommer in blokjes, alles mengen met olie, citroen en kruiden.']},
 p_salade:{tijd:15,kr:'Oregano, citroensap, peper',st:['Kip met oregano bakken, in reepjes.','Sla en paprika in een bak, kip erop, hummus en kaas erbij.']},
 p_zalmsalade:{tijd:15,kr:'Dille, citroen, peper',st:['Zalm 12 min in de oven op 200 °C hetelucht, of uit de pan.','Sla, komkommer en tomaat met olie en citroen, zalm erop.']}};
function ovenNames(){return{oven:'Oven',stoomoven:'Stoomoven'}}
let HA={ws:m=>HEALTH.haWS(m),get:p=>HEALTH.haGet(p)};
/* ---------- oven via Home Assistant (Home Connect). Alleen op jouw knopdruk, met bevestiging; de oven moet zelf 'Start op afstand' aan hebben. ---------- */
async function findOvens(){const r=await HA.ws({type:'config/entity_registry/list_for_display'});const L=(r&&r.entities)||[];const o={};
  L.forEach(e=>{const m=/^select\.(.+)_(actieve_programma|active_program)$/.exec(e.ei||'');if(m&&e.di){const key=/stoom|steam/i.test(m[1])?'stoomoven':'oven';if(!o[key])o[key]={dev:e.di,pre:m[1]}}});
  const st=await HA.get('/api/states');const ids=(st||[]).map(x=>x.entity_id);
  for(const k in o){const p=o[k].pre;const f=re=>ids.find(i=>i.startsWith(re[0]+'.')&&i.includes(p)&&re[1].test(i));o[k].remote=f(['binary_sensor',/start_op_afstand|remote_start/]);o[k].status=f(['sensor',/_status$|operation_state/]);o[k].temp=f(['sensor',/temperatuur|temperature/]);o[k].stop=f(['button',/stop/])}
  F.ovens={...o,found:Date.now()};save(true);return o}
async function ovenState(key){if(!F.ovens||!F.ovens[key])await findOvens();const o=F.ovens&&F.ovens[key];if(!o)throw new Error('Geen '+key+' gevonden in Home Assistant (Home Connect).');
  const g=async id=>id?(await HA.get('/api/states/'+id)).state:null;return{o,remote:await g(o.remote),status:await g(o.status),temp:await g(o.temp)}}
async function ovenStart(key,ov){const s=await ovenState(key);if(s.remote!=='on')throw new Error('REMOTE');
  const prog=ov.prog==='steam'?'cooking_oven_program_steam_modes_steam':'cooking_oven_program_heating_mode_'+ov.prog;
  const base={device_id:s.o.dev,affects_to:'active_program',program:prog,cooking_oven_option_setpoint_temperature:ov.temp};
  const call=d=>HA.ws({type:'call_service',domain:'home_connect',service:'set_program_and_options',service_data:d});
  if(ov.prog==='steam'&&ov.min){try{await call({...base,b_s_h_common_option_duration:ov.min*60});return'duur'}catch(e){}}
  if(key==='oven'&&ov.prog!=='steam'){try{await call({...base,cooking_oven_option_fast_pre_heat:true});return'snel'}catch(e){}}await call(base);return''}
async function ovenStop(key){const s=await ovenState(key);if(!s.o.stop)throw new Error('Geen stopknop gevonden');await HA.ws({type:'call_service',domain:'button',service:'press',service_data:{entity_id:s.o.stop}})}
function eaters(ds,x){F.ui.eat=F.ui.eat||{};const o=F.ui.eat[ds+'|'+x.id];const d={k:x.who.includes('k'),p:x.who.includes('p'),kids:x.gezin?(F.ui.kidsDef??2):0,guests:0};return o?{...d,...o}:d}
function cookTotal(x,e){const add=new Map();const put=(list,f)=>list.forEach(([i,q,u])=>{const key=i+'|'+u;add.set(key,(add.get(key)||0)+q*f)});
  if(e.k)put(variant(x.meal,'k',x.ingK),1);if(e.p)put(variant(x.meal,'p',x.ingP),1);const extra=e.kids*.5+e.guests*.75;if(extra)put(variant(x.meal,'k',x.ingK),extra);
  return[...add].map(([k,q])=>{const [i,u]=k.split('|');return[i,q,u]})}
function fmtQ(q,u){if(u==='g'||u==='ml'||u==='g droog')return q>=50?Math.round(q/5)*5:Math.round(q);if(u==='snee')return Math.ceil(q);return String(Math.round(q*2)/2).replace('.',',')}
let RS=null;
function rsItem(){return RS&&(RS.virt||dayPlan(RS.ds).items.find(i=>i.id===RS.id))}
function recipeSheet(ds,id,virt){const x=virt||dayPlan(ds).items.find(i=>i.id===id);if(!x)return;RS={ds,id,virt};const m=M[x.meal]||{n:x.meal};const R=REC[x.meal];
  const ings=w=>variant(x.meal,w,w==='k'?x.ingK:x.ingP).map(([i,q,u])=>`<li>${q} ${E(u)} ${E(iN(i).toLowerCase())}</li>`).join('');
  const ovH=R?devs(R).map((o,i)=>{const st=o.prog==='steam';return`<div class="card" style="margin:10px 0;border-color:${st?'rgba(125,211,252,.5)':'rgba(251,146,60,.45)'}"><div class="row sp"><b>${st?'♨️':'🔥'} ${o.dev==='stoomoven'?'Stoomoven':'Oven'}: ${PROG[o.prog]} ${o.temp} °C</b><span class="tiny mut">${o.min} min</span></div>
   <div class="tiny mut" style="margin-top:4px">${st?`${E(o.wat||'Groente')} stomen; het programma stopt vanzelf na ${o.min} min. Vul eerst het waterreservoir. Start ±${o.min} min vóór je wilt eten${x.time?' (rond '+hm(Math.max(0,tm(x.time)-o.min-2))+')':''}.`:`Voorverwarmen duurt ±8–12 min. Begin ongeveer ${x.time?hm(Math.max(0,tm(x.time)-(R.tijd||30)-10)):'een kwartier vóór je begint'} als je om ${x.time||'het geplande moment'} wilt eten.`}</div>
   <div id="ovst${i}" class="small" style="margin-top:6px"></div>
   ${window.HEALTH&&HEALTH.hasHA&&HEALTH.hasHA()?`<div class="row" style="gap:8px;margin-top:8px"><button class="btn pri grow" data-a="v_ovask" data-k="${i}">${st?'Stomen starten':'Nu voorverwarmen'}</button><button class="btn sm" data-a="v_ovchk" data-k="${i}">Status</button></div>`:'<div class="tiny mut" style="margin-top:6px">Koppel Home Assistant (Gezondheid) om de oven vanuit hier te bedienen.</div>'}</div>`}).join(''):'';
  sheet(`<h2>${E(m.n)}</h2><div class="small mut">${virt?'Receptenboek':DN[dowOf(ds)]+' '+fmtD(ds)}${x.time?' · '+x.time:''}${R&&R.tijd?' · ±'+R.tijd+' min':''} · ${x.who.map(w=>PN[w]).join(' + ')}</div>${ovH}
   ${(()=>{const e=eaters(ds,x);const tot=cookTotal(x,e);const n=(e.k?1:0)+(e.p?1:0)+e.kids+e.guests;return`<h3>Wie eet er mee</h3><div class="row wrap" style="gap:6px">${['k','p'].map(w=>`<button class="chip${e[w]?' on':''}" data-a="v_eatr" data-k="${w}">${e[w]?'✓':'○'} ${PN[w]}</button>`).join('')}</div>
   ${[['kids','Kinderen','halve portie'],['guests','Gasten','¾ portie']].map(([k,l,h])=>`<div class="row sp" style="margin-top:8px"><span class="small">${l} <span class="tiny mut">(${h})</span></span><div class="row" style="gap:8px;align-items:center"><button class="btn sm" data-a="v_eatn" data-k="${k}:-1">−</button><b style="min-width:16px;text-align:center">${e[k]}</b><button class="btn sm" data-a="v_eatn" data-k="${k}:1">+</button></div></div>`).join('')}
   <h3>Totaal koken · ${n} ${n===1?'persoon':'personen'}</h3>${tot.length?`<ul class="small" style="margin:4px 0 0 18px;padding:0">${tot.map(([i,q,u])=>`<li>${fmtQ(q,u)} ${E(u.replace(' droog',''))} ${E(iN(i).toLowerCase())}${u.includes('droog')?' (droog)':''}</li>`).join('')}</ul><div class="tiny mut" style="margin-top:4px">Kinderen en gasten krijgen de gewone portie (zoals Kristiaan), naar verhouding. Kruiden en olie in de bereiding zijn voor de hele pan; bij meer dan 4 personen iets extra.</div>`:'<div class="small mut">Niemand geselecteerd.</div>'}`})()}
   <h3>Per persoon</h3>${x.who.map(w=>`<div class="tiny mut" style="margin-top:6px">${PN[w]}${w==='p'?' (glutenvrij)':''} · ≈ ${Math.round(nutItem(x,w).p)} g eiwit, ${Math.round(nutItem(x,w).k)} kcal (schatting)</div><ul class="small" style="margin:4px 0 0 18px;padding:0">${ings(w)}</ul>`).join('')}
   ${R?`<h3>Kruiden</h3><div class="small">${E(R.kr)}</div><h3>Bereiding</h3><ol class="small" style="margin:4px 0 0 18px;padding:0">${R.st.map(s=>`<li style="margin:4px 0">${E(s)}</li>`).join('')}</ol>`:'<div class="small mut" style="margin-top:10px">Geen bereiding nodig: klaarmaken met de ingrediënten hierboven.</div>'}
   ${x.who.includes('p')&&R?'<div class="tiny mut" style="margin-top:8px">Voor Patricia zonder ui en knoflook en glutenvrij; controleer kant-en-klare kruidenmixen en sauzen op gluten.</div>':''}
   ${virt?'<div class="tiny mut" style="margin-top:12px">Wil je dit op een dag eten? Tik in het weekschema op die maaltijd → Maaltijd aanpassen → kies dit gerecht.</div>':`<button class="btn full" style="margin-top:14px" data-a="v_edit" data-d="${ds}" data-k="${E(id)}">Maaltijd aanpassen</button>`}`)}
function devs(R){return[R.oven,R.stoom].filter(Boolean)}
function ovCtx(i){const x=rsItem();const R=x&&REC[x.meal];const o=R&&devs(R)[+i||0];return{o,el:document.getElementById('ovst'+(+i||0))}}
async function ovenAsk(i){const {o,el}=ovCtx(i);if(!o||!el)return;const st=o.prog==='steam';
  el.innerHTML=`<div class="banner warn">Zeker weten? De ${o.dev} gaat nu aan: <b>${PROG[o.prog].toLowerCase()} ${o.temp} °C</b>${st?` voor ${o.min} min. Staat er water in het reservoir en de groente erin?`:'. Zorg dat er niets in of op de oven staat.'} <div class="row" style="gap:8px;margin-top:8px"><button class="btn sm pri" data-a="v_ovgo" data-k="${i}">Ja, aanzetten</button><button class="btn sm" data-a="v_ovchk" data-k="${i}">Annuleren</button></div></div>`}
async function ovenGo(i,stop){const {o,el}=ovCtx(i);if(!o||!el)return;const key=o.dev;
  try{if(stop){await ovenStop(key);el.textContent='Programma gestopt.';return}const f=await ovenStart(key,o);el.innerHTML=`✓ ${o.prog==='steam'?'Stomen gestart'+(f==='duur'?`, stopt na ${o.min} min`:' (stel de tijd op de oven in, of stop hier)'):'Voorverwarmen gestart'+(f==='snel'?' (snel voorverwarmen)':'')+'. Je krijgt de melding van je Keuken-hub als hij op temperatuur is'}. <button class="btn sm" data-a="v_ovstop" data-k="${i}">Stoppen</button>`}
  catch(e){el.innerHTML=e.message==='REMOTE'?`<div class="banner warn">De ${key} staat niet op <b>Start op afstand</b>. Druk op de ${key} op de Home Connect-/afstandsknop (of zet ‘Start op afstand’ aan in de instellingen van het apparaat) en probeer het opnieuw. Dat is een veiligheidsregel van Bosch; dat kan de app niet overslaan.</div>`:`<div class="banner warn">Starten lukte niet: ${E(e.message)}</div>`}}
async function ovenCheck(i){const {o,el}=ovCtx(i);if(!o||!el)return;el.textContent='Status ophalen…';
  try{const s=await ovenState(o.dev);const SL={inactive:'uit',ready:'klaar',run:'bezig',finished:'klaar',delayedstart:'uitgestelde start',pause:'gepauzeerd',actionrequired:'actie nodig',error:'fout'};el.innerHTML=`Status: ${E(SL[s.status]||s.status||'onbekend')} · binnen ${s.temp!=null?E(s.temp)+' °C':'—'} · start op afstand: ${s.remote==='on'?'<b style="color:var(--ok)">aan</b>':'<b>uit</b> (druk op de knop op het apparaat)'}`}catch(e){el.textContent='Kon status niet ophalen: '+e.message}}
/* ---------- voedingswaarden: SCHATTING (gangbare gemiddelden, per 100 g/ml of per stuk/snee/tl) — geen gemeten waarden ---------- */
const NUT={havermout:[13,370],melk:[3.5,46],whey:[78,380],skyr:[11,63],lfkwark:[9,65],kaas:[29,290],geraspt:[27,380],lfroom:[2.5,200],spread:[0,540],
 volkoren:[3.5,85],wrap:[5,170],pasta:[5.5,150],gfpasta:[3,150],rijst:[2.7,130],aardappel:[2,80],gfcracker:[7,400],zadencracker:[4,90],rijstwafel:[0.7,28],maiswafel:[0.7,30],
 kip:[23,110],zalm:[20,200],kabeljauw:[18,80],tonijn:[25,115],kipbeleg:[20,105],kalkoen:[22,105],rund:[21,130],gehakt:[20,170],kipgehakt:[19,140],ei:[7,80],
 courgette:[1.5,20],paprika:[1,30],champignons:[3,22],broccoli:[3,35],sperzie:[2,30],wortel:[0.8,35],komkommer:[0.6,12],sla:[1.3,15],tomaat:[0.9,20],spinazie:[2.9,23],wok:[2,30],rauwkost:[1,25],passata:[1.3,30],ui:[1.2,40],knoflook:[6,150],olijven:[1,145],
 banaan:[1.3,105],druiven:[0.7,70],appel:[0.4,80],aardbei:[0.7,35],sinaas:[1.2,70],mango:[0.8,60],kiwi:[0.8,45],fruit:[1,75],citroen:[0.5,15],
 pindakaas:[25,600],noten:[20,620],amandel:[21,600],avocado:[2,200],olie:[0,900],hummus:[7,270],honing:[0.3,320],crunchy:[22,400],kruiden:[0,5],
 kipsoep:[3,35],paprikasoep:[1,40],courgettesoep:[1,30]};
const NUTDRY={pasta:[12,355],gfpasta:[7,350],rijst:[7,350]};
function nutOf(list){let p=0,k=0,miss=0;for(const [i,q,u] of list||[]){const n=NUT[i];if(!n||!(q>0)){miss++;continue}const dry=u==='g droog'&&NUTDRY[i];const nn=dry||n;const f=(u==='g'||u==='ml'||u==='g droog')?q/100:q;p+=nn[0]*f;k+=nn[1]*f}return{p,k,miss}}
function nutItem(x,w){return nutOf(variant(x.meal,w,w==='k'?x.ingK:x.ingP))}
function isEaten(ds,id,w){const d=F.eaten&&F.eaten[ds];return!!(d&&d[id]&&d[id].includes(w))}
function dayNut(ds,w,plan){const P=plan||dayPlan(ds);const r={plan:{p:0,k:0},got:{p:0,k:0},n:0,done:0,target:(F.people[w]||{}).prot||0};
  P.items.filter(x=>x.who.includes(w)).forEach(x=>{const v=nutItem(x,w);r.plan.p+=v.p;r.plan.k+=v.k;r.n++;if(isEaten(ds,x.id,w)){r.got.p+=v.p;r.got.k+=v.k;r.done++}});return r}
function curW(){try{return/patricia/i.test(S.profile.name||'')?'p':'k'}catch(e){return'k'}}
function kcalDay(p){let k=0,unk=0;p.items.filter(x=>x.who.includes('k')).forEach(x=>{const m=M[x.meal];if(!x.ingK&&m&&m.kk)k+=m.kk;else{const v=nutItem(x,'k');k+=v.k;unk++}});return{k:Math.round(k/10)*10,unk}}

/* ---------- agenda Kristiaan: op pad / thuis ---------- */
function kKind(t){t=t||'';if(/kristiaan thuis|\bthuis\b/i.test(t)&&t.length<30)return['home',''];if(/niet eerder weg/i.test(t))return['notbefore',''];const m=t.match(/^([A-Za-zÀ-ÿ'\- ]{2,30}):\s/);if(m)return['out',m[1].trim()];return[null,'']}
async function syncK(){const K=F.kroster;if(!K.on)return{skip:true};if(!window.HEALTH||!HEALTH.haGet)return{err:'Koppel eerst Home Assistant.'};
  const from=new Date(Date.now()-864e5),to=new Date(Date.now()+28*864e5);const ents=(K.entities||'').split(',').map(x=>x.trim()).filter(Boolean);const ev=[];
  try{for(const ent of ents){const r=await HEALTH.haGet(`/api/calendars/${encodeURIComponent(ent)}?start=${encodeURIComponent(from.toISOString())}&end=${encodeURIComponent(to.toISOString())}`);
      for(const e of r||[]){if(!e.start||!e.start.dateTime)continue;const [kind,place]=kKind(e.summary);if(!kind)continue;ev.push({start:ams(new Date(e.start.dateTime)),end:ams(new Date(e.end.dateTime)),kind,place})}}
    K.events=ev.sort((a,b)=>a.start.localeCompare(b.start));K.lastSync=Date.now();K.err='';save();return{ok:true,n:ev.length}}catch(e){K.err=e.message;save(true);return{err:e.message}}}
/* ---------- agenda via Home Assistant ---------- */
/* Type van een dienst: eerst op naam; staan alle diensten als 'Werken' in de agenda, dan op begintijd (Amsterdam-tijd). */
function typeByTime(start,end){const h=tm(start.slice(11))/60;const over=end&&end.slice(0,10)>start.slice(0,10);if(h>=20||(over&&h>=18)||h<4)return'nacht';if(h>=12)return'avond';return'dag'}
const isWork=t=>/werk|dienst/i.test(t||'');
function classify(sum,start,end){const s=(sum||'').toLowerCase();if(!isWork(sum))return null;const kw=F.roster.kw;for(const t of ['nacht','avond','dag']){const ks=(kw[t]||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);if(ks.some(k=>s.includes(k)))return t}
  return F.roster.allShifts&&start&&isWork(sum)?typeByTime(start,end):null}
async function syncCal(){const R=F.roster;if(!R.entity||!R.consent)return{err:'Kies eerst een agenda en geef toestemming.'};if(!window.HEALTH||!HEALTH.haGet)return{err:'Koppel eerst Home Assistant (Gezondheid → Koppelen).'};
  const from=new Date(Date.now()-2*864e5),to=new Date(Date.now()+28*864e5);
  try{const ev=await HEALTH.haGet(`/api/calendars/${encodeURIComponent(R.entity)}?start=${encodeURIComponent(from.toISOString())}&end=${encodeURIComponent(to.toISOString())}`);
    const got=[];for(const e of ev||[]){if(!e.start||!e.start.dateTime)continue;const start=ams(new Date(e.start.dateTime)),end=ams(new Date(e.end.dateTime));const type=classify(e.summary,start,end);if(!type)continue;const id='ha:'+(e.uid||'')+(e.recurrence_id||'')+'@'+(e.uid?'':start+e.summary);got.push({id,type,start,end,src:'ha',title:e.summary})}
    const lo=ams(from).slice(0,10),hi=ams(to).slice(0,10);const before=F.shifts.filter(s=>s.src==='ha');
    const keep=F.shifts.filter(s=>s.src!=='ha'||((s.start.slice(0,10)<lo||s.start.slice(0,10)>hi)&&(!F.roster.allShifts||isWork(s.title))));
    const changes={nieuw:got.filter(g=>!before.some(b=>b.id===g.id)).length,gewijzigd:got.filter(g=>before.some(b=>b.id===g.id&&(b.start!==g.start||b.end!==g.end))).length,vervallen:before.filter(b=>b.start.slice(0,10)>=lo&&b.start.slice(0,10)<=hi&&!got.some(g=>g.id===b.id)).length};
    F.shifts=keep.concat(got);R.lastSync=Date.now();R.err='';R.lastChanges=changes;save();return{ok:true,n:got.length,changes}}
  catch(e){R.err=e.message;save();return{err:e.message}}}

/* ---------- UI ---------- */
const E=s=>esc(s==null?'':String(s));
const chipW=w=>w.map(x=>`<span class="chip" style="padding:2px 7px;${x==='p'?'border-color:rgba(249,168,212,.5);color:#f9a8d4':'border-color:rgba(165,180,252,.5);color:#c7d2fe'}">${PN[x][0]}</span>`).join('');
function ingList(meal,who,custom){return variant(meal,who,custom).map(([i,q,u])=>`${q} ${u} ${iN(i).toLowerCase()}`).join(', ')}
function diffP(it){if(!it.gezin||!it.who.includes('p'))return'';const k=variant(it.meal,'k',it.ingK).map(x=>x[0]),p=variant(it.meal,'p',it.ingP).map(x=>x[0]);
  const only=p.filter(i=>!k.includes(i)),not=k.filter(i=>!p.includes(i));const qty=variant(it.meal,'p',it.ingP).filter(([i,q])=>{const kk=variant(it.meal,'k',it.ingK).find(x=>x[0]===i);return kk&&kk[1]!==q}).map(([i,q,u])=>`${q} ${u} ${iN(i).toLowerCase()}`);
  const parts=[];if(not.length)parts.push('zonder '+not.map(iN).join(', ').toLowerCase());if(only.length)parts.push('met '+only.map(iN).join(', ').toLowerCase());if(qty.length)parts.push('portie: '+qty.join(', '));
  return parts.length?`<div class="tiny" style="color:#f9a8d4;margin-top:3px">Patricia (glutenvrij): ${E(parts.join(' · '))}</div>`:''}
function rosterBanner(mon){const R=F.roster;const sun=addDays(mon,6);const n=shiftsAll().filter(s=>s.start.slice(0,10)>=mon&&s.start.slice(0,10)<=sun).length;
  if(R.src==='ha'&&R.lastSync){const age=(Date.now()-R.lastSync)/36e5;if(R.err)return`<div class="banner warn">Rooster: synchronisatie mislukt (${E(R.err)}). Voorstellen gebruiken de laatst bekende diensten van ${new Date(R.lastSync).toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}.</div>`;
    if(age>24)return`<div class="banner warn">Rooster mogelijk verouderd: laatste synchronisatie ${Math.round(age)} uur geleden. <button class="btn sm" data-a="v_sync">Nu ophalen</button></div>`;
    return`<div class="small mut" style="margin:0 2px 10px">Rooster uit agenda · ${n} dienst(en) deze week · bijgewerkt ${new Date(R.lastSync).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}</div>`}
  return n?`<div class="small mut" style="margin:0 2px 10px">Rooster handmatig ingevoerd · ${n} dienst(en) deze week</div>`:`<div class="banner warn">Rooster onbekend voor deze week: voorstellen gaan uit van vrije dagen. <button class="btn sm" data-a="v_seg" data-k="rooster">Diensten invoeren</button></div>`}
const eatBtn=(ds,x,w)=>{const on=isEaten(ds,x.id,w);return`<button class="chip${on?' on':''}" data-a="v_eat" data-d="${ds}" data-k="${E(x.id)}" data-w="${w}" style="padding:3px 9px">${on?'✓':'○'} ${PN[w][0]}</button>`};
function itemCard(x,ds,d,full,only){const past=ds<=today();const ws=only?x.who.filter(w=>w===only).concat(x.who.filter(w=>w!==only)):x.who;
  return`<div class="li" data-a="v_rec" data-d="${ds}" data-k="${E(x.id)}" style="align-items:flex-start;padding:8px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--line);${x.who.length>1?'':x.who[0]==='p'?'border-left:3px solid #f9a8d4':'border-left:3px solid #a5b4fc'}">
   <div class="grow" style="min-width:0"><div class="row sp tiny"><b style="${x.time?'':'color:var(--warn)'}">${x.time||'open'}${x.at&&x.at.slice(0,10)>ds?' '+DS[(d+1)%7]:''}</b><span class="mut">${SLOT[x.t]||''}${x.gezin?' · gezin':''}${REC[x.meal]&&REC[x.meal].oven?' · 🔥':''}</span></div>
   <div class="small" style="margin-top:2px;line-height:1.25">${E(M[x.meal]?M[x.meal].n:x.meal)} ${x.src==='vast'?'📌':''}</div>
   <div class="row wrap" style="gap:4px;margin-top:5px">${past?ws.map(w=>eatBtn(ds,x,w)).join(''):chipW(ws)}${x.mee&&(x.mee.k||x.mee.p)?`<span class="chip warn" style="padding:2px 7px">mee${x.who.length>1?': '+['k','p'].filter(w=>x.mee[w]).map(w=>PN[w][0]).join(','):''}</span>`:''}<span class="tiny mut" style="align-self:center">≈${ws.map(w=>Math.round(nutItem(x,w).p)).join('/')} g eiwit</span></div>
   ${full?diffP(x)+(x.reason.length?`<div class="tiny mut" style="margin-top:3px">${E(x.reason.join(' · '))}</div>`:''):''}</div></div>`}
function weekItems(p,ds,d){const wv=F.ui.wv||'naast';
  if(wv!=='naast'){const L=p.items.filter(x=>x.who.includes(wv));const other=p.items.filter(x=>!x.who.includes(wv)).length;
    return`<div style="display:grid;gap:6px;margin-top:8px">${L.map(x=>itemCard(x,ds,d,true,wv)).join('')||'<div class="small mut">Geen maaltijden.</div>'}</div>${other?`<div class="tiny mut" style="margin-top:4px">${other} maaltijd(en) alleen voor ${PN[wv==='k'?'p':'k']} verborgen.</div>`:''}`}
  const rows=[];let open=null;p.items.forEach(x=>{if(x.who.length>1){open=null;rows.push({both:x});return}const w=x.who[0];if(open&&!open[w]){open[w]=x}else{open={[w]:x};rows.push(open)}});
  return`<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px"><div class="tiny" style="color:#c7d2fe;font-weight:700">Kristiaan</div><div class="tiny" style="color:#f9a8d4;font-weight:700">Patricia</div>
   ${rows.map(r=>r.both?`<div style="grid-column:1/-1">${itemCard(r.both,ds,d,false)}</div>`:`<div>${r.k?itemCard(r.k,ds,d,false):''}</div><div>${r.p?itemCard(r.p,ds,d,false):''}</div>`).join('')}</div>`}
function weekViewSeg(){const wv=F.ui.wv||'naast';return`<div class="seg" style="margin:0 0 10px">${[['naast','Naast elkaar'],['k','Alleen Kristiaan'],['p','Alleen Patricia']].map(([k,l])=>`<button class="${wv===k?'on':''}" data-a="v_wv" data-k="${k}">${l}</button>`).join('')}</div>`}
function vRecepten(){const grp=[['Uit de oven 🔥 en stoomoven ♨️',k=>REC[k].oven],['Avondeten',k=>!REC[k].oven&&M[k].t==='diner'],['Ontbijt en lunch',k=>!REC[k].oven&&M[k].t!=='diner']];
  return grp.map(([l,f])=>{const ks=Object.keys(REC).filter(k=>M[k]&&f(k));return ks.length?`<div class="card"><h2>${l}</h2><div class="list">${ks.map(k=>`<div class="li" data-a="v_recm" data-k="${k}"><div class="grow"><div class="small"><b>${E(M[k].n)}</b></div><div class="tiny mut">${REC[k].oven?`${PROG[REC[k].oven.prog]} ${REC[k].oven.temp} °C · ${REC[k].oven.min} min${REC[k].stoom?' + stomen':''} · `:''}±${REC[k].tijd} min</div></div><span class="mut">›</span></div>`).join('')}</div></div>`:''}).join('')}
function vWeek(){const mon=addDays(monday(today()),F.ui.wk*7);let h=`<div class="row sp" style="margin:0 2px 10px"><button class="ibtn" data-a="v_wk" data-k="-1">‹</button><b>Week van ${fmtD(mon)}</b><button class="ibtn" data-a="v_wk" data-k="1">›</button></div>`+weekViewSeg()+rosterBanner(mon);
  for(let d=0;d<7;d++){const ds=addDays(mon,d);const p=dayPlan(ds);const kc=kcalDay(p);const isT=ds===today();
    h+=`<div class="card" ${isT?'style="border-color:rgba(165,180,252,.6)"':''}><div class="row sp"><div><b>${DN[d]} ${fmtD(ds)}</b>${isT?' <span class="chip on" style="padding:1px 7px">vandaag</span>':''}</div><span class="tiny mut">${p.trainDay?'trainingsdag K':'rustdag K'}</span></div>
     ${p.shifts.map(x=>`<div class="chip" style="margin-top:6px;border-color:rgba(249,168,212,.45);color:#f9a8d4">Patricia: ${E(x.lab)}${x.s.src==='ha'?' · agenda':''}</div>`).join(' ')}${p.ending.length?'<div class="chip" style="margin-top:6px">Patricia: na nachtdienst</div>':''}${(p.kNotes||[]).map(n=>`<div class="chip" style="margin-top:6px;border-color:rgba(165,180,252,.5);color:#c7d2fe">Kristiaan: ${E(n)}</div>`).join(' ')}
     ${weekItems(p,ds,d)}
     ${ds<=today()?['k','p'].map(w=>{const n=dayNut(ds,w,p);if(!n.n)return'';const pc=n.target?Math.min(100,n.got.p/n.target*100):0;return`<div style="margin-top:8px"><div class="row sp tiny"><span>${PN[w]}: ${Math.round(n.got.p)} / ${n.target} g eiwit</span><span class="mut">${n.done}/${n.n} gegeten · ≈ ${Math.round(n.got.k).toLocaleString('nl-NL')} kcal</span></div><div style="height:6px;border-radius:4px;background:rgba(255,255,255,.08);margin-top:3px"><div style="height:100%;width:${pc}%;border-radius:4px;background:${w==='p'?'#f9a8d4':'#a5b4fc'}"></div></div></div>`}).join(''):''}<div class="tiny mut" style="margin-top:6px">Kristiaan: ≈ ${kc.k.toLocaleString('nl-NL')} kcal gepland${kc.unk?` (${kc.unk} maaltijd(en) geschat uit ingrediënten)`:''} · doel ${(p.trainDay?F.people.k.kcalTrain:F.people.k.kcalRest).toLocaleString('nl-NL')}. Patricia: ≈ ${Math.round(dayNut(ds,'p',p).plan.k).toLocaleString('nl-NL')} kcal gepland, dagdoel ±${F.people.p.kcal.toLocaleString('nl-NL')}. Eiwit en kcal zijn schattingen op basis van gemiddelde voedingswaarden, geen metingen.</div>
     <button class="btn sm" style="margin-top:8px" data-a="v_add" data-d="${ds}">+ Maaltijd</button></div>`}
  return h}
const TS=[[1,'👍','lekker'],[0,'·','neutraal'],[-1,'👎','niet lekker']];
function vSmaak(){const w=F.ui.tp;const P=F.people[w];const T=F.taste[w];
  let h=`<div class="seg" style="margin-bottom:10px">${['k','p'].map(x=>`<button class="${w===x?'on':''}" data-a="v_tp" data-k="${x}">${PN[x]}</button>`).join('')}</div>
  <div class="card"><div class="small mut">Tik op een ingrediënt om te wisselen: <b>👍 lekker</b> → <b>👎 niet lekker</b> → <b>⛔ mag/kan niet</b> (allergie, intolerantie) → neutraal. Wat iemand niet lust of niet mag, komt niet meer in diens porties. ${w==='p'?'Gluten zijn voor Patricia altijd uitgesloten.':''}</div>
   ${w==='p'?`<label class="row sp" style="margin-top:8px"><span>Altijd glutenvrij</span><input type="checkbox" data-vf="gluten" ${P.gluten?'checked':''}></label>`:''}</div>`;
  for(const [c,l] of CATS){const ks=Object.keys(ING).filter(k=>ING[k][1]===c);h+=`<div class="card"><h3 style="margin-top:0">${l}</h3><div class="chips">${ks.map(k=>{const ex=P.excl.includes(k)||(w==='p'&&P.gluten&&iF(k).g);const t=T.ing[k]||0;
    const st=ex?'background:rgba(255,95,109,.15);border-color:rgba(255,95,109,.45);color:#ff8a95;text-decoration:line-through':t>0?'background:rgba(57,217,138,.15);border-color:rgba(57,217,138,.45);color:#7ff0b5':t<0?'background:rgba(255,204,77,.12);border-color:rgba(255,204,77,.4);color:#ffd77a':'';
    return`<button class="chip" style="padding:7px 11px;font-size:13px;${st}" data-a="v_ing" data-k="${k}">${ex?'⛔ ':t>0?'👍 ':t<0?'👎 ':''}${E(ING[k][0])}${iF(k).g?' <span class="tiny">(gluten)</span>':''}</button>`}).join('')}</div></div>`}
  const ms=Object.keys(M).filter(id=>w==='k'?M[id].k:M[id].p);
  h+=`<div class="card"><h3 style="margin-top:0">Maaltijden</h3><div class="list">${ms.map(id=>{const ok=allowed(id,w);const t=T.meal[id]||0;return`<div class="li"><div class="grow"><div style="${ok?'':'opacity:.5'}">${E(M[id].n)}</div><div class="tiny mut">${SLOT[M[id].t]}${M[id].src==='wissel'?' · uit de wissellijst':M[id].src==='voorstel'?' · nieuw recept (voorstel)':''}${ok?'':' · past niet (uitgesloten ingrediënt)'}</div></div>
   ${TS.filter(x=>x[0]).map(([v,ic])=>`<button class="chip ${t===v?'on':''}" style="padding:6px 10px" data-a="v_meal" data-k="${id}" data-v="${v}">${ic}</button>`).join('')}</div>`}).join('')}</div></div>
  <div class="card"><label class="row sp"><span>Elke week afwisselen</span><input type="checkbox" data-vf="vary" ${F.vary?'checked':''}></label><div class="tiny mut" style="margin-top:6px">Aan: de maaltijden wisselen per week. Wat jullie 👍 geven komt vaker terug, wat iemand 👎 of ⛔ geeft komt niet meer in diens portie. Wat je met 'Ook in basisschema' opslaat, blijft vast staan.</div></div><button class="btn pri full" data-a="v_regen">Basisweek opnieuw maken met deze smaak</button><div class="tiny mut" style="margin:6px 2px 14px">Aanpassingen voor losse dagen en vastgezette maaltijden blijven staan.</div>`;return h}
function vRooster(){const pp=F.pp,R=F.roster;const up=shiftsAll().filter(s=>s.end>=today()).sort((a,b)=>a.start.localeCompare(b.start));
  let h=`<div class="card"><div class="row sp"><h2 style="margin:0">Diensten Patricia</h2><button class="btn sm pri" data-a="v_shiftnew">+ Dienst</button></div>
   <div class="list" style="margin-top:8px">${up.length?up.map(s=>`<div class="li" data-a="v_shiftedit" data-k="${E(s.id)}"><div class="grow"><div><b>${TL[s.type]}</b> · ${DN[dowOf(s.start.slice(0,10))]} ${fmtD(s.start.slice(0,10))}</div><div class="small mut">${s.start.slice(11)} – ${s.end.slice(11)}${s.end.slice(0,10)>s.start.slice(0,10)?' (volgende dag)':''}${s.brk?' · pauze '+s.brk:''}${s.wake?' · wektijd '+s.wake:''} · ${s.src==='ha'?'uit agenda':'handmatig'}</div></div><span class="mut">›</span></div>`).join(''):'<div class="small mut">Nog geen diensten bekend.</div>'}</div></div>
  <div class="card"><h2>Agenda koppelen</h2><div class="small mut">Diensten worden uit een agenda in je Home Assistant gehaald (bijv. Patricia's iCloud-agenda via de CalDAV-integratie, of het agenda-abonnement van haar roosterapp). Wachtwoorden blijven in Home Assistant; de app gebruikt dezelfde beveiligde koppeling als Gezondheid.</div>
   <button class="btn sm" style="margin-top:8px" data-a="v_cals">Agenda's in Home Assistant zoeken</button><div id="v_calmsg" class="small" style="margin-top:6px"></div>
   <label class="lb">Agenda (entity)</label><input class="f" id="v_ent" value="${E(R.entity)}" placeholder="calendar.patricia_werk" autocapitalize="off">
   <div class="grid2"><div><label class="lb">Avonddienst heet</label><input class="f" id="v_kwa" value="${E(R.kw.avond)}"></div><div><label class="lb">Nachtdienst heet</label><input class="f" id="v_kwn" value="${E(R.kw.nacht)}"></div></div>
   <label class="row" style="gap:8px;margin-top:10px;align-items:flex-start"><input type="checkbox" id="v_all" ${R.allShifts?'checked':''} style="margin-top:3px"><span class="small">Alleen afspraken met "werken" (of "dienst") in de titel tellen als dienst; andere afspraken zoals "Meiden wedstrijd" of "Gerry past op" worden genegeerd. Type op begintijd: vanaf 20:00 nacht, vanaf 12:00 avond, anders dag.</span></label>
   <label class="lb">Dagdienst heet (optioneel)</label><input class="f" id="v_kwd" value="${E(R.kw.dag)}"><div class="tiny mut" style="margin-top:4px">Meerdere woorden scheiden met een komma. Afspraken zonder deze woorden worden genegeerd.</div>
   <label class="row" style="gap:8px;margin-top:10px;align-items:flex-start"><input type="checkbox" id="v_cons" ${R.consent?'checked':''} style="margin-top:3px"><span class="small">Patricia vindt het goed dat de app haar werkafspraken uit deze agenda leest. Alleen titel, begin en eind van diensten worden op dit apparaat bewaard.</span></label>
   <div class="row" style="gap:8px;margin-top:10px"><button class="btn pri grow" data-a="v_calsave">Opslaan en ophalen</button>${R.src==='ha'?'<button class="btn" data-a="v_sync">Nu ophalen</button>':''}</div>
   <div class="tiny mut" style="margin-top:6px">${R.lastSync?'Laatste geslaagde synchronisatie: '+new Date(R.lastSync).toLocaleString('nl-NL')+(R.lastChanges?` (nieuw ${R.lastChanges.nieuw}, gewijzigd ${R.lastChanges.gewijzigd}, vervallen ${R.lastChanges.vervallen})`:''):'Nog niet gesynchroniseerd.'}${R.err?' · fout: '+E(R.err):''}</div></div>
  <div class="card"><h2>Agenda Kristiaan</h2><div class="small mut">Afspraken als "Horst: …" = op pad (lunch mee). "Kristiaan thuis" = avondeten na thuiskomst. Alleen tijd, soort en plaats worden bewaard, geen klantnamen.</div>
   <label class="lb">Agenda's (entity, komma-gescheiden)</label><input class="f" id="v_kent" value="${E(F.kroster.entities)}" autocapitalize="off">
   <label class="row sp" style="margin-top:8px"><span>Gebruiken voor mijn eettijden</span><input type="checkbox" id="v_kon" ${F.kroster.on?'checked':''}></label>
   <button class="btn sm" style="margin-top:8px" data-a="v_ksync">Opslaan en ophalen</button>
   <div class="tiny mut" style="margin-top:6px">${F.kroster.lastSync?'Laatst opgehaald: '+new Date(F.kroster.lastSync).toLocaleString('nl-NL')+' · '+F.kroster.events.length+' momenten':'Nog niet opgehaald.'}${F.kroster.err?' · fout: '+E(F.kroster.err):''}</div></div>
  <div class="card"><h2>Gedeeld met Patricia</h2><div class="small mut">Het weekschema, de diensten en de smaak staan ook in jullie Home Assistant, zodat jullie op beide telefoons hetzelfde zien. Wie het laatst iets wijzigt, bepaalt de stand.</div>
   <label class="row sp" style="margin-top:8px"><span>Delen via Home Assistant</span><input type="checkbox" id="v_son" ${F.sync.on?'checked':''}></label>
   <div class="tiny mut" style="margin-top:6px">${F.sync.lastPush?'Laatst gedeeld: '+new Date(F.sync.lastPush).toLocaleString('nl-NL'):''}${F.sync.lastPull?' · laatst opgehaald: '+new Date(F.sync.lastPull).toLocaleString('nl-NL'):''}${F.sync.from?' · laatste wijziging door '+E(F.sync.from):''}${F.sync.ro?' · alleen-lezen (geen beheerdersrechten in HA)':''}${F.sync.err&&!F.sync.ro?' · fout: '+E(F.sync.err):''}</div>
   <button class="btn sm" style="margin-top:8px" data-a="v_spull">Nu ophalen</button></div>
  <div class="card"><h2>Voorkeuren Patricia</h2><div class="grid2">
   ${[['travel','Reistijd naar werk (min)','number'],['eatLead','Eten vóór vertrek (min)','number'],['breakEvening','Pauze avonddienst','time'],['breakNight','Pauze nachtdienst','time'],['wake','Wektijd na nachtdienst','time']].map(([k,l,t])=>`<div><label class="lb">${l}</label><input class="f" type="${t}" data-vp="${k}" value="${E(pp[k])}"></div>`).join('')}</div>
   <div class="tiny mut" style="margin-top:6px">Laat de wektijd leeg als die wisselt; dan blijft de eerste maaltijd na het slapen 'open'. Per dienst kun je ook een eigen wektijd en pauze zetten.</div></div>
  <div class="card"><h2>Gezin</h2><div class="grid2">${[['dinner','Gewoon avondeten','time'],['winFrom','Samen eten vanaf','time'],['winTo','Samen eten uiterlijk','time']].map(([k,l,t])=>`<div><label class="lb">${l}</label><input class="f" type="${t}" data-vp="${k}" value="${E(pp[k])}"></div>`).join('')}</div>
   <label class="lb">Trainingsdagen Kristiaan</label><div class="chips">${DS.map((d,i)=>`<button class="chip ${F.people.k.trainDays.includes(i)?'on':''}" style="padding:7px 11px" data-a="v_td" data-k="${i}">${d}</button>`).join('')}</div>
   <div class="grid2" style="margin-top:6px"><div><label class="lb">kcal trainingsdag</label><input class="f" type="number" data-vk="kcalTrain" value="${F.people.k.kcalTrain}"></div><div><label class="lb">kcal rustdag</label><input class="f" type="number" data-vk="kcalRest" value="${F.people.k.kcalRest}"></div></div>
   ${adjustCard()}</div>`;return h}
/* bijsturen volgens het schema: 2 weken gemiddeld gewicht */
function adjustCard(){try{if(!window.HEALTH||!HEALTH.configured()||!HEALTH._t.trend)return'<div class="tiny mut" style="margin-top:8px">Bijsturen op gewicht: koppel Gezondheid (FITAGE), dan stelt Sophie na 2 weken ±150 kcal voor.</div>';
  const t=HEALTH._t.trend('weight',Date.now()-14*864e5);if(!t)return'<div class="tiny mut" style="margin-top:8px">Bijsturen: nog te weinig wegingen in de laatste 2 weken.</div>';
  const s=t.slope;const adv=s<0.1?150:s>0.35?-150:0;const txt=`Gewicht 2 weken: ${s>=0?'+':''}${s.toFixed(2).replace('.',',')} kg/week (berekend). `+(adv>0?'Schema: +150 kcal per dag (als je kracht ook niet stijgt).':adv<0?'Schema: −150 kcal per dag (als je taille ook snel stijgt).':'Binnen +0,1 tot +0,35 kg/week: niets veranderen.');
  return`<div class="card" style="margin:10px 0 0;background:rgba(255,255,255,.05)"><div class="small"><span class="chip acc">suggestie</span> ${E(txt)}</div>${adv?`<button class="btn sm" style="margin-top:8px" data-a="v_adj" data-k="${adv}">Toepassen (${adv>0?'+':''}${adv} kcal)</button>`:''}</div>`}catch(e){return''}}
function view(){const seg=F.ui.seg;return`<div class="hdr"><div><div class="sub">Gezin · glutenvrij waar nodig</div><h1>Voeding</h1></div><button class="ibtn" data-a="home" aria-label="Start">${IC.home}</button></div>
  <div class="seg" style="margin-bottom:12px">${[['week','Week'],['recepten','Recepten'],['smaak','Smaak'],['rooster','Diensten & agenda']].map(([k,l])=>`<button class="${seg===k?'on':''}" data-a="v_seg" data-k="${k}">${l}</button>`).join('')}</div>`+(seg==='smaak'?vSmaak():seg==='rooster'?vRooster():seg==='recepten'?vRecepten():vWeek())+
  `<div class="tiny mut" style="margin:6px 2px 20px">Basis: jouw spiermassaschema en Patricia's weekmenu. Voedingswaarden alleen waar het schema ze noemt; geen medisch dieetadvies.</div>`}
/* bewerken */
let ED=null;
function editSheet(ds,id,isNew){const p=dayPlan(ds);let x=isNew?{id:'x'+Date.now().toString(36),t:'snack',time:'12:00',meal:'',who:['k'],mee:{},reason:[]}:p.items.find(i=>i.id===id);if(!x)return;
  ED={ds,x:{...x,who:[...x.who],mee:{...(x.mee||{})}},isNew,ingK:x.ingK?x.ingK.map(a=>[...a]):variant(x.meal,'k').map(a=>[...a]),ingP:x.ingP?x.ingP.map(a=>[...a]):variant(x.meal,'p').map(a=>[...a])};renderEdit()}
function renderEdit(){const x=ED.x;const opts=Object.keys(M).filter(id=>!x.t||M[id].t===x.t||x.t==='pauze'&&M[id].t==='diner');
  const ingEd=w=>{const arr=w==='k'?ED.ingK:ED.ingP;return`<div class="tiny mut" style="margin-top:8px">${PN[w]}${w==='p'?' (glutenvrij)':''}</div>${arr.map((a,i)=>`<div class="row" style="gap:6px;margin-top:4px"><input class="f" style="flex:.6;min-height:38px" inputmode="decimal" data-vi="${w}:${i}" value="${a[1]}"><span class="small" style="flex:.5">${E(a[2])}</span><span class="small grow" style="${F.people[w].excl.includes(a[0])||(w==='p'&&F.people.p.gluten&&iF(a[0]).g)?'color:var(--bad)':''}">${E(iN(a[0]))}</span><button class="btn sm" data-a="v_irm" data-k="${w}:${i}">✕</button></div>`).join('')}
   <div class="row" style="gap:6px;margin-top:6px"><select class="f" style="flex:1;min-height:38px" id="v_iadd_${w}"><option value="">+ ingrediënt</option>${CATS.map(([c,l])=>`<optgroup label="${l}">${Object.keys(ING).filter(k=>ING[k][1]===c).map(k=>`<option value="${k}">${E(ING[k][0])}</option>`).join('')}</optgroup>`).join('')}</select><button class="btn sm" data-a="v_iadd" data-k="${w}">Voeg toe</button></div>`};
  sheet(`<h2>${ED.isNew?'Maaltijd toevoegen':'Maaltijd aanpassen'}</h2><div class="small mut">${DN[dowOf(ED.ds)]} ${fmtD(ED.ds)}${x.reason&&x.reason.length?' · '+E(x.reason.join(' · ')):''}</div>
   <div class="grid2"><div><label class="lb">Moment</label><select class="f" id="v_t">${Object.keys(SLOT).map(k=>`<option value="${k}" ${x.t===k?'selected':''}>${SLOT[k]}</option>`).join('')}</select></div><div><label class="lb">Tijd</label><input class="f" type="time" id="v_time" value="${x.time||''}"></div></div>
   <label class="lb">Maaltijd</label><select class="f" id="v_meal"><option value="">— kies —</option>${opts.map(id=>`<option value="${id}" ${x.meal===id?'selected':''}>${E(M[id].n)}${!allowed(id,'p')&&M[id].p?' (niet voor P)':''}</option>`).join('')}</select>
   <label class="lb">Voor wie</label><div class="row" style="gap:12px">${['k','p'].map(w=>`<label class="row" style="gap:6px"><input type="checkbox" class="v_who" value="${w}" ${x.who.includes(w)?'checked':''}>${PN[w]}</label>`).join('')}<label class="row" style="gap:6px"><input type="checkbox" id="v_gez" ${x.gezin?'checked':''}>Hele gezin</label></div>
   <label class="lb">Mee naar het werk</label><div class="row" style="gap:12px">${['k','p'].map(w=>`<label class="row" style="gap:6px"><input type="checkbox" class="v_mee" value="${w}" ${x.mee&&x.mee[w]?'checked':''}>${PN[w]}</label>`).join('')}</div>
   ${x.who.includes('k')?ingEd('k'):''}${x.who.includes('p')?ingEd('p'):''}
   <div class="grid2" style="margin-top:14px"><button class="btn pri" data-a="v_save" data-k="dag">Alleen deze dag</button><button class="btn" data-a="v_save" data-k="basis">Ook in basisschema</button></div>
   <div class="grid2" style="margin-top:8px"><button class="btn" data-a="v_save" data-k="pin">${x.src==='vast'?'📌 Losmaken':'📌 Vastzetten'}</button>${ED.isNew?'<span></span>':'<button class="btn" style="color:var(--bad)" data-a="v_del">Niet op deze dag</button>'}</div>
   ${x.src==='dag'||x.src==='vast'?'<button class="btn full" style="margin-top:8px" data-a="v_reset">Terug naar automatisch voorstel</button>':''}
   <button class="btn full" style="margin-top:8px" data-a="close">Annuleren</button>`)}
function readEdit(){const x=ED.x;const g=id=>document.getElementById(id);if(!g('v_t'))return;const nm=g('v_meal').value;if(nm!==x.meal){x.meal=nm;ED.ingK=variant(nm,'k').map(a=>[...a]);ED.ingP=variant(nm,'p').map(a=>[...a])}
  x.t=g('v_t').value;x.time=g('v_time').value||null;x.who=[...document.querySelectorAll('.v_who')].filter(c=>c.checked).map(c=>c.value);x.gezin=g('v_gez').checked;x.mee={};document.querySelectorAll('.v_mee').forEach(c=>{if(c.checked)x.mee[c.value]=true});
  document.querySelectorAll('[data-vi]').forEach(inp=>{const [w,i]=inp.dataset.vi.split(':');const arr=w==='k'?ED.ingK:ED.ingP;if(arr[+i])arr[+i][1]=parseFloat(String(inp.value).replace(',','.'))||0})}
function commit(mode){readEdit();const x=ED.x;if(!x.meal){toast('Kies een maaltijd.');return}if(!x.who.length){toast('Kies voor wie.');return}
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);const o={id:x.id,t:x.t,time:x.time,meal:x.meal,who:x.who,mee:x.mee,gezin:x.gezin};
  if(!same(ED.ingK,variant(x.meal,'k')))o.ingK=ED.ingK;if(!same(ED.ingP,variant(x.meal,'p')))o.ingP=ED.ingP;
  if(mode==='basis'){const dow=dowOf(ED.ds);const b=F.base[dow];const i=b.findIndex(y=>y.id===x.id);const nb={...o,fixed:true};delete nb.reason;if(i>=0)b[i]={...b[i],...nb};else b.push(nb);if(F.over[ED.ds])delete F.over[ED.ds][x.id];toast('Opgeslagen in het basisschema voor elke '+DN[dow].toLowerCase()+'.')}
  else{const ov=F.over[ED.ds]||(F.over[ED.ds]={});if(mode==='pin'&&x.src==='vast'){delete ov[x.id];toast('Losgemaakt: weer automatisch.')}else{ov[x.id]={...o,pinned:mode==='pin'||(ov[x.id]&&ov[x.id].pinned&&mode!=='dag')};toast(mode==='pin'?'Vastgezet: blijft staan als het rooster wijzigt.':'Alleen voor '+DN[dowOf(ED.ds)].toLowerCase()+' '+fmtD(ED.ds)+' aangepast.')}}
  save();ED=null;closeSheet();render()}
let SH=null;
function shiftSheet(id){const s=id?{...F.shifts.find(x=>x.id===id),...(F.shiftExtra[id]||{})}:{id:'m'+Date.now().toString(36),type:'avond',start:today()+'T'+F.pp.avond[0],end:today()+'T'+F.pp.avond[1],src:'manual'};SH=s;const ro=s.src==='ha';
  sheet(`<h2>${id?'Dienst':'Nieuwe dienst'}</h2>${ro?'<div class="small mut">Uit de agenda: begin, eind en type worden bij elke synchronisatie bijgewerkt. Pauze en wektijd kun je hier wel zetten.</div>':''}
   <label class="lb">Type</label><select class="f" id="s_type" ${ro?'disabled':''}>${Object.keys(TL).map(t=>`<option value="${t}" ${s.type===t?'selected':''}>${TL[t]}</option>`).join('')}</select>
   <label class="lb">Datum (begin)</label><input class="f" type="date" id="s_date" value="${s.start.slice(0,10)}" ${ro?'disabled':''}>
   <div class="grid2"><div><label class="lb">Begin</label><input class="f" type="time" id="s_st" value="${s.start.slice(11)}" ${ro?'disabled':''}></div><div><label class="lb">Eind</label><input class="f" type="time" id="s_en" value="${s.end.slice(11)}" ${ro?'disabled':''}></div></div>
   <div class="tiny mut" style="margin-top:4px">Eindigt de dienst vóór de begintijd, dan valt het einde op de volgende dag (nachtdienst = één dienst).</div>
   <div class="grid2"><div><label class="lb">Pauze (optioneel)</label><input class="f" type="time" id="s_brk" value="${s.brk||''}"></div><div><label class="lb">Wektijd erna (nacht)</label><input class="f" type="time" id="s_wake" value="${s.wake||''}"></div></div>
   <button class="btn pri full" style="margin-top:14px" data-a="s_save">Opslaan</button>${id&&!ro?'<button class="btn full" style="margin-top:8px;color:var(--bad)" data-a="s_del">Dienst vervalt / verwijderen</button>':''}<button class="btn full" style="margin-top:8px" data-a="close">Annuleren</button>`);
  const ty=document.getElementById('s_type');if(ty&&!id)ty.onchange=()=>{const d=F.pp[ty.value]||['08:00','16:00'];document.getElementById('s_st').value=d[0];document.getElementById('s_en').value=d[1]}}
function upsertShift(s){const i=F.shifts.findIndex(x=>x.id===s.id);if(i>=0)F.shifts[i]=s;else F.shifts.push(s);save()}
function saveShift(){const g=id=>document.getElementById(id);const s=SH;const extra={brk:g('s_brk').value||null,wake:g('s_wake').value||null};
  if(s.src!=='ha'){const d=g('s_date').value,st=g('s_st').value,en=g('s_en').value;if(!d||!st||!en){toast('Vul datum, begin en eind in.');return}
    const endD=tm(en)<=tm(st)?addDays(d,1):d;upsertShift({id:s.id,type:g('s_type').value,start:d+'T'+st,end:endD+'T'+en,src:'manual'})}
  F.shiftExtra[s.id]=extra;save();closeSheet();render();toast('Dienst opgeslagen; maaltijden zijn opnieuw berekend.')}
document.addEventListener('click',async ev=>{const t=ev.target.closest('[data-a^="v_"],[data-a^="s_"]');if(!t)return;const a=t.dataset.a,k=t.dataset.k;
  if(a==='v_seg'){F.ui.seg=k;save();render();scrollTo(0,0)}
  else if(a==='v_wk'){F.ui.wk+=+k;save();render()}
  else if(a==='v_eat'){const ds=t.dataset.d,w=t.dataset.w;F.eaten=F.eaten||{};const d=F.eaten[ds]=F.eaten[ds]||{};const l=d[k]=d[k]||[];const i=l.indexOf(w);if(i>=0)l.splice(i,1);else l.push(w);
    const keys=Object.keys(F.eaten).sort();while(keys.length>60)delete F.eaten[keys.shift()];save(true);render()}
  else if(a==='v_tp'){F.ui.tp=k;save();render()}
  else if(a==='v_ing'){const w=F.ui.tp,P=F.people[w],T=F.taste[w].ing;if(w==='p'&&P.gluten&&iF(k).g){toast('Gluten zijn uitgesloten zolang "Altijd glutenvrij" aan staat.');return}
    const ex=P.excl.includes(k),cur=T[k]||0;if(ex){P.excl=P.excl.filter(x=>x!==k);delete T[k]}else if(cur===0)T[k]=1;else if(cur===1)T[k]=-1;else{delete T[k];P.excl.push(k)}save();render()}
  else if(a==='v_meal'){const T=F.taste[F.ui.tp].meal;T[k]=T[k]===+t.dataset.v?0:+t.dataset.v;save();render()}
  else if(a==='v_regen'){F.base=genBase();save();render();toast('Basisweek opnieuw gemaakt.')}
  else if(a==='v_edit')editSheet(t.dataset.d,k);
  else if(a==='v_rec')recipeSheet(t.dataset.d,k);
  else if(a==='v_recm'){const m=M[k];recipeSheet(today(),'r_'+k,{id:'r_'+k,meal:k,t:m.t,time:null,who:m.k&&m.p?['k','p']:m.p?['p']:['k'],gezin:m.t==='diner',mee:{},reason:[]})}
  else if(a==='v_eatr'||a==='v_eatn'){const x=rsItem();if(!x)return;const e=eaters(RS.ds,x);if(a==='v_eatr')e[k]=!e[k];else{const [f,dv]=k.split(':');e[f]=Math.max(0,Math.min(10,e[f]+(+dv)));if(f==='kids'&&x.gezin)F.ui.kidsDef=e.kids}F.ui.eat[RS.ds+'|'+RS.id]=e;const ks=Object.keys(F.ui.eat);while(ks.length>80)delete F.ui.eat[ks.shift()];save(true);recipeSheet(RS.ds,RS.id,RS.virt)}
  else if(a==='v_ovask')ovenAsk(k);else if(a==='v_ovgo')ovenGo(k);else if(a==='v_ovstop')ovenGo(k,true);else if(a==='v_ovchk')ovenCheck(k);
  else if(a==='v_wv'){F.ui.wv=k;save(true);render()}
  else if(a==='v_add')editSheet(t.dataset.d,null,true);
  else if(a==='v_save')commit(k);
  else if(a==='v_del'){const ov=F.over[ED.ds]||(F.over[ED.ds]={});ov[ED.x.id]={deleted:true};save();ED=null;closeSheet();render()}
  else if(a==='v_reset'){if(F.over[ED.ds])delete F.over[ED.ds][ED.x.id];save();ED=null;closeSheet();render()}
  else if(a==='v_irm'){readEdit();const [w,i]=k.split(':');(w==='k'?ED.ingK:ED.ingP).splice(+i,1);renderEdit()}
  else if(a==='v_iadd'){readEdit();const v=document.getElementById('v_iadd_'+k).value;if(!v)return;(k==='k'?ED.ingK:ED.ingP).push([v,100,'g']);renderEdit()}
  else if(a==='v_td'){const td=F.people.k.trainDays,i=+k;F.people.k.trainDays=td.includes(i)?td.filter(x=>x!==i):[...td,i].sort();save();render()}
  else if(a==='v_adj'){F.people.k.kcalTrain+=+k;F.people.k.kcalRest+=+k;save();render();toast('Calorie-doelen aangepast.')}
  else if(a==='v_shiftnew')shiftSheet(null);
  else if(a==='v_shiftedit')shiftSheet(k);
  else if(a==='s_save')saveShift();
  else if(a==='s_del'){if(!confirm('Deze dienst verwijderen? De maaltijden worden opnieuw berekend.'))return;F.shifts=F.shifts.filter(x=>x.id!==SH.id);save();closeSheet();render()}
  else if(a==='v_cals'){const m=document.getElementById('v_calmsg');try{if(!HEALTH.haGet)throw new Error('Koppel eerst Home Assistant via Gezondheid.');m.textContent='Zoeken…';const cs=await HEALTH.haGet('/api/calendars');m.innerHTML='Gevonden: '+cs.map(c=>`<button class="chip" style="margin:3px" data-a="v_pickcal" data-k="${E(c.entity_id)}">${E(c.name||c.entity_id)}</button>`).join('')+'<div class="tiny mut">Staat haar werkagenda er niet tussen? Voeg die eerst toe in Home Assistant.</div>'}catch(e){m.textContent=e.message}}
  else if(a==='v_ksync'){F.kroster.entities=document.getElementById('v_kent').value;F.kroster.on=document.getElementById('v_kon').checked;save();toast('Ophalen…');const r=await syncK();toast(r.err?'Mislukt: '+r.err:r.skip?'Uitgeschakeld.':r.n+' momenten uit je agenda.',4000);render()}
  else if(a==='v_spull'){const ch=await pull();toast(ch?'Bijgewerkt met de nieuwste stand.':F.sync.err?'Mislukt: '+F.sync.err:'Je hebt al de nieuwste stand.',4000);render()}
  else if(a==='v_pickcal'){document.getElementById('v_ent').value=k}
  else if(a==='v_calsave'||a==='v_sync'){const g=id=>document.getElementById(id);if(g('v_ent')){F.roster.entity=g('v_ent').value.trim();F.roster.kw={avond:g('v_kwa').value,nacht:g('v_kwn').value,dag:g('v_kwd').value};F.roster.allShifts=g('v_all').checked;F.roster.consent=g('v_cons').checked?(F.roster.consent||new Date().toISOString()):null}
    F.roster.src='ha';save();toast('Ophalen…');const r=await syncCal();toast(r.err?'Mislukt: '+r.err:`${r.n} diensten gevonden (nieuw ${r.changes.nieuw}, gewijzigd ${r.changes.gewijzigd}, vervallen ${r.changes.vervallen}).`,5000);render()}});
document.addEventListener('change',ev=>{const t=ev.target;if(t.dataset.vp!=null){F.pp[t.dataset.vp]=t.type==='number'?+t.value:t.value;if(t.dataset.vp==='dinner')F.base.forEach(d=>d.forEach(x=>{if(x.id==='diner')x.time=t.value}));save();render()}
  else if(t.dataset.vk!=null){F.people.k[t.dataset.vk]=+t.value;save()}
  else if(t.id==='v_son'){F.sync.on=t.checked;save(true);if(t.checked)pull().then(()=>render())}
  else if(t.dataset.vf==='vary'){F.vary=t.checked;save();render()}
  else if(t.dataset.vf==='gluten'){F.people.p.gluten=t.checked;save();render()}});
async function autoSync(){let ch=false;try{ch=await pull()}catch(e){}
  if(F.roster.src==='ha'&&F.roster.consent&&(!F.roster.lastSync||Date.now()-F.roster.lastSync>30*6e4)){const r=await syncCal();ch=ch||r.ok}
  if(F.kroster.on&&(!F.kroster.lastSync||Date.now()-F.kroster.lastSync>30*6e4)){const r=await syncK();ch=ch||r.ok}
  if(ch&&typeof S!=='undefined'&&['voeding','home'].includes(S.ui.tab))render()}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')autoSync()});
function todayCard(){const p=dayPlan(today());const now=tm(ams(new Date()).slice(11));const nx=p.items.find(x=>x.time&&tm(x.time)>=now-15);const w=curW();const n=dayNut(today(),w,p);
  const pr=n.n?`<div class="tiny mut" style="margin-top:4px">Eiwit vandaag: ${Math.round(n.got.p)} / ${n.target} g (schatting, ${n.done}/${n.n} afgevinkt)</div>`:'';if(!nx)return pr;return`<div class="small mut">Volgende maaltijd</div><b>${nx.time} · ${E(M[nx.meal]?M[nx.meal].n:'')}</b>`+pr}
window.VOED={pull,push,syncK,load,view,dayPlan,genBase,syncCal,autoSync,todayCard,dayNut,nutOf,NUT,REC,get F(){return F},set F(v){F=v},M,ING,exportData:()=>F,importData:d=>{if(d&&d.base){F={...DEF(),...d};saveNow()}},saveNow,_t:{nutItem,isEaten,recipeSheet,ovenStart,classify,setHA:h=>{HA=h},kKind,absMin,fromAbs,addDays,dowOf,monday,classify,allowed,variant,today,ams}};
})();
