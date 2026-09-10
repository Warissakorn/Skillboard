// Run with NODE_PATH pointing to a Playwright installation, or install playwright locally.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
 const root=path.resolve(__dirname,'..');
 const server=http.createServer(async(req,res)=>{
  try {const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname); if(!file.startsWith(root+path.sep))throw Error();
   const data=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html');res.end(data);
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']}).catch(error=>{server.close();throw error;});
 try {
 const context=await browser.newContext();
 await context.addInitScript(()=>{
  const listeners=[];const db=JSON.parse(localStorage.getItem('test-db')||'{"language":"th","skills":[]}');
  window.chrome={runtime:{getURL:p=>location.origin+'/'+p},storage:{local:{
   get(keys,cb){const result=typeof keys==='string'?{[keys]:db[keys]}:Object.fromEntries(keys.map(k=>[k,db[k]]));if(cb)cb(result);else return Promise.resolve(result)},
   set(data,cb){const changes={};for(const [key,value]of Object.entries(data)){changes[key]={oldValue:db[key],newValue:value};db[key]=value}localStorage.setItem('test-db',JSON.stringify(db));listeners.forEach(fn=>fn(changes,'local'));if(cb)cb();else return Promise.resolve()}
  },onChanged:{addListener(fn){listeners.push(fn)}}},tabs:{query:async()=>[{id:25}],sendMessage(id,msg,cb){window.lastInserted=msg.text;cb({success:true})}},windows:{getCurrent:async()=>({id:7}),create:async()=>{}}};
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const url=`http://127.0.0.1:${server.address().port}/popup/popup.html?mode=mini&sourceWindow=7`;
 await page.setViewportSize({width:360,height:380});await page.goto(url);
 await page.locator('#starterBtn').click();await page.locator('#starterDialog[open]').waitFor();
 assert.equal(await page.locator('.starter-item').count(),6);
 for(let i=0;i<6;i++) {await page.locator('.starter-item').nth(i).locator('button').click();await page.waitForFunction(n=>JSON.parse(localStorage.getItem('test-db')).skills.length===n,i+1);}
 await page.locator('#closeStarterBtn').click();assert.equal(await page.locator('.skill-item').count(),6);
 // Mini shelf scrolls horizontally and all controls fit vertically at supported sizes.
 for(const lang of ['th','en']) {
  await page.locator('#languageSelect').selectOption(lang);
  for(const size of [{width:360,height:380},{width:280,height:300},{width:500,height:420},{width:320,height:260}]) {
   await page.setViewportSize(size);
   const metrics=await page.evaluate(()=>{
    const list=document.querySelector('.list-section');const cards=[...document.querySelectorAll('.skill-item')];
    return {bodyH:document.body.scrollHeight,viewport:innerHeight,listH:list.clientHeight,scrollH:list.scrollHeight,scrollW:list.scrollWidth,listW:list.clientWidth,axis:getComputedStyle(list).overflowY,buttonsFit:cards.every(card=>[...card.querySelectorAll('button')].every(button=>button.getBoundingClientRect().bottom<=list.getBoundingClientRect().bottom-8))};
   });
   assert.ok(metrics.scrollW>metrics.listW,JSON.stringify({lang,size,metrics}));
   assert.equal(metrics.axis,'hidden');assert.ok(metrics.bodyH<=metrics.viewport,JSON.stringify({lang,size,metrics}));
   assert.ok(metrics.scrollH<=metrics.listH+1,JSON.stringify({lang,size,metrics}));assert.ok(metrics.buttonsFit,JSON.stringify({lang,size,metrics}));
  }
 }
 await page.setViewportSize({width:360,height:380});
 assert.equal(await page.locator('#addSkillBtn').innerText(),'+ Add skill');
 await page.reload();await page.waitForFunction(()=>document.documentElement.lang==='en');assert.equal(await page.locator('#languageSelect').inputValue(),'en');
 await page.locator('#addSkillBtn').click();await page.locator('#skillName').fill('My draft');
 await page.evaluate(()=>chrome.storage.local.set({language:'th'}));assert.equal(await page.locator('#skillName').inputValue(),'My draft');assert.equal(await page.locator('#editorTitle').innerText(),'เพิ่ม Skill');await page.locator('#cancelEditBtn').click();
 await page.locator('.use-btn').first().click();assert.ok(await page.evaluate(()=>lastInserted.includes('MIT License')));
 const exported=await page.evaluate(()=>SkilltapeStorage.exportJSON());assert.equal(JSON.parse(exported).skills.length,6);assert.ok(JSON.parse(exported).skills.every(s=>s.source.includes('/blob/')&&s.license==='MIT'&&s.content.includes('Permission is hereby granted')));
 await page.locator('#starterBtn').click();assert.equal(await page.locator('.starter-item button:disabled').count(),6);await page.locator('#closeStarterBtn').click();
 await page.locator('#searchInput').fill('unmatchable-query');await page.locator('#noResultsState').waitFor({state:'visible'});
 await page.locator('#searchInput').fill('');await page.waitForFunction(()=>document.querySelectorAll('.skill-item').length===6);
 await page.screenshot({path:'/tmp/skillboard-mini.png'});
 assert.deepEqual(errors,[]);console.log('Browser smoke passed: 8 viewport/language combinations, starter install/deduplication, persistence, editor preservation, prompt insertion, attribution export and search.');
 } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
