const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const catalog=JSON.parse(fs.readFileSync('data/starter-skills.json','utf8'));
function setup(){
 let data=[];
 const context=vm.createContext({window:{},chrome:{runtime:{},storage:{local:{get(keys,cb){cb({skills:structuredClone(data)})},set(value,cb){data=structuredClone(value.skills);cb()}}}}});
 vm.runInContext(fs.readFileSync('utils/storage.js','utf8'),context);
 return context.window.SkilltapeStorage;
}
test('starter catalog imports offline and retains attribution through export and re-import',async()=>{
 const storage=setup();await storage.importJSON(JSON.stringify(catalog),{mode:'merge'});
 const exported=JSON.parse(await storage.exportJSON());assert.equal(exported.skills.length,6);
 assert.equal(new Set(exported.skills.map(s=>s.id)).size,6);
 for(const skill of exported.skills){assert.equal(skill.license,'MIT');assert.match(skill.source,/https:\/\/github.com\/(mattpocock\/skills|obra\/superpowers)\/blob\/[a-f0-9]{40}\//);assert.match(skill.content,/Copyright \(c\)/);assert.match(skill.content,/Permission is hereby granted/);assert.match(skill.content,/Chat-ready adaptation/)}
 const other=setup();await other.importJSON(JSON.stringify(exported));assert.deepEqual(JSON.parse(await other.exportJSON()),exported);
});
test('reimporting starters cannot overwrite a user-edited prompt',async()=>{
 const storage=setup();await storage.importJSON(JSON.stringify(catalog),{mode:'merge'});
 const first=catalog.skills[0];await storage.updateSkill(first.id,{content:'My custom prompt'});
 await storage.importJSON(JSON.stringify(catalog),{mode:'merge'});
 const result=await storage.getSkills();assert.equal(result.length,6);assert.equal(result.find(s=>s.id===first.id).content,'My custom prompt');
});
