"""Integration tests using a disposable private store and local mail pickup; no mail is sent."""
import copy, email, email.header, json, os, re, socket, subprocess, tempfile, time, urllib.request, urllib.error, http.cookiejar
from pathlib import Path

root=Path(__file__).resolve().parents[1]
test_root=Path(os.environ.get('HANDESTECH_TEST_ROOT',str(root/'App_Data'/'tests')))
test_root.mkdir(parents=True,exist_ok=True)
scratch=Path(tempfile.mkdtemp(prefix='handestech-tests-',dir=str(test_root)))
env=os.environ.copy()
env.update({'ASPNETCORE_ENVIRONMENT':'Development','Academy__DataDirectory':str(scratch/'data'),
 'Academy__LocalTesting':'true','Email__DevelopmentPickupDirectory':str(scratch/'mail'),'Assessment__ReportRecipient':'owner@example.test','Academy__PublicRequestLimit':'300','Academy__SensitiveRequestLimit':'100'})
password='Disposable-integration-password-123!'
dll=Path(os.environ.get('HANDESTECH_TEST_DLL',str(root/'bin/Debug/net10.0/HandesTECH.dll')))
env.pop('Admin__PasswordHash',None)
private_bank=root/'App_Data'/'seed-questions.json'
if private_bank.exists() and os.environ.get('HANDESTECH_SYNTHETIC_BANK')!='1':
 bank_source=json.loads(private_bank.read_text(encoding='utf-8-sig'))
else:
 catalogue=json.loads((root/'wwwroot/assets/course-data.json').read_text(encoding='utf-8-sig'));bank_source=[]
 for d in catalogue:
  for path in (['design-power','design-telecom','bim','ai'] if d['slug']=='electrical' else ['design','bim','ai']):
   eligible=[(i,c) for i,c in enumerate(d['courses']) if (c['path']=='design' and (d['slug']!='electrical' or (i<11 if path=='design-power' else i>=11))) if path.startswith('design')] if path.startswith('design') else [(i,c) for i,c in enumerate(d['courses']) if c['path']==path]
   for difficulty in ['easy','medium','hard']:
    for i in range(3):bank_source.append({'id':d['slug']+'-'+path+'-'+difficulty+'-'+str(i),'disciplineId':d['slug'],'pathId':d['slug']+'-'+path,'difficulty':difficulty,'prompt':'Synthetic integration test item '+str(i),'options':['Fixture answer','Fixture distractor 1','Fixture distractor 2','Fixture distractor 3'],'correctIndex':0,'explanation':'Synthetic test fixture, not real assessment content.','courseIds':[d['slug']+'-course-'+str(eligible[0][0]+1)],'reviewed':False,'topic':'Fixture topic'})
seed_file=scratch/'seed-questions.json';seed_file.write_text(json.dumps(bank_source),encoding='utf8');env['Academy__SeedQuestionsPath']=str(seed_file)
sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
base='http://127.0.0.1:'+str(port)
log=(scratch/'server.log').open('w')
proc=subprocess.Popen(['dotnet',str(dll),'--urls',base],env=env,cwd=str(root),stdout=log,stderr=log,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(jar));csrf=None;checks=0
def call(path,method='GET',body=None,auth=True,expected=200):
 global checks
 headers={'Content-Type':'application/json'}
 if auth and csrf: headers['X-CSRF-TOKEN']=csrf
 request=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=headers,method=method)
 try:
  with client.open(request) as response: status=response.status;raw=response.read()
 except urllib.error.HTTPError as error:status=error.code;raw=error.read()
 assert status==expected,(path,status,raw[:400])
 checks+=1
 try:return json.loads(raw)
 except ValueError:return raw.decode()
try:
 for i in range(100):
  try:client.open(base+'/assessment.html',timeout=1);break
  except Exception:time.sleep(.1)
 else:raise AssertionError('Server did not start: '+(scratch/'server.log').read_text())
 call('/api/admin/catalog',expected=401)
 csrf=call('/api/csrf')['token']
 call('/api/chat','POST',{'message':'BIM'},auth=False,expected=400)
 setup=call('/api/admin/setup');assert setup['canSetup'] and not setup['configured']
 rebinding=urllib.request.Request(base+'/api/admin/setup',headers={'Host':'untrusted.example.test'})
 with client.open(rebinding) as response: assert not json.load(response)['canSetup']
 checks+=1
 call('/api/admin/setup','POST',{'password':'short'},expected=400)
 call('/api/admin/setup','POST',{'password':password})
 call('/api/admin/setup','POST',{'password':password},expected=403)
 call('/api/admin/login','POST',{'password':'wrong-password'},expected=401)
 call('/api/admin/login','POST',{'password':password})
 csrf=call('/api/csrf')['token']
 data=call('/api/admin/catalog');assert len(data['courses'])==112 and len(data['questions'])==len(bank_source)
 public=call('/api/catalog');assert 'questions' not in public and 'reports' not in public
 assert call('/assets/academy-config.json')['enabled']
 assert all(p['kind'] in ['design','bim','ai'] for p in public['paths'])
 assert 'questions' not in call('/assets/course-data.json')[0]
 assert all(x['mode']=='coming-soon' for x in public['assessments'])
 # Enabling draft questions must fail.
 draft=copy.deepcopy(data);draft['assessmentModes']['electrical']='enabled'
 call('/api/admin/catalog','PUT',draft,expected=400)
 # Reject subcourse cycles without damaging the saved catalogue.
 draft=copy.deepcopy(data);draft['courses'][0]['parentId']=draft['courses'][0]['id']
 call('/api/admin/catalog','PUT',draft,expected=400)
 # Add a path and nested course; hide the parent and check visibility inheritance.
 draft=copy.deepcopy(data)
 draft['paths'].append({'id':'electrical-controls','disciplineId':'electrical','name':'Controls','published':True})
 parent=copy.deepcopy(draft['courses'][0]);parent.update(id='test-parent',title='Test parent',pathId='electrical-controls',published=False)
 child=copy.deepcopy(parent);child.update(id='test-child',title='Test child',parentId='test-parent',published=True)
 draft['courses'] += [parent,child]
 saved=call('/api/admin/catalog','PUT',draft)
 public=call('/api/catalog');assert not any(c['id']=='test-child' for c in public['courses'])
 call('/api/admin/catalog','PUT',draft,expected=409)
 # Remove draft fixtures and review only the test copy of the electrical bank.
 data['revision']=saved['revision']
 for q in data['questions']:
  if q['disciplineId']=='electrical':q['reviewed']=True
 data['assessmentModes']['electrical']='enabled'
 data=call('/api/admin/catalog','PUT',data)
 call('/api/assessment/start','POST',{'disciplineId':'electrical'},expected=401)
 call('/api/assessment/code','POST',{'email':'participant@example.test','botToken':''},expected=400)
 call('/api/assessment/code','POST',{'email':'not-an-email','botToken':'','consent':True},expected=400)
 challenge=call('/api/assessment/code','POST',{'email':'participant@example.test','botToken':'','consent':True})['challengeId']
 call('/api/assessment/code','POST',{'email':'participant@example.test','botToken':'','consent':True},expected=429)
 mail=next((scratch/'mail').glob('*.eml'))
 msg=email.message_from_bytes(mail.read_bytes());text=msg.get_payload(decode=True).decode()
 code=re.search(r'code is (\d{6})',text).group(1)
 call('/api/assessment/verify','POST',{'challengeId':challenge,'code':'000000'},expected=400)
 call('/api/assessment/verify','POST',{'challengeId':challenge,'code':code})
 call('/api/assessment/verify','POST',{'challengeId':challenge,'code':code},expected=400)
 exam=call('/api/assessment/start','POST',{'disciplineId':'electrical'})
 assert call('/api/assessment/session')['state']=='active'
 assert len(exam['questions'])==24 and all('correctIndex' not in q and 'explanation' not in q for q in exam['questions'])
 assert call('/api/assessment/start','POST',{'disciplineId':'electrical'})==exam
 bank={q['id']:q for q in data['questions']};answers=[]
 for q in exam['questions']:
  original=bank[q['id']];correct=q['options'].index(original['options'][original['correctIndex']])
  answers.append({'questionId':q['id'],'option':(correct+1)%len(q['options']) if original['difficulty']=='hard' else correct})
 call('/api/assessment/submit','POST',{'answers':answers[:-1]},expected=400)
 report=call('/api/assessment/submit','POST',{'answers':answers})
 assert len(report['paths'])==4 and all(p['score']==67 and p['difficultyScores']=={'easy':100,'medium':100,'hard':0} for p in report['paths']),report
 assert all(p['suggestedLevel']=='Advanced' and p['focusAreas'] for p in report['paths'])
 assert call('/api/assessment/session')['report']['id']==report['id']
 assert call('/api/assessment/submit','POST',{'answers':answers})['id']==report['id']
 guide=call('/api/chat','POST',{'message':'Revit'});assert guide['links'] and all('course.html?' in l['url'] for l in guide['links'])
 guide=call('/api/chat','POST',{'message':'How does the assessment work?'});assert guide['links'][0]['url']=='assessment.html'
 call('/App_Data/academy.json',expected=404)
 call('/Academy/seed-questions.json',expected=404)
 call('/App_Data/settings.json',expected=404)
 # The outbox persists and sends to the owner through local pickup.
 for i in range(200):
  state=json.loads((scratch/'data/academy.json').read_text())
  if state['reports'][0]['delivery']=='sent':break
  time.sleep(.1)
 else:raise AssertionError('Report delivery did not complete')
 assert state['revision']==data['revision'],'Outbox updates must not invalidate catalogue edits'
 mails=[email.message_from_bytes(p.read_bytes()) for p in (scratch/'mail').glob('*.eml')]
 assert any('owner@example.test' in str(m['To']) and 'assessment' in str(email.header.make_header(email.header.decode_header(m['Subject']))).lower() for m in mails)
 print('PASS: {} HTTP checks; first-run setup, catalogue validation, private answer keys, CSRF, auth, subcourses, OTP consent and replay, shuffled questions, focus areas, resume, scoring, idempotency and durable email outbox.'.format(checks))
finally:
 proc.terminate();proc.wait(timeout=15);log.close()
