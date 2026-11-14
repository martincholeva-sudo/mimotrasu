/* Open supported Google links on Android, with the original web URL as fallback. */
(function(root){
 'use strict';
 const key='mimo-prefer-android-apps';
 function target(href,userAgent,enabled=true){
  if(!enabled||!/Android/i.test(userAgent))return null;
  let u;try{u=new URL(href);}catch{return null;}
  if(u.protocol!=='https:'||u.username||u.password)return null;
  let pkg,appUrl=u;
  if(u.hostname==='mail.google.com'){
   // Current Gmail registers gmail.app.goo.gl, not mail.google.com, on Android.
   // Only generic inbox shortcuts may become a launcher; keep account/search links intact.
   if(!/^\/(?:mail\/(?:u\/0\/)?)?$/.test(u.pathname)||u.search)return null;
   pkg='com.google.android.gm';
   appUrl=new URL('https://gmail.app.goo.gl/');
  }
  else if(u.hostname==='calendar.google.com')pkg='com.google.android.calendar';
  else if(u.hostname==='moje.mimotrasu.cz'&&u.pathname==='/moje/kalendar'&&!u.search&&!u.hash){pkg='com.google.android.calendar';appUrl=new URL('https://calendar.google.com/calendar/u/0/r');}
  else return null;
  // Gmail message fragments must retain their destination; let Android handle those normal links.
  if(u.hash&&u.hash!=='#inbox')return null;
  const fallback=pkg==='com.google.android.gm'?'https://mimotrasu.cz/start/open-app.html':u.href;
  return 'intent://'+appUrl.host+appUrl.pathname+appUrl.search+'#Intent;scheme=https;package='+pkg+';S.browser_fallback_url='+encodeURIComponent(fallback)+';end';
 }
 if(typeof module!=='undefined'&&module.exports){module.exports={target};return;}
 function enabled(){try{return localStorage.getItem(key)!=='false';}catch{return true;}}
 const converted=new WeakMap();
 function refresh(){
  document.querySelectorAll('a[href]').forEach(a=>{
   if(a.hasAttribute('download'))return;
   const old=converted.get(a),web=old&&a.href===old.app?old.web:a.href;
   const app=target(web,navigator.userAgent,enabled());
   if(app){if(a.href!==app)a.href=app;converted.set(a,{web,app});}
   else if(old&&a.href===old.app){a.href=old.web;converted.delete(a);}
  });
 }
 const setting=document.getElementById('preferMobileApps');
 if(setting){setting.checked=enabled();setting.addEventListener('change',()=>{try{localStorage.setItem(key,String(setting.checked));}catch{}refresh();});}
 // A real anchor keeps the browser's normal user-initiated app handoff intact.
 new MutationObserver(refresh).observe(document.body,{subtree:true,childList:true});
 window.addEventListener('storage',e=>{if(e.key===key)refresh();});
 refresh();
})(typeof window!=='undefined'?window:globalThis);
