(function(){
 'use strict';
 const panel=document.getElementById('bookmarksPanel');
 const toggle=document.getElementById('bookmarksToggle');
 const drawer=document.getElementById('bookmarksDrawer');
 const closeButton=document.getElementById('bookmarksClose');
 const viewport=document.getElementById('bookmarksViewport');
 const frame=document.getElementById('bookmarksFrame');
 if(!panel||!toggle||!drawer||!closeButton||!viewport||!frame)return;
 const origin='https://moje.mimotrasu.cz',channel='mimo-bookmark-strip-v1';
 const mobile=()=>matchMedia('(max-width:700px)').matches;
 const baseHeight=()=>mobile()?58:64;
 let expanded=false,childOpen=false,childHeight=baseHeight();
 function post(action){
  if(frame.hasAttribute('src'))frame.contentWindow?.postMessage({channel,action},origin);
 }
 function sendTheme(theme=window.mimoPhotoPalette){
  if(theme&&frame.hasAttribute('src'))
   frame.contentWindow?.postMessage({channel,action:'theme',theme},origin);
 }
 function resizeFrame(){
  const visibleHeight=window.visualViewport?.height||window.innerHeight;
  const top=panel.getBoundingClientRect().top;
  const reserved=mobile()?155:164;
  const limit=Math.max(baseHeight(),Math.min(mobile()?440:400,visibleHeight-top-reserved));
  const height=childOpen?Math.min(limit,Math.max(baseHeight(),childHeight)):baseHeight();
  frame.style.height=height+'px';
  viewport.style.height=height+'px';
 }
 function close(returnFocus=false){
  if(!expanded)return;
  expanded=false;childOpen=false;
  panel.classList.remove('open');drawer.hidden=true;
  toggle.setAttribute('aria-expanded','false');
  post('close');
  if(returnFocus)toggle.focus();
 }
 function open(){
  if(expanded)return;
  expanded=true;childOpen=false;
  panel.classList.add('open');drawer.hidden=false;
  toggle.setAttribute('aria-expanded','true');resizeFrame();
  // Do not load the private content before the user explicitly opens it.
  if(!frame.hasAttribute('src'))frame.src=frame.dataset.src;
  else{post('close');sendTheme();}
 }
 toggle.addEventListener('click',()=>expanded?close():open());
 closeButton.addEventListener('click',()=>close(true));
 document.addEventListener('pointerdown',event=>{
  if(expanded&&!panel.contains(event.target))close();
 });
 document.addEventListener('keydown',event=>{
  if(expanded&&event.key==='Escape'){event.preventDefault();close(true);}
 });
 window.addEventListener('pageshow',()=>close());
 window.addEventListener('resize',resizeFrame);
 window.visualViewport?.addEventListener('resize',resizeFrame);
 window.addEventListener('message',event=>{
  if(event.origin!==origin||event.source!==frame.contentWindow||event.data?.channel!==channel)return;
  if(!expanded)return;
  childOpen=Boolean(event.data.open);
  const requested=Number(event.data.height);
  childHeight=Number.isFinite(requested)?requested:baseHeight();
  resizeFrame();
 });
 frame.addEventListener('load',()=>{sendTheme();post('close');});
 document.addEventListener('mimo:photo-theme',event=>sendTheme(event.detail));
 drawer.hidden=true;
 toggle.setAttribute('aria-expanded','false');
 resizeFrame();
})();