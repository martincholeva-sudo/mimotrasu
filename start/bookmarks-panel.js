(function(){
 'use strict';
 const panel=document.getElementById('bookmarksPanel');
 const frame=document.getElementById('bookmarksFrame');
 if(!panel||!frame)return;
 const origin='https://moje.mimotrasu.cz';
 const channel='mimo-bookmark-strip-v1';
 const mobile=()=>matchMedia('(max-width:700px)').matches;
 const compactHeight=()=>mobile()?48:52;
 let activated=false;
 function post(action){
  frame.contentWindow?.postMessage({channel,action},origin);
 }
 function sendTheme(theme=window.mimoPhotoPalette){
  if(theme)frame.contentWindow?.postMessage({channel,action:'theme',theme},origin);
 }
 function compact(){
  const height=compactHeight()+'px';
  panel.style.height=height;
  frame.style.height=height;
  panel.classList.remove('open');
 }
 function close(){
  if(panel.classList.contains('open'))post('close');
  compact();
 }
 function reset(){
  activated=false;
  compact();
  post('close');
 }
 // The embedded bookmark menu is cross-origin; focus proves the visitor
 // interacted with it. Ignore unsolicited open messages on initial load.
 frame.addEventListener('focus',()=>{activated=true;});
 window.addEventListener('blur',()=>{
  if(document.activeElement===frame)activated=true;
 });
 window.addEventListener('message',event=>{
  if(event.origin!==origin||event.source!==frame.contentWindow||event.data?.channel!==channel)return;
  if(!event.data.open){compact();return;}
  if(!activated&&document.activeElement!==frame){compact();return;}
  activated=true;
  const top=panel.getBoundingClientRect().top;
  const available=Math.max(compactHeight(),window.innerHeight-top-12);
  const maxHeight=Math.min(mobile()?420:340,available);
  const requested=Number(event.data.height);
  const height=Math.max(compactHeight(),Math.min(maxHeight,Number.isFinite(requested)?requested:compactHeight()));
  panel.style.height=height+'px';
  frame.style.height=height+'px';
  panel.classList.add('open');
 });
 frame.addEventListener('load',()=>{
  reset();
  sendTheme();
 });
 window.addEventListener('pageshow',reset);
 document.addEventListener('mimo:photo-theme',event=>sendTheme(event.detail));
 window.addEventListener('resize',close);
 document.addEventListener('pointerdown',event=>{if(!panel.contains(event.target))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
 compact();
})();
