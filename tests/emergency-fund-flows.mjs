import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const auth=JSON.parse(fs.readFileSync('/tmp/mgpjn-emergency-auth.json','utf8'));
const origin='http://127.0.0.1:5173', backend='http://127.0.0.1:8189';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage();const errors=[],requests=[],searches=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
page.on('pageerror',e=>errors.push(e.message));
await page.setRequestInterception(true);
page.on('request',async req=>{
 const u=new URL(req.url());if(!u.pathname.startsWith('/api/v1/'))return req.continue();
 const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};
 try{
  if(req.method()==='OPTIONS')return await req.respond({status:204,headers});
  if(req.method()!=='GET')assert.match(u.pathname,/^\/api\/v1\/(emergency-fund|admin\/emergency-funds)(\/|$)/,'Unexpected API write');
  if(u.pathname==='/api/v1/admin/emergency-funds')searches.push({at:Date.now(),term:u.searchParams.get('search')});
  requests.push({path:u.pathname,method:req.method()});
  const r=await fetch(backend+u.pathname+u.search,{method:req.method(),headers:{Accept:'application/json','Content-Type':'application/json',...(req.headers().authorization?{Authorization:req.headers().authorization}:{})},...(req.postData()?{body:req.postData()}:{})});
  await req.respond({status:r.status,headers,contentType:'application/json',body:await r.text()});
 }catch(e){errors.push(e.message);if(!req.isInterceptResolutionHandled())await req.abort();}
});
const click=async text=>{const ok=await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t);if(!b)return false;b.click();return true;},text);assert.ok(ok,`Button missing: ${text}`);};
const waitText=t=>page.waitForFunction(v=>document.body.innerText.includes(v),{},t);
const fill=async(selector,value)=>{await page.$eval(selector,el=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'');el.dispatchEvent(new Event('input',{bubbles:true}));});await page.type(selector,value,{delay:15});};
const submit=selector=>page.$eval(selector,el=>el.requestSubmit());
async function login(kind,path){await page.evaluate(a=>{sessionStorage.setItem('mediglaxo_session_token',a.token);sessionStorage.setItem('mediglaxo_session_user',JSON.stringify(a.user));},auth[kind]);await page.goto(origin+path,{waitUntil:'networkidle0'});}
async function current(kind='member'){const r=await fetch(backend+'/api/v1/emergency-fund',{headers:{Authorization:`Bearer ${auth[kind].token}`,Accept:'application/json'}});assert.equal(r.status,200);return r.json();}
const proof='../docs/emergency-fund-2026-11-06';fs.mkdirSync(proof,{recursive:true});
try{
 await page.setViewport({width:390,height:844});await page.goto(origin,{waitUntil:'networkidle0'});
 await login('other','/emergency-fund');await waitText('Eligibility pending');assert.equal(await page.$('form [name="reason"]'),null);
 await login('member','/emergency-fund');await waitText('Eligible — you can request support');
 assert.equal((await current()).eligibility.total,99);assert.equal((await current()).eligibility.direct,27);
 await page.screenshot({path:`${proof}/website-eligibility-mobile.png`,fullPage:true});
 await page.type('textarea[name=reason]','Family emergency test request');
 for(const [name,value] of Object.entries({account_holder:'Fund Test Member',bank_name:'Test Bank',bank_account:'123456789012',bank_ifsc:'TEST0000123'}))await fill(`[name=${name}]`,value);
 await page.click('form input[type=checkbox]');
 await page.$eval('textarea[name=reason]',el=>el.closest('form').requestSubmit());
 await waitText('You already have an active fund request');
 let data=await current();assert.equal(data.funds.data.length,1);const id=data.funds.data[0].id;assert.equal(data.funds.data[0].status,'requested');assert.ok(!('bank_details' in data.funds.data[0]));
 await login('admin','/admin/emergency-funds');await waitText(`Fund #${id}`);
 for(const action of ['approve','process','disburse']){
  await page.select('article select[aria-label^="Action"]',action);
  await fill('article input[name=note]',`${action} confirmed using isolated test records`);
  if(action==='disburse'){await fill('article input[name=reference]','TEST-DISBURSAL001');await page.click('article input[type=checkbox]');}
  await submit('article form');
  const status={approve:'approved',process:'processing',disburse:'disbursed'}[action];
  await page.waitForFunction(s=>document.querySelector('article > div > strong')?.textContent===s,{},status);
 }
 await page.screenshot({path:`${proof}/website-admin-mobile.png`,fullPage:true});
 await login('member','/emergency-fund');await waitText('Repay Emergency Fund');
 await page.select('article select','bank');await fill('article input[name=amount]','1500');await fill('article input[name=reference]','TEST-REPAYMENT001');await submit('article form');
 await waitText('TEST-REPAYMENT001');data=await current();assert.equal(data.funds.data[0].repaid_paise,0);assert.equal(data.funds.data[0].available_repayment_paise,350000);
 await login('admin','/admin/emergency-funds');await waitText('Bank verification note / rejection reason');
 await fill('article form:has(select[name=action]) input[name=note]','Test bank receipt checked');await page.click('article form:has(select[name=action]) input[type=checkbox]');await submit('article form:has(select[name=action])');
 await page.waitForFunction(()=>document.querySelector('article .grid p:nth-child(2) strong')?.textContent==='₹1,500.00');
 data=await current();assert.equal(data.funds.data[0].repaid_paise,150000);
 await login('member','/emergency-fund');await waitText('Repay Emergency Fund');
 await fill('article input[name=amount]','3500');await page.click('article form input[type=checkbox]');await submit('article form');
 await page.waitForFunction(()=>document.querySelector('article > div > strong')?.textContent==='repaid');
 data=await current();assert.equal(data.funds.data[0].repaid_paise,500000);assert.equal(data.funds.data[0].outstanding_paise,0);assert.equal(data.eligibility.can_request,false);
 await page.screenshot({path:`${proof}/website-repaid-mobile.png`,fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewport({width:1440,height:1000});await page.screenshot({path:`${proof}/website-repaid-desktop.png`,fullPage:true});
 await login('admin','/admin/emergency-funds');const before=searches.length;
 await page.type('[aria-label="Search fund member"]','nomatch',{delay:30});const finished=Date.now();assert.equal(searches.length,before);await pause(550);
 assert.equal(searches.at(-1).term,'nomatch');assert.ok(searches.at(-1).at-finished>=400);
 await waitText('No fund requests yet.');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(`${proof}/browser-verification.json`,JSON.stringify({passed:true,requests:requests.length,errors,proof:'Real browser → isolated Laravel → SQLite; no production API requests',fund_id:id},null,2));
 console.log('PASS: eligibility, bank privacy, request, super-admin approval/disbursement, bank verification, wallet consent repayment, history, cooldown, 450ms search, responsive layout.');
}catch(e){await page.screenshot({path:`${proof}/website-failure.png`,fullPage:true});console.error((await page.$eval('body',el=>el.innerText)).slice(-4500));throw e;}
finally{await browser.close();}
