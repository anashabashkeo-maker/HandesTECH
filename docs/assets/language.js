(()=>{
 const originalTitle=document.title;const originals=new WeakMap(),attributeOriginals=new WeakMap();let dictionary={},matcher,language='en',pending=false;
 try{language=localStorage.getItem('handestech-language')==='ar'?'ar':'en';}catch{}
 const switcher=document.createElement('button');switcher.type='button';switcher.className='language-switch';switcher.setAttribute('data-language-control','');document.querySelector('.nav').insertBefore(switcher,document.querySelector('.menu-toggle'));
 function translate(value){if(language!=='ar')return value;return value.replace(matcher,match=>dictionary[match.toLowerCase()]||match);}
 function convertNode(node){const current=node.nodeValue;let saved=originals.get(node);if(!saved||current!==saved.rendered)saved={original:current};const rendered=translate(saved.original);if(current!==rendered)node.nodeValue=rendered;saved.rendered=rendered;originals.set(node,saved);}
 const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;apply();});}});
 function apply(){if(!matcher)return;observer.disconnect();document.title=translate(originalTitle);document.documentElement.lang=language;document.documentElement.dir=language==='ar'?'rtl':'ltr';
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('script,style,svg,[data-language-control]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});let node;while(node=walker.nextNode())convertNode(node);
  document.querySelectorAll('[aria-label],[placeholder],[alt]').forEach(el=>{if(el===switcher)return;let saved=attributeOriginals.get(el)||{};for(const attr of ['aria-label','placeholder','alt']){if(!el.hasAttribute(attr))continue;const value=el.getAttribute(attr);let item=saved[attr];if(!item||value!==item.rendered)item={original:value};item.rendered=translate(item.original);if(value!==item.rendered)el.setAttribute(attr,item.rendered);saved[attr]=item;}attributeOriginals.set(el,saved);});
  switcher.dataset.activeLanguage=language;switcher.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg><span class="language-track"><span class="language-thumb"></span><span class="language-option language-en">EN</span><span class="language-option language-ar">عربي</span></span>';switcher.lang=language==='ar'?'en':'ar';switcher.setAttribute('aria-label',language==='ar'?'Switch to English':'التبديل إلى العربية');
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','alt']});
 }
 window.HandesLanguage={translate};
 switcher.addEventListener('click',()=>{language=language==='ar'?'en':'ar';try{localStorage.setItem('handestech-language',language);}catch{}apply();});
 fetch('assets/ar.json?v=3').then(r=>{if(!r.ok)throw Error('language data');return r.json();}).then(data=>{dictionary=Object.fromEntries(Object.entries(data).map(([k,v])=>[k.toLowerCase(),v]));const keys=Object.keys(dictionary).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));matcher=new RegExp('(?<![A-Za-z])(?:'+keys.join('|')+')(?![A-Za-z])','gi');apply();}).catch(()=>{switcher.textContent='Language unavailable';switcher.disabled=true;});
})();

