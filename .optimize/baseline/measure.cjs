const fs = require('node:fs');
const vm = require('node:vm');
let data = {};
const context = vm.createContext({window:{}, console, crypto:require('node:crypto').webcrypto, chrome:{runtime:{},storage:{local:{get(keys,cb){cb(structuredClone(data));},set(value,cb){Object.assign(data,structuredClone(value)); cb();},async clear(){data={};}}}}});
(async()=>{
  console.log('Command: node .optimize/baseline/measure.cjs');
  console.log('Runtime:', process.version, '; Chrome storage mocked in memory');
  vm.runInContext(fs.readFileSync('utils/storage.js','utf8'),context);
  vm.runInContext(fs.readFileSync('utils/storage.test.js','utf8'),context);
  if(!await context.window.runStorageTests()) process.exitCode=1;
  const elements = new Map();
  function el(id){if(!elements.has(id))elements.set(id,{value:'',hidden:false,addEventListener(){},classList:{add(){},remove(){},toggle(){}},reset(){},focus(){},querySelectorAll(){return[];}});return elements.get(id);}
  let imports=[];
  let saved=[];
  let releases=[];
  const c=vm.createContext({window:{confirm:()=>false,SkilltapeStorage:{importJSON:async(text,options)=>imports.push(options.mode),getSkills:async()=>[],saveSkill:async s=>{saved.push(s);await new Promise(r=>releases.push(r));}}},document:{querySelector:el,getElementById:el},console,setTimeout:()=>1,clearTimeout(){}});
  let js=fs.readFileSync('popup/popup.js','utf8').replace(/refresh\(\);\s*$/,'');
  vm.runInContext(js,c);
  vm.runInContext('refresh = async () => {};',c);
  await vm.runInContext('handleImportFileChange({target:{files:[{text:async()=>"{}"}]}})',c);
  console.log('Import with confirm=false (Cancel):',JSON.stringify(imports));
  el('skillName').value='Example';el('skillContent').value='Prompt';el('skillCategory').value='general';
  const p1=vm.runInContext('handleSubmit({preventDefault(){}})',c);
  const p2=vm.runInContext('handleSubmit({preventDefault(){}})',c);
  console.log('Two submits before storage resolves: saveSkill calls =',saved.length);
  releases.forEach(r=>r());await Promise.all([p1,p2]);
  console.log('UI/content test files:',require('node:child_process').execFileSync('git',['ls-files','*test*'],{encoding:'utf8'}).trim());
})();
