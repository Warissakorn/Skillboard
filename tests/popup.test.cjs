const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(){
 const elements=new Map();
 function make(){return {value:'',hidden:false,disabled:false,textContent:'',children:[],dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},appendChild(c){this.children.push(c)},append(...c){this.children.push(...c)},querySelectorAll(){return[]},reset(){},focus(){},showModal(){this.open=true},close(){this.open=false}};}
 function el(id){if(!elements.has(id))elements.set(id,make());return elements.get(id)}
 let db=[], imports=[], writes=0;
 const storage={getSkills:async()=>structuredClone(db),saveSkill:async s=>{writes++;db.push({...s,id:'new',updatedAt:2});},updateSkill:async(id,p)=>{db=db.map(s=>s.id===id?{...s,...p}:s)},importJSON:async(text,options)=>{imports.push(options.mode)}};
 const c=vm.createContext({window:{confirm:()=>false,SkilltapeStorage:storage},document:{querySelector:el,getElementById:el,createElement:make,createDocumentFragment:make},console,setTimeout:()=>1,clearTimeout(){}});
 vm.runInContext(fs.readFileSync('popup/popup.js','utf8').replace(/refresh\(\)(?:\.catch\([^\n]+\))?;\s*$/,''),c);
 return {el,c,storage,imports,run:s=>vm.runInContext(s,c),db:()=>db,writes:()=>writes,seed:v=>{db=v}};
}
test('search covers Thai category, case-insensitive content and tags; category filters combine',()=>{const h=setup();h.run('state.skills=[{id:"a",name:"Alpha",content:"HELLO",category:"coding",tags:["special"],updatedAt:1},{id:"b",name:"Beta",content:"world",category:"writing",updatedAt:2}]');for(const q of ['hello','โค้ดดิ้ง','special'])assert.equal(h.run(`matchesSearch(state.skills[0],${JSON.stringify(q)})`),true);assert.equal(h.run('matchesCategory(state.skills[0],"writing")'),false);h.run('state.searchTerm="alpha";state.categoryFilter="coding";render()');assert.equal(h.el('resultCount').textContent,'พบ 1 skills');});
test('empty and no-results states differ',()=>{const h=setup();h.run('render()');assert.equal(h.el('emptyState').hidden,false);h.run('state.skills=[{name:"a",content:"b",category:"general"}];state.searchTerm="missing";render()');assert.equal(h.el('emptyState').hidden,true);assert.equal(h.el('noResultsState').hidden,false)});
test('blank submission is rejected and valid create saves trimmed values',async()=>{const h=setup();await h.run('handleSubmit({preventDefault(){}})');assert.equal(h.writes(),0);h.el('skillName').value=' Name ';h.el('skillContent').value=' Prompt ';h.el('skillCategory').value='coding';await h.run('handleSubmit({preventDefault(){}})');assert.equal(h.db()[0].name,'Name');assert.equal(h.db()[0].content,'Prompt')});
test('edit updates existing id and keeps tags',async()=>{const h=setup();h.seed([{id:'a',name:'old',content:'text',category:'coding',tags:['keep']}]);h.run('enterEditMode({id:"a",name:"old",content:"text",category:"coding"})');h.el('skillName').value='new';await h.run('handleSubmit({preventDefault(){}})');assert.equal(h.db().length,1);assert.equal(h.db()[0].name,'new');assert.deepEqual(h.db()[0].tags,['keep']);assert.equal(h.writes(),0)});
module.exports={setup};
test('import cancel performs zero writes; merge is explicit; replace requires confirmation',async()=>{const h=setup();const select=()=>h.run('handleImportFileChange({target:{files:[{text:async()=>"{}"}]}})');await select();h.run('cancelImport()');await h.run('confirmImport("merge")');assert.equal(h.imports.length,0);await select();await h.run('confirmImport("replace")');assert.equal(h.imports.length,0);await h.run('confirmImport("merge")');assert.deepEqual(h.imports,['merge']);await select();h.run('window.confirm=()=>true');await h.run('confirmImport("replace")');assert.deepEqual(h.imports,['merge','replace'])});
