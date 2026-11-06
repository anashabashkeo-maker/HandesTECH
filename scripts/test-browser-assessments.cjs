const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),engine=require('../wwwroot/assets/assessment-browser.js');
const bank=JSON.parse(fs.readFileSync(path.join(root,'wwwroot/assets/assessment-bank.json'),'utf8'));
engine.validateBank(bank);
assert.equal(bank.disciplines.length,5);assert.equal(bank.paths.length,16);assert.equal(bank.courses.length,112);assert.equal(bank.questions.length,240);
assert(bank.assessments.every(a=>a.mode==='enabled'));
const source=new Map(bank.questions.map(q=>[q.id,q])),before=JSON.stringify(bank);
function rng(seed){return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
function answer(exam,mode){return Object.fromEntries(exam.questions.map(q=>{const original=source.get(q.id),correct=q.options.indexOf(original.options[original.correctIndex]);return [q.id,mode(original)?correct:(correct+1)%q.options.length];}));}
let attempts=0;
for(const discipline of bank.disciplines){
 const signatures=new Set();
 for(let seed=1;seed<=30;seed++){
  const exam=engine.createExam(bank,discipline.id,rng(seed));attempts++;
  engine.validateExam(bank,JSON.parse(JSON.stringify(exam)));
  assert.equal(exam.questions.length,discipline.id==='electrical'?24:18);
  assert.equal(new Set(exam.questions.map(q=>q.id)).size,exam.questions.length);
  for(const p of bank.paths.filter(p=>p.disciplineId===discipline.id))for(const difficulty of ['easy','medium','hard']){
   const group=exam.questions.filter(q=>q.pathId===p.id&&source.get(q.id).difficulty===difficulty);
   assert.equal(group.length,2);assert.equal(new Set(group.map(q=>source.get(q.id).conceptKey)).size,2);
  }
  signatures.add(JSON.stringify(exam.questions));
  for(const [condition,score,level] of [[()=>true,100,'Advanced'],[()=>false,0,'Beginner'],[q=>q.difficulty!=='hard',67,'Advanced'],[q=>q.difficulty==='easy',33,'Intermediate']]){
   const report=engine.grade(bank,exam,answer(exam,condition));assert.equal(report.id,exam.attemptId);assert.equal(report.delivery,'browser-only');assert(!('email' in report));
   for(const p of report.paths){
    assert.equal(p.score,score);assert.equal(p.suggestedLevel,level);assert.equal(p.total,6);assert(p.courses.length>0);
    assert.equal(p.focusAreas.length>0,score<100);
    if(bank.courses.some(c=>c.pathId===p.pathId&&c.level===level))assert.equal(p.courses[0].level,level,'Lead with the course level matching the participant starting point');
    for(const c of p.courses){const url=new URL(c.url,'https://example.test/HandesTECH/');const original=bank.courses.find(x=>x.id===c.id);assert.equal(original.pathId,p.pathId);assert.equal(url.searchParams.get('title'),original.title);assert.equal(url.searchParams.get('discipline'),discipline.id);}
   }
  }
  assert.throws(()=>engine.grade(bank,exam,{}),/Answer every question/);
 }
 assert(signatures.size>25,'Question and choice order should vary across attempts');
}
assert.equal(JSON.stringify(bank),before,'Starting and grading must not mutate the bank');
const exam=engine.createExam(bank,'electrical',rng(42));
assert.deepEqual(engine.grade(bank,exam,answer(exam,()=>true)).paths,engine.grade(bank,exam,answer(exam,()=>true)).paths);
const expired={...exam,expiresAt:'2000-01-01T00:00:00Z'};assert.throws(()=>engine.validateExam(bank,expired),/expired/);
assert.throws(()=>engine.validateExam(bank,{...exam,version:'old'}),/changed/);
const corrupt=JSON.parse(JSON.stringify(exam));corrupt.questions[0].options[0]='An injected option';assert.throws(()=>engine.validateExam(bank,corrupt),/could not be restored/);
const duplicate=JSON.parse(JSON.stringify(exam));duplicate.questions[0]=duplicate.questions[1];assert.throws(()=>engine.validateExam(bank,duplicate),/incomplete/);
const invalid=JSON.parse(JSON.stringify(bank));invalid.questions[0].correctIndex=99;assert.throws(()=>engine.validateBank(invalid),/invalid answer/);
const paused=JSON.parse(JSON.stringify(bank));paused.assessments[0].mode='coming-soon';assert.throws(()=>engine.createExam(paused,paused.assessments[0].disciplineId),/not available/);
const html=fs.readFileSync(path.join(root,'wwwroot/assessment.html'),'utf8'),ui=fs.readFileSync(path.join(root,'wwwroot/assets/assessment.js'),'utf8');
assert(html.indexOf('assessment-browser.js')<html.indexOf('assets/assessment.js'));
assert(!ui.includes('/api/assessment'),'Browser assessments must not depend on backend APIs');
assert(ui.includes('It is not sent to HandesTECH or saved in Admin.'));
console.log(`PASS: ${attempts} generated attempts across all five disciplines; balanced sampling, concept diversity, option shuffling, scoring, recommendations, corrupt/expired state, availability and browser-only privacy.`);
