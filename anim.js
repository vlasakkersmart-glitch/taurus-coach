/* Taurus Coach — 3D-oefenanimaties (fase 4, v2)
   Schematisch 3D-model van de Taurus UltraForce + menselijk model (190 cm).
   Begin-/eindhoudingen per oefening afgeleid van de foto's in de Taurus
   Ultra Force Trainingsanleitung. Armen/benen via 2-bot-IK; kabels,
   grepen, voetlussen en beenrollen bewegen mee met handen en enkels. */
(function(){
'use strict';
const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.min.js';
let T=null;
function loadThree(){if(window.THREE)return Promise.resolve(T=window.THREE);
  return new Promise((res,rej)=>{const s=document.createElement('script');s.src=THREE_URL;s.onload=()=>res(T=window.THREE);s.onerror=()=>rej(new Error('De 3D-bibliotheek kon niet laden (geen internet?).'));document.head.appendChild(s)})}

const B={torso:.52,sh:.205,hip:.10,ua:.34,fa:.30,th:.48,sh2:.48,head:.11};
const PI=Math.PI;
/* ---------- gedeelde houdingen ---------- */
const SEAT_OUT={yaw:0,seat:.55,leg:1,pelvis:[0,.63,.17],feet:[.17,.08,.68],kPole:[0,.4,1]};          // zittend, rug naar toestel
const SEAT_IN={yaw:PI,seat:.55,leg:1,pelvis:[0,.63,.37],feet:[.26,.08,.06],kPole:[.6,.3,-1]};        // zittend, gezicht naar toestel
const STAND_PAD={yaw:PI,seat:.55,leg:1,pelvis:[0,.97,.80],feet:[.14,.08,.74],kPole:[0,0,-1]};        // staand, knieën tegen beenrol
const STAND_IN={yaw:PI,seat:null,leg:0,pelvis:[0,.99,.50],feet:[.15,.08,.50],kPole:[0,0,-1]};        // staand, gezicht naar toestel
const STAND_OUT={yaw:0,seat:null,leg:0,pelvis:[0,.99,.40],feet:[.15,.08,.42],kPole:[0,0,1]};         // staand, rug naar toestel
const SIDE={yaw:PI/2,seat:null,leg:0};                                                                // zijwaarts naast toestel
const D=(base,o)=>Object.assign({},base,o);
const PUSH=['Duwen','Terug'],PULL=['Trekken','Terug'],LIFT=['Heffen','Laten zakken'],LEGS=['Omhoog','Gecontroleerd zakken'];

/* ---------- oefeningsspecificaties ----------
   Wereld: kolom z≈0, voorkant toestel +z, y omhoog. Coördinaten voor de +x-kant;
   de andere kant wordt gespiegeld, tenzij handsR/feetR/ePoleR/kPoleR is gegeven.
   hands/feet: [x,y,z] statisch of {s,e,m?} (m = bochtpunt). rel:'sh'|'chest' =
   [zij, omhoog, voorwaarts] t.o.v. schouder of borst (beweegt met de romp mee).
   lean/twist in graden (+ = voorover / draai naar links). */
const FLOOR={yaw:0,seat:null,leg:0,floor:true,anchor:{type:'none'},grip:'none'};
const SUPKNEE={feet:[.12,.05,.86],kPole:[0,1,0]},ARMSIDE={hands:[.30,.05,.22],ePole:[1,1,0]};
const ABS={
 ab_deadbug:D(FLOOR,{pelvis:[0,.13,.40],lean:[-89,-89],alt:true,hands:{rel:'sh',s:[0,.02,.62],e:[0,.60,.12]},handsR:{rel:'sh',s:[0,.02,.62],e:[0,.02,.62]},ePole:[1,0,0],
   feet:[.10,.57,.86],feetR:{s:[-.10,.57,.86],e:[-.10,.20,1.30]},kPole:[0,1,-1],kPoleR:[0,1,-.4],prim:['diep','buik'],sec:['heup'],phase:['Arm en tegenovergesteld been strekken','Terug naar het midden']}),
 ab_crunch:D(FLOOR,{pelvis:[0,.13,.40],lean:[-88,-55],...SUPKNEE,hands:{rel:'sh',s:[-.12,.26,.04],e:[-.12,.26,.04]},ePole:[1,.4,-.2],prim:['buik'],sec:['schuin'],phase:['Schouders oprollen','Rustig terug']}),
 ab_plank:D(FLOOR,{pelvis:{s:[0,.27,0],e:[0,.40,0]},lean:[74,90],hands:[.15,.05,.80],ePole:[0,-1,-.4],feet:{s:[.11,.07,-.74],e:[.11,.05,-.90]},kPole:[0,-1,0],footPitch:[75,75],
   prim:['buik','diep'],sec:['schouders','billen'],phase:['Omhoog in plank','Loslaten'],holdLabel:'Vasthouden',cy:[.7,1.0,3.0,1.0]}),
 ab_heeltaps:D(FLOOR,{pelvis:[0,.13,.40],lean:[-70,-66],alt:true,feet:[.16,.05,.84],kPole:[.2,1,0],hands:{s:[.32,.12,.22],e:[.24,.08,.72]},handsR:{s:[-.32,.12,.22],e:[-.32,.12,.22]},ePole:[1,.3,0],roll:[0,10],
   prim:['schuin'],sec:['buik'],phase:['Reiken naar je hiel','Terug']}),
 ab_bicycle:D(FLOOR,{pelvis:[0,.13,.40],lean:[-70,-70],roll:[16,-16],hands:{rel:'sh',s:[-.12,.26,.04],e:[-.12,.26,.04]},ePole:[1,.4,-.2],
   feet:{s:[.10,.26,1.30],e:[.10,.44,.62]},feetR:{s:[-.10,.44,.62],e:[-.10,.26,1.30]},kPole:[0,1,-1],kPoleR:[0,1,-1],prim:['schuin','buik'],sec:['heup'],phase:['Knie naar borst, draaien','Wisselen']}),
 ab_legraise:D(FLOOR,{pelvis:[0,.13,.40],lean:[-89,-89],...ARMSIDE,feet:{s:[.09,.08,1.36],e:[.09,1.02,.52]},kPole:[0,.2,1],footPitch:[0,-75],prim:['buik'],sec:['heup'],phase:['Benen omhoog','Langzaam laten zakken']}),
 ab_sideplank:D(FLOOR,{pelvis:{s:[0,.15,0],e:[0,.31,0]},lean:[50,72],roll:[-90,-90],hands:[-.26,.05,.40],ePole:[0,-1,.2],handsR:{rel:'sh',s:[0,-.46,.08],e:[0,-.46,.08]},ePoleR:[0,1,.3],
   feet:[0,.05,-.92],feetR:[0,.15,-.90],kPole:[0,1,0],kPoleR:[0,1,0],prim:['schuin'],sec:['diep','billen','schouders'],phase:['Heup omhoog','Loslaten'],holdLabel:'Vasthouden',cy:[.7,1.0,3.0,1.0]}),
 ab_birddog:D(FLOOR,{pelvis:[0,.55,0],lean:[73,73],alt:true,hands:{s:[.20,.04,.50],e:[.18,.68,1.12]},handsR:[-.20,.04,.50],ePole:[0,-.2,-1],ePoleR:[0,-.2,-1],
   feet:[.12,.06,-.46],feetR:{s:[-.12,.06,-.46],e:[-.12,.60,-.96]},kPole:[0,-1,0],kPoleR:[0,-1,0],prim:['diep','onderrug'],sec:['billen','schouders'],phase:['Arm en tegenovergesteld been strekken','Terug']}),
 ab_revcrunch:D(FLOOR,{pelvis:{s:[0,.13,.40],e:[0,.20,.47]},lean:[-89,-84],...ARMSIDE,feet:{s:[.10,.57,.86],e:[.10,.66,.40]},kPole:[0,1,-1],prim:['buik'],sec:['heup'],phase:['Knieën naar je borst','Rustig terug']}),
 ab_bridge:D(FLOOR,{pelvis:{s:[0,.13,.40],e:[0,.44,.40]},lean:[-89,-123],...SUPKNEE,hands:[.30,.05,.06],ePole:[1,1,0],prim:['billen'],sec:['hamstrings','onderrug'],phase:['Heupen omhoog','Rustig laten zakken']})};
const SP={
32:D(SEAT_OUT,{lean:[-5,-5],hands:{s:[.29,1.10,.12],e:[.19,1.13,.70]},ePole:[1,-.35,-.6],anchor:{type:'arm',p:[.62,1.10,0]},grip:'x',prim:['borst'],sec:['triceps','schouders'],phase:PUSH,
  err:{label:'Rug los van de leuning, schouders naar voren',lean:[-5,16]}}),
34:D(SEAT_OUT,{lean:[-5,-5],hands:{s:[.27,1.14,.10],e:[.17,1.50,.60]},ePole:[1,.1,-.6],anchor:{type:'arm',p:[.62,1.02,0]},grip:'x',prim:['borst'],sec:['schouders','triceps'],phase:PUSH,
  err:{label:'Holle rug, romp komt mee naar voren',lean:[-5,15]}}),
36:D(SEAT_OUT,{lean:[-5,-5],hands:{s:[.66,1.10,.12],m:[.62,1.12,.62],e:[.08,1.12,.60]},ePole:[.3,-1,-.7],anchor:{type:'arm',p:[.70,1.08,-.08]},grip:'y',prim:['borst'],sec:['schouders'],phase:['Armen sluiten','Gecontroleerd openen'],
  err:{label:'Er een press van maken (ellebogen buigen)',hands:{s:[.40,1.10,.10],e:[.12,1.12,.55]},ePole:[1,-.3,-.6]}}),
60:D(SEAT_OUT,{lean:[-5,-5],hands:{s:[.31,1.22,.14],e:[.11,1.72,.16]},ePole:[1,-.6,-.1],anchor:{type:'arm',p:[.55,.95,-.05]},grip:'y',prim:['schouders'],sec:['triceps'],phase:PUSH,
  err:{label:'Holle rug, ellebogen zakken te laag',lean:[-5,-22]}}),
92:D(SEAT_OUT,{lean:[-5,-5],hands:{s:[.08,1.30,0],e:[.10,1.74,.17]},ePole:[.15,1,.6],anchor:{type:'arm',p:[.45,.95,-.15]},grip:'y',prim:['triceps'],sec:[],phase:['Strekken','Terug'],
  err:{label:'Ellebogen kantelen naar buiten',ePole:[1,.4,0]}}),
51:D(SEAT_OUT,{lean:[-3,-3],hands:{s:[.34,1.74,.10],m:[.70,1.55,.12],e:[.78,1.05,.14]},ePole:[1,0,-.3],anchor:{type:'towerH'},grip:'x',prim:['rug'],sec:['triceps'],phase:['Armen omlaag','Terug omhoog'],
  err:{label:'Ellebogen buigen (wordt een pulldown)',hands:{s:[.34,1.74,.10],e:[.30,1.10,.14]},ePole:[0,-1,-.5]}}),
106:D(SEAT_OUT,{lean:[-5,42],hands:{rel:'sh',s:[-.06,.16,.08],e:[-.06,.16,.08]},ePole:[.4,.2,1],anchor:{type:'towerH'},grip:'y',prim:['buik'],sec:[],phase:['Oprollen','Terug'],
  err:{label:'Trekken met je armen',lean:[-5,15],hands:{rel:'sh',s:[-.06,.16,.08],e:[0,-.20,.25]}}}),
107:D(SEAT_OUT,{lean:[-5,35],twist:[0,28],hands:{rel:'sh',s:[-.06,.16,.08],e:[-.06,.16,.08]},ePole:[.4,.2,1],anchor:{type:'towerH'},grip:'y',prim:['buik'],sec:[],phase:['Oprollen + draaien','Terug'],
  err:{label:'Trekken met je armen',lean:[-5,12],hands:{rel:'sh',s:[-.06,.16,.08],e:[0,-.20,.25]}}}),
4:D(SEAT_OUT,{lean:[-15,-15],legDyn:'ext',hands:[.24,.62,.25],ePole:[1,-.3,-.3],feet:{s:[.10,.14,.66],e:[.10,.56,1.04]},kPole:[0,1,.3],anchor:{type:'none'},cables:[['hook','roller']],grip:'none',prim:['quads'],sec:[],phase:['Strekken','Gecontroleerd buigen'],
  err:{label:'Billen komen los, zwaaien met momentum',pelvis:{s:[0,.63,.17],e:[0,.70,.21]},lean:[-15,-30]}}),
42:D(SEAT_IN,{lean:[-12,-16],hands:{s:[.38,1.70,.36],e:[.36,1.12,.33]},ePole:[.6,-1,.5],anchor:{type:'tower',bar:1.0,at:.30},grip:'bar',prim:['rug'],sec:['biceps','schouders'],phase:PULL,
  err:{label:'Met je romp zwaaien om te trekken',lean:[-5,-42]}}),
47:D(SEAT_IN,{lean:[-12,-16],hands:{s:[.22,1.72,.34],e:[.22,1.15,.36]},ePole:[.3,-1,.6],anchor:{type:'towerH'},grip:'y',prim:['rug'],sec:['biceps'],phase:PULL,
  err:{label:'Met je romp zwaaien om te trekken',lean:[-5,-40]}}),
45:D(SEAT_IN,{lean:[-12,-16],hands:{s:[.20,1.72,.34],e:[.20,1.17,.36]},ePole:[.1,-1,.8],anchor:{type:'towerH'},grip:'x',prim:['rug'],sec:['biceps'],phase:PULL,
  err:{label:'Met je romp zwaaien om te trekken',lean:[-5,-40]}}),
53:D(STAND_PAD,{lean:[3,-2],hands:{s:[.17,1.22,.26],e:[.17,1.10,.66]},ePole:[.25,-.4,1],anchor:{type:'arm',p:[.20,1.24,.04]},grip:'y',prim:['rug'],sec:['biceps','schouders'],phase:PULL,
  err:{label:'Achterover hangen om te trekken',lean:[5,-30]}}),
54:D(STAND_PAD,{lean:[3,0],hands:{s:[.17,1.22,.26],e:[.17,1.10,.66]},handsR:[-.20,1.00,.86],ePole:[.25,-.4,1],ePoleR:[-1,-.4,.6],anchor:{type:'arm',p:[.20,1.24,.04]},cables:[['armL','handL']],grip:'y',prim:['rug'],sec:['biceps','schouders'],phase:PULL,
  err:{label:'Romp draait mee om meer te trekken',twist:[0,28]}}),
68:D(STAND_PAD,{pelvis:[0,.97,.84],feet:[.14,.08,.78],lean:[0,0],hands:{s:[.15,1.32,.24],e:[.52,1.40,.78]},ePole:[1,.4,.2],anchor:{type:'arm',p:[.20,1.30,.04]},grip:'x',prim:['schouders'],sec:['rug'],phase:['Ellebogen hoog naar achteren','Terug'],
  err:{label:'Ellebogen te laag (wordt een gewone row)',hands:{s:[.15,1.32,.24],e:[.25,1.12,.74]},ePole:[.3,-1,.6]}}),
70:D(STAND_PAD,{pelvis:[0,.97,.84],feet:[.14,.08,.78],lean:[0,0],hands:{s:[.06,1.12,.40],e:[.72,1.40,.76]},ePole:[.4,-.4,.3],anchor:{type:'arm',p:[.20,1.10,.04]},cables:[['armR','handL'],['armL','handR']],grip:'y',prim:['schouders'],sec:['rug'],phase:['Armen naar buiten','Terug'],
  err:{label:'Achterover leunen',lean:[0,-15]}}),
94:D(STAND_IN,{lean:[8,8],hands:{s:[.17,1.18,.18],e:[.18,.90,.40]},ePole:[0,-.3,1],anchor:{type:'tower',bar:1.0,at:.10},grip:'bar',prim:['triceps'],sec:[],phase:PUSH,
  err:{label:'Ellebogen bewegen mee naar voren',lean:[8,22],ePole:[0,-.2,-1],hands:{s:[.17,1.18,.18],e:[.18,.98,.22]}}}),
101:D(STAND_IN,{pelvis:[0,.99,.62],feet:[.14,.08,.62],lean:[18,18],hands:{s:[.20,1.02,.40],e:[.20,.98,.92]},ePole:[0,.1,1],anchor:{type:'arm',p:[.20,1.10,.04]},grip:'y',prim:['triceps'],sec:[],phase:['Naar achteren strekken','Terug'],
  err:{label:'Bovenarm zakt, elleboog beweegt mee',ePole:[0,-1,.2]}}),
63:D(STAND_IN,{pelvis:[0,.99,.62],feet:[.15,.08,.62],lean:[0,0],hands:{s:[.10,.92,.48],e:[.12,1.42,.50]},ePole:[1,.6,0],anchor:{type:'lowbar',bar:.9,at:.30},grip:'bar',prim:['schouders'],sec:['rug','biceps'],phase:['Omhoog trekken','Laten zakken'],
  err:{label:'Achterover leunen',lean:[0,-14]}}),
1:D(STAND_IN,{pelvis:{s:[0,.99,.46],e:[0,.60,.62]},feet:[.16,.08,.42],kPole:[.35,0,-1],lean:[3,32],hands:{rel:'sh',s:[-.06,-.02,.13],e:[-.06,-.02,.13]},ePole:[.6,-1,.2],anchor:{type:'low'},grip:'y',prim:['quads'],sec:['billen','hamstrings'],phase:['Zakken','Omhoog duwen'],
  err:{label:'Knieën vallen naar binnen, te ver voorover',lean:[3,55],kPole:[-.5,0,-1]}}),
2:D(STAND_IN,{pelvis:{s:[0,.97,.62],e:[0,.62,.66]},feet:[.12,.08,.42],feetR:[-.12,.10,.92],footPitchR:[35,35],kPole:[.1,0,-1],kPoleR:[-.1,-1,-.3],lean:[5,14],hands:{rel:'sh',s:[-.06,-.02,.13],e:[-.06,-.02,.13]},ePole:[.6,-1,.2],anchor:{type:'low'},grip:'y',prim:['quads'],sec:['billen'],phase:['Zakken','Omhoog duwen'],
  err:{label:'Voorste knie voorbij je tenen',pelvis:{s:[0,.97,.62],e:[0,.66,.50]}}}),
3:D(STAND_IN,{pelvis:{s:[0,.99,.48],e:[0,.62,.70]},feet:[.12,.08,.44],feetR:{s:[-.12,.08,.46],e:[-.12,.10,.98]},footPitchR:[0,35],kPole:[.1,0,-1],kPoleR:[-.1,-1,-.3],lean:[2,8],hands:{rel:'sh',s:[-.06,-.02,.13],e:[-.06,-.02,.13]},ePole:[.6,-1,.2],anchor:{type:'low'},grip:'y',prim:['quads'],sec:['billen','hamstrings'],phase:['Stap terug en zakken','Terug omhoog'],
  err:{label:'Te korte stap, voorste knie schiet door',pelvis:{s:[0,.99,.48],e:[0,.66,.52]},feetR:{s:[-.12,.08,.46],e:[-.12,.10,.78]}}}),
6:D(STAND_OUT,{pelvis:{s:[0,1.02,.30],e:[0,1.0,.42]},feet:[.14,.08,.46],lean:[72,0],hands:{s:[.10,.50,.62],e:[.16,.86,.50]},ePole:[0,0,1],anchor:{type:'low'},cables:[['lowR','handL'],['lowL','handR']],grip:'y',prim:['hamstrings'],sec:['billen','onderrug'],phase:['Omhoog komen','Gecontroleerd voorover'],
  err:{label:'Door je knieën zakken, ronde rug',pelvis:{s:[0,.80,.30],e:[0,.99,.42]},lean:[60,0]}}),
8:D(STAND_PAD,{pelvis:[0,.99,.80],lean:[8,8],legDyn:'curl',feet:{s:[.10,.10,.74],e:[.10,.55,1.08]},feetR:[-.12,.08,.80],kPole:[0,0,-1],kPoleR:[0,0,-1],hands:[.15,1.32,.12],ePole:[0,-1,0],anchor:{type:'none'},cables:[['hook','roller']],grip:'none',prim:['hamstrings'],sec:['kuiten'],phase:['Hiel omhoog','Gecontroleerd zakken'],
  err:{label:'Heup naar voren, holle rug',lean:[8,-12],pelvis:{s:[0,.99,.80],e:[0,1.0,.72]}}}),
9:D(STAND_IN,{pelvis:{s:[0,.99,.55],e:[0,1.07,.55]},feet:{s:[.13,.08,.56],e:[.13,.15,.56]},footPitch:[0,35],lean:[0,0],hands:{rel:'sh',s:[.04,-.62,-.02],e:[.04,-.62,-.02]},ePole:[0,0,1],anchor:{type:'low'},grip:'y',prim:['kuiten'],sec:[],phase:['Op je tenen','Laten zakken'],
  err:{label:'Meeveren door de knieën',pelvis:{s:[0,.93,.58],e:[0,1.04,.55]}}}),
16:D(SIDE,{pelvis:[0,.99,.47],lean:[0,0],feet:[0,.08,.38],feetR:{s:[0,.09,.56],e:[0,.30,.92]},kPole:[1,0,0],kPoleR:[1,0,0],hands:[.05,1.05,.12],handsR:[.06,.98,.64],ePole:[0,-1,-.3],ePoleR:[0,-.5,1],anchor:{type:'none'},cables:[['lowL','footR']],grip:'none',prim:['heup'],sec:['billen'],phase:['Been opzij','Terug'],
  err:{label:'Been zwaait naar voren',feetR:{s:[0,.09,.56],e:[.25,.25,.80]}}}),
17:D(SIDE,{pelvis:[0,.99,.55],lean:[0,0],feet:{s:[0,.12,.30],e:[.07,.10,.66]},feetR:[0,.08,.62],kPole:[1,0,0],kPoleR:[1,0,0],hands:[.05,1.05,.16],handsR:[.06,.98,.72],ePole:[0,-1,-.3],ePoleR:[0,-.5,1],anchor:{type:'none'},cables:[['lowL','footL']],grip:'none',prim:['heup'],sec:[],phase:['Been naar binnen','Terug'],
  err:{label:'Romp helt mee',lean:[0,-12]}}),
108:D(SIDE,{pelvis:[0,.99,.48],lean:[0,0],twist:[55,-45],feet:[0,.08,.36],feetR:[0,.08,.60],kPole:[1,0,0],kPoleR:[1,0,0],hands:{rel:'chest',s:[.03,-.08,.55],e:[.03,-.08,.55]},handsR:{rel:'chest',s:[-.03,-.08,.55],e:[-.03,-.08,.55]},ePole:[0,-1,0],ePoleR:[0,-1,0],anchor:{type:'arm',p:[0,1.15,0]},cables:[['armL','handsMid']],grip:'mid',prim:['buik'],sec:['schouders'],phase:['Romp wegdraaien','Gecontroleerd terug'],
  err:{label:'Draaien vanuit je armen in plaats van je romp',twist:[10,-5],hands:{rel:'chest',s:[.30,-.08,.45],e:[-.35,-.08,.45]}}}),
81:D(STAND_OUT,{lean:[0,0],hands:{s:[.22,.86,.46],e:[.22,1.28,.58]},ePole:[0,-1,-.5],anchor:{type:'low'},grip:'x',prim:['biceps'],sec:['onderarmen'],phase:['Curlen','Laten zakken'],
  err:{label:'Ellebogen naar voren, zwaaien met de romp',ePole:[0,-.3,1],lean:[0,-12]}}),
83:D(STAND_OUT,{lean:[0,0],hands:{s:[.22,.86,.46],e:[.22,1.28,.58]},ePole:[0,-1,-.5],anchor:{type:'low'},grip:'y',prim:['biceps'],sec:['onderarmen'],phase:['Curlen','Laten zakken'],
  err:{label:'Ellebogen naar voren, zwaaien met de romp',ePole:[0,-.3,1],lean:[0,-12]}}),
66:D(STAND_OUT,{lean:[0,0],hands:{s:[.24,.88,.44],e:[.80,1.40,.46]},ePole:[0,-.6,-1],anchor:{type:'low'},grip:'y',prim:['schouders'],sec:[],phase:LIFT,
  err:{label:'Zwaaien met de romp, te hoog heffen',lean:[0,-12],hands:{s:[.24,.88,.44],e:[.82,1.62,.46]}}})
};

/* ---------- helpers ---------- */
let V,UP;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const lerp3=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function ik(A,Tg,l1,l2,pole){const d=Tg.clone().sub(A);let L=d.length();L=Math.min(l1+l2-.002,Math.max(Math.abs(l1-l2)+.002,L));const dir=d.normalize();
  const a=(l1*l1-l2*l2+L*L)/(2*L),h=Math.sqrt(Math.max(0,l1*l1-a*a));let p=pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
  if(p.lengthSq()<1e-6)p=new V(0,0,1);p.normalize();return{E:A.clone().add(dir.clone().multiplyScalar(a)).add(p.multiplyScalar(h)),H:A.clone().add(dir.clone().multiplyScalar(L))}}
function seg(r,len,mat){return new T.Mesh(new T.CapsuleGeometry(r,Math.max(.001,len-2*r),6,14),mat)}
function place(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(UP,b.clone().sub(a).normalize())}
function rod(m,a,b){const d=b.clone().sub(a);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(1,Math.max(.001,d.length()),1);m.quaternion.setFromUnitVectors(UP,d.normalize())}
function at(spec,p){if(Array.isArray(spec))return spec;const{s,e,m}=spec;if(m)return s.map((v,i)=>(1-p)*(1-p)*v+2*(1-p)*p*m[i]+p*p*e[i]);return lerp3(s,e,p)}
const rng=(a,p)=>a?a[0]+(a[1]-a[0])*p:0;

/* ---------- toestel ---------- */
function buildStation(scene,sp,M){const g=new T.Group();scene.add(g);
  const box=(w,h,d,mat,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);g.add(m);return m};
  const tube=(pts,r,mat)=>{const c=new T.CatmullRomCurve3(pts.map(p=>new V(...p)));const m=new T.Mesh(new T.TubeGeometry(c,40,r,10,false),mat);g.add(m);return m};
  const cyl=(r,h,mat)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,18),mat);g.add(m);return m};
  const pulley=(x,y,z,r=.035)=>{const p=new T.Mesh(new T.TorusGeometry(r,.012,8,18),M.dark);p.position.set(x,y,z);p.rotation.y=PI/2;g.add(p)};
  box(.62,.03,1.05,M.plate,0,.015,.48);box(.05,.05,1.25,M.frame,.30,.04,.40);box(.05,.05,1.25,M.frame,-.30,.04,.40);box(.66,.05,.05,M.frame,0,.04,-.18);
  box(.10,1.62,.10,M.frame,0,.85,-.06);
  tube([[0,1.6,-.06],[0,1.85,-.04],[0,1.98,.08],[0,2.02,.22],[0,2.0,.28]],.045,M.frame);box(.46,.04,.05,M.frame,0,2.0,.28);
  pulley(.20,1.97,.30,.04);pulley(-.20,1.97,.30,.04);
  box(.30,.62,.08,M.pad,0,.93,.02);
  const anc=sp.anchor||{};const tips={};
  for(const s of[1,-1]){const piv=[.07*s,1.28,-.12];const tip=anc.type==='arm'?[anc.p[0]*s,anc.p[1],anc.p[2]]:[.42*s,.55,-.30];
    const mid=[(piv[0]+tip[0])/2+.18*s,Math.max(piv[1],tip[1])+.10,(piv[2]+tip[2])/2-.12];
    tube([piv,mid,tip],.022,M.frame);const c=cyl(.035,1,M.cyl);rod(c,new V(.05*s,.78,-.14),new V(.12*s,1.18,-.16));
    pulley(...tip);tips[s>0?'armL':'armR']=new V(...tip)}
  pulley(.24,.12,-.10,.03);pulley(-.24,.12,-.10,.03);pulley(0,.10,.02,.03);
  if(sp.seat){box(.34,.07,.40,M.pad,0,sp.seat,.24);box(.05,sp.seat-.05,.05,M.frame,0,(sp.seat-.05)/2+.03,.24)}
  if(sp.leg){box(.05,.05,.32,M.frame,0,.44,.44);box(.05,.42,.05,M.frame,0,.27,.58);
    const up=cyl(.055,.40,M.pad);up.position.set(0,.50,.58);up.rotation.z=PI/2;
    if(!sp.legDyn){const lo=cyl(.055,.40,M.pad);lo.position.set(0,.18,.62);lo.rotation.z=PI/2}}
  return{g,tips,pts:{topL:new V(.20,1.97,.30),topR:new V(-.20,1.97,.30),lowL:new V(.24,.12,-.10),lowR:new V(-.24,.12,-.10),hook:new V(0,.10,.02),...tips}}}

/* ---------- mens ---------- */
function buildHuman(scene,M){const g=new T.Group();scene.add(g);const P={};
  const add=(k,m)=>{g.add(m);P[k]=m;return m};
  for(const s of['L','R']){add('ua'+s,seg(.052,B.ua,M.skin));add('fa'+s,seg(.042,B.fa,M.skin));add('th'+s,seg(.078,B.th,M.short));add('sh'+s,seg(.056,B.sh2,M.skin));
    add('hand'+s,new T.Mesh(new T.SphereGeometry(.046,14,10),M.skin));add('foot'+s,new T.Mesh(new T.BoxGeometry(.10,.07,.27),M.shoe));
    add('delt'+s,new T.Mesh(new T.SphereGeometry(.068,16,12),M.shirt))}
  const torso=new T.Group();g.add(torso);P.torso=torso;
  const tc=new T.Mesh(new T.CapsuleGeometry(.13,.30,6,16),M.shirt);tc.scale.set(1.45,1,.85);torso.add(tc);
  const pel=new T.Mesh(new T.SphereGeometry(.14,16,12),M.short);pel.scale.set(1.3,.75,.95);g.add(pel);P.pel=pel;
  add('neck',seg(.05,.12,M.skin));add('head',new T.Mesh(new T.SphereGeometry(B.head,20,16),M.skin));
  const ov={};const mk=(k,geo,pos,sc)=>{const m=new T.Mesh(geo,M.mus(k));m.position.set(...pos);m.scale.set(...sc);m.visible=false;torso.add(m);(ov[k]=ov[k]||[]).push(m)};
  const sph=new T.SphereGeometry(1,16,12);
  mk('borst',sph,[.085,.10,.095],[.085,.065,.04]);mk('borst',sph,[-.085,.10,.095],[.085,.065,.04]);
  mk('rug',sph,[.13,.02,-.05],[.05,.14,.07]);mk('rug',sph,[-.13,.02,-.05],[.05,.14,.07]);mk('rug',sph,[0,.19,-.08],[.12,.06,.04]);
  mk('onderrug',sph,[.05,-.14,-.09],[.04,.08,.03]);mk('onderrug',sph,[-.05,-.14,-.09],[.04,.08,.03]);
  mk('buik',new T.BoxGeometry(1,1,1),[0,-.10,.10],[.13,.20,.03]);
  mk('schuin',sph,[.15,-.08,.06],[.045,.12,.06]);mk('schuin',sph,[-.15,-.08,.06],[.045,.12,.06]);
  mk('diep',sph,[0,-.17,.075],[.17,.07,.035]);
  P.ov=ov;return{g,P}}

/* ---------- pose ---------- */
function pose(H,sp,p){const P=H.P;
  const lean=rng(sp.lean,p)*PI/180,tw=rng(sp.twist,p)*PI/180;
  const fwd0=new V(Math.sin(sp.yaw),0,Math.cos(sp.yaw)),xa0=new V(Math.cos(sp.yaw),0,-Math.sin(sp.yaw));const sgn=Math.cos(sp.yaw)<-.5?-1:1;
  const fwd=fwd0.clone().applyAxisAngle(UP,tw),xa=xa0.clone().applyAxisAngle(UP,tw);
  const spine=UP.clone().multiplyScalar(Math.cos(lean)).add(fwd.clone().multiplyScalar(Math.sin(lean)));
  const roll=rng(sp.roll,p)*PI/180;if(roll)xa.applyAxisAngle(spine,roll);
  const chestF=xa.clone().cross(spine);const sv=xa.clone().multiplyScalar(sgn),sv0=(sp.roll?xa:xa0).clone().multiplyScalar(sgn);
  const pelv=new V(...at(sp.pelvis,p)),C=pelv.clone().add(spine.clone().multiplyScalar(B.torso));
  const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(xa,spine,chestF));const spineP=sp.floor?spine:UP,xaP=sp.floor?xa:xa0;
  P.torso.position.copy(pelv).add(C).multiplyScalar(.5);P.torso.quaternion.copy(q);
  P.pel.position.copy(pelv).add(spine.clone().multiplyScalar(-.02));P.pel.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(xaP,spineP,xaP.clone().cross(spineP)));
  const head=C.clone().add(spine.clone().multiplyScalar(.24));place(P.neck,C.clone().add(spine.clone().multiplyScalar(.04)),head.clone().add(spine.clone().multiplyScalar(-.08)));P.head.position.copy(head);
  const out={hand:{},foot:{}};
  for(const s of[1,-1]){const k=s>0?'L':'R';const own=s<0;
    const S=C.clone().add(sv.clone().multiplyScalar(B.sh*s)).add(spine.clone().multiplyScalar(-.03));
    const hs=own&&sp.handsR?sp.handsR:sp.hands,mir=own&&!sp.handsR;let tgt;const a=at(hs,p);
    if(hs.rel){const base=hs.rel==='sh'?S:C;tgt=base.clone().add(sv.clone().multiplyScalar(a[0]*(mir?-1:1))).add(spine.clone().multiplyScalar(a[1])).add(chestF.clone().multiplyScalar(a[2]))}
    else{tgt=new V(...a);if(mir)tgt.x*=-1}
    const ep=own&&sp.ePoleR?sp.ePoleR:sp.ePole;const pole=new V(ep[0]*(own&&!sp.ePoleR?-1:1),ep[1],ep[2]);
    const r=ik(S,tgt,B.ua,B.fa,pole);place(P['ua'+k],S,r.E);place(P['fa'+k],r.E,r.H);P['hand'+k].position.copy(r.H);P['delt'+k].position.copy(S);out.hand[k]=r.H;
    const fs=own&&sp.feetR?sp.feetR:sp.feet,fm=own&&!sp.feetR;const fa=at(fs,p);const ft=new V(...fa);if(fm)ft.x*=-1;
    const kp0=own&&sp.kPoleR?sp.kPoleR:sp.kPole;const kp=new V(kp0[0]*(own&&!sp.kPoleR?-1:1),kp0[1],kp0[2]);
    const Hp=pelv.clone().add(sv0.clone().multiplyScalar(B.hip*s)).add(new V(0,-.02,0));
    const rl=ik(Hp,ft,B.th,B.sh2,kp);place(P['th'+k],Hp,rl.E);place(P['sh'+k],rl.E,rl.H);out.foot[k]=rl.H;
    const pitch=rng(own&&sp.footPitchR?sp.footPitchR:sp.footPitch,p)*PI/180;
    const fq=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(xa0,UP,xa0.clone().cross(UP)));
    if(pitch){fq.premultiply(new T.Quaternion().setFromAxisAngle(xa0,pitch))}
    P['foot'+k].quaternion.copy(fq);const off=new V(0,-.035,.07).applyQuaternion(fq);P['foot'+k].position.copy(rl.H).add(off)}
  out.fwd0=fwd0;return out}

/* wisselende kant (dead bug, bird dog, heel taps): links/rechts spiegelen */
function mirSpec(v){if(!v)return v;if(Array.isArray(v))return[-v[0],v[1],v[2]];const o={...v};['s','e','m'].forEach(k=>{if(o[k])o[k]=[-o[k][0],o[k][1],o[k][2]]});return o}
function swapSides(sp){const o={...sp};const pairs=[['hands','handsR'],['feet','feetR'],['ePole','ePoleR'],['kPole','kPoleR']];
  for(const [a,b] of pairs){const A=sp[a],Bv=sp[b];if(Bv===undefined||A===undefined)continue;o[a]=mirSpec(Bv);o[b]=mirSpec(A)}return o}
/* ---------- mount ---------- */
let cur=null;
function unmount(){if(!cur)return;cancelAnimationFrame(cur.raf);window.removeEventListener('resize',cur.onR);try{cur.renderer.dispose();cur.scene.traverse(o=>{if(o.geometry)o.geometry.dispose()})}catch(e){}cur=null}
const DEFAULT_CABLES={arm:[['armL','handL'],['armR','handR']],tower:[['topL','barL'],['topR','barR']],towerH:[['topL','handL'],['topR','handR']],low:[['lowL','handL'],['lowR','handR']],lowbar:[['lowL','barL'],['lowR','barR']],none:[]};
const MUSNL={schuin:'schuine buikspieren',diep:'diepe buikspier',borst:'borst',rug:'rug',schouders:'schouders',triceps:'triceps',biceps:'biceps',buik:'buik',quads:'quadriceps',hamstrings:'hamstrings',kuiten:'kuiten',billen:'bilspieren',heup:'heup',onderrug:'onderrug',onderarmen:'onderarmen'};
async function mount(el,n){unmount();const base=SP[n];if(!base)return;
  el.innerHTML='<div style="height:300px;display:grid;place-items:center;color:#8d95a5;font-size:13px">3D-model laden…</div>';
  try{await loadThree()}catch(e){el.innerHTML='<div class="small mut" style="padding:14px">'+e.message+' De foto\'s en instructies hieronder werken wel.</div>';return}
  V=T.Vector3;UP=new V(0,1,0);
  el.innerHTML=`<div style="position:relative;border-radius:14px;overflow:hidden;background:#151821">
   <canvas style="display:block;width:100%;height:320px;touch-action:none"></canvas>
   <div style="position:absolute;left:10px;top:10px;display:flex;flex-direction:column;gap:6px;pointer-events:none;align-items:flex-start">
    <span class="chip acc" data-r="phase">Startpositie</span><span class="chip" data-r="breath" style="display:none"></span><span class="chip bad" data-r="err" style="display:none"></span></div>
   <div style="position:absolute;right:10px;top:10px;flex-direction:column;align-items:flex-end;display:flex;gap:4px">${(base.prim||[]).map(m=>`<span class="chip" style="border-color:#ff5a2a;color:#ff9b73">● ${MUSNL[m]||m}</span>`).join('')}${(base.sec||[]).map(m=>`<span class="chip" style="color:#ffc98f">○ ${MUSNL[m]||m}</span>`).join('')}</div>
   <div style="position:absolute;left:10px;bottom:8px" class="tiny mut">Sleep om te draaien</div></div>
  <div class="row wrap" style="gap:6px;margin-top:8px">
   <button class="btn sm" data-c="play" aria-label="Pauzeren">❚❚</button>
   <div class="seg" style="flex:1;min-width:150px">${[.5,1,1.5].map(v=>`<button data-c="spd" data-v="${v}" class="${v===1?'on':''}">${String(v).replace('.',',')}×</button>`).join('')}</div>
   <div class="seg" style="flex:1;min-width:170px">${[['voor','Voor'],['zij','Zij'],['schuin','Schuin']].map(([k,l])=>`<button data-c="view" data-v="${k}" class="${k==='schuin'?'on':''}">${l}</button>`).join('')}</div></div>
  <div class="row" style="gap:8px;margin-top:8px"><span class="tiny mut">Start</span><input type="range" min="0" max="100" value="0" data-c="scrub" style="flex:1"><span class="tiny mut">Eind</span></div>
  <div class="row sp" style="margin-top:6px">${base.err?'<label class="row small"><input type="checkbox" data-c="err"> Veelgemaakte fout tonen</label>':'<span></span>'}<span class="tiny mut">${base.floor?'3D-model · oranje = spieren die je traint':"Schematisch model · houding volgens handleidingfoto's"}</span></div>`;
  const cv=el.querySelector('canvas'),W=()=>cv.clientWidth||320,Hh=320;
  const renderer=new T.WebGLRenderer({canvas:cv,antialias:true});renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.setSize(W(),Hh,false);renderer.outputEncoding=T.sRGBEncoding;
  const scene=new T.Scene();scene.background=new T.Color(0x151821);
  const cam=new T.PerspectiveCamera(38,W()/Hh,.05,30);
  scene.add(new T.HemisphereLight(0xffffff,0x30343c,.9));const dl=new T.DirectionalLight(0xffffff,.9);dl.position.set(2,4,3);scene.add(dl);const dl2=new T.DirectionalLight(0xffb27a,.35);dl2.position.set(-3,2,-2);scene.add(dl2);
  const floor=new T.Mesh(new T.CircleGeometry(1.8,48),new T.MeshBasicMaterial({color:0x1b1f27}));floor.rotation.x=-PI/2;scene.add(floor);
  const std=(c,m,r)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:r});
  const isP=k=>(base.prim||[]).includes(k);const musMats={};
  const M={frame:std(0xc3c8d0,.55,.35),plate:std(0xdfe2e6,.1,.6),pad:std(0x22252b,.05,.85),dark:std(0x111215,.3,.5),cyl:std(0x3a3d44,.4,.4),
    skin:std(0xcfd3da,.05,.7),shirt:std(0x3b4150,.05,.8),short:std(0x2a2e37,.05,.85),shoe:std(0xe6e8ec,.05,.6),cable:std(0x101114,.2,.6),grip:std(0x15171b,.1,.8),
    mus:k=>musMats[k]||(musMats[k]=new T.MeshStandardMaterial({color:isP(k)?0xff5a2a:0xffb26b,emissive:isP(k)?0xff3d00:0xff9a3d,emissiveIntensity:.3,roughness:.6,transparent:true,opacity:.92}))};
  const st=base.floor?{pts:{}}:buildStation(scene,base,M);if(base.floor){const mat=new T.Mesh(new T.BoxGeometry(.62,.012,1.9),std(0x4c4f8a,.05,.9));mat.position.set(0,.006,.25);scene.add(mat)}const H=buildHuman(scene,M);
  const act=[...(base.prim||[]),...(base.sec||[])];for(const k in H.P.ov)H.P.ov[k].forEach(m=>m.visible=act.includes(k));
  const tint=(keys,parts)=>{const k=keys.find(x=>act.includes(x));if(k)for(const s of['L','R'])parts.forEach(pp=>H.P[pp+s].material=M.mus(k))};
  tint(['triceps','biceps'],['ua']);tint(['onderarmen'],['fa']);tint(['schouders'],['delt']);tint(['quads','hamstrings','heup'],['th']);tint(['kuiten'],['sh']);
  if(act.includes('billen'))H.P.pel.material=M.mus('billen');
  const cabList=base.cables||DEFAULT_CABLES[(base.anchor||{}).type||'none']||[];
  const cables=cabList.map(()=>{const m=new T.Mesh(new T.CylinderGeometry(.005,.005,1,6),M.cable);scene.add(m);return m});
  let bar=null;if(base.grip==='bar'){bar=new T.Mesh(new T.CylinderGeometry(.016,.016,base.anchor.bar||1,12),M.frame);scene.add(bar)}
  const grips={};const mkGrip=k=>{const gm=new T.Mesh(new T.CylinderGeometry(.018,.018,.13,10),M.grip);scene.add(gm);grips[k]=gm};
  const straps={};const mkStrap=k=>{const sm=new T.Mesh(new T.TorusGeometry(.05,.012,8,16),M.dark);scene.add(sm);straps[k]=sm};
  cabList.forEach(([,to])=>{if(to.startsWith('hand')&&base.grip!=='none'&&base.grip!=='bar')mkGrip(to);if(to.startsWith('foot'))mkStrap(to)});
  let roller=null;if(base.legDyn){roller=new T.Mesh(new T.CylinderGeometry(.055,.055,.40,18),M.pad);scene.add(roller)}
  const tgt=base.floor?new V(0,.38,.20):new V(0,1.0,.40);let th=.75,ph=1.22,rad=base.floor?2.9:3.0;
  const VIEWS={voor:[0,1.32],zij:[PI/2,1.32],schuin:[.75,1.2]};const setView=k=>{[th,ph]=VIEWS[k]};
  const camUpd=()=>{cam.position.set(tgt.x+rad*Math.sin(ph)*Math.sin(th),tgt.y+rad*Math.cos(ph),tgt.z+rad*Math.sin(ph)*Math.cos(th));cam.lookAt(tgt)};
  let drag=null;cv.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY,th,ph];try{cv.setPointerCapture(e.pointerId)}catch(x){}});
  cv.addEventListener('pointermove',e=>{if(!drag)return;th=drag[2]-(e.clientX-drag[0])*.01;ph=Math.max(.35,Math.min(1.55,drag[3]-(e.clientY-drag[1])*.006))});
  cv.addEventListener('pointerup',()=>drag=null);cv.addEventListener('pointercancel',()=>drag=null);
  const CY=base.cy||[.5,1.2,.5,2.0],TOT=CY.reduce((a,b)=>a+b);let t=0,speed=1,playing=true,errOn=false,last=performance.now(),pManual=null;
  const R=k=>el.querySelector(`[data-r="${k}"]`);const ph2=base.phase||['Uitvoeren','Terug'];
  const state=tt=>{let x=tt%TOT;if(x<CY[0])return[0,'Startpositie',''];x-=CY[0];if(x<CY[1])return[ease(x/CY[1]),ph2[0],'uit'];x-=CY[1];if(x<CY[2])return[1,base.holdLabel||'Kort vasthouden',base.holdLabel?'rustig':''];x-=CY[2];return[1-ease(x/CY[3]),ph2[1],'in']};
  el.addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;const c=b.dataset.c;
    if(c==='play'){playing=!playing;pManual=null;b.textContent=playing?'❚❚':'▶'}
    if(c==='spd'){speed=+b.dataset.v;b.parentNode.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}
    if(c==='view'){setView(b.dataset.v);b.parentNode.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}});
  el.addEventListener('input',e=>{if(e.target.dataset&&e.target.dataset.c==='scrub'){pManual=e.target.value/100;playing=false;el.querySelector('[data-c="play"]').textContent='▶'}});
  el.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.c==='err'){errOn=e.target.checked;const r=R('err');r.style.display=errOn?'':'none';r.textContent='Fout: '+(base.err?base.err.label:'')}});
  setView('schuin');
  function frame(now){if(!el.isConnected){unmount();return}
    const dt=Math.min(.1,(now-last)/1000);last=now;if(playing)t+=dt*speed;
    let p,lab,br;if(pManual!=null){p=pManual;lab=p<.02?'Startpositie':p>.98?'Eindpositie':'Stap voor stap';br=''}else[p,lab,br]=state(t);
    R('phase').textContent=lab;const b=R('breath');b.style.display=br?'':'none';b.textContent=br==='uit'?'Adem uit':br==='rustig'?'Rustig doorademen':'Adem in';
    let sp=errOn&&base.err?Object.assign({},base,base.err):base;if(base.alt&&pManual==null&&Math.floor(t/TOT)%2)sp=swapSides(sp);const o=pose(H,sp,p);
    const pts=Object.assign({},st.pts,{handL:o.hand.L,handR:o.hand.R,footL:o.foot.L,footR:o.foot.R,handsMid:o.hand.L.clone().add(o.hand.R).multiplyScalar(.5)});
    if(bar){const c=o.hand.L.clone().add(o.hand.R).multiplyScalar(.5);const ax=o.hand.L.clone().sub(o.hand.R).normalize();bar.position.copy(c);bar.quaternion.setFromUnitVectors(UP,ax);
      const a2=(base.anchor.at||.15);pts.barL=c.clone().add(ax.clone().multiplyScalar(a2));pts.barR=c.clone().add(ax.clone().multiplyScalar(-a2))}
    if(roller){const f=base.legDyn==='ext'?o.foot.L.clone().add(o.foot.R).multiplyScalar(.5).add(new V(0,0,.06)):o.foot.L.clone().add(new V(0,0,.06));f.x=0;roller.position.copy(f);roller.rotation.z=PI/2;pts.roller=f}
    cabList.forEach(([a,bk],i)=>{if(pts[a]&&pts[bk])rod(cables[i],pts[a],pts[bk])});
    for(const k in grips){const h=pts[k];grips[k].position.copy(h);grips[k].quaternion.setFromUnitVectors(UP,base.grip==='y'?UP:new V(1,0,0))}
    for(const k in straps){straps[k].position.copy(pts[k]);straps[k].rotation.x=PI/2}
    const a=.25+.75*p;for(const k in musMats)musMats[k].emissiveIntensity=isP(k)?.15+.85*a:.1+.4*a;
    camUpd();renderer.render(scene,cam);if(cur)cur.raf=requestAnimationFrame(frame)}
  const onR=()=>{if(!el.isConnected)return;renderer.setSize(W(),Hh,false);cam.aspect=W()/Hh;cam.updateProjectionMatrix()};window.addEventListener('resize',onR);
  cur={renderer,scene,onR,raf:0};cur.raf=requestAnimationFrame(frame);
  // test-hook (alleen voor ontwikkeling)
  cur.debug=(pp,thv,err)=>{if(thv!=null)th=thv;playing=false;pManual=pp;errOn=!!err;frame(performance.now());cancelAnimationFrame(cur.raf)}}
Object.assign(SP,ABS);
window.TaurusAnim={has:n=>!!SP[n],list:Object.keys(SP).filter(k=>!isNaN(k)).map(Number),mount,unmount,debug:(p,th,err)=>cur&&cur.debug(p,th,err)};
})();
