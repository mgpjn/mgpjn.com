import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';
const user={id:999,name:'Customer Pricing Fixture',role:'customer',phone:'9000000000',wallet_balance:0};
const product={id:86,name:'Customer Price Test Syrup',slug:'customer-price-test',category_id:1,price:190,retail_price:190,mrp:210,wholesale_price:700,sd_price:27,dist_price:35,subd_price:45,retailer_price:55,is_assigned:true,stock:100,strip_unit:'Bottle',strip_packing:'1 Bottle (200 ml)',box_unit:'Box',box_packing:'10 Bottles',wholesale_min_qty:5,image:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="lightblue"/></svg>'};
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.evaluateOnNewDocument(u=>{sessionStorage.setItem('mediglaxo_session_token','isolated-price-test');sessionStorage.setItem('mediglaxo_session_user',JSON.stringify(u));localStorage.removeItem('mediglaxo_cart');},user);
await page.setRequestInterception(true);page.on('request',async req=>{const url=new URL(req.url());if(!url.pathname.startsWith('/api/v1/'))return req.continue();const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'*'};if(req.method()==='OPTIONS')return req.respond({status:204,headers});assert.equal(req.method(),'GET');let body={success:true};if(url.pathname.endsWith('/auth/profile'))body.user=user;else if(url.pathname.endsWith('/categories'))body.categories=[];else if(url.pathname==='/api/v1/products')body.products={data:[product],total:1,current_page:1,last_page:1};else if(url.pathname.startsWith('/api/v1/products/')){body.product=product;body.related=[];}return req.respond({status:200,headers,contentType:'application/json',body:JSON.stringify(body)});});
try{
 await page.setViewport({width:390,height:844});
 for(const path of ['/shop','/product/customer-price-test']){
  await page.goto('http://127.0.0.1:5173'+path,{waitUntil:'networkidle0'});await page.waitForFunction(()=>document.body.innerText.includes('Customer Price Test Syrup'));
  const body=await page.$eval('body',el=>el.innerText);assert.ok(!body.includes('Wholesale'));assert.ok(!body.includes('₹700'));assert.ok(body.includes('190'));
 }
 await page.screenshot({path:'../docs/customer-pricing-2026-11-06/customer-retail-only.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('PASS: assigned customer catalog/detail show only retail, no wholesale selector or purchase rate.');
}finally{await browser.close();}
