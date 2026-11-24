/* Taurus Coach service worker — offline + updates */
const VERSION='taurus-v3.9.1';
const SHELL=['./','./index.html','./anim.js','./health.js','./voeding.js','./buik.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
const THREE='https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.min.js';
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>caches.open(VERSION).then(c=>c.add(THREE).catch(()=>{})))) });
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);
  if(req.mode==='navigate'){e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(VERSION).then(c=>c.put('./index.html',cp));return r}).catch(()=>caches.match('./index.html')));return}
  if(url.origin===location.origin||url.href===THREE){e.respondWith(caches.match(req).then(hit=>{const net=fetch(req).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(VERSION).then(c=>c.put(req,cp))}return r}).catch(()=>hit);return hit||net}))}
});
