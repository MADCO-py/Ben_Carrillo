const canvas=document.querySelector('#signature-canvas');
const paper=canvas.closest('.signature-paper');
const wall=document.querySelector('#signature-wall');
const status=document.querySelector('#signature-status');
const undo=document.querySelector('#signature-undo'),clear=document.querySelector('#signature-clear'),save=document.querySelector('#signature-save');
const t=(key,fallback)=>globalThis.benLocale?.messages?.[key]||fallback;
let ink,strokes=[],active=null,marks=[],db,canPersist=false,saving=false;
const previews=new WeakMap();
const previewObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const target=entry.target,mark=previews.get(target);if(mark){target.width=600;target.height=240;paint(target,mark.strokes,mark.ink);}previewObserver.unobserve(target);}},{rootMargin:'300px'});
try{ink=localStorage.getItem('ben-signature-ink-v1');}catch{}
if(!/^#[0-9a-f]{6}$/i.test(ink||'')){
 const bytes=crypto.getRandomValues(new Uint8Array(3));
 ink='#'+[...bytes].map(n=>(22+n%115).toString(16).padStart(2,'0')).join('');
 try{localStorage.setItem('ben-signature-ink-v1',ink);}catch{}
}
document.querySelector('#signature-ink').style.background=ink;
canvas.dataset.ink=ink;
function paint(target,lines,color){
 const ctx=target.getContext('2d'),w=target.width,h=target.height;
 ctx.clearRect(0,0,w,h);ctx.strokeStyle=color;ctx.fillStyle=color;
 ctx.lineWidth=1.5*w/(target.clientWidth||500);ctx.lineCap='round';ctx.lineJoin='round';
 for(const line of lines){
  if(!line.length)continue;
  ctx.beginPath();ctx.moveTo(line[0][0]*w,line[0][1]*h);
  for(const p of line.slice(1))ctx.lineTo(p[0]*w,p[1]*h);
  if(line.length===1){ctx.arc(line[0][0]*w,line[0][1]*h,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}else ctx.stroke();
 }
}
function update(){
 paint(canvas,strokes,ink);paper.classList.toggle('has-ink',strokes.length>0);
 undo.disabled=clear.disabled=!strokes.length;save.disabled=!strokes.length||saving;
}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);update();}
new ResizeObserver(resize).observe(canvas);
function point(e){const r=canvas.getBoundingClientRect();return [Math.round(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*10000)/10000,Math.round(Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))*10000)/10000];}
canvas.addEventListener('pointerdown',e=>{
 if(!e.isPrimary||e.button!==0||saving)return;
 if(strokes.reduce((n,s)=>n+s.length,0)>=6000){status.textContent=t('signFull','This drawing is full. Save it and start another.');return;}
 e.preventDefault();canvas.setPointerCapture(e.pointerId);active=[point(e)];strokes.push(active);status.textContent='';update();
});
canvas.addEventListener('pointermove',e=>{
 if(!active||!e.isPrimary)return;
 const events=e.getCoalescedEvents?.()||[e];
 for(const event of events){const p=point(event),last=active.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])>.001&&active.length<2000)active.push(p);}
 update();
});
function end(){active=null;}
canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
undo.addEventListener('click',()=>{active=null;strokes.pop();update();});
clear.addEventListener('click',()=>{active=null;strokes=[];status.textContent='';update();});
function transaction(mode,action){return new Promise((resolve,reject)=>{const tx=db.transaction('marks',mode);let result;action(tx.objectStore('marks'),value=>result=value);tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
function renderWall(){
 previewObserver.disconnect();wall.replaceChildren();
 for(const mark of [...marks].reverse()){
  const figure=document.createElement('figure'),preview=document.createElement('canvas'),remove=document.createElement('button');
  preview.width=1;preview.height=1;preview.style.aspectRatio='5 / 2';preview.setAttribute('role','img');preview.setAttribute('aria-label',t('signDrawing','Saved drawing'));
  remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',t('signDelete','Delete drawing'));
  remove.addEventListener('click',async()=>{
   try{if(canPersist)await transaction('readwrite',store=>store.delete(mark.id));marks=marks.filter(m=>m.id!==mark.id);renderWall();}
   catch{status.textContent=t('signStorage','Storage is unavailable. Your drawing is still on the page.');}
  });
  figure.append(preview,remove);wall.append(figure);previews.set(preview,mark);previewObserver.observe(preview);
 }
}
async function init(){
 try{
  db=await new Promise((resolve,reject)=>{const request=indexedDB.open('ben-guestbook-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('marks',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Storage blocked'));});
  marks=await transaction('readonly',(store,done)=>{const request=store.getAll();request.onsuccess=()=>done(request.result);});canPersist=true;renderWall();
 }catch{canPersist=false;status.textContent=t('signStorage','Storage is unavailable. Your drawing is still on the page.');}
}
save.addEventListener('click',async()=>{
 if(!strokes.length||saving)return;
 saving=true;active=null;update();
 const mark={id:crypto.randomUUID(),ink,strokes:structuredClone(strokes),createdAt:new Date().toISOString()};
 try{
  if(canPersist)await transaction('readwrite',store=>store.put(mark));
  marks.push(mark);strokes=[];renderWall();status.textContent=canPersist?t('signSaved','Saved on this browser. Maltiox!'):t('signStorage','Storage is unavailable. Your drawing is still on the page.');
 }catch{status.textContent=t('signStorage','Storage is unavailable. Your drawing is still on the page.');}
 finally{saving=false;update();}
});
document.addEventListener('ben-language',()=>{renderWall();status.textContent='';});
init();resize();
