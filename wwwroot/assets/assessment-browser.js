(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HandesBrowserAssessment=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const difficulties=['easy','medium','hard'];
 function requireValue(ok,message){if(!ok)throw Error(message);}
 function validateBank(bank){
  requireValue(bank&&bank.publicSelfAssessment===true&&typeof bank.version==='string','The assessment bank is unavailable.');
  for(const key of ['disciplines','paths','courses','questions','assessments'])requireValue(Array.isArray(bank[key]),'The assessment bank is incomplete.');
  for(const key of ['disciplines','paths','courses','questions'])requireValue(new Set(bank[key].map(x=>x.id)).size===bank[key].length,'The assessment bank contains duplicate items.');
  const disciplines=new Set(bank.disciplines.map(x=>x.id)),paths=new Map(bank.paths.map(x=>[x.id,x])),courses=new Map(bank.courses.map(x=>[x.id,x]));
  requireValue(bank.paths.every(p=>disciplines.has(p.disciplineId))&&bank.courses.every(c=>paths.get(c.pathId)?.disciplineId===c.disciplineId),'Course paths do not match the catalogue.');
  for(const q of bank.questions){
   requireValue(paths.get(q.pathId)?.disciplineId===q.disciplineId&&difficulties.includes(q.difficulty),'A question has an invalid path or difficulty.');
   requireValue(typeof q.prompt==='string'&&q.prompt.trim()&&Array.isArray(q.options)&&q.options.length>=2&&q.options.every(x=>typeof x==='string'&&x.trim())&&new Set(q.options).size===q.options.length,'A question has invalid answer choices.');
   requireValue(Number.isInteger(q.correctIndex)&&q.correctIndex>=0&&q.correctIndex<q.options.length,'A question has an invalid answer.');
   requireValue(Array.isArray(q.courseIds)&&q.courseIds.length&&q.courseIds.every(id=>courses.get(id)?.pathId===q.pathId),'A question has an invalid course recommendation.');
  }
  for(const a of bank.assessments){
   requireValue(disciplines.has(a.disciplineId)&&['enabled','coming-soon','hidden'].includes(a.mode),'Assessment availability is invalid.');
   if(a.mode==='enabled'){
    const selectedPaths=bank.paths.filter(p=>p.disciplineId===a.disciplineId);requireValue(selectedPaths.length,'This discipline has no learning paths.');
    for(const p of selectedPaths)for(const difficulty of difficulties){const pool=bank.questions.filter(q=>q.pathId===p.id&&q.difficulty===difficulty);requireValue(new Set(pool.map(q=>q.conceptKey||q.id)).size>=2,'This path does not have enough different questions.');}
   }
  }
  return bank;
 }
 function random(){if(typeof crypto!=='undefined'&&crypto.getRandomValues){const values=new Uint32Array(1);crypto.getRandomValues(values);return values[0]/4294967296;}return Math.random();}
 function shuffle(items,rng=random){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
 function identifier(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
 function createExam(bank,disciplineId,rng=random){
  validateBank(bank);requireValue(bank.assessments.some(a=>a.disciplineId===disciplineId&&a.mode==='enabled'),'This assessment is not available.');
  const selected=[];
  for(const path of bank.paths.filter(p=>p.disciplineId===disciplineId))for(const difficulty of difficulties){
   const concepts=new Set();let count=0;
   for(const q of shuffle(bank.questions.filter(q=>q.pathId===path.id&&q.difficulty===difficulty),rng)){
    const key=q.conceptKey||q.id;if(concepts.has(key))continue;concepts.add(key);selected.push({id:q.id,pathId:q.pathId,prompt:q.prompt,options:shuffle(q.options,rng)});if(++count===2)break;
   }
  }
  return {attemptId:identifier(),version:bank.version,disciplineId,expiresAt:new Date(Date.now()+86400000).toISOString(),questions:shuffle(selected,rng)};
 }
 function validateExam(bank,exam){
  requireValue(exam&&exam.version===bank.version&&typeof exam.attemptId==='string'&&Number.isFinite(Date.parse(exam.expiresAt))&&Date.parse(exam.expiresAt)>Date.now(),'Saved progress has expired or the assessment has changed. Please start again.');
  requireValue(bank.assessments.some(a=>a.disciplineId===exam.disciplineId&&a.mode==='enabled'),'This assessment is not available.');
  const source=new Map(bank.questions.map(q=>[q.id,q])),paths=bank.paths.filter(p=>p.disciplineId===exam.disciplineId);
  requireValue(Array.isArray(exam.questions)&&exam.questions.length===paths.length*6&&new Set(exam.questions.map(q=>q.id)).size===exam.questions.length,'The saved assessment is incomplete.');
  for(const q of exam.questions){const original=source.get(q.id);requireValue(original&&original.disciplineId===exam.disciplineId&&q.pathId===original.pathId&&q.prompt===original.prompt&&Array.isArray(q.options)&&JSON.stringify([...q.options].sort())===JSON.stringify([...original.options].sort()),'The saved assessment could not be restored.');}
  for(const path of paths)for(const difficulty of difficulties){const group=exam.questions.filter(q=>q.pathId===path.id&&source.get(q.id).difficulty===difficulty);requireValue(group.length===2&&new Set(group.map(q=>source.get(q.id).conceptKey||q.id)).size===2,'The saved assessment has an invalid question mix.');}
  return exam;
 }
 function grade(bank,exam,answers){
  validateExam(bank,exam);const source=new Map(bank.questions.map(q=>[q.id,q]));
  requireValue(answers&&exam.questions.every(q=>Number.isInteger(answers[q.id])&&answers[q.id]>=0&&answers[q.id]<q.options.length),'Answer every question before submitting.');
  const correct=q=>q.options[answers[q.id]]===source.get(q.id).options[source.get(q.id).correctIndex];
  const percent=items=>Math.round(100*items.filter(correct).length/items.length);
  const paths=bank.paths.filter(p=>p.disciplineId===exam.disciplineId).map(path=>{
   const group=exam.questions.filter(q=>q.pathId===path.id),score=percent(group),difficultyScores=Object.fromEntries(difficulties.map(d=>[d,percent(group.filter(q=>source.get(q.id).difficulty===d))]));
   const suggestedLevel=difficultyScores.easy<75?'Beginner':difficultyScores.medium<75?'Intermediate':'Advanced';
   const missed=group.filter(q=>!correct(q)).map(q=>source.get(q.id)),weakIds=new Set(missed.flatMap(q=>q.courseIds));
   const candidates=bank.courses.filter(c=>c.pathId===path.id),levels=['Beginner','Intermediate','Advanced','Professional'];
   const availableLevel=levels.slice(levels.indexOf(suggestedLevel)).find(level=>candidates.some(c=>c.level===level))||levels.slice().reverse().find(level=>candidates.some(c=>c.level===level));
   const recommended=candidates.sort((a,b)=>Number(b.level===availableLevel)-Number(a.level===availableLevel)||Number(weakIds.has(b.id))-Number(weakIds.has(a.id))).slice(0,3).map(c=>({id:c.id,title:c.title,level:c.level,url:'course.html?discipline='+encodeURIComponent(c.disciplineId)+'&title='+encodeURIComponent(c.title)}));
   const focus=difficulties.reduce((lowest,d)=>difficultyScores[d]<difficultyScores[lowest]?d:lowest,'easy');
   const advice=score>=85?'Strong performance in this short diagnostic. Explore advanced projects and validate your knowledge in practice.':`Start with ${suggestedLevel.toLowerCase()} material. Focus on ${focus}-difficulty concepts, then practise before taking the assessment again.`;
   return {pathId:path.id,name:path.name,score,correct:group.filter(correct).length,total:group.length,difficultyScores,suggestedLevel,advice,courses:recommended,focusAreas:[...new Set(missed.map(q=>q.topic||q.prompt))].slice(0,4)};
  });
  return {id:exam.attemptId,version:bank.version,disciplineId:exam.disciplineId,createdAt:new Date().toISOString(),expiresAt:exam.expiresAt,delivery:'browser-only',paths};
 }
 return {validateBank,createExam,validateExam,grade,shuffle};
});
