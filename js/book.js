const section = document.querySelector('.book-journey');
const notebook = document.querySelector('.notebook');
const stage = document.querySelector('.book-stage');
const index = document.querySelector('.index-spread');
const biography = document.querySelector('.bio-spread');
const cover = document.querySelector('.book-cover');
const turningPage = document.querySelector('.turning-page');
const bookMode = matchMedia('(prefers-reduced-motion: reduce), (max-height:540px)');
const staticBook = () => bookMode.matches;
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { const x=clamp(n);return x*x*(3-2*x); };
let raf = false;
let language='es', copy={};
function clonePage(source, target) {
  const clone=source.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.querySelectorAll('h1').forEach(el=>{
    const title=document.createElement('div');title.className='cloned-book-title';title.innerHTML=el.innerHTML;el.replaceWith(title);
  });
  clone.querySelectorAll('a,button,input').forEach(el=>{el.tabIndex=-1;});
  target.append(clone);target.inert=true;
}
clonePage(document.querySelector('.index-art'),document.querySelector('.cover-inside'));
clonePage(document.querySelector('.index-links'),document.querySelector('.leaf-front'));
clonePage(document.querySelector('.bio-photo-page'),document.querySelector('.leaf-back'));
// A continuous flexible sheet, approximated by hinged strips. Its curvature is
// zero at rest, grows in mid-turn and settles flat on the opposite page.
const leafSegments=[];
const stripCount=16;
turningPage.style.setProperty('--leaf-count',stripCount);
const frontTemplate=turningPage.querySelector('.leaf-front');
const backTemplate=turningPage.querySelector('.leaf-back');
frontTemplate.classList.add('leaf-template');backTemplate.classList.add('leaf-template');
for(let i=0;i<stripCount;i++) {
  const strip=document.createElement('div');strip.className='leaf-segment';strip.inert=true;
  for(const [template,side] of [[frontTemplate,'front'],[backTemplate,'back']]) {
    const face=template.cloneNode(true);face.classList.remove('leaf-template');
    const crop=document.createElement('div');crop.className='leaf-crop';
    while(face.firstChild)crop.append(face.firstChild);
    face.append(crop);strip.append(face);
    crop.style.setProperty('--slice-index',side==='front'?i:stripCount-1-i);
  }
  turningPage.append(strip);leafSegments.push(strip);
}
const castShadow=document.createElement('div');castShadow.className='page-cast-shadow';castShadow.setAttribute('aria-hidden','true');turningPage.before(castShadow);
let pageWidth=0;
function measureLeaf(){pageWidth=innerWidth*(innerWidth<=700?1:.5);turningPage.style.setProperty('--leaf-width',pageWidth+'px');}
measureLeaf();addEventListener('resize',measureLeaf);
let lastCurveTurn=-1;
function curveLeaf(turn) {
  if(Math.abs(lastCurveTurn-turn)<.000001)return;
  lastCurveTurn=turn;
  turningPage.classList.toggle('leaf-flat-front',turn<.001);
  turningPage.classList.toggle('leaf-flat-back',turn>.999);
  const slice=pageWidth/stripCount,amplitude=Math.sin(Math.PI*turn)*.72;
  let x=0,z=0;
  for(let i=0;i<stripCount;i++) {
    const bend=-amplitude*Math.sin((i+.5)/stripCount*Math.PI*.65);
    leafSegments[i].style.transform=`translate3d(${x.toFixed(2)}px,0,${z.toFixed(2)}px) rotateY(${bend.toFixed(4)}rad)`;
    leafSegments[i].style.setProperty('--slice-shade',Math.abs(Math.sin(bend))*.22);
    x+=Math.cos(bend)*slice;z-=Math.sin(bend)*slice;
  }
  turningPage.style.setProperty('--page-lift',Math.sin(Math.PI*turn));
}

function updateBook() {
  raf=false;
  if (staticBook()) {
    index.inert=false;biography.inert=false;index.style.visibility='visible';biography.style.visibility='visible';
    index.querySelectorAll('.paper-page').forEach(el=>el.style.visibility='visible');
    biography.querySelector('.bio-photo-page').style.visibility='visible';
    stage.style.pointerEvents='auto';document.body.classList.remove('book-closed');return;
  }
  const travel=section.offsetHeight-innerHeight;
  const p=clamp(-section.getBoundingClientRect().top/travel);
  // The sheet follows the actual scroll position. No timed jump can skip the
  // visible turn, and pausing the scroll intentionally pauses the page.
  const open=ease(p/.23);
  const turn=ease((p-.40)/.22);
  const exit=ease((p-.82)/.18);
  const turning=turn>.0001;
  notebook.style.setProperty('--book-open',open);
  notebook.style.setProperty('--book-turn',turn);
  curveLeaf(turn);
  notebook.style.setProperty('--book-close',0);
  section.style.setProperty('--book-exit',exit);
  // Both faces remain mounted. The actual sheet rotates around the spine.
  cover.style.opacity='1';
  turningPage.style.opacity='1';
  turningPage.style.visibility=turning?'visible':'hidden';
  biography.style.opacity='1';biography.style.visibility=turning?'visible':'hidden';
  biography.querySelector('.bio-photo-page').style.visibility=turn>=.999?'visible':'hidden';
  index.style.opacity='1';index.style.visibility='visible';
  index.querySelector('.index-links').style.visibility=turning?'hidden':'visible';
  index.querySelector('.index-art').style.visibility=turn>=.999?'hidden':'visible';
  index.inert=open<.999||turning||exit>.01;
  biography.inert=turn<.999||exit>.01;
  stage.style.pointerEvents=exit>.95?'none':'auto';
  document.body.classList.toggle('book-closed',open<.5);
  const active=open<.5?'cover':turn<.5?'index':'bio';
  const previous=document.querySelector('.book-arrow-prev');
  const following=document.querySelector('.book-arrow-next');
  previous.disabled=(open<=.001&&turn<=.001)||exit>.95;
  previous.dataset.bookStep=turn>.001?'index':'cover';
  following.dataset.bookStep=open<.999?'index':turn<.999?'bio':'journey';
  following.disabled=exit>.95;
  previous.style.opacity=previous.disabled?'0':String((1-exit)*.65);
  following.style.opacity=String((1-exit)*.65);
  previous.style.pointerEvents=previous.disabled?'none':'auto';
  previous.setAttribute('aria-hidden',String(previous.disabled));

  const next=document.querySelector('.open-book');
  next.dataset.bookStep=active==='cover'?'index':active==='index'?'bio':'journey';
  next.dataset.i18n=active==='cover'?'openBook':active==='index'?'turnPage':'startJourney';
  if(copy[next.dataset.i18n])next.textContent=copy[next.dataset.i18n];
  document.querySelectorAll('.book-pagination button').forEach(b=>{if(b.dataset.bookStep===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});

}
function queueBook(){if(!raf){raf=true;requestAnimationFrame(updateBook);}}
bookMode.addEventListener('change',queueBook);
addEventListener('scroll',queueBook,{passive:true});addEventListener('resize',queueBook);document.fonts.ready.then(queueBook);
let navigationFrame=0;
function cancelBookNavigation(){if(navigationFrame){cancelAnimationFrame(navigationFrame);navigationFrame=0;}}
function scrollToBook(top){
  cancelBookNavigation();
  const from=scrollY,distance=top-from;
  let elapsed=0,previous=performance.now();
  const duration=Math.max(700,Math.min(1200,Math.abs(distance)*.7));
  function frame(now){
    // Keep visible intermediate frames even if Chrome briefly stalls on paint.
    elapsed+=Math.min(32,Math.max(0,now-previous));previous=now;
    const progress=clamp(elapsed/duration);
    window.scrollTo({top:from+distance*ease(progress),behavior:'instant'});
    updateBook();
    if(progress<1)navigationFrame=requestAnimationFrame(frame);else navigationFrame=0;
  }
  navigationFrame=requestAnimationFrame(frame);
}
for(const event of ['wheel','touchstart','pointerdown','keydown'])addEventListener(event,cancelBookNavigation,{passive:true});
function goToBook(step) {
  let target;
  if(staticBook()) target=step==='bio'?biography:step==='index'?index:step==='journey'?document.querySelector('#presentacion'):section;
  if(target){target.scrollIntoView({behavior:'auto',block:'start'});target.inert=false;}
  else {
    const ratio={cover:0,index:.31,bio:.70,journey:1.05}[step]||0;
    const top=section.getBoundingClientRect().top+scrollY+(section.offsetHeight-innerHeight)*ratio;
    scrollToBook(top);
  }
}
document.querySelectorAll('[data-book-step]:not(.leaf-face [data-book-step]):not(.cover-inside [data-book-step])').forEach(b=>b.addEventListener('click',()=>goToBook(b.dataset.bookStep)));
document.querySelectorAll('[data-book-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goToBook(a.dataset.bookLink);}));
updateBook();
const text=(key,fallback)=>copy[key]||fallback;
document.addEventListener('ben-language',event=>{
 language=event.detail.language;copy=event.detail.messages;queueBook();
 document.querySelectorAll('.tour-date').forEach(el=>formatDate(el));
 document.querySelectorAll('[data-detail-label]').forEach(el=>el.setAttribute('aria-label',`${text('merchDetails','Ver concepto')}: ${el.dataset.detailLabel}`));
});
function formatDate(el){el.textContent=new Intl.DateTimeFormat(language==='quc'?'es-GT':language,{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(el.dataset.date+'T12:00:00Z'));}
async function renderTour(){
 const response=await fetch('content/tour.json');if(!response.ok)throw new Error('Tour data unavailable');
 const data=await response.json(),list=document.querySelector('#tour-list');
 for(const show of data.shows){
  const row=document.createElement('article');row.className='tour-row';
  const date=document.createElement('time');date.className='tour-date';date.dateTime=show.date;date.dataset.date=show.date;formatDate(date);
  const title=document.createElement('h3');title.textContent=show.city;
  const venue=document.createElement('span');venue.className='tour-venue';venue.dataset.i18n='venuePending';venue.textContent=text('venuePending','Escenario por anunciar');
  const action=document.createElement('a');action.href='#mailing';action.dataset.i18n='notifyMe';action.textContent=text('notifyMe','Avisame');
  row.append(date,title,venue,action);list.append(row);
 }
}
const merchDialog=document.createElement('dialog');merchDialog.className='product-dialog';merchDialog.setAttribute('aria-label','Merch — concepto');document.body.append(merchDialog);
merchDialog.addEventListener('click',e=>{if(e.target===merchDialog){const r=merchDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)merchDialog.close();}});
async function renderMerch(){
 const response=await fetch('content/merch.json');if(!response.ok)throw new Error('Merch data unavailable');
 const data=await response.json(),grid=document.querySelector('#merch-grid');
 for(const product of data.products){
  const card=document.createElement('button');card.type='button';card.className='product-card';card.dataset.category=product.category;card.dataset.detailLabel=product.id;card.setAttribute('aria-label',`${text('merchDetails','Ver concepto')}: ${product.id}`);
  const image=document.createElement('img');image.src=`assets/images/merch/${product.shape}.svg`;image.alt=product.name;image.width=300;image.height=300;image.loading='lazy';
  const title=document.createElement('span');title.textContent=product.id;
  const price=document.createElement('small');price.textContent=`US$${product.price}`;
  card.append(image,title,price);grid.append(card);
  card.addEventListener('click',()=>{
    merchDialog.replaceChildren();
    const close=document.createElement('button');close.type='button';close.className='dialog-close';close.textContent='×';close.setAttribute('aria-label',text('close','Cerrar'));close.addEventListener('click',()=>merchDialog.close());
    const detailImage=image.cloneNode();detailImage.loading='eager';
    const heading=document.createElement('h2');heading.textContent=product.name;
    const amount=document.createElement('p');amount.textContent=`US$${product.price} · ${text('demoPrice','Precio de ejemplo')}`;
    const note=document.createElement('p');note.textContent=text('productConcept','Producto conceptual. No está a la venta. Imagen y precio provisionales.');
    const notify=document.createElement('a');notify.href='#mailing';notify.className='button button-dark';notify.textContent=text('notifyMe','Avisame');notify.addEventListener('click',()=>merchDialog.close());
    merchDialog.append(close,detailImage,heading,amount,note,notify);merchDialog.showModal();
  });
 }
 document.querySelectorAll('[data-merch-filter]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-merch-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  grid.querySelectorAll('.product-card').forEach(card=>{card.hidden=button.dataset.merchFilter!=='all'&&button.dataset.merchFilter!==card.dataset.category;});
 }));
}
Promise.all([renderTour(),renderMerch()]).catch(error=>console.error(error));
const form=document.querySelector('#mailing-form');
form.addEventListener('submit',e=>{
 e.preventDefault();
 if(!form.reportValidity())return;
 const status=document.querySelector('#mail-status');status.hidden=false;status.textContent=text('mailDemoResult','Esta es una vista previa: tu correo no se guardó ni se envió. Conectaremos la lista antes del lanzamiento.');
 form.reset();
});
// Reaching the bottom alone never restarts the story. Additional deliberate input does.
const ending=document.querySelector('.ending'),meter=document.querySelector('.ending-track');
let effort=0,lastInput=0,bottomSince=0,touchY=null,touchStartedAtBottom=false,decayTimer;
function atBottom(){return scrollY+innerHeight>=document.documentElement.scrollHeight-6;}
function paintEffort(){ending.style.setProperty('--restart-progress',effort/1100);meter.setAttribute('aria-valuenow',String(Math.round(effort/11)));}
function resetEffort(){effort=0;paintEffort();}
function restart(){resetEffort();bottomSince=0;history.replaceState(null,'',location.pathname+location.search);window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function addEffort(delta){
 if(!atBottom()||document.querySelector('dialog[open]'))return;
 const now=performance.now();if(!bottomSince){bottomSince=now;return;}if(now-bottomSince<300)return;
 if(now-lastInput>1800)effort=0;
 lastInput=now;effort=Math.min(1100,effort+delta);paintEffort();
 clearTimeout(decayTimer);decayTimer=setTimeout(resetEffort,2000);
 if(effort>=1100)restart();
}
addEventListener('scroll',()=>{if(!atBottom()){bottomSince=0;resetEffort();}else if(!bottomSince)bottomSince=performance.now();},{passive:true});
addEventListener('wheel',e=>{if(e.deltaY>0)addEffort(Math.min(e.deltaY,140));else resetEffort();},{passive:true});
addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY;touchStartedAtBottom=atBottom();},{passive:true});
addEventListener('touchend',e=>{const end=e.changedTouches[0]?.clientY;if(touchStartedAtBottom&&touchY!==null&&touchY-end>40)addEffort(230);touchY=null;},{passive:true});
addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,button,a')||e.ctrlKey||e.metaKey||e.altKey)return;if(['ArrowDown','PageDown',' '].includes(e.key))addEffort(e.key==='ArrowDown'?90:230);});
document.querySelector('#restart-book').addEventListener('click',restart);
