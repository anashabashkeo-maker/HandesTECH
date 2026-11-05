(async()=>{


 const {request,esc}=Academy,$=s=>document.querySelector(s);let data,tab='courses',selected=null,dirty=false,statusData,formDirty=false,applicationIds=[];


 const say=s=>$('#status').textContent=s;
 if(!(await window.HandesAcademyRuntime.ready).enabled){$('#login').innerHTML='<h2>Administrator access needs the application server.</h2><p>This is the read-only website preview. Use your hosted HandesTECH administration address, or open the Visual Studio project locally.</p>';return;}


 function changed(){dirty=true;$('#dirty').textContent='Unsaved changes — select Save changes to publish';}


 function options(items,value,label='name'){return items.map(x=>`<option value="${esc(x.id)}" ${x.id===value?'selected':''}>${esc(x[label])}</option>`).join('');}


 const id=prefix=>prefix+'-'+crypto.randomUUID().slice(0,8);


 const discipline=()=>$('#discipline').value;


 const paths=()=>data.paths.filter(p=>p.disciplineId===discipline());


 function bindForm(fn){const form=$('#edit-form');formDirty=false;form.onsubmit=e=>{e.preventDefault();try{fn(new FormData(e.target));formDirty=false;changed();render();say('Updated draft. Save changes to publish.');}catch(err){say(err.message);}};}


 function leaveForm(){if(!formDirty)return true;const form=$('#edit-form');if(!form.reportValidity())return false;form.requestSubmit();return !formDirty;}


 function field(name,title,value='',type='text'){return `<label>${title}<input name="${name}" type="${type}" value="${esc(value)}" required maxlength="${name==='scope'?2000:200}"></label>`;}


 function pathSelect(value){return `<label>Learning path<select name="pathId">${options(paths(),value)}</select></label>`;}


 function listEditor(items,label,body){$('#editor-area').innerHTML=`<div class="two"><section class="card"><div class="toolbar"><h2>${label}</h2><button id="add" class="secondary">Add new</button></div><div class="list">${items.map(x=>`<button type="button" data-item="${esc(x.id)}" aria-current="${selected===x.id}">${esc(x.title||x.name||x.prompt)}${x.parentId?'<br><small>Subcourse</small>':''}${x.reviewed===false?'<br><small>Draft · not used in assessments</small>':''}</button>`).join('')||'<p class="empty">No items yet.</p>'}</div></section><section class="card">${body}</section></div>`;


  document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{if(!leaveForm())return;selected=b.dataset.item;render();});$('#add').onclick=()=>{if(!leaveForm())return;selected=null;render(true);};}


 function bankTools(){const tools=document.createElement('div');tools.className='toolbar bank-tools';tools.innerHTML='<button id="export-bank" class="secondary">Export private question bank</button><label class="action secondary">Import question bank<input id="import-bank" type="file" accept="application/json,.json" hidden></label>';$('#editor-area').prepend(tools);$('#export-bank').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data.questions,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='HandesTECH-private-question-bank.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('#import-bank').onchange=async e=>{try{if(!leaveForm())return;const file=e.target.files[0];if(!file)return;const items=JSON.parse(await file.text());if(!Array.isArray(items)||items.length>10000)throw Error('Choose a JSON array containing up to 10,000 questions.');const knownPaths=new Set(data.paths.map(p=>p.id));if(items.some(q=>!q||!knownPaths.has(q.pathId)||!Array.isArray(q.options)))throw Error('Every imported question must match an existing path and include its options.');for(const q of items){const i=data.questions.findIndex(old=>old.id===q.id);const draft={...q,reviewed:false};if(i<0)data.questions.push(draft);else data.questions[i]=draft;data.assessmentModes[q.disciplineId]='coming-soon';}changed();render();say('Imported '+items.length+' draft questions. Review them before enabling assessments.');}catch(error){say(error.message);}};}


 function render(newItem=false){


  if(tab==='assessments'){renderAssessments();return;}


  const kind=tab==='paths'?'paths':tab==='questions'?'questions':'courses',items=data[kind].filter(x=>x.disciplineId===discipline()),current=items.find(x=>x.id===selected);


  if(!current&&!newItem&&items.length){selected=items[0].id;render();return;}


  if(kind==='paths'){


   const p=current||{name:'',published:true};


   listEditor(items,'Paths',`<h2>${current?'Edit path':'Add path'}</h2><form id="edit-form">${field('name','Path name',p.name)}<label>Path type<select name="kind">${['design','bim','ai'].map(k=>`<option value="${k}" ${k===(p.kind||'design')?'selected':''}>${({design:'Design',bim:'BIM',ai:'AI integration'})[k]}</option>`).join('')}</select></label><label class="check"><input type="checkbox" name="published" ${p.published?'checked':''}>Published</label><button>Apply to draft</button> ${current?'<button type="button" id="delete" class="danger">Delete path</button>':''}</form><p class="muted">Deleting a path also removes its courses, subcourses and questions from the draft. Its discipline assessment returns to Coming soon.</p>`);


   bindForm(f=>{const value={id:current?.id||id(discipline()),disciplineId:discipline(),name:f.get('name').trim(),kind:f.get('kind'),published:f.has('published')};if(current)data.paths[data.paths.indexOf(current)]=value;else data.paths.push(value);selected=value.id;data.assessmentModes[discipline()]='coming-soon';});


   if(current)$('#delete').onclick=()=>{const count=data.courses.filter(c=>c.pathId===current.id).length,q=data.questions.filter(q=>q.pathId===current.id).length;if(confirm(`Delete “${current.name}”, ${count} courses and ${q} questions from the draft? Save changes will publish this deletion.`)){data.paths=data.paths.filter(x=>x.id!==current.id);data.courses=data.courses.filter(x=>x.pathId!==current.id);data.questions=data.questions.filter(x=>x.pathId!==current.id);data.assessmentModes[discipline()]='coming-soon';selected=null;changed();render();}};


  }else if(kind==='courses'){


   if(!paths().length){$('#editor-area').innerHTML='<p class="card">Add a learning path first.</p>';return;}


   const c=current||{title:'',pathId:paths()[0].id,level:'Beginner',scope:'',topics:[],applications:[],published:true};


   const parentChoices=()=>data.courses.filter(x=>x.pathId===c.pathId&&x.id!==current?.id);


   listEditor(items,'Courses',`<h2>${current?'Edit course':'Add course'}</h2><form id="edit-form">${field('title','Course title',c.title)}${pathSelect(c.pathId)}<label>Parent course (optional)<select name="parentId"><option value="">Top-level course</option>${options(parentChoices(),c.parentId,'title')}</select></label><label>Level<select name="level">${['Beginner','Intermediate','Advanced','Professional'].map(x=>`<option ${x===c.level?'selected':''}>${x}</option>`).join('')}</select></label>${field('scope','Summary',c.scope)}<label>Syllabus topics — one per line<textarea name="topics" rows="5" required>${esc(c.topics.join('\n'))}</textarea></label><label>Application knowledge — one program per line<textarea name="applications" rows="4" placeholder="revit | What the participant will learn">${esc(c.applications.map(a=>a.id+' | '+a.skill).join('\n'))}</textarea></label><p class="muted">Available application IDs: ${esc(applicationIds.join(', '))}</p><label class="check"><input type="checkbox" name="published" ${c.published?'checked':''}>Published</label><button>Apply to draft</button> ${current?'<button type="button" id="delete" class="danger">Delete course</button>':''}</form><p class="muted">An unpublished parent also hides its subcourses. Existing application previews are preserved. Moving a course with children requires moving its children and linked questions into the same path before saving.</p>`);


   $('#edit-form [name=pathId]').onchange=e=>{const select=$('#edit-form [name=parentId]');select.innerHTML='<option value="">Top-level course</option>'+options(data.courses.filter(x=>x.pathId===e.target.value&&x.id!==current?.id),'','title');};


   bindForm(f=>{const value={...c,id:current?.id||id(discipline()+'-course'),disciplineId:discipline(),title:f.get('title').trim(),pathId:f.get('pathId'),parentId:f.get('parentId')||null,level:f.get('level'),scope:f.get('scope').trim(),topics:f.get('topics').split('\n').map(t=>t.trim()).filter(Boolean),applications:f.get('applications').split('\n').map(t=>t.trim()).filter(Boolean).map(line=>{const split=line.indexOf('|');if(split<1)throw Error('Use program-id | learning outcome for each application.');const id=line.slice(0,split).trim(),skill=line.slice(split+1).trim();if(!applicationIds.includes(id)||!skill)throw Error('Choose an available application ID and write its learning outcome.');return {id,skill};}),published:f.has('published')};if(current)data.courses[data.courses.indexOf(current)]=value;else data.courses.push(value);selected=value.id;});


   if(current)$('#delete').onclick=()=>{const ids=new Set([current.id]);let before;do{before=ids.size;data.courses.filter(x=>ids.has(x.parentId)).forEach(x=>ids.add(x.id));}while(before!==ids.size);if(confirm(`Delete “${current.title}” and its descendants (${ids.size} courses total) from the draft?`)){data.courses=data.courses.filter(x=>!ids.has(x.id));data.questions=data.questions.map(q=>({...q,courseIds:q.courseIds.filter(x=>!ids.has(x))}));selected=null;changed();render();}};


  }else{


   if(!paths().length){$('#editor-area').innerHTML='<p class="card">Add a path first.</p>';return;}


   const q=current||{pathId:paths()[0].id,difficulty:'easy',prompt:'',options:['','','',''],correctIndex:0,explanation:'',courseIds:[],reviewed:false};


   listEditor(items,'Question bank',`<h2>${current?'Edit question':'Add question'}</h2><p class="notice">Draft questions must be reviewed by a subject expert before use. Every path needs at least two reviewed questions at each difficulty. A larger bank gives more variation between attempts.</p><form id="edit-form">${pathSelect(q.pathId)}<label>Focus topic<input name="topic" value="${esc(q.topic||'')}" maxlength="180" placeholder="For example: Voltage drop"></label><label>Difficulty<select name="difficulty">${['easy','medium','hard'].map(x=>`<option ${x===q.difficulty?'selected':''}>${x}</option>`).join('')}</select></label><label>Question<textarea name="prompt" rows="4" maxlength="3000" required>${esc(q.prompt)}</textarea></label><fieldset><legend>Options — select the correct answer</legend>${q.options.map((o,i)=>`<label class="check"><input type="radio" name="correctIndex" value="${i}" ${q.correctIndex===i?'checked':''} required><span>Answer ${i+1}</span></label><input name="option${i}" value="${esc(o)}" aria-label="Answer ${i+1} text" maxlength="1000" required>`).join('')}</fieldset><label>Explanation<textarea name="explanation" rows="3" maxlength="3000" required>${esc(q.explanation)}</textarea></label><label>Related course outlines<select name="courseIds" multiple size="5">${data.courses.filter(c=>c.pathId===q.pathId).map(c=>`<option value="${esc(c.id)}" ${q.courseIds.includes(c.id)?'selected':''}>${esc(c.title)}</option>`).join('')}</select></label><label class="check"><input type="checkbox" name="reviewed" ${q.reviewed?'checked':''}>Reviewed and approved for assessment</label><button>Apply to draft</button> ${current?'<button type="button" id="delete" class="danger">Delete question</button>':''}</form>`);


   $('#edit-form [name=pathId]').onchange=e=>{$('#edit-form [name=courseIds]').innerHTML=options(data.courses.filter(c=>c.pathId===e.target.value),'','title');};


   bindForm(f=>{const value={id:current?.id||id(discipline()+'-q'),disciplineId:discipline(),pathId:f.get('pathId'),difficulty:f.get('difficulty'),prompt:f.get('prompt').trim(),topic:f.get('topic').trim()||null,options:q.options.map((_,i)=>f.get('option'+i).trim()),correctIndex:Number(f.get('correctIndex')),explanation:f.get('explanation').trim(),courseIds:f.getAll('courseIds'),reviewed:f.has('reviewed')};if(current)data.questions[data.questions.indexOf(current)]=value;else data.questions.push(value);selected=value.id;data.assessmentModes[discipline()]='coming-soon';});


   bankTools();


   if(current)$('#delete').onclick=()=>{if(confirm('Delete this question from the draft?')){data.questions=data.questions.filter(x=>x.id!==current.id);data.assessmentModes[discipline()]='coming-soon';selected=null;changed();render();}};


  }


 }


 function renderAssessments(){


  const mode=data.assessmentModes[discipline()]||'coming-soon',reports=statusData?.reports.filter(r=>r.disciplineId===discipline())||[];


  $('#editor-area').innerHTML=`<section class="card"><h2>Assessment availability</h2><label>Visitor access<select id="mode"><option value="hidden" ${mode==='hidden'?'selected':''}>Hidden</option><option value="coming-soon" ${mode==='coming-soon'?'selected':''}>Coming soon</option><option value="enabled" ${mode==='enabled'?'selected':''}>Enabled</option></select></label><p class="muted">Changing paths or questions returns the discipline to Coming soon for review. Existing attempts use a snapshot of their question bank.</p><h3>Question coverage</h3>${paths().map(p=>`<p><b>${esc(p.name)}</b> ${p.published?'':'(unpublished)'}<br>${['easy','medium','hard'].map(t=>`${t}: ${data.questions.filter(q=>q.pathId===p.id&&q.difficulty===t&&q.reviewed).length} reviewed`).join(' · ')}</p>`).join('')}</section><section class="card"><h2>Delivery & verification</h2><p>Email: ${statusData?.emailConfigured&&statusData?.recipientConfigured?'Configured':'Setup required'} · Bot protection: ${statusData?.botConfigured?'Configured':statusData?.localTesting?'Local test mode':'Setup required'}</p><p>Report recipient: <strong>${esc(statusData?.recipient||'Not configured')}</strong></p><p class="muted">Enabled assessments appear Coming soon publicly until email and bot protection are configured. Check the setup guide in the project’s docs folder.</p></section><section class="card"><div class="toolbar"><h2>Latest reports</h2><button id="refresh-reports" class="secondary">Refresh delivery status</button></div>${reports.map(r=>`<div class="report-row"><strong>${esc(r.email)}</strong> · ${esc(new Date(r.createdAt).toLocaleString())}<br><small>${esc(r.id)}</small><p>${r.paths.map(p=>esc(p.name)+': '+p.score+'%').join(' · ')}</p><span class="pill">${esc(r.delivery)}</span> ${r.delivery==='failed'?`<button data-retry="${esc(r.id)}" class="secondary">Retry email</button>`:''}<details><summary>View learning advice</summary>${r.paths.map(p=>`<p><b>${esc(p.name)}</b> — ${esc(p.advice)}<br>${p.courses.map(c=>esc(c.title)).join(' · ')}</p>`).join('')}</details></div>`).join('')||'<p>No reports yet.</p>'}</section>`;


  $('#mode').onchange=e=>{data.assessmentModes[discipline()]=e.target.value;changed();};


  $('#refresh-reports').onclick=async()=>{try{statusData=await request('/api/admin/status');renderAssessments();}catch(err){say(err.message);}};


  document.querySelectorAll('[data-retry]').forEach(b=>b.onclick=async()=>{try{await request('/api/admin/reports/'+b.dataset.retry+'/retry','POST');say('Report queued for retry.');statusData=await request('/api/admin/status');renderAssessments();}catch(err){say(err.message);}});


 }


 async function load(){


  data=await request('/api/admin/catalog');statusData=await request('/api/admin/status');applicationIds=await request('/api/admin/applications');dirty=false;formDirty=false;$('#dirty').textContent='All changes saved';$('#discipline').innerHTML=options(data.disciplines,discipline());$('#login').hidden=true;$('#workspace').hidden=false;$('#logout').hidden=false;selected=null;render();


 }


 $('#login-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{await request('/api/admin/login','POST',{password:$('#password').value});$('#password').value='';await Academy.refresh();await load();say('Signed in.');}catch(err){say(err.message);}finally{b.disabled=false;}};


 $('#save').onclick=async()=>{if(!leaveForm())return;try{$('#save').disabled=true;data=await request('/api/admin/catalog','PUT',data);dirty=false;$('#dirty').textContent='All changes saved';statusData=await request('/api/admin/status');render();say('Changes saved.');}catch(err){say(err.message);}finally{$('#save').disabled=false;}};


 $('#reload').onclick=async()=>{if((dirty||formDirty)&&!confirm('Discard unsaved draft changes and reload?'))return;try{await load();say('Loaded saved version.');}catch(err){say(err.message);}};


 $('#logout').onclick=async()=>{if((dirty||formDirty)&&!confirm('Sign out and discard unsaved changes?'))return;try{await request('/api/admin/logout','POST');dirty=false;location.reload();}catch(err){say(err.message);}};


 let previousDiscipline='';$('#discipline').onfocus=()=>previousDiscipline=discipline();$('#discipline').onchange=()=>{if(!leaveForm()){if(previousDiscipline)$('#discipline').value=previousDiscipline;return;}previousDiscipline=discipline();selected=null;render();};


 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{if(!leaveForm())return;tab=b.dataset.tab;selected=null;document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));render();});


 // Form values are explicitly applied to the local draft before selecting another item.


 document.addEventListener('input',e=>{if(e.target.closest('#edit-form')){formDirty=true;say('Select “Apply to draft” before switching items, then Save changes to publish.');}});


 addEventListener('beforeunload',e=>{if(dirty||formDirty){e.preventDefault();e.returnValue='';}});


 try{const setup=await request('/api/admin/setup');if(setup.canSetup){$('#login').innerHTML='<h2>Create your administrator account</h2><p>This first-run setup is available only on this computer.</p><form id="setup-form"><label>New password<input id="setup-password" type="password" minlength="16" maxlength="256" autocomplete="new-password" required></label><label>Confirm password<input id="setup-confirm" type="password" minlength="16" maxlength="256" autocomplete="new-password" required></label><button>Create administrator</button></form>';$('#setup-form').onsubmit=async e=>{e.preventDefault();if($('#setup-password').value!==$('#setup-confirm').value){say('The passwords do not match.');return;}try{await request('/api/admin/setup','POST',{password:$('#setup-password').value});location.reload();}catch(error){say(error.message);}};}else{await load();}}catch(err){if(err.status!==401)say(err.message);}


})();


