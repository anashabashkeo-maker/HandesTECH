(()=>{
 const originalTitle=document.title;const originals=new WeakMap(),attributeOriginals=new WeakMap();let dictionary={},matcher,language='en',pending=false;
 try{language=localStorage.getItem('handestech-language')==='ar'?'ar':'en';}catch{}
 const switcher=document.createElement('button');switcher.type='button';switcher.className='language-switch';switcher.setAttribute('data-language-control','');document.querySelector('.nav').insertBefore(switcher,document.querySelector('.menu-toggle'));
 switcher.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg><span class="language-track"><span class="language-thumb"></span><span class="language-option language-en">EN</span><span class="language-option language-ar">عربي</span></span>';
 document.querySelectorAll('.combined-brand').forEach(brand=>{brand.querySelector('img').classList.add('brand-en');const ar=document.createElement('img');ar.src='assets/wordmark-ar.svg?v=9';ar.alt='هندستك — لكل مهندس';ar.width=460;ar.height=105;ar.className='brand-ar';brand.append(ar);});
 function translate(value){if(language!=='ar')return value;return value.replace(matcher,match=>dictionary[match.toLowerCase()]||match);}
 function convertNode(node){const current=node.nodeValue;let saved=originals.get(node);if(!saved||current!==saved.rendered)saved={original:current};const rendered=translate(saved.original);if(current!==rendered)node.nodeValue=rendered;saved.rendered=rendered;originals.set(node,saved);}
 const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;apply();});}});
 function apply(){if(!matcher)return;observer.disconnect();document.title=translate(originalTitle);document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('script,style,svg,[data-language-control],[data-user-content]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});let node;while(node=walker.nextNode())convertNode(node);
  document.querySelectorAll('[aria-label],[placeholder],[alt]').forEach(el=>{if(el===switcher)return;let saved=attributeOriginals.get(el)||{};for(const attr of ['aria-label','placeholder','alt']){if(!el.hasAttribute(attr))continue;const value=el.getAttribute(attr);let item=saved[attr];if(!item||value!==item.rendered)item={original:value};item.rendered=translate(item.original);if(value!==item.rendered)el.setAttribute(attr,item.rendered);saved[attr]=item;}attributeOriginals.set(el,saved);});
  switcher.dataset.activeLanguage=language;switcher.lang=language==='ar'?'en':'ar';switcher.setAttribute('aria-label',language==='ar'?'Switch to English':'التبديل إلى العربية');
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','alt']});
 }
 window.HandesLanguage={translate,originalText:el=>[...el.childNodes].map(n=>originals.get(n)?.original||n.textContent).join('')};
 let switching=false;
 switcher.addEventListener('click',async()=>{
  if(switching||!matcher)return;switching=true;switcher.disabled=true;
  const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motion-paused');
  const anchor=[...document.querySelectorAll('main section[id],main h1,main .stage')].find(el=>{const box=el.getBoundingClientRect();return box.bottom>120&&box.top<innerHeight;});const before=anchor?.getBoundingClientRect().top;
  function change(){language=language==='ar'?'en':'ar';try{localStorage.setItem('handestech-language',language);}catch{}apply();if(anchor&&before!==undefined)window.scrollBy({top:anchor.getBoundingClientRect().top-before,behavior:'instant'});}
  try{if(!reduced&&document.startViewTransition){const transition=document.startViewTransition(change);await transition.finished;}else if(!reduced){const main=document.querySelector('main');await main.animate([{opacity:1},{opacity:.2}],{duration:110,easing:'ease-out',fill:'forwards'}).finished;change();main.getAnimations().forEach(a=>a.cancel());await main.animate([{opacity:.2,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:270,easing:'ease-out'}).finished;}else change();}finally{switching=false;switcher.disabled=false;}
 });
 fetch('assets/ar.json?v=16').then(r=>{if(!r.ok)throw Error('language data');return r.json();}).then(data=>{dictionary=Object.fromEntries(Object.entries(data).map(([k,v])=>[k.toLowerCase(),v]));const keys=Object.keys(dictionary).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));matcher=new RegExp('(?<![A-Za-z])(?:'+keys.join('|')+')(?![A-Za-z])','gi');apply();}).catch(()=>{switcher.textContent='Language unavailable';switcher.disabled=true;});
})();
