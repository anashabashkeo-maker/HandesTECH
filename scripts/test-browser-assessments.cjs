const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),engine=require(path.join(root,'wwwroot/assets/assessment-browser.js'));
const bank=JSON.parse(fs.readFileSync(path.join(root,'wwwroot/assets/assessment-bank.json'),'utf8'));engine.validateBank(bank);
assert.equal(bank.disciplines.length,5);assert.equal(bank.paths.length,16);assert.equal(bank.courses.length,112);assert.equal(bank.questions.length,336);assert(bank.assessments.every(a=>a.mode==='enabled'));
const source=new Map(bank.questions.map(q=>[q.id,q])),before=JSON.stringify(bank);
function rng(seed){return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
function value(q,right){const original=source.get(q.id),kind=engine.type(q);if(kind==='single'){const correct=q.options.indexOf(original.options[original.correctIndex]);return right?correct:(correct+1)%q.options.length;}if(kind==='multi')return right?original.correctIndices.map(i=>q.options.indexOf(original.options[i])):[q.options.findIndex(option=>!original.correctIndices.some(i=>original.options[i]===option))];if(kind==='matching')return Object.fromEntries(original.items.map((item,i)=>[item.id,right?item.answerId:original.items[(i+1)%original.items.length].answerId]));return right?[...original.correctOrder]:[...original.correctOrder].reverse();}
const answer=(exam,mode)=>Object.fromEntries(exam.questions.map(q=>[q.id,value(q,mode(source.get(q.id)))]));
let attempts=0;
for(const discipline of bank.disciplines){const signatures=new Set();for(let seed=1;seed<=30;seed++){
 const exam=engine.createExam(bank,discipline.id,rng(seed));attempts++;engine.validateExam(bank,JSON.parse(JSON.stringify(exam)));assert.equal(exam.questions.length,discipline.id==='electrical'?24:18);assert.equal(new Set(exam.questions.map(q=>q.id)).size,exam.questions.length);
 for(const p of bank.paths.filter(p=>p.disciplineId===discipline.id)){
  const group=exam.questions.filter(q=>q.pathId===p.id);assert(group.some(q=>q.image));for(const kind of ['multi','matching','ordering'])assert(group.some(q=>engine.type(q)===kind));
  for(const difficulty of ['easy','medium','hard']){const selected=group.filter(q=>source.get(q.id).difficulty===difficulty);assert.equal(selected.length,2);assert.equal(new Set(selected.map(q=>source.get(q.id).conceptKey)).size,2);}
 }
 signatures.add(JSON.stringify(exam.questions));
 for(const [condition,score,level] of [[()=>true,100,'Advanced'],[()=>false,0,'Beginner'],[q=>q.difficulty!=='hard',67,'Advanced'],[q=>q.difficulty==='easy',33,'Intermediate']]){
  const answers=answer(exam,condition),report=engine.grade(bank,exam,answers);assert.equal(report.id,exam.attemptId);assert.equal(report.delivery,'browser-only');assert(!('email' in report));assert.equal(report.recommendation.score,Math.min(...report.paths.map(p=>p.score)));
  for(const p of report.paths){assert.equal(p.score,score);assert.equal(p.suggestedLevel,level);assert.equal(p.total,6);assert.equal(p.courses.length,1);assert.equal(p.focusAreas.length>0,score<100);if(bank.courses.some(c=>c.pathId===p.pathId&&c.level===level))assert.equal(p.courses[0].level,level);for(const c of p.courses){const url=new URL(c.url,'https://example.test/HandesTECH/'),original=bank.courses.find(x=>x.id===c.id);assert.equal(original.pathId,p.pathId);assert.equal(url.searchParams.get('title'),original.title);assert.equal(url.searchParams.get('discipline'),discipline.id);}}
  const start=report.paths.find(p=>p.pathId===report.recommendation.pathId);assert.deepEqual(report.recommendation.course,start.courses[0]);assert.deepEqual(engine.restoreAnswers(exam,answers),answers);
 }
 assert.throws(()=>engine.grade(bank,exam,{}),/Complete every question/);
 }assert(signatures.size>25);}
assert.equal(JSON.stringify(bank),before);
const exam=engine.createExam(bank,'electrical',rng(42)),allCorrect=answer(exam,()=>true);
for(const kind of ['multi','matching','ordering']){
 const q=exam.questions.find(x=>engine.type(x)===kind),values=structuredClone(allCorrect);values[q.id]=value(q,false);const report=engine.grade(bank,exam,values);assert.equal(report.paths.find(p=>p.pathId===q.pathId).score,83,'Any incorrect part makes that question incorrect');assert.equal(report.recommendation.pathId,q.pathId,'Direct recommendation must choose the lowest path');
}
const multi=exam.questions.find(q=>engine.type(q)==='multi'),partial=structuredClone(allCorrect);partial[multi.id]=allCorrect[multi.id].slice(0,1);assert(engine.isAnswered(multi,partial[multi.id]));assert.equal(engine.grade(bank,exam,partial).paths.find(p=>p.pathId===multi.pathId).score,83,'A subset of correct choices is not full credit');const extra=structuredClone(allCorrect);extra[multi.id].push(value(multi,false)[0]);assert.equal(engine.grade(bank,exam,extra).paths.find(p=>p.pathId===multi.pathId).score,83,'Selecting an incorrect option must lose the point');assert(!engine.isAnswered(multi,[]));
const match=exam.questions.find(q=>engine.type(q)==='matching'),onePair={[match.items[0].id]:match.matchOptions[0].id};assert(!engine.isAnswered(match,onePair));assert.deepEqual(engine.restoreAnswers(exam,{[match.id]:onePair})[match.id],onePair);const duplicates=Object.fromEntries(match.items.map(x=>[x.id,match.matchOptions[0].id]));assert(!engine.isAnswered(match,duplicates));
const order=exam.questions.find(q=>engine.type(q)==='ordering');assert(!engine.isAnswered(order,undefined));assert(!engine.isAnswered(order,[order.items[0].id]));assert(engine.isAnswered(order,value(order,true)));
assert.throws(()=>engine.validateExam(bank,{...exam,expiresAt:'2000-01-01T00:00:00Z'}),/expired/);assert.throws(()=>engine.validateExam(bank,{...exam,version:'old'}),/changed/);
const corrupt=structuredClone(exam);corrupt.questions.find(q=>engine.type(q)==='single').options[0]='Injected';assert.throws(()=>engine.validateExam(bank,corrupt),/could not be restored/);
const duplicated=structuredClone(exam);duplicated.questions[0]=duplicated.questions[1];assert.throws(()=>engine.validateExam(bank,duplicated),/incomplete/);
const invalid=structuredClone(bank);invalid.questions[0].correctIndex=99;assert.throws(()=>engine.validateBank(invalid),/invalid answer/);
for(const q of bank.questions){if(q.image)assert(fs.existsSync(path.join(root,'wwwroot',q.image)));for(const item of q.items||[])if(item.image)assert(fs.existsSync(path.join(root,'wwwroot',item.image)));}
const html=fs.readFileSync(path.join(root,'wwwroot/assessment.html'),'utf8'),ui=fs.readFileSync(path.join(root,'wwwroot/assets/assessment.js'),'utf8');assert(html.indexOf('assessment-browser.js')<html.indexOf('assets/assessment.js'));assert(!ui.includes('/api/assessment'));assert(ui.includes('It is not sent to HandesTECH or saved in Admin.'));assert(!ui.includes('p.courses.map'),'Results should not offer a list of competing course recommendations');
console.log(`PASS: ${attempts} mixed-format attempts; diagrams, multi-select exact scoring, matching, ordering, partial-state restore, balanced difficulty, one lowest-path recommendation, course links and browser-only privacy.`);
