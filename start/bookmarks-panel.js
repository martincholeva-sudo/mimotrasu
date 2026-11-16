(function(){
 'use strict';
 const panel=document.getElementById('bookmarksPanel'),frame=document.getElementById('bookmarksFrame');
 if(!panel||!frame)return;
 function close(){if(panel.classList.contains('open'))frame.contentWindow.postMessage({channel:'mimo-bookmark-strip-v1',action:'close'},'https://moje.mimotrasu.cz');}
 window.addEventListener('message',event=>{
  if(event.origin!=='https://moje.mimotrasu.cz'||event.source!==frame.contentWindow||event.data?.channel!=='mimo-bookmark-strip-v1')return;
  const height=Math.max(52,Math.min(430,Number(event.data.height)||52));
  panel.style.height=height+'px';frame.style.height=height+'px';panel.classList.toggle('open',Boolean(event.data.open));
 });
 document.addEventListener('pointerdown',event=>{if(!panel.contains(event.target))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
})();