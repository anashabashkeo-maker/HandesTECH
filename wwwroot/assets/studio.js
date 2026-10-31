(() => {
 const main=document.querySelector('main');
 document.querySelector('#course-list').insertAdjacentHTML('afterend','<div class="more-wrap"><button class="button secondary" id="show-more">Show more courses ↓</button></div>');
 const more=document.querySelector('#show-more');
 function updateMore(){const count=filteredCourses().length;more.hidden=count<=visibleLimit;more.textContent='Show more courses ('+Math.max(0,count-visibleLimit)+' more) ↓';}
 more.addEventListener('click',()=>{visibleLimit+=9;render();});document.addEventListener('catalog:render',updateMore);updateMore();
 const panels={learn:['courses','training','paths'],studio:['services','portfolio'],about:['about','method']};
 Object.entries(panels).forEach(([key,ids])=>{const panel=document.createElement('div');panel.id='workspace-'+key;panel.className='workspace-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','view-'+key);panel.hidden=key!=='learn';document.querySelector('.workspace-nav').after(panel);ids.forEach(id=>panel.append(document.getElementById(id)));});
 const lab=document.createElement('div');lab.id='workspace-ai';lab.className='workspace-panel';lab.hidden=true;lab.setAttribute('role','tabpanel');lab.setAttribute('aria-labelledby','view-ai');
 lab.innerHTML=`<section id="ai-lab" class="wrap studio-lab"><div class="lab-heading"><div><p class="eyebrow">THE CONNECTED ENGINEER</p><h2>Your discipline.<br>A smarter workflow.</h2></div><p>Explore how Revit data, AI-assisted code and engineering judgement work together.</p></div><div class="lab-layout"><img class="lab-photo" id="lab-photo" src="assets/power.jpg" alt="Electrical power infrastructure"><div class="lab-copy"><div class="lab-selector" aria-label="AI workflow discipline">${courses.filter(c=>c.ai).map((c,i)=>`<button data-lab="${c.id}" aria-pressed="${i===0}">${escapeHTML(c.category)}</button>`).join('')}</div><p class="eyebrow">REVIT + AI / PRACTICAL LAB</p><h3 id="lab-title"></h3><p id="lab-outcome"></p><div class="flow-chart" aria-label="Revit model data flows to AI-assisted automation, followed by engineer review"><div><b>01</b><span>Revit data</span></div><i>→</i><div><b>02</b><span>AI + scripts</span></div><i>→</i><div><b>03</b><span>Engineer review</span></div></div><button class="button" id="lab-open">Explore this course ↗</button></div></div><p class="lab-footnote">Illustrated learning workflow. AI assists scripts and reviews; engineering calculations and model changes remain subject to qualified review.</p><h3 style="margin-top:40px">One academy. Eight connected disciplines.</h3><div class="catalog-chart" aria-label="Course distribution by discipline"></div><div class="chart-legend"></div></section>`;
 document.querySelector('.workspace-nav').after(lab);
 const colors=['#245344','#40816a','#7ea680','#a7c991','#547c7b','#8a9b65','#4e757b','#b6c7a1'];
 Object.entries(subjectPhotos).forEach(([cat],i)=>{const n=courses.filter(c=>c.category===cat).length;document.querySelector('.catalog-chart').insertAdjacentHTML('beforeend',`<button style="--count:${n};--bar:${colors[i]}" data-chart="${cat}" aria-label="${cat}: ${n} courses" title="${cat}: ${n} courses"></button>`);document.querySelector('.chart-legend').insertAdjacentHTML('beforeend',`<button data-chart="${cat}"><i style="--bar:${colors[i]}"></i>${cat} · ${n}</button>`);});
 const viewTabs=[...document.querySelectorAll('[data-view]')];
 function showView(key,scroll=false){viewTabs.forEach(t=>{const active=t.dataset.view===key;t.setAttribute('aria-selected',active);t.tabIndex=active?0:-1;document.getElementById('workspace-'+t.dataset.view).hidden=!active;});if(scroll)document.querySelector('.workspace-nav').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 wireTabs(viewTabs,t=>showView(t.dataset.view));
 function route(hash,scroll=true){const target=hash.slice(1);const key=target==='ai-lab'?'ai':Object.keys(panels).find(k=>panels[k].includes(target));if(key)showView(key,scroll);}
 document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(link)route(link.getAttribute('href'),false);const chart=e.target.closest('[data-chart]');if(chart){aiOnly=false;document.querySelector('#ai-only').setAttribute('aria-pressed','false');selectTab(tabs.find(t=>t.dataset.tab===chart.dataset.chart));showView('learn',true);}if(e.target.closest('[data-format-link]'))showView('learn',true);});
 addEventListener('hashchange',()=>route(location.hash,false));route(location.hash,false);
 function chooseLab(id){const c=courses.find(c=>c.id===id);document.querySelector('#lab-title').textContent=c.title;document.querySelector('#lab-outcome').textContent=c.description;document.querySelector('#lab-photo').src='assets/'+c.photo+'.jpg';document.querySelector('#lab-photo').alt=c.category+' subject photograph';document.querySelector('#lab-open').dataset.open=id;document.querySelectorAll('[data-lab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lab===id));}
 document.querySelectorAll('[data-lab]').forEach(b=>b.addEventListener('click',()=>chooseLab(b.dataset.lab)));chooseLab('course-45');
 document.querySelector('.catalog-controls').insertAdjacentHTML('beforebegin','<div class="course-tools"><button id="ai-only" aria-pressed="false">✦ Revit + AI only</button><span class="sr-only">Filter the catalogue to AI courses</span></div>');
 document.querySelector('#ai-only').addEventListener('click',e=>{aiOnly=!aiOnly;e.currentTarget.setAttribute('aria-pressed',aiOnly);render();});
 ['reset-filters','empty-reset'].forEach(id=>document.getElementById(id).addEventListener('click',()=>{aiOnly=false;document.querySelector('#ai-only').setAttribute('aria-pressed','false');render();}));
 document.addEventListener('catalog:render',()=>{if(aiOnly)document.querySelector('#reset-filters').hidden=false;});
 const video=document.querySelector('#engineering-video'),toggle=document.querySelector('#video-toggle'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function sync(){toggle.textContent=video.paused?'Play motion ▷':'Pause motion Ⅱ';toggle.setAttribute('aria-label',video.paused?'Play background video':'Pause background video');}
 async function play(){try{await video.play();}catch{}sync();}
 toggle.addEventListener('click',()=>video.paused?play():video.pause());video.addEventListener('play',sync);video.addEventListener('pause',sync);
 reduced.addEventListener('change',()=>{if(reduced.matches)video.pause();});
 if(!reduced.matches&&!navigator.connection?.saveData)play();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
})();

