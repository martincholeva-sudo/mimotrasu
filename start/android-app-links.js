/* Open supported Google links on Android, with the original web URL as fallback. */
(function(root){
 'use strict';
 const key='mimo-prefer-android-apps';
 function target(href,userAgent,enabled=true){
  if(!enabled||!/Android/i.test(userAgent))return null;
  let u;try{u=new URL(href);}catch{return null;}
  if(u.protocol!=='https:'||u.username||u.password)return null;
  let pkg,appUrl=u;
  if(u.hostname==='mail.google.com')pkg='com.google.android.gm';
  else if(u.hostname==='calendar.google.com')pkg='com.google.android.calendar';
  else if(u.hostname==='moje.mimotrasu.cz'&&u.pathname==='/moje/kalendar'){pkg='com.google.android.calendar';appUrl=new URL('https://calendar.google.com/calendar/u/0/r');}
  else return null;
  // Gmail message fragments must retain their destination; let Android handle those normal links.
  if(u.hash&&u.hash!=='#inbox')return null;
  return 'intent://'+appUrl.host+appUrl.pathname+appUrl.search+'#Intent;scheme=https;package='+pkg+';S.browser_fallback_url='+encodeURIComponent(u.href)+';end';
 }
 if(typeof module!=='undefined'&&module.exports){module.exports={target};return;}
 function enabled(){try{return localStorage.getItem(key)!=='false';}catch{return true;}}
 const setting=document.getElementById('preferMobileApps');
 if(setting){setting.checked=enabled();setting.addEventListener('change',()=>{try{localStorage.setItem(key,String(setting.checked));}catch{}});}
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const a=event.target instanceof Element?event.target.closest('a[href]'):null;if(!a||a.hasAttribute('download'))return;
  const uri=target(a.href,navigator.userAgent,enabled());if(!uri)return;
  event.preventDefault();location.assign(uri);
 });
})(typeof window!=='undefined'?window:globalThis);
