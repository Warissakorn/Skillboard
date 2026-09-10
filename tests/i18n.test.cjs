const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
async function setup(language='en',saved){
 const handlers={},changes=[],attributes={},errors=[];
 const select={value:'',addEventListener:(name,fn)=>{handlers[name]=fn}};
 const title={dataset:{i18n:'＋ เพิ่ม Skill'}};
 let listener,stored=saved;
 const chrome={storage:{local:{get:async()=>({language:stored}),set:async data=>{stored=data.language}},onChanged:{addListener:fn=>{listener=fn}}}};
 const c=vm.createContext({navigator:{language},chrome,Event:class{constructor(type){this.type=type}},showToast:message=>errors.push(message),document:{documentElement:attributes,querySelectorAll:selector=>selector==='[data-i18n]'?[title]:[],getElementById:()=>select,dispatchEvent:event=>changes.push(event.type)}});
 vm.runInContext(fs.readFileSync('popup/i18n.js','utf8'),c);await vm.runInContext('languageReady',c);
 return {run:code=>vm.runInContext(code,c),title,select,attributes,changes,chrome,errors,change:async value=>{select.value=value;await handlers.change({target:select})},external:value=>listener({language:{newValue:value}},'local'),stored:()=>stored};
}
test('language selection uses saved preference, browser language and English fallback',async()=>{
 const th=await setup('en-US','th');assert.equal(th.attributes.lang,'th');assert.equal(th.title.textContent,'＋ เพิ่ม Skill');
 const en=await setup('fr-FR');assert.equal(en.attributes.lang,'en');assert.equal(en.title.textContent,'+ Add skill');
 const auto=await setup('th-TH');assert.equal(auto.attributes.lang,'th');
});
test('language changes persist and external changes update translated controls',async()=>{
 const h=await setup('th');await h.change('en');assert.equal(h.stored(),'en');assert.equal(h.title.textContent,'+ Add skill');
 assert.equal(h.run('t("พบ {count} skills",{count:6})'),'6 skills found');
 assert.equal(h.run('t("custom storage error")'),'custom storage error');assert.equal(h.run('t(undefined)'),'');
 h.external('th');assert.equal(h.title.textContent,'＋ เพิ่ม Skill');assert.ok(h.changes.includes('languagechange'));
});
test('failed language persistence restores selector and reports failure',async()=>{
 const h=await setup('th');h.chrome.storage.local.set=async()=>{throw Error('full')};await h.change('en');
 assert.equal(h.select.value,'th');assert.equal(h.attributes.lang,'th');assert.equal(h.errors.length,1);
});
