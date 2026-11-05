(async () => {
  const {request, esc} = Academy, root = document.querySelector('#assessment-content'), status = document.querySelector('#status');
  let catalog, discipline, challenge, exam, submitting = false;
  function say(s) { status.textContent = s; }
  function focusHeading() { const el = root.querySelector('h2'); if(el){el.tabIndex=-1;el.focus();} }
  try { catalog = await request('/api/catalog'); } catch { root.innerHTML = '<div class="card"><h2>Assessments are coming soon.</h2><p>The assessment service is not connected yet. Please return later.</p></div>'; return; }
  function choose() {
    const visible = catalog.assessments.filter(x => x.mode !== 'hidden');
    root.innerHTML = '<div class="grid">' + visible.map(x => { const d = catalog.disciplines.find(d => d.id === x.disciplineId), paths = catalog.paths.filter(p => p.disciplineId === d.id);
      return `<section class="card"><span class="pill">${x.mode === 'enabled' ? 'Available' : 'Coming soon'}</span><h2>${esc(d.name)}</h2><p>${paths.length} paths · ${paths.length * 6} questions</p><p>${paths.map(p => esc(p.name)).join(' · ')}</p><button data-start="${esc(d.id)}" ${x.mode !== 'enabled' ? 'disabled' : ''}>Find my starting point ↗</button></section>`;
    }).join('') + '</div>' + (!visible.length ? '<p class="empty">Assessments are not available yet.</p>' : '');
    root.querySelectorAll('[data-start]').forEach(b => b.onclick = () => { discipline = b.dataset.start; verifyScreen(); });
  }
  function verifyScreen() {
    root.innerHTML = `<section class="card"><h2>First, verify your email.</h2><p>We’ll send you a six-digit code to confirm that you can access this mailbox.</p><form id="email-form"><label>Email address<input id="email" type="email" autocomplete="email" maxlength="254" required></label><label class="check"><input id="consent" type="checkbox" required>I agree to share my email address and assessment results with the HandesTECH team at anas.habash98@gmail.com for learning guidance.</label><p class="muted">Your email and results are stored privately by HandesTECH. Contact anas.habash98@gmail.com to request their deletion.</p><div id="bot"></div><button id="send-code">Send verification code</button></form><form id="code-form" hidden><label>Verification code<input id="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required></label><p class="muted">The code expires in 10 minutes. You have five attempts.</p><button>Verify & begin</button><button type="button" class="secondary" id="resend">Use another email / resend</button></form></section>`;
    focusHeading();
    let widget;
    async function mount() {
      if (catalog.localTesting) { document.querySelector('#bot').textContent = 'Local development test mode'; return; }
      if (!catalog.turnstileSiteKey) { say('Bot verification is not configured yet.'); document.querySelector('#send-code').disabled = true; return; }
      if (!window.turnstile) await new Promise((resolve, reject) => { const script = document.createElement('script'); script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.onload=resolve; script.onerror=reject; document.head.append(script); });
      widget = turnstile.render('#bot', {sitekey: catalog.turnstileSiteKey, action: 'assessment'});
    }
    mount().catch(() => say('Bot verification could not load. Reload the page and try again.'));
    document.querySelector('#email-form').onsubmit = async e => {
      e.preventDefault(); const b = document.querySelector('#send-code'); b.disabled=true; say('Sending code…');
      try { const result = await request('/api/assessment/code', 'POST', { email: document.querySelector('#email').value.trim(), botToken: catalog.localTesting ? '' : turnstile.getResponse(widget) }); challenge = result.challengeId;
        e.target.hidden=true; document.querySelector('#code-form').hidden=false; document.querySelector('#code').focus(); say('Code sent. Check your inbox and spam folder.');
      } catch(err) { say(err.message); if(window.turnstile && widget !== undefined) turnstile.reset(widget); } finally { b.disabled=false; }
    };
    document.querySelector('#resend').onclick=()=>{ document.querySelector('#code-form').hidden=true; document.querySelector('#email-form').hidden=false; if(window.turnstile && widget !== undefined) turnstile.reset(widget); say('Wait at least one minute between code requests.'); };
    document.querySelector('#code-form').onsubmit = async e => {
      e.preventDefault(); const b=e.target.querySelector('button'); b.disabled=true;
      try { await request('/api/assessment/verify','POST',{challengeId:challenge,code:document.querySelector('#code').value}); exam=await request('/api/assessment/start','POST',{disciplineId:discipline}); renderExam(); say('Email verified. Your assessment is ready.'); }
      catch(err){say(err.message);} finally{b.disabled=false;}
    };
  }
  function renderExam(){
    root.innerHTML=`<form id="exam-form"><div class="progress"><strong id="progress">0 of ${exam.questions.length} answered</strong><span class="muted"> · Complete within two hours of email verification.</span></div><h2>${esc(catalog.disciplines.find(d=>d.id===discipline).name)} assessment</h2>${exam.questions.map((q,i)=>`<fieldset><legend>Question ${i+1} / ${exam.questions.length}</legend><p>${esc(q.prompt)}</p>${q.options.map((o,j)=>`<label class="answer"><input type="radio" name="${esc(q.id)}" value="${j}" required><span>${esc(o)}</span></label>`).join('')}</fieldset>`).join('')}<p class="muted">Submit when all questions are answered. Your result will be saved and a report queued for the HandesTECH team.</p><button id="submit-exam">See my learning plan ↗</button></form>`;
    focusHeading(); const form=document.querySelector('#exam-form');
    form.onchange=()=>{document.querySelector('#progress').textContent=`${form.querySelectorAll('input:checked').length} of ${exam.questions.length} answered`;};
    form.onsubmit=async e=>{e.preventDefault(); if(submitting)return; submitting=true; const b=document.querySelector('#submit-exam');b.disabled=true;say('Preparing your learning plan…');
      try{const fd=new FormData(form),report=await request('/api/assessment/submit','POST',{answers:exam.questions.map(q=>({questionId:q.id,option:Number(fd.get(q.id))}))}); renderResult(report);}
      catch(err){say(err.message);b.disabled=false;}finally{submitting=false;}
    };
  }
  function renderResult(r){
    const ordered=[...r.paths].sort((a,b)=>a.score-b.score);
    root.innerHTML=`<h2>Your learning plan</h2><p>Focus first on <strong>${esc(ordered[0].name)}</strong>, your lowest-scoring path in this attempt. Review all paths below.</p><p class="notice">Your result is saved. The report ${r.delivery==='sent'?'was sent':'is queued for delivery'} to anas.habash98@gmail.com.</p><p class="muted">Reference: ${esc(r.id)} · Each path uses six questions. Treat scores as an initial guide, and discuss your experience with the team before choosing a course.</p><div class="grid">${ordered.map(p=>`<section class="card report"><p class="kicker">${esc(p.name)}</p><div class="score">${p.score}%</div><meter min="0" max="100" value="${p.score}" aria-label="${esc(p.name)} score">${p.score}%</meter><p>${p.correct} of ${p.total} correct</p><p class="muted">${Object.entries(p.difficultyScores).map(([k,v])=>esc(k)+': '+v+'%').join(' · ')}</p><p>${esc(p.advice)}</p><h3>Course outlines to explore</h3><ul>${p.courses.map(c=>`<li><a href="${esc(c.url)}">${esc(c.title)}</a> <span class="muted">${esc(c.level)}</span></li>`).join('')||'<li>No published courses in this path yet.</li>'}</ul></section>`).join('')}</div><p class="muted">Course recommendations indicate learning fit. Availability, fees and prerequisites are confirmed before enrolment.</p><div class="toolbar"><button id="print">Print / save result as PDF</button><a class="action" href="courses.html">Explore courses ↗</a></div>`;
    document.querySelector('#print').onclick=()=>window.print();say('Your learning plan is ready.');focusHeading();
  }
  choose();
})();
