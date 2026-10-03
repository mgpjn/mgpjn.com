import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox'],defaultViewport:{width:1440,height:1000}});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
let user={id:99,name:'Test Partner',email:'test@example.test',role:'super_admin',status:'active'},balance=0,submitted,order={id:1,order_number:'TEST-COD',customer_name:'Buyer',phone:'9876543210',city:'Test',pincode:'394230',subtotal:1000,total_amount:1000,payment_method:'cod',payment_status:'pending',order_status:'delivered'};
const paged=data=>({data,current_page:1,last_page:1,total:data.length});
await page.setRequestInterception(true);
page.on('request',async r=>{
 if(!r.url().includes('/api/v1/'))return r.continue();
 if(r.method()==='OPTIONS')return r.respond({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'}});
 const path=new URL(r.url()).pathname.replace('/api/v1','');let data={success:true,stats:{},data:[],users:paged([]),transactions:paged([]),products:[],categories:[]};
 if(path==='/auth/profile')data={success:true,user};
 if(path==='/admin/orders')data={success:true,orders:paged([order]),summary:{}};
 if(path==='/admin/payments/1/reconcile'){submitted=JSON.parse(r.postData());order={...order,payment_status:'paid'};data={success:true,order};}
 if(path==='/mlm/dashboard')data={success:true,stats:{wallet_balance:balance,stage1_earnings:balance},customer_orders:[],recent_commissions:[],recent_directs:[]};
 await r.respond({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'},body:JSON.stringify(data)});
});
const wait=t=>page.waitForFunction(t=>document.body.innerText.includes(t),{},t);
const click=async t=>assert(await page.evaluate(t=>{const e=[...document.querySelectorAll('button,a')].find(e=>e.textContent.trim()===t);e?.click();return !!e},t),`Missing ${t}`);
async function session(){await page.evaluate(u=>{localStorage.setItem('mediglaxo_token','test-token');localStorage.setItem('mediglaxo_user',JSON.stringify(u));localStorage.setItem('mediglaxo_login_time',Date.now().toString())},user)}
try{
 await page.goto('http://127.0.0.1:5173/login',{waitUntil:'networkidle0'});await session();await page.goto('http://127.0.0.1:5173/admin/orders',{waitUntil:'networkidle0'});
 await click('Record payment received');await wait('Cash collection / receipt reference');assert.equal(await page.$eval('input[placeholder="Cash received — receipt / collection reference"]',e=>e.required),true);
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('input[type="checkbox"]')].some(e=>e.closest('label')?.innerText.includes('Referral Commissions'))),false);
 await page.type('input[placeholder="Cash received — receipt / collection reference"]','TEST-CASH-RECEIPT');
 await page.evaluate(()=>{const e=document.querySelector('input[placeholder="Cash received — receipt / collection reference"]');e.form.requestSubmit()});
 await page.waitForFunction(()=>!document.body.innerText.includes('Record payment received'));
 assert.equal(submitted.payment_method,'cod');assert.equal(submitted.transaction_id,'TEST-CASH-RECEIPT');assert.equal(submitted.trigger_mlm,true);
 user={...user,role:'customer'};await session();await page.goto('http://127.0.0.1:5173/mlm',{waitUntil:'networkidle0'});await wait('Refresh balance');
 balance=100;await click('Refresh balance');await wait('₹100.00');
 balance=130;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await wait('₹130.00');
 await page.setViewport({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 console.log('PASS: explicit COD receipt confirmation, mandatory automatic commissions, orders refresh after payment, wallet refresh on demand/focus, mobile layout. All API calls mocked.');
}finally{await browser.close()}
