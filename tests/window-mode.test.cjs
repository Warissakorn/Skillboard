const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(search='') {
  const calls = [], messages = [], button = {addEventListener(){},setAttribute(){}};
  const cardButton = {addEventListener(){},setAttribute(key,value){this[key]=value}};
  const window = {location:{search},close(){calls.push('close')}};
  const chrome = {
    runtime:{getURL:path=>'chrome-extension://test/'+path},
    windows:{getCurrent:async()=>({id:7,width:360,height:480}),update:async(id,size)=>{calls.push({id,...size})},create:async options=>{calls.push(options)}},
    tabs:{query:async query=>{calls.push(query);return [{id:25}]}},
  };
  const context = vm.createContext({t:(key,values={})=>key.replace(/\{(\w+)\}/g,(m,n)=>values[n]??m),window,chrome,URL,URLSearchParams,document:{addEventListener(){},body:{classList:{add(){},toggle(){}}},getElementById:id=>id === "cardModeBtn" ? cardButton : button},showToast:message=>messages.push(message)});
  vm.runInContext(fs.readFileSync('popup/window-mode.js','utf8'),context);
  return {api:window.SkilltapeWindow,chrome,calls,messages,button,cardButton};
}
test('mini window targets active tab in source window, never itself',async()=>{
  const h=setup('?mode=mini&sourceWindow=7');
  assert.equal((await h.api.getTargetTab()).id,25);
  assert.equal(h.calls[0].windowId,7);
  assert.equal(h.calls[0].currentWindow,undefined);
  assert.equal(h.button.hidden,true);
});
test('toolbar popup targets its current window',async()=>{
  const h=setup();await h.api.getTargetTab();assert.equal(h.calls[0].currentWindow,true);
});
test('missing source fails safely instead of inserting into another window',async()=>{
  const h=setup('?mode=mini');await assert.rejects(h.api.getTargetTab());assert.equal(h.calls.length,0);
});
test('open creates small resizable popup before closing toolbar popup',async()=>{
  const h=setup();await h.api.openMiniWindow();
  assert.equal(h.calls[0].type,'popup');assert.equal(h.calls[0].width,360);assert.equal(h.calls[0].height,420);
  assert.equal(new URL(h.calls[0].url).searchParams.get('sourceWindow'),'7');assert.equal(h.calls[1],'close');
});
test('failed open retains toolbar popup and allows retry',async()=>{
  const h=setup();h.chrome.windows.create=async()=>{throw new Error('failed')};await h.api.openMiniWindow();
  assert.equal(h.calls.includes('close'),false);assert.equal(h.button.disabled,false);assert.equal(h.messages.length,1);
});
test('repeated click during window creation creates only one window',async()=>{
  const h=setup();let release,count=0;h.chrome.windows.create=async()=>{count++;await new Promise(r=>release=r)};
  const pending=h.api.openMiniWindow();await Promise.resolve();await h.api.openMiniWindow();assert.equal(count,1);release();await pending;
});
test('card mode toggles in toolbar without opening or resizing a browser window',async()=>{
  const h=setup();await h.api.toggleCardMode();assert.equal(h.cardButton['aria-pressed'],'true');assert.equal(h.calls.length,0);
  await h.api.toggleCardMode();assert.equal(h.cardButton['aria-pressed'],'false');
});
test('mini window defaults to cards and cannot switch to vertical scrolling',async()=>{
  const h=setup('?mode=mini&sourceWindow=7');
  assert.equal(h.cardButton['aria-pressed'],'true');assert.equal(h.cardButton.hidden,true);
  await h.api.toggleCardMode();assert.equal(h.calls.length,0);assert.equal(h.cardButton['aria-pressed'],'true');
});
test('opening detached window preserves cards layout',async()=>{
  const h=setup();await h.api.toggleCardMode();await h.api.openMiniWindow();
  assert.equal(new URL(h.calls[0].url).searchParams.get('layout'),'cards');assert.equal(h.calls[0].height,420);
});
