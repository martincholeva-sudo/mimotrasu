'use strict';
(() => {
  const frame = document.getElementById('portal-frame') || document.getElementById('finance-private');
  const status = document.getElementById('status') || document.getElementById('finance-status');
  if (!frame || !status) return;
  const text = document.getElementById('status-text');
  const params = new URLSearchParams(location.search),section=params.get('sekce');
  const sections={fitness:'/moje/trenink',garmin:'/moje/garmin',disk:'/moje/disk',tyden:'/moje/tyden',kondice:'/moje/kondice',hledat:'/moje/hledat',zapisnik:'/moje/zapisnik',nastaveni:'/moje/nastaveni',weby:'/moje/weby',ukoly:'/moje/ukoly',archiv:'/moje/archiv',rozpocet:'/moje/rozpocet'};
  const path=location.pathname.startsWith('/moje/disk/')?'/moje/disk':frame.id==='finance-private'?'/api/finance/ui':Object.hasOwn(sections,section)?sections[section]:'/moje';
  function copyParams(from,to){
    for(const key of ['slozka','soubor']){const value=from.get(key);if(value&&/^[A-Za-z0-9_-]{1,200}$/.test(value))to.set(key,value);}
    for(const key of ['q','hledat']){const value=from.get(key);if(value&&value.length<=150)to.set(key,value);}
    const link=from.get('odkaz');if(link&&/^\d+-\d+$/.test(link))to.set('odkaz',link);
    const date=from.get('datum');if(date&&/^20\d{2}-\d{2}-\d{2}$/.test(date))to.set('datum',date);
    const tab=from.get('tab');if(['day','calendar','results','exercises','nicotine','measurements','settings'].includes(tab))to.set('tab',tab);
    if(from.get('zobrazeni')==='spolecny')to.set('zobrazeni','spolecny');
    if(from.get('zapsat')==='1')to.set('zapsat','1');
    for(const key of ['pridat','pozdeji','nahrat'])if(from.get(key)==='1')to.set(key,'1');
    const id=from.get('id');if(id&&/^[A-Za-z0-9_-]{1,100}$/.test(id))to.set('id',id);
  }
  const target=new URL(path,'https://moje.mimotrasu.cz');copyParams(params,target.searchParams);frame.src=target.toString();
  let ready = false;
  window.addEventListener('message', event => {
    if (event.origin !== 'https://moje.mimotrasu.cz' || event.source !== frame.contentWindow) return;
    if (event.data?.type !== 'ready' || !['mimo-portal-v1','mimo-finance-server'].includes(event.data?.channel)) return;
    ready = true;
    status.hidden = true;
    frame.hidden = false;
    if(event.data.navigation===2){
      document.documentElement.classList.add('portal-ready');
      const paths={'/moje':'/moje/','/moje/trenink':'/moje/?sekce=fitness','/moje/garmin':'/moje/?sekce=garmin','/moje/disk':'/moje/disk/','/api/finance/ui':'/moje/finance/','/moje/tyden':'/moje/?sekce=tyden','/moje/kondice':'/moje/?sekce=kondice','/moje/hledat':'/moje/?sekce=hledat','/moje/zapisnik':'/moje/?sekce=zapisnik','/moje/nastaveni':'/moje/?sekce=nastaveni','/moje/weby':'/moje/?sekce=weby','/moje/ukoly':'/moje/?sekce=ukoly','/moje/archiv':'/moje/?sekce=archiv','/moje/rozpocet':'/moje/?sekce=rozpocet'};
      if(typeof event.data.path==='string'&&event.data.path.startsWith('/')&&!event.data.path.startsWith('//')&&event.data.path.length<=1500){
        const child=new URL(event.data.path,'https://moje.mimotrasu.cz');
        if(child.origin==='https://moje.mimotrasu.cz'&&Object.hasOwn(paths,child.pathname)){const url=new URL(paths[child.pathname],location.origin);copyParams(child.searchParams,url.searchParams);history.replaceState(null,'',url.pathname+url.search);}
      }
    }
  });
  setTimeout(() => {
    if (!ready && text) text.textContent = 'Pro otevření soukromého prostoru se přihlas svým účtem.';
  }, 10000);
})();
