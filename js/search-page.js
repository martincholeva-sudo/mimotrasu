(function(){
  const $ = sel => document.querySelector(sel);
  const input = $("#q");
  const resultsEl = $("#results");
  const form = $("#s-form");

  let index = [];
  let loaded = false;
  let debTimer = null;

  const norm = s => (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const contains = (hay, needle) => norm(hay).includes(norm(needle));

  async function loadIndex(){
    if(loaded) return index;
    try{
      const r = await fetch("/search-index.json", { cache: "force-cache" });
      index = await r.json();
    }catch(e){
      console.warn("search-index.json nešlo načíst", e);
      index = [];
    }
    loaded = true;
    return index;
  }

  function search(q){
    q = (q||"").trim();
    if(!q) return [];
    return index.map(it=>{
      let score = 0;
      if (contains(it.title, q)) score += 5;
      if (it.tags && it.tags.some(t=>contains(t, q))) score += 3;
      if (contains(it.description||"", q)) score += 2;
      if (contains(it.content||"", q)) score += 1;
      return { ...it, score };
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0, 30);
  }

  function hilite(text, q){
    if(!text) return "";
    const i = norm(text).indexOf(norm(q));
    if(i<0) return text;
    return text.substring(0,i) + "<mark>" + text.substring(i,i+q.length) + "</mark>"
         + text.substring(i+q.length);
  }

  function render(list, q){
    if(!q){
      resultsEl.innerHTML = `<div class="empty">Začni psát do vyhledávání výše.</div>`;
      return;
    }
    if(!list.length){
      resultsEl.innerHTML = `<div class="empty">Nic jsem nenašel pro „${q}“.</div>`;
      return;
    }
    resultsEl.innerHTML = list.map(it=>{
      const img = it.image || "/img/og-default.jpg";
      const url = it.url || "#";
      const title = hilite(it.title, q);
      const desc = hilite(it.description || it.excerpt || "", q);
      return `
        <a class="item" href="${url}">
          <img class="thumb" src="${img}" alt="">
          <div class="meta">
            <div class="title">${title}</div>
            <p class="desc">${desc}</p>
          </div>
        </a>
      `;
    }).join("");
  }

  function doSearch(q){
    clearTimeout(debTimer);
    debTimer = setTimeout(async ()=>{
      await loadIndex();
      const list = search(q);
      render(list, q);
    }, 150);
  }

  // submit držíme na stejné stránce (jen přepíše URL s ?q=..)
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const q = input.value.trim();
    const url = new URL(location.href);
    if(q){ url.searchParams.set("q", q); } else { url.searchParams.delete("q"); }
    history.pushState({}, "", url.toString());
    doSearch(q);
  });

  input.addEventListener("input", (e)=> doSearch(e.target.value));

  // načti q z URL
  const params = new URLSearchParams(location.search);
  const q = params.get("q") || "";
  input.value = q;
  input.focus();
  doSearch(q);

  // zpět/vpřed v historii
  window.addEventListener("popstate", ()=>{
    const q2 = new URLSearchParams(location.search).get("q") || "";
    input.value = q2;
    doSearch(q2);
  });
})();
