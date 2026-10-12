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
const context = vm.createContext({Date, localMonthKey:()=> '2026-10', today:()=> '2026-10-12', state:{bills:[],weekly_plan:{}}, defaultAccounts:()=>[{id:'main',name:'Main',type:'checking'}], _demoMode:false, _buildBackupPayload:()=>({transactions:[{amount:5}]}), loadSnapshots:()=>[], _writeSnapshots:()=>true, MAX_SNAPSHOTS:4, _payloadTxnCount:()=>1});
for (const fn of ['billDueDay','billPaidMonths','isBillPaidFor','billsStillDueTotal','weeklyBillsReserve','weeklySpendingSummary','calculateBillHealth','recordedCashflow','backupPreviewData','takeSnapshot']) vm.runInContext(extract(fn),context);
const bills=[{amount:100,dueDay:1,paidMonths:[]},{amount:45,dueDay:19,paidMonths:[]}];
assert.equal(context.weeklyBillsReserve({bills:'340'},bills),340);
assert.equal(context.weeklyBillsReserve({bills:'340',bills_source:'tracked'},bills),145);
bills[0].paidMonths.push('2026-10');
assert.equal(context.weeklyBillsReserve({bills:'340',bills_source:'tracked'},bills),45,'tracked reserve follows payments');
assert.equal(context.weeklyBillsReserve({bills:'340'},bills),340,'manual reserve does not move');
assert.equal(context.weeklyBillsReserve({bills:'340',bills_source:'tracked'},bills,'2026-11'),145,'payment month remains scoped');
assert.equal(context.weeklySpendingSummary(200,12,50).left,38);
assert.equal(context.weeklySpendingSummary(200,12,300).left,188,'target cannot raise available spending');
assert.equal(context.weeklySpendingSummary(0,12,50).left,0,'buffer protection takes precedence');
assert.equal(context.weeklySpendingSummary(200,12).left,188,'legacy plan without target');
assert.equal(context.calculateBillHealth([{dueDay:19,paidMonths:[]}],'2026-10').score,25,'future bill does not lower score');
assert.equal(context.calculateBillHealth([{dueDay:12,paidMonths:[]}],'2026-10').score,25,'today is not late');
assert.equal(context.calculateBillHealth([{dueDay:1,paidMonths:[]}],'2026-10').score,0,'overdue bill lowers score');
assert.equal(context.calculateBillHealth([{dueDay:1,paidMonths:['2026-10']},{dueDay:19,paidMonths:[]}],'2026-10').score,25);
assert.equal(context.calculateBillHealth([{dueDay:31,paidMonths:[]}],'2026-02','2026-02-28').dueToday,1,'short-month due date is shared');
const flow=context.recordedCashflow([
 {date:'2026-10-01',type:'income',amount:1000},
 {date:'2026-10-02',type:'expense',amount:100,_billTxnId:'rent'},
 {date:'2026-10-03',type:'expense',amount:20,excludeFromBudget:true},
 {date:'2026-10-04',type:'expense',amount:500,_xfer:true},
 {date:'2026-10-05',type:'income',amount:800,category:'Adjustment',excludeFromBudget:true},
 {date:'2026-10-13',type:'expense',amount:50},
], '2026-10-01','2026-10-12');
assert.equal(flow.income,1000);assert.equal(flow.expense,120);assert.equal(flow.count,3,'cashflow includes bills and excludes internal movements and future days');
const data={_multiAccount:true,_backupCreatedAt:'2026-10-12T12:00:00Z',accounts:[{id:'a',name:'Checking',type:'checking'},{id:'b',name:'Loan',type:'loan'}],accountData:{a:{startingBalance:500,transactions:[{type:'income',amount:100},{type:'expense',amount:20}]},b:{startingBalance:1000,transactions:[{type:'income',amount:100},{type:'expense',amount:50}]}}};
const preview=context.backupPreviewData(data);
assert.equal(preview.rows[0].balance,580);assert.equal(preview.rows[1].balance,950);assert.equal(preview.count,4);assert.equal(preview.createdAt,'2026-10-12T12:00:00.000Z');
assert.equal(context.backupPreviewData({transactions:[],startingBalance:25}).rows[0].balance,25,'legacy single-account backup');
assert.throws(()=>context.backupPreviewData({_multiAccount:true}),/Missing account data/);
assert.throws(()=>context.backupPreviewData({...data,accounts:[data.accounts[0],data.accounts[0]]}),/duplicate account/);
assert.throws(()=>context.backupPreviewData({transactions:[{type:'expense',amount:'oops'}]}),/Invalid transactions/);
assert.equal(context.takeSnapshot('before-restore'),true);
context._writeSnapshots=()=>false;assert.equal(context.takeSnapshot('before-restore'),false,'failed undo point is reported');
context._demoMode=true;assert.equal(context.takeSnapshot('before-restore'),false,'demo data does not become an undo point');
console.log('Planning/review checks passed: reserve modes and payment months, target caps, buffer protection, due-date scoring, recorded cashflow, backup previews, legacy formats, malformed files, and undo-point failures.');
