const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../docs/app.js'), 'utf8');
let settings={autoBackup:true},writes=0,requests=0,permission='prompt',forcedError=false,existing=2,fresh=2,queries=0;
const handle={name:'backup.json',queryPermission:async()=>{queries++;return permission},requestPermission:()=>{requests++;return Promise.resolve(permission==='denied'?'denied':'granted')},getFile:async()=>({text:async()=>JSON.stringify({transactions:Array(existing).fill({})})}),createWritable:async()=>{if(forcedError)throw new Error('disk');return{write:async()=>{writes++},close:async()=>{}}}};
const ctx=vm.createContext({console,Date,window:{showSaveFilePicker:()=>{}},today:()=> '2026-11-25',loadSettings:()=>({...settings}),saveSettings:s=>settings=s,markBackupDone:()=>{},_fsGetHandle:()=>handle,_buildBackupPayload:()=>({transactions:Array(fresh).fill({})}),_payloadTxnCount:p=>(p.transactions||[]).length});
vm.runInContext('let _backupResumeTask=null;',ctx);
for(const name of ['autoBackupSupported','_writeAutoBackup','maybeAutoBackup','resumeAutoBackup']){let start=source.indexOf(`function ${name}(`);if(source.slice(start-6,start)==='async ')start-=6;vm.runInContext(source.slice(start,source.indexOf('\n}',start)+2),ctx)}
(async()=>{
 let r=await ctx.maybeAutoBackup();assert.equal(r.state,'needs-permission');assert.equal(r.handle,handle);assert.equal(requests,0,'boot never opens native permission');
 const first=ctx.resumeAutoBackup(()=>handle);assert.equal(requests,1,'cached handle requests permission synchronously inside click');const second=ctx.resumeAutoBackup(()=>handle);assert.equal(first,second,'double clicks share one task');assert.equal((await first).state,'written');assert.equal(writes,1);assert.equal(settings.lastAutoBackup,'2026-11-25');assert.equal((await ctx.maybeAutoBackup()).state,'done-today');assert.equal(requests,1);
 delete settings.lastAutoBackup;permission='denied';r=await ctx.resumeAutoBackup(()=>handle);assert.equal(r.state,'denied');assert.equal(writes,1);
 permission='granted';r=await ctx.maybeAutoBackup();assert.equal(r.state,'written');assert.equal(writes,2,'granted permission writes silently');assert.equal(requests,2,'automatic backup never requests again');
 delete settings.lastAutoBackup;fresh=0;existing=3;r=await ctx.resumeAutoBackup(()=>handle);assert.equal(r.state,'refused');assert.equal(writes,2,'populated backup is protected');assert(!settings.lastAutoBackup);
 fresh=2;forcedError=true;assert.equal((await ctx.resumeAutoBackup(()=>handle)).state,'error');assert(!settings.lastAutoBackup);forcedError=false;
 assert.equal((await ctx.resumeAutoBackup(()=>null)).state,'no-handle');assert.equal((await ctx.maybeAutoBackup(()=>null)).state,'no-handle');
 assert.equal((await ctx.resumeAutoBackup(()=>Promise.resolve(handle))).state,'written','async injected handle still supported');
 settings.autoBackup=false;assert.equal((await ctx.maybeAutoBackup()).state,'off');
 console.log('Auto-backup checks passed: no startup permission request, synchronous native request from cached handle, coalesced taps, silent granted access, once daily, denial, missing handle, protected populated backups, write errors, and retry.');
})().catch(e=>{console.error(e);process.exitCode=1});
