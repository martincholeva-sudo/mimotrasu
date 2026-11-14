(function(){
 'use strict';
 const body=document.body,nav=document.getElementById('shortcuts'),mobile=matchMedia('(max-width:700px)');
 let queued=false,page=0,more=null,keyboard=false;
 function height(){const v=window.visualViewport;return Math.floor(v&&v.scale===1?Math.min(innerHeight,v.height):innerHeight);}
 function paginate(){
  const links=Array.from(nav.querySelectorAll('a'));
  const limited=mobile.matches&&body.dataset.startDensity==='tight'&&links.length>6;
  const pages=limited?Math.ceil(links.length/5):1;page%=pages;
  links.forEach((a,i)=>{a.hidden=limited&&Math.floor(i/5)!==page;});
  if(limited&&!more){more=document.createElement('button');more.type='button';more.className='shortcut-more';more.onclick=()=>{page=(page+1)%Math.ceil(nav.querySelectorAll('a').length/5);paginate();};}
  if(more){more.hidden=!limited;if(limited){more.replaceChildren();const icon=document.createElement('span');icon.textContent='→';more.append(icon,document.createTextNode((page+1)+' / '+pages));more.setAttribute('aria-label','Další oblíbené odkazy, stránka '+(page+1)+' z '+pages);if(more.parentNode!==nav)nav.append(more);}}
 }
 function fit(reset=false){
  if(!mobile.matches){delete body.dataset.startDensity;body.style.removeProperty('--start-height');paginate();return;}
  const h=height();
  // Keep zoom and the software keyboard usable instead of shrinking the whole UI.
  keyboard=!!document.activeElement?.matches('input,textarea')&&h<400;
  if(keyboard||window.visualViewport?.scale>1)return;
  body.style.setProperty('--start-height',h+'px');
  if(reset){if(h<=560)body.dataset.startDensity='tight';else if(h<=730)body.dataset.startDensity='compact';else delete body.dataset.startDensity;}
  paginate();
  if(document.documentElement.scrollHeight>h+1){
   if(!body.dataset.startDensity){body.dataset.startDensity='compact';paginate();}
   if(document.documentElement.scrollHeight>h+1){body.dataset.startDensity='tight';paginate();}
  }
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fit();});}
 window.addEventListener('resize',()=>fit(true));window.visualViewport?.addEventListener('resize',()=>fit(true));
 window.addEventListener('pageshow',()=>fit(true));window.addEventListener('start-links-changed',()=>{page=0;fit(true);});
 // Account sync, long labels and the selected photo credit can change the needed height.
 const observer=new ResizeObserver(schedule);['header','main','footer'].forEach(s=>observer.observe(document.querySelector(s)));
 fit(true);
})();
