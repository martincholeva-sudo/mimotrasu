'use strict';
(() => {
  const frame=document.getElementById('finance-private'),status=document.getElementById('finance-status');
  window.addEventListener('message',event=>{
    if(event.origin!=='https://moje.mimotrasu.cz'||event.source!==frame.contentWindow||event.data?.channel!=='mimo-finance-server'||event.data.type!=='ready')return;
    frame.hidden=false;status.hidden=true;
  });
})();
