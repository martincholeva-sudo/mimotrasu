(function(){
 'use strict';
 const panel=document.getElementById('bookmarksPanel'),dialog=document.getElementById('bookmarksDialog'),slot=document.getElementById('bookmarksSlot'),open=document.getElementById('bookmarksOpen');
 const wide=matchMedia('(min-width:1360px)'),frame=document.createElement('iframe');
 frame.title='Moje soukromé záložky';frame.referrerPolicy='no-referrer';frame.id='bookmarksFrame';
 function load(){if(!frame.src)frame.src='https://moje.mimotrasu.cz/start-bookmarks';}
 function layout(){if(wide.matches){if(dialog.open)dialog.close();panel.append(frame);load();}else{slot.append(frame);}}
 open.addEventListener('click',()=>{dialog.showModal();load();});
 document.getElementById('bookmarksClose').addEventListener('click',()=>dialog.close());
 wide.addEventListener('change',layout);layout();
})();
