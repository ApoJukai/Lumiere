const C=LumiereCore;const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const state={catalog:[],online:[],query:'',category:'All',sort:'relevance',saved:JSON.parse(localStorage.getItem('lumiere-saved')||'[]'),view:'discover',searchPage:1,next:null,prev:null,loading:false,selected:null};let book=null,rendition=null,font=100,searchTimer=null,deferredPrompt=null;
function toast(m){const t=$('#toast');t.querySelector('span').textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2400)}
function persist(){localStorage.setItem('lumiere-saved',JSON.stringify(state.saved));$('#savedCount').textContent=state.saved.length}
function cover(b,cls=''){const hue=(Number(b.id)||String(b.title).length)%360;return `<div class="cover ${cls}" style="background:linear-gradient(145deg,hsl(${hue} 65% 58%),hsl(${(hue+55)%360} 50% 18%))">${b.cover?`<img src="${b.cover}" alt="" loading="lazy" onerror="this.remove()">`:''}<div class="fallback"><small>LUMIÈRE CLASSICS</small><h3>${esc(b.title)}</h3><small>${esc(b.author)}</small></div><button class="save ${state.saved.includes(String(b.id))?'on':''}" data-save="${b.id}">${state.saved.includes(String(b.id))?'♥':'♡'}</button><span class="tag">Complete EPUB</span></div>`}
function esc(v){return String(v||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function allResults(){let list=state.online.length?C.dedupe([...C.searchLocal(state.catalog,state.query,state.category),...state.online]):C.searchLocal(state.catalog,state.query,state.category);if(state.view==='saved')list=list.filter(b=>state.saved.includes(String(b.id)));if(state.sort==='title')list.sort((a,b)=>a.title.localeCompare(b.title));if(state.sort==='author')list.sort((a,b)=>a.author.localeCompare(b.author));return list}
function render(){const list=allResults();$('#grid').innerHTML=list.map(b=>`<article class="book"><div data-open="${b.id}">${cover(b)}</div><div class="meta"><h3>${esc(b.title)}</h3><p>${esc(b.author)}</p><div><span>${esc(b.category||'Classic')}</span><span>#${b.id}</span></div></div></article>`).join('');$('#empty').hidden=!!list.length;$('#status').textContent=state.loading?'Searching Project Gutenberg…':`${list.length} shown · ${state.catalog.length} bundled titles${state.online.length?` · ${state.online.length} online results`:''}`;$$('[data-open]').forEach(x=>x.onclick=e=>{if(!e.target.closest('[data-save]'))openDetails(String(x.dataset.open))});$$('[data-save]').forEach(x=>x.onclick=e=>{e.stopPropagation();toggleSave(String(x.dataset.save))});$('#pager').hidden=!(state.next||state.prev);$('#prevSearch').disabled=!state.prev;$('#nextSearch').disabled=!state.next;$('#pageLabel').textContent=`Search page ${state.searchPage}`}
function toggleSave(id){state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];persist();render();toast(state.saved.includes(id)?'Saved to your library':'Removed from your library')}
function getBook(id){return [...state.catalog,...state.online].find(x=>String(x.id)===String(id))}
function openDetails(id){const b=getBook(id);if(!b)return;state.selected=b;$('#modalBody').innerHTML=`<div class="book-detail">${cover(b,'detail-cover')}<div class="detail-copy"><span class="eyebrow">PROJECT GUTENBERG · EBOOK #${b.id}</span><h2>${esc(b.title)}</h2><p><b>${esc(b.author)}</b></p><p>${esc((b.subjects||[]).slice(0,3).join(' · ')||b.category||'Public-domain ebook')}</p><p>This edition opens as an EPUB inside Lumière. If the image edition is unavailable, the app automatically tries the no-images EPUB.</p><div class="detail-actions"><button class="primary" id="read">▤ Read EPUB in Lumière</button><button class="secondary" id="detailSave">${state.saved.includes(String(b.id))?'♥':'♡'}</button></div></div></div>`;$('#modal').classList.add('open');document.body.style.overflow='hidden';$('#read').onclick=()=>openEpub(b);$('#detailSave').onclick=()=>{toggleSave(String(b.id));openDetails(id)}}
function closeModal(){$('#modal').classList.remove('open');document.body.style.overflow=''}
function cleanup(){try{rendition?.destroy()}catch{}try{book?.destroy()}catch{}rendition=null;book=null;$('#viewer').innerHTML=''}
function withTimeout(ms){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),ms);return{signal:controller.signal,clear:()=>clearTimeout(timer)}}
function isEpubBuffer(buffer){const bytes=new Uint8Array(buffer);return bytes.length>4&&bytes[0]===0x50&&bytes[1]===0x4b&&(bytes[2]===0x03||bytes[2]===0x05||bytes[2]===0x07)&&(bytes[3]===0x04||bytes[3]===0x06||bytes[3]===0x08)}
async function fetchEpubBuffer(url,timeoutMs=25000){
  const timer=withTimeout(timeoutMs);
  try{
    const response=await fetch(url,{signal:timer.signal,headers:{Accept:'application/epub+zip,application/octet-stream;q=0.9,*/*;q=0.1'},cache:'no-store'});
    if(!response.ok)throw new Error(`EPUB request failed (${response.status})`);
    const type=(response.headers.get('content-type')||'').toLowerCase();
    const buffer=await response.arrayBuffer();
    if(!isEpubBuffer(buffer)){
      const hint=type.includes('html')?'The server returned an HTML page instead of an EPUB.':'The downloaded file is not a valid EPUB archive.';
      throw new Error(hint)
    }
    return buffer
  }finally{timer.clear()}
}
async function renderEpubBuffer(buffer,b){
  cleanup();
  book=window.ePub(buffer,{openAs:'epub'});
  await book.ready;
  rendition=book.renderTo('viewer',{width:'100%',height:'100%',spread:'auto',flow:'paginated'});
  const cfi=localStorage.getItem(`lumiere-cfi-${b.id}`);
  await Promise.race([
    rendition.display(cfi||undefined),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('EPUB rendering timed out.')),18000))
  ]);
  rendition.themes.default({body:{'font-family':'Georgia, serif','line-height':'1.65','font-size':`${font}%`,padding:'0 4%'}});
  rendition.on('relocated',loc=>{
    if(loc?.start?.cfi)localStorage.setItem(`lumiere-cfi-${b.id}`,loc.start.cfi);
    const pct=loc?.start?.percentage?Math.round(loc.start.percentage*100):0;
    $('#location').textContent=pct?`${pct}% complete`:'EPUB reader'
  })
}
function showReaderError(b,errors){
  cleanup();
  $('#viewer').innerHTML=`<div class="reader-error"><strong>We could not open this EPUB.</strong><p>${esc(errors.at(-1)?.message||'The ebook server did not return a valid EPUB file.')}</p><div><button class="primary" id="retryEpub">Retry</button><button class="reader-secondary" id="chooseEpub">Open a local EPUB</button></div><small>Book #${esc(b.id)} · Both the image and no-images editions were attempted.</small></div>`;
  $('#retryEpub').onclick=()=>openEpub(b);
  $('#chooseEpub').onclick=()=>$('#file').click();
  $('#location').textContent='EPUB unavailable'
}
async function openEpub(b){
  closeModal();cleanup();state.selected=b;
  $('#readerTitle').textContent=b.title;
  $('#reader').classList.add('open');
  document.body.style.overflow='hidden';
  $('#location').textContent='Connecting…';
  const sources=[b.epub,b.epubNoImages,C.epubUrl(b.id,true),C.epubUrl(b.id,false)].filter((v,i,a)=>v&&a.indexOf(v)===i);
  const errors=[];
  for(let index=0;index<sources.length;index++){
    const label=index===0?'image EPUB':'fallback EPUB';
    $('#viewer').innerHTML=`<div class="reader-loading"><span class="spinner"></span><strong>Loading complete EPUB…</strong><p>Trying ${label}. This attempt will stop automatically if the server does not respond.</p></div>`;
    $('#location').textContent=`Loading ${index+1} of ${sources.length}`;
    try{
      const buffer=await fetchEpubBuffer(sources[index]);
      $('#viewer').innerHTML='';
      await renderEpubBuffer(buffer,b);
      toast('EPUB opened inside Lumière');
      return
    }catch(error){errors.push(error);cleanup()}
  }
  showReaderError(b,errors)
}
async function searchOnline(url){state.loading=true;render();try{const target=url||`/gutenberg/ebooks/search.opds/?query=${encodeURIComponent(state.query)}`;const r=await fetch(target,{headers:{Accept:'application/atom+xml,application/xml'}});if(!r.ok)throw Error(r.status);const xml=await r.text();const parsed=C.parseOpds(xml);state.online=parsed;const doc=new DOMParser().parseFromString(xml,'application/xml');const next=doc.querySelector('link[rel="next"]')?.getAttribute('href'),prev=doc.querySelector('link[rel="previous"]')?.getAttribute('href');state.next=proxyOpds(next);state.prev=proxyOpds(prev);$('#sourceNotice').textContent=`Official Gutenberg search returned ${parsed.length} books. EPUB links open inside Lumière.`}catch(e){state.online=[];state.next=state.prev=null;$('#sourceNotice').textContent='Online Gutenberg search is temporarily unavailable. The bundled catalog remains searchable and readable.';toast('Online search unavailable; showing bundled books.')}finally{state.loading=false;render()}}
function proxyOpds(url){if(!url)return null;try{const u=new URL(url,location.origin);return u.hostname.includes('gutenberg.org')?'/gutenberg'+u.pathname+u.search:url}catch{return null}}
async function openLocal(file){cleanup();state.selected={id:`local-${file.name}`,title:file.name.replace(/\.epub$/i,'')};$('#readerTitle').textContent=state.selected.title;$('#reader').classList.add('open');document.body.style.overflow='hidden';try{book=window.ePub(await file.arrayBuffer(),{openAs:'epub'});rendition=book.renderTo('viewer',{width:'100%',height:'100%',spread:'auto',flow:'paginated'});await rendition.display();rendition.themes.default({body:{'font-family':'Georgia, serif','font-size':`${font}%`}})}catch(e){toast('Invalid or DRM-protected EPUB')}}
fetch('data/catalog.json').then(r=>r.json()).then(d=>{state.catalog=d;const cats=['All',...new Set(d.map(x=>x.category))];$('#category').innerHTML=cats.map(x=>`<option>${x}</option>`).join('');$('#heroStack').innerHTML=d.slice(0,3).map((b,i)=>`<div class="mini-cover" style="background:linear-gradient(145deg,hsl(${40+i*90} 70% 55%),#161820)"><small>LUMIÈRE</small><h3>${esc(b.title)}</h3><small>${esc(b.author)}</small></div>`).join('');render()}).catch(()=>{$('#status').textContent='Local catalog failed to load.'});
$('#searchForm').onsubmit=e=>{e.preventDefault();state.query=$('#search').value.trim();state.searchPage=1;render();if(state.query)searchOnline();document.querySelector('#collection').scrollIntoView({behavior:'smooth'})};$('#search').oninput=e=>{state.query=e.target.value;state.online=[];state.next=state.prev=null;render();clearTimeout(searchTimer);if(state.query.length>=3)searchTimer=setTimeout(()=>searchOnline(),800)};$('#category').onchange=e=>{state.category=e.target.value;render()};$('#sort').onchange=e=>{state.sort=e.target.value;render()};$('#prevSearch').onclick=()=>{if(state.prev){state.searchPage--;searchOnline(state.prev)}};$('#nextSearch').onclick=()=>{if(state.next){state.searchPage++;searchOnline(state.next)}};$('#upload').onclick=()=>$('#file').click();$('#file').onchange=e=>e.target.files[0]&&openLocal(e.target.files[0]);$$('[data-close]').forEach(x=>x.onclick=closeModal);$('#back').onclick=()=>{cleanup();$('#reader').classList.remove('open');document.body.style.overflow=''};$('#prev').onclick=()=>rendition?.prev();$('#next').onclick=()=>rendition?.next();$('#smaller').onclick=()=>{font=Math.max(75,font-10);rendition?.themes.fontSize(`${font}%`)};$('#larger').onclick=()=>{font=Math.min(180,font+10);rendition?.themes.fontSize(`${font}%`)};$('#theme').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('lumiere-theme',document.body.classList.contains('dark')?'dark':'light')};if(localStorage.getItem('lumiere-theme')==='dark')document.body.classList.add('dark');$$('[data-view]').forEach(x=>x.onclick=()=>{state.view=x.dataset.view;$$('[data-view]').forEach(y=>y.classList.toggle('active',y===x));render();$('#collection').scrollIntoView({behavior:'smooth'})});$('#home').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e});$('#install').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice}else toast('Use your browser menu to install Lumière')};persist();if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
