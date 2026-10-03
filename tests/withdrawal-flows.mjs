import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox'],defaultViewport:{width:1440,height:1000}});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
let user={id:99,name:'Test Buyer',email:'test@example.test',phone:'9876543210',role:'customer',status:'active',wallet_balance:1500};
let requests=[],submitted,actions=[];
const paged=data=>({data,current_page:1,last_page:1});
await page.setRequestInterception(true);
page.on('request',async r=>{
 if(!r.url().includes('/api/v1/'))return r.continue();
 if(r.method()==='OPTIONS')return r.respond({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'}});
 const path=new URL(r.url()).pathname.replace('/api/v1','');let data={success:true,stats:{},data:[],users:paged([]),transactions:paged([]),products:[],categories:[]};
 if(path==='/auth/profile')data={success:true,user};
 if(path==='/mlm/wallet')data={success:true,balance:user.wallet_balance,transactions:paged([])};
 if(path==='/mlm/payout-requests'||path==='/admin/payouts')data={success:true,payouts:paged(requests)};
 if(path==='/mlm/payout-preview')data={success:true,summary:{amount:1000,tds_rate:5,tds_amount:50,net_payable:950,remaining_balance:500}};
 if(path==='/mlm/payout-request'){
  submitted=JSON.parse(r.postData());user.wallet_balance=500;
  requests=[{id:1,amount:1000,admin_fee:50,net_payable:950,status:'pending',account_details:'Test Bank · ••••8901',user:{name:user.name},events:[]}];data={success:true,payout:requests[0]};
 }
 if(path==='/admin/payouts/1/process'){
  const p=JSON.parse(r.postData());actions.push(p.action);requests[0].status={approve:'approved',process:'processing',success:'success'}[p.action];requests[0].transaction_ref=p.transaction_ref;data={success:true,payout:requests[0]};
 }
 await r.respond({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'},body:JSON.stringify(data)});
});
const wait=t=>page.waitForFunction(t=>document.body.innerText.includes(t),{},t);
const click=async t=>{assert(await page.evaluate(t=>{const e=[...document.querySelectorAll('button,a')].find(e=>e.textContent.trim()===t);e?.click();return !!e},t),`Missing ${t}`)};
async function session(){await page.evaluate(u=>{localStorage.setItem('mediglaxo_token','test-token');localStorage.setItem('mediglaxo_user',JSON.stringify(u));localStorage.setItem('mediglaxo_login_time',Date.now().toString())},user)}
try {
 await page.goto('http://127.0.0.1:5173/login',{waitUntil:'networkidle0'});await session();await page.goto('http://127.0.0.1:5173/mlm/wallet',{waitUntil:'networkidle0'});
 await page.type('[aria-label="Withdrawal amount"]','1000');
 for(const [key,value] of Object.entries({bank_name:'Test Bank',bank_account:'12345678901',bank_ifsc:'TEST0123456'}))await page.type(`[name="${key}"]`,value);
 await click('Review withdrawal');await wait('₹950.00');assert.equal(submitted,undefined);
 await click('Confirm withdrawal request');await wait('Withdrawal requested.');assert.equal(submitted.amount,1000);assert.equal(submitted.bank_ifsc,'TEST0123456');assert.match(submitted.request_key,/^[a-f0-9-]{36}$/);assert.equal(user.wallet_balance,500);
 await page.setViewport({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'/tmp/mgpjn-verification/withdrawal-mobile.png',fullPage:true});
 user={...user,role:'super_admin'};await session();await page.setViewport({width:1440,height:1000});await page.goto('http://127.0.0.1:5173/admin/wallet',{waitUntil:'networkidle0'});await page.evaluate(()=>[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Payout & Withdrawal Requests'))?.click());await wait('Withdrawal requests');
 await click('Approve');await click('Confirm');await wait('Start processing');assert.deepEqual(actions,['approve']);
 await click('Start processing');await click('Confirm');await wait('Mark success');await click('Mark success');
 const modal='[role="dialog"]';await page.type(`${modal} input`,'TEST-UTR');await click('Confirm');await page.evaluate(()=>document.querySelector('article details')?.setAttribute('open',''));await wait('UTR: TEST-UTR');assert.deepEqual(actions,['approve','process','success']);assert.equal(user.wallet_balance,500);
 assert.deepEqual(errors,[]);console.log('PASS: bank form, ₹1,000 preview / ₹50 TDS / ₹950 net, confirmed request, mobile layout, admin approve→processing→success and unchanged reserved balance. All requests mocked; no real bank transfer.');
} finally{await browser.close()}
