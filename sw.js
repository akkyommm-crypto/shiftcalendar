'use strict';
const CACHE_NAME='shift-manager-v5-gas-integrated';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('shift-manager-')&&k!==CACHE_NAME).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 const scope=new URL(self.registration.scope);
 if(!url.pathname.startsWith(scope.pathname))return;
 // index / manifestはオンライン時に更新確認。通信できなければ直近のキャッシュ。
 const navigation=request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/manifest.json');
 if(navigation){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   try{
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
   }catch{return await cache.match(request)||await cache.match('./index.html')||Response.error();}
  })());
 }else if(ASSETS.some(path=>new URL(path,scope).pathname===url.pathname)){
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
 }
});
