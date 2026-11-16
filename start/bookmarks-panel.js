(function(){
 'use strict';
 const panel=document.getElementById('bookmarksPanel'),frame=document.getElementById('bookmarksFrame');
 if(!panel||!frame)return;
 window.addEventListener('message',event=>{
  if(event.origin!=='https://moje.mimotrasu.cz'||event.source!==frame.contentWindow||event.data?.channel!=='mimo-bookmark-strip-v1')return;
  const height=Math.max(52,Math.min(430,Number(event.data.height)||52));
  panel.style.height=height+'px';frame.style.height=height+'px';panel.classList.toggle('open',Boolean(event.data.open));
 });
})();