const t=(key,fallback)=>globalThis.benLocale?.messages?.[key]||fallback;
const money=cents=>new Intl.NumberFormat(globalThis.benLocale?.language==='cak'?'es':globalThis.benLocale?.language||'en',{style:'currency',currency:'USD'}).format(cents/100);
const dialog=document.createElement('dialog');dialog.className='shop-dialog product-dialog';dialog.setAttribute('aria-label','BEN CARRILLO · Merch');document.body.append(dialog);
let products=[],cart=[],view='product',selected=null,size='',payment='',shippingData={},billingData={},sameBilling=true;
const states={'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California','CO':'Colorado','CT':'Connecticut','DE':'Delaware','DC':'District of Columbia','FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland','MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri','MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont','VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming'};
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
function button(label,fn,cls=''){const el=node('button',cls,label);el.type='button';el.addEventListener('click',fn);return el;}
function image(product){const el=node('img');el.src=`assets/images/merch/${product.shape}.svg`;el.alt=product.name;el.width=300;el.height=300;return el;}
const productFor=id=>products.find(p=>p.id===id);
const count=()=>cart.reduce((n,item)=>n+item.quantity,0);
const subtotal=()=>cart.reduce((n,item)=>n+Math.round(productFor(item.id).price*100)*item.quantity,0);
function persist(){try{localStorage.setItem('ben-bag-v1',JSON.stringify(cart));}catch{}updateCount();}
function updateCount(){document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=count());}
function show(next,product){view=next;if(product){selected=product;size='';}render();if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
function close(){dialog.close();}
function preview(){return node('p','shop-preview',t('shopPreview','Preview collection · US shipping only · Payments not active.'));}
function status(text){let el=dialog.querySelector('.shop-status');if(!el){el=node('p','shop-status');el.setAttribute('role','status');dialog.querySelector('.shop-form,.shop-product-controls,.shop-cart')?.append(el);}el.textContent=text;}
function render(){
 dialog.replaceChildren();dialog.dir=document.documentElement.dir;
 const header=node('div','shop-header');
 const back=button('‹',()=>view==='checkout'?show('cart'):view==='cart'&&selected?show('product'):close(), 'shop-back');back.setAttribute('aria-label',t('shopBack','Back'));
 header.append(back,button(`${t('shopBag','Bag')} (${count()})`,()=>show('cart'),'shop-cart-toggle'));dialog.append(header);
 const body=node('div','shop-body');dialog.append(body);
 if(view==='product'&&selected)renderProduct(body);
 else if(view==='checkout'&&cart.length)renderCheckout(body);
 else renderCart(body);
}
function renderProduct(body){
 const wrap=node('div','shop-product'),visual=node('div','shop-product-image');visual.append(image(selected));wrap.append(visual,node('h2','shop-product-code',selected.id),node('p','shop-price',money(Math.round(selected.price*100))));
 const controls=node('div','shop-product-controls'),plus=button('+',()=>{choices.hidden=false;plus.hidden=true;choices.querySelector('button')?.focus();},'shop-plus');plus.setAttribute('aria-label',t('shopChoose','Select size'));
 const choices=node('div');choices.hidden=!size;
 const label=node('p','',t('shopChoose','Select size')),sizes=node('div','shop-sizes');sizes.setAttribute('role','group');sizes.setAttribute('aria-label',t('shopChoose','Select size'));
 const add=button(t('shopAdd','Add to bag'),()=>{
  if(!selected.sizes.includes(size))return;
  const existing=cart.find(item=>item.id===selected.id&&item.size===size);
  if(existing)existing.quantity=Math.min(10,existing.quantity+1);else cart.push({id:selected.id,size,quantity:1});
  persist();show('cart');
 },'shop-primary');add.disabled=!size;
 for(const value of selected.sizes){const option=button(value,()=>{size=value;sizes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===size)));add.disabled=false;});option.setAttribute('aria-pressed',String(size===value));sizes.append(option);}
 choices.append(label,sizes,add);controls.append(plus,choices);
 if(size)plus.hidden=true;
 const info=node('details','shop-info');info.append(node('summary','',t('shopInfo','Information')),node('p','',t('shopProductInfo','Concept garment. Images, sizes and prices are provisional. Final materials and measurements will be added before sale.')));
 controls.append(info,preview());wrap.append(controls);body.append(wrap);
}
function quantity(item,delta){item.quantity=Math.max(0,Math.min(10,item.quantity+delta));cart=cart.filter(x=>x.quantity);persist();if(!cart.length&&view==='checkout')view='cart';render();}
function cartItem(item,editable=true){
 const product=productFor(item.id),row=node('div','shop-cart-item'),description=node('div'),right=node('div');
 description.append(node('p','',product.id),node('p','',`${t('shopSize','Size')}: ${item.size}`));
 if(editable)description.append(button(t('shopRemove','Remove'),()=>quantity(item,-item.quantity),'shop-remove'));
 right.append(node('p','',money(Math.round(product.price*100)*item.quantity)));
 const qty=node('div','shop-qty'),minus=button('−',()=>quantity(item,-1)),plus=button('+',()=>quantity(item,1));minus.setAttribute('aria-label',`${t('shopLess','Decrease quantity')}: ${product.id}`);plus.setAttribute('aria-label',`${t('shopMore','Increase quantity')}: ${product.id}`);plus.disabled=item.quantity>=10;
 qty.append(minus,node('span','',String(item.quantity)),plus);right.append(qty);row.append(image(product),description,right);return row;
}
function totalRow(label,value,cls=''){const row=node('div','shop-row '+cls);row.append(node('span','',label),node('span','',value));return row;}
function renderCart(body){
 const wrap=node('div','shop-cart');wrap.append(node('h2','',t('shopBag','Bag')));
 if(!cart.length){const empty=node('div','shop-empty');empty.append(node('p','',t('shopEmpty','Your bag is empty.')),button(t('shopContinue','Continue browsing'),close,'shop-primary'));wrap.append(empty);body.append(wrap);return;}
 const items=node('div','shop-cart-items');cart.forEach(item=>items.append(cartItem(item)));wrap.append(items);
 const footer=node('div','shop-cart-footer');footer.append(totalRow(t('shopSubtotal','Subtotal'),money(subtotal())),node('p','shop-preview',t('shopCosts','Shipping and taxes calculated when checkout is connected.')),button(t('shopCheckout','Checkout'),()=>show('checkout'),'shop-primary'),preview());wrap.append(footer);body.append(wrap);
}
function field(parent,key,label,{type='text',required=true,autocomplete='',value='',pattern,maxLength}={}){
 const wrap=node('div'),id='shop-'+key,lab=node('label','',label),input=node('input');lab.htmlFor=id;input.id=id;input.name=key;input.type=type;input.required=required;input.autocomplete=autocomplete;input.value=value;if(pattern)input.pattern=pattern;if(maxLength)input.maxLength=maxLength;
 input.addEventListener('input',()=>{(key.startsWith('bill-')?billingData:shippingData)[key]=input.value;dialog.querySelector('.shop-review')?.remove();});wrap.append(lab,input);parent.append(wrap);return input;
}
function address(parent,prefix,data){
 const names=node('div','shop-two');field(names,prefix+'first',t('shopFirst','First name'),{autocomplete:prefix?'billing given-name':'shipping given-name',value:data[prefix+'first']||'',maxLength:80});field(names,prefix+'last',t('shopLast','Last name'),{autocomplete:prefix?'billing family-name':'shipping family-name',value:data[prefix+'last']||'',maxLength:80});parent.append(names);
 field(parent,prefix+'address',t('shopAddress','Address'),{autocomplete:prefix?'billing address-line1':'shipping address-line1',value:data[prefix+'address']||'',maxLength:150});
 field(parent,prefix+'apartment',t('shopApartment','Apartment / suite (optional)'),{required:false,autocomplete:prefix?'billing address-line2':'shipping address-line2',value:data[prefix+'apartment']||'',maxLength:80});
 const cityCountry=node('div','shop-two');field(cityCountry,prefix+'city',t('shopCity','City'),{autocomplete:prefix?'billing address-level2':'shipping address-level2',value:data[prefix+'city']||'',maxLength:80});
 const country=field(cityCountry,prefix+'country',t('shopCountry','Country'),{value:'United States',autocomplete:prefix?'billing country-name':'shipping country-name'});country.readOnly=true;country.dataset.countryCode='US';parent.append(cityCountry);
 const regionZip=node('div','shop-two'),stateWrap=node('div'),stateLabel=node('label','',t('shopState','State')),state=node('select');state.name=prefix+'state';state.id='shop-'+prefix+'state';state.required=true;state.autocomplete=prefix?'billing address-level1':'shipping address-level1';stateLabel.htmlFor=state.id;
 state.append(new Option(t('shopChooseState','Select a state'),' '));state.firstElementChild.value='';for(const [code,name]of Object.entries(states))state.append(new Option(name,code));state.value=data[prefix+'state']||'';state.addEventListener('change',()=>{data[prefix+'state']=state.value;dialog.querySelector('.shop-review')?.remove();});stateWrap.append(stateLabel,state);regionZip.append(stateWrap);
 field(regionZip,prefix+'zip',t('shopZip','ZIP code'),{autocomplete:prefix?'billing postal-code':'shipping postal-code',value:data[prefix+'zip']||'',pattern:'[0-9]{5}(-[0-9]{4})?',maxLength:10});parent.append(regionZip);
}
function renderCheckout(body){
 const wrap=node('div','shop-checkout'),form=node('form','shop-form'),summary=node('aside','shop-order-summary');form.id='shop-checkout-form';
 summary.append(node('h3','',t('shopSummary','Order summary')));cart.forEach(item=>summary.append(cartItem(item)));
 summary.append(totalRow(t('shopSubtotal','Subtotal'),money(subtotal())),totalRow(t('shopShipping','Shipping'),t('shopPending','Pending')),totalRow(t('shopTaxes','Taxes'),t('shopPending','Pending')),totalRow(t('shopItemsTotal','Items total'),money(subtotal()),'shop-summary-total'),node('p','shop-preview',t('shopCosts','Shipping and taxes calculated when checkout is connected.')));
 const express=node('fieldset');express.append(node('legend','',t('shopExpress','Express checkout')));
 const payments=node('div','shop-payments');
 for(const provider of ['PayPal','Google Pay']){const pay=button(provider,()=>{payment=provider;payments.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===provider)));status(t('shopPaymentOff','Payments are not active yet. No charge or order will be created.'));});pay.setAttribute('aria-pressed',String(payment===provider));payments.append(pay);}
 express.append(payments,node('p','shop-preview',t('shopPaymentOff','Payments are not active yet. No charge or order will be created.')));form.append(express);
 const contact=node('fieldset');contact.append(node('legend','',t('shopContact','Contact information')));field(contact,'email',t('emailLabel','Email address'),{type:'email',autocomplete:'email',value:shippingData.email||'',maxLength:254});
 const opt=node('label','shop-check'),optInput=node('input');optInput.type='checkbox';optInput.name='updates';optInput.checked=!!shippingData.updates;optInput.addEventListener('change',()=>shippingData.updates=optInput.checked);opt.append(optInput,document.createTextNode(t('shopUpdates','Send me news and updates (optional).')));contact.append(opt);form.append(contact);
 const shipping=node('fieldset');shipping.append(node('legend','',t('shopShippingAddress','Shipping address · United States only')));address(shipping,'',shippingData);field(shipping,'phone',t('shopPhone','Phone number (optional)'),{type:'tel',required:false,autocomplete:'tel',value:shippingData.phone||'',maxLength:30});form.append(shipping);
 const billing=node('fieldset');billing.append(node('legend','',t('shopBilling','Billing address')));
 const same=node('label','shop-check'),check=node('input');check.type='checkbox';check.checked=sameBilling;check.name='same-billing';same.append(check,document.createTextNode(t('shopSame','Use shipping address as billing address')));
 const billingFields=node('fieldset');billingFields.hidden=sameBilling;billingFields.disabled=sameBilling;address(billingFields,'bill-',billingData);check.addEventListener('change',()=>{sameBilling=check.checked;billingFields.hidden=sameBilling;billingFields.disabled=sameBilling;dialog.querySelector('.shop-review')?.remove();});billing.append(same,billingFields);form.append(billing);
 const paymentDetails=node('fieldset');paymentDetails.append(node('legend','',t('shopPaymentDetails','Payment details')),node('p','',t('shopPaymentInfo','PayPal and Google Pay will open their secure payment forms here when enabled.')));form.append(paymentDetails);
 const review=node('button','shop-primary',t('shopReview','Review order'));review.type='submit';
 const terms=node('details','shop-terms');terms.append(node('summary','',t('shopTerms','Shipping & returns')),node('p','',t('shopTermsInfo','US shipping only. Final delivery rates, returns policy and product details will be published before payments open.')));
 form.append(review,preview(),terms);
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!form.reportValidity())return;
  dialog.querySelector('.shop-review')?.remove();
  const reviewBox=node('div','shop-review');reviewBox.setAttribute('role','status');reviewBox.append(node('h3','',t('shopReview','Review order')),totalRow(t('shopItemsTotal','Items total'),money(subtotal())),node('p','',t('shopPaymentOff','Payments are not active yet. No charge or order will be created.')));
  const final=node('button','shop-primary',t('shopPayInactive','Payment coming soon'));final.type='button';final.disabled=true;reviewBox.append(final);review.after(reviewBox);reviewBox.scrollIntoView({block:'nearest',behavior:'smooth'});
 });
 wrap.append(form,summary);body.append(wrap);
}
dialog.addEventListener('close',()=>{shippingData={};billingData={};sameBilling=true;payment='';dialog.replaceChildren();});
document.querySelectorAll('[data-open-cart]').forEach(b=>b.addEventListener('click',()=>show('cart')));
document.addEventListener('ben-language',()=>{if(dialog.open)render();document.querySelectorAll('.product-card').forEach(card=>card.setAttribute('aria-label',`${t('shopView','View product')}: ${card.dataset.product}`));});
async function init(){
 const response=await fetch('content/merch.json');if(!response.ok)throw new Error('Merch data unavailable');const data=await response.json();products=data.products;
 try{const saved=JSON.parse(localStorage.getItem('ben-bag-v1')||'[]');if(Array.isArray(saved))for(const item of saved.slice(0,24)){const p=productFor(item.id);if(p&&p.sizes.includes(item.size)&&Number.isInteger(item.quantity)&&item.quantity>0&&item.quantity<=10&&!cart.some(x=>x.id===item.id&&x.size===item.size))cart.push({id:item.id,size:item.size,quantity:item.quantity});}}catch{}
 const grid=document.querySelector('#merch-grid');
 for(const product of products){const card=button('',()=>show('product',product),'product-card');card.dataset.product=product.id;card.dataset.category=product.category;card.setAttribute('aria-label',`${t('shopView','View product')}: ${product.id}`);const img=image(product);img.loading='lazy';card.append(img,node('span','',product.id),node('small','',`US$${product.price}`));grid.append(card);}
 persist();
}
init().catch(error=>{console.error(error);document.querySelector('#merch-grid').textContent=t('shopUnavailable','The collection is unavailable. Please try again later.');});
