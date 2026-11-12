import {createPageRenderer} from './page-renderer.js?v=20261111-firefox4';
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
let virtualBookPosition=null;
let viewportWidth=innerWidth, stableBookHeight=innerHeight;
function syncMobileBookSize(){
  if(innerWidth!==viewportWidth){viewportWidth=innerWidth;stableBookHeight=innerHeight;}
  const mobile=innerWidth<=700&&!staticBook();
  section.style.height=mobile?`${stableBookHeight*3.6+innerHeight}px`:'';
  document.documentElement.style.setProperty('--book-viewport-height',`${innerHeight}px`);
}
syncMobileBookSize();
addEventListener('resize',syncMobileBookSize);
bookMode.addEventListener('change',syncMobileBookSize);
let lastUiKey='';
const lastBookValues={open:NaN,turn:NaN,exit:NaN};
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
const leafShades=[];
const leafCrops=[];
const stripCount=16;
turningPage.style.setProperty('--leaf-count',stripCount);
const frontTemplate=turningPage.querySelector('.leaf-front');
const backTemplate=turningPage.querySelector('.leaf-back');
frontTemplate.classList.add('leaf-template');backTemplate.classList.add('leaf-template');
let builtStrips=0;
let preparationAllowed=false;
function buildLeafStrips(limit=stripCount){
  const fragment=document.createDocumentFragment();
  const end=Math.min(stripCount,builtStrips+limit);
  for(let i=builtStrips;i<end;i++){
    const strip=document.createElement('div');strip.className='leaf-segment';strip.inert=true;
    const shades=[];
    for(const [template,side] of [[frontTemplate,'front'],[backTemplate,'back']]) {
      const face=template.cloneNode(true);face.classList.remove('leaf-template');
      const crop=document.createElement('div');crop.className='leaf-crop';
      while(face.firstChild)crop.append(face.firstChild);
      const shade=document.createElement('div');shade.className='leaf-shade';shade.style.opacity='0';
      face.append(crop,shade);strip.append(face);shades.push(shade);
    leafCrops.push({node:crop,side});
      crop.style.setProperty('--slice-index',side==='front'?i:stripCount-1-i);
    }
    fragment.append(strip);leafSegments.push(strip);leafShades.push(shades);

  }
  builtStrips=end;
  turningPage.append(fragment);
  if(typeof lastCurveTurn!=='undefined')lastCurveTurn=-1;
}
function prepareLeafInIdle(){
  if(staticBook()||builtStrips===stripCount)return;
  buildLeafStrips(4);
  if(builtStrips<stripCount)scheduleLeafPreparation();
}
function scheduleLeafPreparation(){
  if('requestIdleCallback' in window)requestIdleCallback(prepareLeafInIdle,{timeout:1200});
  else setTimeout(prepareLeafInIdle,30);
}
document.fonts.ready.then(queueBook);
const castShadow=document.createElement('div');castShadow.className='page-cast-shadow';castShadow.setAttribute('aria-hidden','true');turningPage.before(castShadow);
let pageWidth=0;
let pageHeight=stage.clientHeight;
function measureLeaf(){pageHeight=stage.clientHeight;pageWidth=innerWidth*(innerWidth<=700?1:.5);turningPage.style.setProperty('--leaf-width',pageWidth+'px');}
measureLeaf();addEventListener('resize',measureLeaf);
let lastCurveTurn=-1;

let faceTextures=null,appliedTextureKey='',textureRequest=0,textureTimer=0,fontEmbedPromise,pageRenderer;
const textureKey=()=>`${pageWidth}x${pageHeight}:${language}`;
async function embeddedHandwriting(){
  if(!fontEmbedPromise)fontEmbedPromise=fetch('assets/fonts/schoolbell.ttf').then(r=>r.blob()).then(blob=>new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(`@font-face{font-family:Schoolbell;src:url(${reader.result}) format('truetype');font-style:normal;font-weight:400;}`);reader.readAsDataURL(blob);}));
  return fontEmbedPromise;
}
function applyFaceTextures(){
  if(!faceTextures||faceTextures.key!==textureKey()||appliedTextureKey===faceTextures.key||builtStrips<stripCount)return;
  for(const crop of leafCrops){
    const image=new Image();image.alt='';image.draggable=false;image.src=faceTextures[crop.side];
    crop.node.replaceChildren(image);
  }
  appliedTextureKey=faceTextures.key;turningPage.dataset.renderMode='texture';
  // Firefox's compositor handles shared image faces without WebGL readbacks.
  if(!pageRenderer&&innerWidth>700&&!/Firefox\//.test(navigator.userAgent))pageRenderer=createPageRenderer(notebook);
  if(innerWidth>700&&pageRenderer?.setFaces(faceTextures.frontImage,faceTextures.backImage)){turningPage.classList.add('gpu-page');turningPage.dataset.renderMode='webgl';pageRenderer.warmUp(pageWidth,pageHeight);}
}
async function prepareFaceTextures(){
  if(staticBook())return;
  const request=++textureRequest,key=textureKey();
  try{
    await import('./vendor/html-to-image.js');
    const fontEmbedCSS=await embeddedHandwriting();
    const faces={key};
    for(const [side,template]of [['front',frontTemplate],['back',backTemplate]]){
      const holder=document.createElement('div');holder.className='leaf-face leaf-'+side;holder.inert=true;holder.setAttribute('aria-hidden','true');
      Object.assign(holder.style,{position:'fixed',left:'-20000px',right:'auto',top:'0',bottom:'auto',width:pageWidth+'px',height:stage.clientHeight+'px',display:'block',visibility:'visible',transform:'none',pointerEvents:'none'});
      const content=template.firstElementChild.cloneNode(true);holder.append(content);document.body.append(holder);
      try{
        faces[side]=await window.htmlToImage.toPng(content,{width:pageWidth,height:stage.clientHeight,pixelRatio:Math.min(devicePixelRatio||1,2),fontEmbedCSS,cacheBust:false,style:{transform:'none',width:pageWidth+'px',height:stage.clientHeight+'px'}});
        const image=new Image();image.src=faces[side];await image.decode();faces[side+'Image']=image;
      }finally{holder.remove();}
    }
    if(request!==textureRequest||key!==textureKey())return;
    faceTextures=faces;
    if(lastCurveTurn<=.001||lastCurveTurn>=.999)applyFaceTextures();
  }catch(error){console.warn('Book texture preparation uses HTML fallback:',error);}
}
function scheduleFaceTextures(){if(!preparationAllowed)return;clearTimeout(textureTimer);textureTimer=setTimeout(()=>{if('requestIdleCallback'in window)requestIdleCallback(prepareFaceTextures,{timeout:800});else prepareFaceTextures();},60);}
function invalidateFaceTextures(){
  if(!faceTextures&&!appliedTextureKey){scheduleFaceTextures();return;}
  faceTextures=null;appliedTextureKey='';pageRenderer?.hide();turningPage.classList.remove('gpu-page');turningPage.dataset.renderMode='html';
  for(const crop of leafCrops){const template=crop.side==='front'?frontTemplate:backTemplate;crop.node.replaceChildren(template.firstElementChild.cloneNode(true));}
  lastCurveTurn=-1;scheduleFaceTextures();queueBook();
}
document.fonts.ready.then(scheduleFaceTextures);
addEventListener('resize',()=>{if(faceTextures?.key!==textureKey())invalidateFaceTextures();});

function curveLeaf(turn) {
  if(turn>0&&turn<1&&builtStrips<stripCount)buildLeafStrips();
  if(turn<=.001||turn>=.999)applyFaceTextures();
  if(Math.abs(lastCurveTurn-turn)<.000001)return;
  lastCurveTurn=turn;
  turningPage.classList.toggle('leaf-flat-front',turn<.001);
  turningPage.classList.toggle('leaf-flat-back',turn>.999);
  if(innerWidth<=700){pageRenderer?.hide();turningPage.classList.remove('gpu-page');}
  if(innerWidth>700&&faceTextures?.key===textureKey()&&pageRenderer?.draw(turn,pageWidth,pageHeight)){
    const lift=Math.sin(Math.PI*turn);castShadow.style.opacity=String(lift*.7);castShadow.style.transform=`scaleX(${.3+lift*.7})`;return;
  }
  const slice=pageWidth/stripCount,amplitude=Math.sin(Math.PI*turn)*.72;
  let x=0,z=0;
  for(let i=0;i<leafSegments.length;i++) {
    const bend=-amplitude*Math.sin((i+.5)/stripCount*Math.PI*.65);
    leafSegments[i].style.transform=`translate3d(${x.toFixed(2)}px,0,${z.toFixed(2)}px) rotateY(${bend.toFixed(4)}rad)`;
    const shade=String(Math.abs(Math.sin(bend))*.22);
    for(const layer of leafShades[i])layer.style.opacity=shade;
    x+=Math.cos(bend)*slice;z-=Math.sin(bend)*slice;
  }
  const lift=Math.sin(Math.PI*turn);
  castShadow.style.opacity=String(lift*.7);
  castShadow.style.transform=`scaleX(${.3+lift*.7})`;
}

function updateBook() {
  raf=false;
  if (staticBook()) {
    lastUiKey='';
    index.inert=false;biography.inert=false;index.style.visibility='visible';biography.style.visibility='visible';
    index.querySelectorAll('.paper-page').forEach(el=>el.style.visibility='visible');
    biography.querySelector('.bio-photo-page').style.visibility='visible';
    stage.style.pointerEvents='auto';document.body.classList.remove('book-closed');return;
  }
  const travel=virtualBookPosition===null?section.offsetHeight-innerHeight:0;
  const p=virtualBookPosition??clamp(-section.getBoundingClientRect().top/travel);
  // The sheet follows the actual scroll position. No timed jump can skip the
  // visible turn, and pausing the scroll intentionally pauses the page.
  const open=ease(p/.23);
  const turn=ease((p-.40)/.22);
  const exit=ease((p-.82)/.18);
  const turning=turn>.0001;
  if(open>=.999&&(turn<=.001||turn>=.999)&&!preparationAllowed){preparationAllowed=true;scheduleLeafPreparation();scheduleFaceTextures();}
  if(lastBookValues.open!==open){
    notebook.style.setProperty('--book-open',open);cover.style.setProperty('--book-open',open);lastBookValues.open=open;
  }
  if(lastBookValues.turn!==turn){
    notebook.style.setProperty('--book-turn',turn);turningPage.style.setProperty('--book-turn',turn);lastBookValues.turn=turn;
  }
  curveLeaf(turn);
  if(lastBookValues.exit!==exit){
    section.style.setProperty('--book-exit',exit);notebook.style.setProperty('--book-exit',exit);
    document.querySelector('.book-bottomline').style.opacity=String(1-exit);
    const previous=document.querySelector('.book-arrow-prev');
    previous.style.opacity=previous.disabled?'0':String((1-exit)*.65);
    document.querySelector('.book-arrow-next').style.opacity=String((1-exit)*.65);
    lastBookValues.exit=exit;
  }
  const uiKey=[innerWidth<=700,open>.001,open>=.999,turning,turn>=.999,open<.5,turn<.5,exit>.01,exit>.95,language].join(':');
  if(uiKey===lastUiKey)return;
  lastUiKey=uiKey;
  // Both faces remain mounted. The actual sheet rotates around the spine.
  cover.style.opacity='1';
  turningPage.style.opacity='1';
  turningPage.style.visibility=turning?'visible':'hidden';
  biography.style.opacity='1';biography.style.visibility=turning?'visible':'hidden';
  biography.querySelector('.bio-photo-page').style.visibility=(innerWidth<=700&&turning)||turn>=.999?'visible':'hidden';
  index.style.opacity='1';index.style.visibility='visible';
  index.querySelector('.index-links').style.visibility=turning?'hidden':'visible';
  index.querySelector('.index-art').style.visibility=turn>=.999?'hidden':'visible';
  const indexInactive=open<.999||turning||exit>.01, bioInactive=turn<.999||exit>.01;
  if(index.inert!==indexInactive)index.inert=indexInactive;
  if(biography.inert!==bioInactive)biography.inert=bioInactive;
  stage.style.pointerEvents=exit>.95?'none':'auto';
  document.body.classList.toggle('book-closed',open<.5);
  const active=open<.5?'cover':turn<.5?'index':'bio';
  section.dataset.page=active;
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
  if(copy[next.dataset.i18n]&&next.textContent!==copy[next.dataset.i18n])next.textContent=copy[next.dataset.i18n];
  document.querySelectorAll('.book-pagination button').forEach(b=>{if(b.dataset.bookStep===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});

}
function queueBook(){if(!raf){raf=true;requestAnimationFrame(updateBook);}}
bookMode.addEventListener('change',queueBook);
addEventListener('scroll',queueBook,{passive:true});addEventListener('resize',queueBook);document.fonts.ready.then(queueBook);
let navigationFrame=0;
function cancelBookNavigation(){
  if(navigationFrame){cancelAnimationFrame(navigationFrame);navigationFrame=0;}
  if(virtualBookPosition!==null){const p=virtualBookPosition;virtualBookPosition=null;window.scrollTo({top:section.getBoundingClientRect().top+scrollY+(section.offsetHeight-innerHeight)*p,behavior:'instant'});updateBook();}
}
function scrollToBook(top){
  cancelBookNavigation();
  const origin=section.getBoundingClientRect().top+scrollY;
  const travel=section.offsetHeight-innerHeight;
  const target=clamp((top-origin)/travel);
  let current=clamp((scrollY-origin)/travel);
  const phases=[];
  function add(from,to,span,duration=750){
    if(Math.abs(to-from)>.0001)phases.push({from,to,duration:Math.max(240,duration*Math.abs(to-from)/span)});
  }
  // Give the visible turn the whole animation budget. Reading-space gaps
  // between pages are skipped only while both ends show the same flat page.
  if(target>=.82){
    if(current<.23)add(current,.23,.23);
    if(current<.62)add(Math.max(.40,current),.62,.22);
    add(Math.max(.82,current),1,.18,650);
  }else if(target>=.62){
    if(current<.23)add(current,.23,.23);
    if(current<.62)add(Math.max(.40,current),.62,.22);
  }else if(target>=.23){
    if(current>.40)add(Math.min(.62,current),.40,.22);
    if(current<.23)add(current,.23,.23);
  }else{
    if(current>.40)add(Math.min(.62,current),.40,.22);
    if(current>0)add(Math.min(.23,current),0,.23);
  }
  let phaseIndex=0,start=null;
  function seek(p){virtualBookPosition=null;window.scrollTo({top:origin+travel*p,behavior:'instant'});updateBook();}
  function frame(now){
    const phase=phases[phaseIndex];
    if(!phase){seek(target);navigationFrame=0;return;}
    if(start===null){start=now;virtualBookPosition=phase.from;updateBook();}
    const progress=clamp((now-start)/phase.duration);
    const position=phase.from+(phase.to-phase.from)*ease(progress);
    if(phase.from>=.82)seek(position);
    else{virtualBookPosition=position;updateBook();}
    if(progress===1){seek(phase.to);phaseIndex++;start=null;}
    navigationFrame=requestAnimationFrame(frame);
  }
  navigationFrame=requestAnimationFrame(frame);
}
for(const event of ['wheel','touchstart','pointerdown','keydown'])addEventListener(event,cancelBookNavigation,{passive:true});
function goToBook(step) {
  let target;
  if(staticBook()) target=step==='bio'?biography:step==='index'?index:step==='journey'?document.querySelector('#presentacion'):section;
  if(target){target.scrollIntoView({behavior:'auto',block:'start'});target.inert=false;}
  else {
    const ratio={cover:0,index:.31,bio:.70,journey:1}[step]||0;
    const top=section.getBoundingClientRect().top+scrollY+(section.offsetHeight-innerHeight)*ratio;
    scrollToBook(top);
  }
}
document.querySelectorAll('[data-book-step]:not(.leaf-face [data-book-step]):not(.cover-inside [data-book-step])').forEach(b=>b.addEventListener('click',()=>goToBook(b.dataset.bookStep)));
document.querySelectorAll('[data-book-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();goToBook(a.dataset.bookLink);}));
updateBook();
const text=(key,fallback)=>copy[key]||fallback;
document.addEventListener('ben-language',event=>{
 language=event.detail.language;copy=event.detail.messages;queueMicrotask(invalidateFaceTextures);queueBook();
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
