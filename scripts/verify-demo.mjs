/** Browser regression suite. Start Vite and Chrome with --remote-debugging-port=9333 first. */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const targets=await (await fetch('http://localhost:9333/json/list')).json();
const target=targets.find(t=>t.type==='page');
assert(target,'A Chrome page is required');
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
let seq=0;const pending=new Map();const errors=[];
ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);else if(m.method==='Runtime.consoleAPICalled' && m.params.type==='error')errors.push(m.params.args.map(a=>a.value??a.description).join(' '));};
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try {
 await call('Runtime.enable');await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
 await call('Runtime.discardConsoleEntries');errors.length=0;
 await call('Page.navigate',{url:'http://localhost:5199/'});await wait(1200);
 const checks=await evaluate(`(async()=>{
 const {S,agent,evaluate,DEFAULT_CRITERIA,reconcileFee}=await import('/tests/browser-api.ts');
 const logs=[]; const check=(v,label)=>{if(!v)throw Error(label);logs.push(label);};
 window.demoStore=S;S.getState().login('a.chan@apexpacific.example');
 const metrics={return:11,volatility:14,drawdown:17,sharpe:1.1,history:42,notice:75,concentration:9,correlation:0.35};
 check(evaluate(metrics).status==='Eligible','Screen boundaries pass');check(evaluate({...metrics,correlation:undefined}).status==='Needs evidence','Missing evidence never passes');check(evaluate({...metrics,return:10,correlation:undefined}).checks.some(c=>c.status==='Fail'),'Failures retained with missing evidence');check(evaluate(metrics,DEFAULT_CRITERIA.map(c=>({...c,enabled:false}))).status==='No checks enabled','Disabled rules do not imply eligibility');
 const initial=S.getState().records.length;S.getState().editDocField('inv-pfs-q3','amount_usd','49000');check(S.getState().records.length===initial,'Draft edit does not save a record');S.getState().approveDoc('inv-pfs-q3');let record=S.getState().records.find(r=>r.docId==='inv-pfs-q3');check(record.values.amount_usd===49000 && typeof record.values.amount_usd==='number','Approval saves typed corrected values');S.getState().approveDoc('inv-pfs-q3');check(S.getState().records.length===initial+1,'Repeated approval does not duplicate records');S.getState().editDocField('inv-pfs-q3','amount_usd','1');check(S.getState().records.find(r=>r.docId==='inv-pfs-q3').values.amount_usd===49000,'Approved record remains read-only');
 S.getState().approveDoc('hal-nav-08');check(S.getState().halAck,'Approved NAV completes linked workflow');
 S.getState().rejectDoc('eml-mer-0807','Wrong document');check(!S.getState().records.some(r=>r.docId==='eml-mer-0807'),'Rejected draft creates no approved data');
 const fee={nav:17100000,annualRate:1.44,start:'2026-08-01',end:'2026-08-31',invoiced:22500};check(reconcileFee(fee).days===31,'Fee includes both dates');check(reconcileFee({...fee,start:'2026-02-30'}).ok===false,'Fee rejects impossible date');check(reconcileFee({...fee,start:'2026-09-01'}).ok===false,'Fee rejects reversed dates');check(reconcileFee({...fee,nav:NaN}).ok===false,'Fee rejects invalid number');check(reconcileFee({...fee,start:'2024-02-28',end:'2024-03-01'}).days===3,'Leap year uses actual days');check(!S.getState().approveFee(fee,'').ok,'Discrepancy requires explanation');check(S.getState().approveFee(fee,'Confirm corrected invoice with administrator.').ok,'PM can save explained reconciliation');
 const saved=S.getState().feeReviews.length;S.getState().approveFee(fee,'Confirm corrected invoice with administrator.');check(S.getState().feeReviews.length===saved,'Duplicate fee approval is idempotent');
 S.getState().runMonitoring();S.getState().runMonitoring();check(S.getState().assignments.filter(a=>a.id==='MON-SAB').length===1,'Repeated monitoring creates one investigation');
 S.getState().prepareResearch('MON-SAB');const draft=S.getState().assignments.find(a=>a.id==='MON-SAB').draft;check(S.getState().submitResearch('MON-SAB',draft,'form').ok,'Investigation can be submitted');check(S.getState().reviewResearch('MON-SAB','accepted','Obtain the outstanding administrator pack.').ok,'Human review creates follow-up');check(S.getState().funds.find(f=>f.id==='SAB').asOf==='2026-07-31','Research does not clear numerical breach');
 S.getState().login('l.wu@apexpacific.example');check(!agent('docs get private-reference').ok,'Analyst cannot read restricted original');check(!agent('records get DATA-terms-hal').ok,'Analyst cannot read restricted structured data');check(!agent('tasks get PM-REF').ok,'Analyst cannot read report with restricted source');check(!JSON.stringify(agent('funds get SIL')).includes('disciplined escalation'),'Fund aggregate omits restricted evidence');check(!S.getState().approveFee(fee,'Try approval').ok,'Analyst cannot approve PM reconciliation');check(!agent('book approve').ok,'Agent cannot approve investments');
 const added=agent('funds add',{name:'Test Meadow',metrics,metricSource:'Fictional live monthly series',metricAsOf:'2026-08-31'},'cli');check(added.ok,'CLI adds candidate: '+JSON.stringify(added));check(!agent('funds add',{name:'test meadow'},'cli').ok,'CLI rejects duplicate names');check(!agent('funds add',{name:'Invalid',metrics:{correlation:4}},'cli').ok,'CLI rejects out-of-range metrics');
 const taskId=added.data.assignmentId;const task=agent('tasks get '+taskId).data;check(task.fundId===added.data.id,'New candidate has a usable assignment');check(agent('tasks submit '+taskId,{recommendation:'Continue evidence gathering.',rationale:'Review the screening evidence and request independent records.',risks:'Missing operational evidence.',conditions:'Obtain independent administrator confirmation.',sources:task.sources.map(s=>s.id)},'cli').ok,'Agent submits report for new candidate');
 S.getState().login('a.chan@apexpacific.example');check(S.getState().reviewResearch(taskId,'changes requested','Clarify evidence quality.').ok,'Reviewer can request changes');const rev=S.getState().assignments.find(a=>a.id===taskId);check(rev.revisions.length===1 && rev.status==='In progress','Revision history retained');
 const committed=JSON.stringify(S.getState().book);S.getState().stage({...S.getState().book,NOR:90});S.getState().approveGate();check(JSON.stringify(S.getState().book)===committed,'Invalid allocation cannot be committed');S.getState().clearStage();S.getState().stage({...S.getState().book,SAB:5,CASH:17});S.getState().login('l.wu@apexpacific.example');S.getState().approveGate();check(JSON.stringify(S.getState().book)===committed,'Analyst cannot commit a valid allocation');S.getState().login('a.chan@apexpacific.example');S.getState().approveGate();check(S.getState().book.SAB===5,'PM can commit valid allocation');S.getState().setView('screening');return logs;
 })()`);
 for(const check of checks)console.log('PASS',check);
 await wait(200);
 for(const [width,height] of [[1280,720],[1920,1080]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const view of ['screening','library','monitoring','fees','team']){
   await evaluate(`window.demoStore.getState().setView('${view}')`);await wait(100);
   assert(await evaluate('document.querySelector("main").innerText.length>50'),`${view} renders`);
   assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`${view} no page overflow at ${width}`);
   const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`/tmp/apex-${view}-${width}.png`,Buffer.from(shot.data,'base64'));
  }
 }
 await evaluate(`window.demoStore.getState().login('l.wu@apexpacific.example');window.demoStore.getState().setView('library')`);await wait(100);
 assert((await evaluate('document.body.innerText')).includes('Restricted document'),'Restricted placeholder is visible');
 assert(!(await evaluate('document.body.innerText')).includes('Manager reference note'),'Restricted title absent');
 // Exercise real HTTP command transport, with explicit browser session targeting.
 const session=await evaluate(`import('/tests/browser-api.ts').then(m=>m.agentSession)`);await wait(900);
 const command=await fetch('http://localhost:5199/api/demo/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session,command:'funds add',payload:{name:'Live Bridge Candidate'}})});
 const result=await command.json();assert(result.ok,result.message);assert(await evaluate(`window.demoStore.getState().screener.some(f=>f.id===${JSON.stringify(result.data.id)})`),'Bridge write appears in live browser');console.log('PASS HTTP bridge write updates browser');
 const before=await (await fetch('http://localhost:5199/raw/PacificFundServices_September_Invoice.pdf')).arrayBuffer();assert(Buffer.from(before).subarray(0,5).toString()==='%PDF-','Real PDF bytes');
 assert(Buffer.from(before).includes(Buffer.from('$48,750.00')),'Original PDF value remains unchanged after correction');
 // Click through the document flow from a fresh browser session.
 await call('Page.reload');await wait(1000);
 const click=async label=>{await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!button)throw Error('Missing button: '+${JSON.stringify(label)});button.click();})()`);await wait(100);};
 await click('Skip MFA');await click('Data library');
 await evaluate(`document.querySelectorAll('button').forEach(b=>{if(b.textContent.startsWith('PacificFundServices_September_Invoice.pdf'))b.click();})`);await wait(100);
 assert((await evaluate('document.body.innerText')).includes('Draft value'),'Document review labels draft values');
 await click('Original PDF');assert(await evaluate(`document.querySelector('iframe')?.title === 'PacificFundServices_September_Invoice.pdf'`),'Original PDF viewer opens');await click('Annotated review');
 await call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
 await evaluate(`document.querySelector('[data-field-input=gl_code]').scrollIntoView({block:'center'})`);await wait(100);
 const docShot=await call('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/apex-document-review-1280.png',Buffer.from(docShot.data,'base64'));
 await evaluate(`(()=>{const input=document.querySelector('[data-field-input=gl_code]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'6200-Administration');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await wait(100);await click('Approve & save record');await click('View saved record');
 assert((await evaluate('document.body.innerText')).includes('6200-Administration'),'Corrected field visible in saved record');
 assert((await evaluate('document.body.innerText')).includes('read-only snapshot'),'Approval opens approved record destination');
 console.log('PASS document review buttons, real PDF viewer and saved-record navigation');
 assert.deepEqual(errors,[],'Browser console has no errors');console.log('PASS layouts, restricted placeholders, PDF asset and clean browser console');
} finally { ws.close(); }
