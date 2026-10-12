const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../docs/app.js'), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, name);
  const firstEnd = source.indexOf('\n', start);
  const end = source.slice(start, firstEnd).endsWith('}') ? firstEnd : source.indexOf('\n}', start) + 2;
  return source.slice(start, end);
}
const values = new Map();
let fail = () => false;
const storage = {getItem:key=>values.get(key) ?? null, removeItem:key=>values.delete(key), setItem:(key,value)=>{if(fail(key,value))throw new Error('Test quota failure');values.set(key,String(value));}};
const ctx = vm.createContext({Date, console, localStorage:storage, SETTINGS_KEY:'settings',ACCOUNTS_KEY:'accounts',NOTES_KEY:'notes',SNAPSHOTS_KEY:'snapshots',MAX_SNAPSHOTS:4,VERSION:'5.65.0',_settingsCache:null,_demoMode:false,_calcVer:0,currentAccountId:'main',updateAccountSwitcher:()=>{},_showSaveError:()=>{},state:{accounts:[{id:'main',name:'Checking',type:'checking'},{id:'savings',name:'Savings',type:'savings'}],transactions:[{type:'expense',amount:10,date:'2026-10-01'}],startingBalance:200,weekly_plan:{bills:'25'},budgets:{Food:50},bills:[],goals:[],challenges:[],notes:[{text:'Original note'}]}});
for (const fn of ['defaultAccounts','accountDataKey','loadSettings','saveSettings','loadNotes','saveNotes','_save','_saveAccounts','_loadAccountData','_buildBackupPayload','_payloadTxnCount','loadSnapshots','_writeSnapshots','takeSnapshot','backupPreviewData','_applyBackupPayload','restoreBackupWithUndo']) vm.runInContext(extract(fn),ctx);
ctx._save();ctx._saveAccounts();ctx.saveNotes(ctx.state.notes);ctx.saveSettings({theme:'gengar'});storage.setItem(ctx.accountDataKey('savings'),JSON.stringify({startingBalance:500,transactions:[]}));
const original=JSON.parse(JSON.stringify(ctx._buildBackupPayload()));
const incoming=JSON.parse(JSON.stringify(original));incoming.accounts[0].name='New Checking';incoming.accountData.main.startingBalance=300;incoming.accountData.main.transactions[0].amount='22.5';incoming.accountData.savings.startingBalance=777;incoming.settings.theme='light';incoming.notes=[{text:'Incoming note'}];
const current=()=>({accounts:JSON.parse(storage.getItem('accounts')),main:JSON.parse(storage.getItem(ctx.accountDataKey('main'))),savings:JSON.parse(storage.getItem(ctx.accountDataKey('savings'))),settings:JSON.parse(storage.getItem('settings')),notes:JSON.parse(storage.getItem('notes'))});
const before=current();
fail=key=>key==='snapshots';assert.throws(()=>ctx.restoreBackupWithUndo(incoming),/undo point/);assert.deepEqual(current(),before,'no mutation when undo point cannot be saved');
fail=(key,value)=>key===ctx.accountDataKey('savings')&&value.includes('777');assert.throws(()=>ctx.restoreBackupWithUndo(incoming),/previous data has been kept/);assert.deepEqual(current(),before,'all affected values roll back after a later account write fails');assert.equal(ctx.state.startingBalance,200);assert.equal(ctx.currentAccountId,'main');assert.equal(ctx.loadSettings().theme,'gengar');
fail=()=>false;ctx.restoreBackupWithUndo(incoming);assert.equal(ctx.state.startingBalance,300);assert.equal(ctx.state.transactions[0].amount,22.5,'valid numeric values normalized before storage');assert.equal(ctx.loadSettings().theme,'light');assert.equal(ctx.state.notes[0].text,'Incoming note');assert.equal(JSON.parse(storage.getItem(ctx.accountDataKey('savings'))).startingBalance,777);
const undo=ctx.loadSnapshots().at(-1).payload;ctx.restoreBackupWithUndo(undo);assert.deepEqual(current(),before,'undo restores names, balances, transactions, settings and notes');
ctx.currentAccountId='savings';ctx._loadAccountData('savings');ctx.restoreBackupWithUndo({accounts:original.accounts,currentAccountId:'main',transactions:[{type:'income',amount:25,date:'2026-10-01'}]});assert.equal(ctx.currentAccountId,'main','legacy backup uses declared account');assert.equal(ctx.state.startingBalance,0,'missing legacy opening balance cannot inherit current balance');assert.equal(ctx.state.transactions[0].amount,25);assert.deepEqual(JSON.parse(storage.getItem(ctx.accountDataKey('savings'))),{},'legacy accounts without data do not inherit old balances');
assert.throws(()=>ctx.restoreBackupWithUndo({transactions:[],notes:{}}),/Invalid notes/);
assert.throws(()=>ctx.restoreBackupWithUndo({transactions:[],weekly_plan:[]}),/Invalid weekly_plan/);
console.log('Backup restore checks passed: failed undo point, partial-write rollback, normalized amounts, all-account restore and undo, settings/notes, legacy account selection, and malformed payloads.');
