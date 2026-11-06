(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HandesBrowserAssessment=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const questionsPerDifficulty=5,questionsPerPath=15,difficulties=['easy','medium','hard'],levels=['Beginner','Intermediate','Advanced','Professional'];
 const type=q=>q.type||'single',unique=values=>new Set(values).size===values.length;
 function check(ok,message){if(!ok)throw Error(message);}
 const equalSet=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&unique(a)&&JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
 const safeImage=value=>typeof value==='string'&&/^assets\/(assessment-visuals\/[a-z0-9-]+|app-[a-z0-9-]+)\.svg$/.test(value);
 function validItems(items){return Array.isArray(items)&&items.length>=2&&unique(items.map(x=>x.id))&&items.every(x=>typeof x.id==='string'&&x.id&&typeof x.text==='string'&&x.text.trim()&&(!x.image||safeImage(x.image)));}
 function validateBank(bank){
  check(bank&&bank.publicSelfAssessment===true&&typeof bank.version==='string','The assessment bank is unavailable.');
  for(const key of ['disciplines','paths','courses','questions','assessments'])check(Array.isArray(bank[key]),'The assessment bank is incomplete.');
  for(const key of ['disciplines','paths','courses','questions'])check(unique(bank[key].map(x=>x.id)),'The assessment bank contains duplicate items.');
  const disciplines=new Set(bank.disciplines.map(x=>x.id)),paths=new Map(bank.paths.map(x=>[x.id,x])),courses=new Map(bank.courses.map(x=>[x.id,x]));
  check(bank.paths.every(p=>disciplines.has(p.disciplineId))&&bank.courses.every(c=>paths.get(c.pathId)?.disciplineId===c.disciplineId),'Course paths do not match the catalogue.');
  for(const q of bank.questions){
   check(paths.get(q.pathId)?.disciplineId===q.disciplineId&&difficulties.includes(q.difficulty),'A question has an invalid path or difficulty.');
   check(typeof q.prompt==='string'&&q.prompt.trim()&&['single','multi','matching','ordering'].includes(type(q)),'A question has an invalid format.');
   check(!q.image||(safeImage(q.image)&&typeof q.imageAlt==='string'&&q.imageAlt.trim()),'A question has an invalid image.');
   check(Array.isArray(q.courseIds)&&q.courseIds.length&&q.courseIds.every(id=>courses.get(id)?.pathId===q.pathId),'A question has an invalid course recommendation.');
   if(['single','multi'].includes(type(q))){
    check(Array.isArray(q.options)&&q.options.length>=2&&q.options.every(x=>typeof x==='string'&&x.trim())&&unique(q.options),'A question has invalid answer choices.');
    if(type(q)==='single')check(Number.isInteger(q.correctIndex)&&q.correctIndex>=0&&q.correctIndex<q.options.length,'A question has an invalid answer.');
    else check(Array.isArray(q.correctIndices)&&q.correctIndices.length>=2&&q.correctIndices.length<q.options.length&&unique(q.correctIndices)&&q.correctIndices.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length),'A multi-select question has invalid answers.');
   }else if(type(q)==='matching')check(validItems(q.items)&&validItems(q.matchOptions)&&equalSet(q.items.map(x=>x.answerId),q.matchOptions.map(x=>x.id)),'A matching question has invalid pairs.');
   else check(validItems(q.items)&&equalSet(q.correctOrder,q.items.map(x=>x.id)),'An ordering question has an invalid sequence.');
  }
  for(const a of bank.assessments){
   check(disciplines.has(a.disciplineId)&&['enabled','coming-soon','hidden'].includes(a.mode),'Assessment availability is invalid.');
   if(a.mode==='enabled')for(const p of bank.paths.filter(p=>p.disciplineId===a.disciplineId)){
    const pool=bank.questions.filter(q=>q.pathId===p.id);
    for(const difficulty of difficulties)check(new Set(pool.filter(q=>q.difficulty===difficulty).map(q=>q.conceptKey||q.id)).size>=questionsPerDifficulty,'This path does not have enough different questions.');
    check(pool.some(q=>q.difficulty==='easy'&&q.image)&&pool.some(q=>q.difficulty==='easy'&&type(q)==='multi')&&pool.some(q=>q.difficulty==='medium'&&type(q)==='matching')&&pool.some(q=>q.difficulty==='hard'&&type(q)==='ordering'),'A path is missing its mixed-format questions.');
   }
  }
  return bank;
 }
 function random(){if(typeof crypto!=='undefined'&&crypto.getRandomValues){const values=new Uint32Array(1);crypto.getRandomValues(values);return values[0]/4294967296;}return Math.random();}
 function shuffle(items,rng=random){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
 function identifier(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
 function presentation(q,rng){
  const item={id:q.id,pathId:q.pathId,type:type(q),prompt:q.prompt};
  if(q.image){item.image=q.image;item.imageAlt=q.imageAlt;}
  if(['single','multi'].includes(type(q)))item.options=shuffle(q.options,rng);
  else{item.items=shuffle(q.items.map(x=>({id:x.id,text:x.text,...(x.image?{image:x.image}:{})})),rng);if(type(q)==='matching')item.matchOptions=shuffle(q.matchOptions.map(x=>({id:x.id,text:x.text})),rng);}
  return item;
 }
 function createExam(bank,disciplineId,rng=random){
  validateBank(bank);check(bank.assessments.some(a=>a.disciplineId===disciplineId&&a.mode==='enabled'),'This assessment is not available.');
  const selected=[];
  for(const path of bank.paths.filter(p=>p.disciplineId===disciplineId)){
   const pool=bank.questions.filter(q=>q.pathId===path.id),seen=new Set();
   function pick(difficulty,predicate){const candidates=shuffle(pool.filter(q=>q.difficulty===difficulty&&predicate(q)&&!seen.has(q.conceptKey||q.id)),rng);check(candidates.length,'This path does not have enough different questions.');const q=candidates[0];seen.add(q.conceptKey||q.id);selected.push(presentation(q,rng));}
   pick('easy',q=>Boolean(q.image));pick('easy',q=>type(q)==='multi');
   pick('medium',q=>type(q)==='matching');pick('medium',q=>type(q)!=='matching');
   pick('hard',q=>type(q)==='ordering');pick('hard',q=>type(q)!=='ordering');
   for(const difficulty of difficulties)for(let i=2;i<questionsPerDifficulty;i++)pick(difficulty,()=>true);
  }
  return {attemptId:identifier(),version:bank.version,disciplineId,expiresAt:new Date(Date.now()+86400000).toISOString(),questions:shuffle(selected,rng)};
 }
 function validateExam(bank,exam){
  check(exam&&exam.version===bank.version&&typeof exam.attemptId==='string'&&Number.isFinite(Date.parse(exam.expiresAt))&&Date.parse(exam.expiresAt)>Date.now(),'Saved progress has expired or the assessment has changed. Please start again.');
  check(bank.assessments.some(a=>a.disciplineId===exam.disciplineId&&a.mode==='enabled'),'This assessment is not available.');
  const source=new Map(bank.questions.map(q=>[q.id,q])),paths=bank.paths.filter(p=>p.disciplineId===exam.disciplineId);
  check(Array.isArray(exam.questions)&&exam.questions.length===paths.length*questionsPerPath&&unique(exam.questions.map(q=>q.id)),'The saved assessment is incomplete.');
  for(const q of exam.questions){
   const original=source.get(q.id);check(original&&original.disciplineId===exam.disciplineId&&q.pathId===original.pathId&&q.prompt===original.prompt&&type(q)===type(original)&&q.image===original.image&&q.imageAlt===original.imageAlt,'The saved assessment could not be restored.');
   if(['single','multi'].includes(type(q)))check(equalSet(q.options,original.options),'The saved assessment could not be restored.');
   else{check(validItems(q.items)&&q.items.length===original.items.length&&q.items.every(x=>original.items.some(o=>x.id===o.id&&x.text===o.text&&x.image===o.image)),'The saved assessment could not be restored.');if(type(q)==='matching')check(validItems(q.matchOptions)&&q.matchOptions.length===original.matchOptions.length&&q.matchOptions.every(x=>original.matchOptions.some(o=>x.id===o.id&&x.text===o.text)),'The saved assessment could not be restored.');}
  }
  for(const path of paths)for(const difficulty of difficulties){const group=exam.questions.filter(q=>q.pathId===path.id&&source.get(q.id).difficulty===difficulty);check(group.length===questionsPerDifficulty&&unique(group.map(q=>source.get(q.id).conceptKey||q.id)),'The saved assessment has an invalid question mix.');}
  return exam;
 }
 function validPartial(q,value){
  if(type(q)==='single')return Number.isInteger(value)&&value>=0&&value<q.options.length;
  if(type(q)==='multi')return Array.isArray(value)&&unique(value)&&value.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length);
  if(type(q)==='ordering')return equalSet(value,q.items.map(x=>x.id));
  return value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([left,right])=>q.items.some(x=>x.id===left)&&q.matchOptions.some(x=>x.id===right));
 }
 function isAnswered(q,value){if(!validPartial(q,value))return false;if(type(q)==='multi')return value.length>0;if(type(q)==='matching')return Object.keys(value).length===q.items.length&&unique(Object.values(value));return true;}
 function restoreAnswers(exam,answers){if(!answers||typeof answers!=='object')return {};return Object.fromEntries(exam.questions.filter(q=>validPartial(q,answers[q.id])).map(q=>[q.id,answers[q.id]]));}
 function grade(bank,exam,answers){
  validateExam(bank,exam);const source=new Map(bank.questions.map(q=>[q.id,q]));
  check(answers&&exam.questions.every(q=>isAnswered(q,answers[q.id])),'Complete every question before submitting.');
  function correct(q){const original=source.get(q.id),value=answers[q.id];if(type(q)==='single')return q.options[value]===original.options[original.correctIndex];if(type(q)==='multi')return equalSet(value.map(i=>q.options[i]),original.correctIndices.map(i=>original.options[i]));if(type(q)==='matching')return original.items.every(x=>value[x.id]===x.answerId);return JSON.stringify(value)===JSON.stringify(original.correctOrder);}
  const percent=items=>Math.round(100*items.filter(correct).length/items.length);
  const paths=bank.paths.filter(p=>p.disciplineId===exam.disciplineId).map(path=>{
   const group=exam.questions.filter(q=>q.pathId===path.id),score=percent(group),difficultyScores=Object.fromEntries(difficulties.map(d=>[d,percent(group.filter(q=>source.get(q.id).difficulty===d))]));
   const suggestedLevel=difficultyScores.easy<75?'Beginner':difficultyScores.medium<75?'Intermediate':'Advanced';
   const missed=group.filter(q=>!correct(q)).map(q=>source.get(q.id)),weakIds=new Set(missed.flatMap(q=>q.courseIds)),candidates=bank.courses.filter(c=>c.pathId===path.id);
   const availableLevel=levels.slice(levels.indexOf(suggestedLevel)).find(level=>candidates.some(c=>c.level===level))||levels.slice().reverse().find(level=>candidates.some(c=>c.level===level));
   const target=levels.indexOf(availableLevel);
   const recommended=candidates.sort((a,b)=>Math.abs(levels.indexOf(a.level)-target)-Math.abs(levels.indexOf(b.level)-target)||Number(weakIds.has(b.id))-Number(weakIds.has(a.id))).slice(0,1).map(c=>({id:c.id,title:c.title,level:c.level,url:'course.html?discipline='+encodeURIComponent(c.disciplineId)+'&title='+encodeURIComponent(c.title)}));
   return {pathId:path.id,name:path.name,score,correct:group.filter(correct).length,total:group.length,difficultyScores,suggestedLevel,courses:recommended,focusAreas:[...new Set(missed.map(q=>q.topic||q.prompt))].slice(0,3)};
  });
  const priority=[...paths].sort((a,b)=>a.score-b.score||a.difficultyScores.easy-b.difficultyScores.easy||a.difficultyScores.medium-b.difficultyScores.medium)[0];
  return {id:exam.attemptId,version:bank.version,disciplineId:exam.disciplineId,createdAt:new Date().toISOString(),expiresAt:exam.expiresAt,delivery:'browser-only',paths,recommendation:{pathId:priority.pathId,name:priority.name,score:priority.score,level:priority.suggestedLevel,course:priority.courses[0]}};
 }
 return {validateBank,createExam,validateExam,grade,shuffle,isAnswered,restoreAnswers,type,questionsPerPath,questionsPerDifficulty};
});
