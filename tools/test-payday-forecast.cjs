const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../docs/app.js'), 'utf8');
const context = vm.createContext({Date});
for (const name of ['billOccurrenceDate','billOccurrenceAmount','calculatePaydayForecast', 'billDueDay', 'shiftMonthKey']) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0);
  vm.runInContext(source.slice(start, source.indexOf('\n}', start) + 2), context);
}
const calculate = (overrides = {}, day = '2026-10-27') => context.calculatePaydayForecast({
  account:{type:'checking',paySchedule:{enabled:true,amount:1500,nextPayDate:'2026-11-03'}},
  startingBalance:1000, transactions:[], bills:[], plan:{stop_at:200,bills_source:'tracked'}, ...overrides,
}, day);
let f = calculate({bills:[{name:'Internet',amount:100,dueDay:28,paidMonths:[]},{name:'Rent',amount:300,dueDay:1,paidMonths:['2026-10']}]});
assert.equal(f.balance,1000);assert.equal(f.lowest,600);assert.equal(f.lowestDate,'2026-11-01');
assert.equal(f.allowance,400);assert.equal(f.billsTotal,400);assert.equal(f.days,7);assert.equal(f.perDay,57.14);
assert.equal(f.paycheck,1500,'expected pay does not raise today’s spending allowance');
assert.equal(f.beforePay,600);
const bills = [{amount:100,dueDay:28,paidMonths:['2026-10']},{amount:300,dueDay:1,paidMonths:['2026-10','2026-11']}];
assert.equal(calculate({bills}).billsTotal,0,'payments are scoped by month, including early payments');
f = calculate({startingBalance:900,bills:[{amount:100,dueDay:28,paidMonths:['2026-10']}],transactions:[]});
assert.equal(f.lowest,900,'already deducted, paid bills are not subtracted again');
f = calculate({bills:[{name:'Overdue',amount:100,dueDay:20,paidMonths:[]}]});
assert.equal(f.events[0].date,'2026-10-27');assert.equal(f.events[0].dueDate,'2026-10-20');
assert.equal(f.billsTotal,100,'a later bill after payday is not held early');
assert.equal(calculate({bills:[{amount:100,dueDay:1,paidMonths:[]}]}).billsTotal,200,'current overdue and next-month occurrence are separate obligations');
// Use a February payday to isolate short-month clamping and leap-year behavior.
f = calculate({account:{type:'savings',paySchedule:{enabled:true,amount:500,nextPayDate:'2026-03-02'}},bills:[{amount:100,dueDay:31,paidMonths:[]}]},'2026-02-27');
assert.equal(f.events[0].dueDate,'2026-02-28');assert.equal(f.billsTotal,100);
f = calculate({account:{type:'cash',paySchedule:{enabled:true,amount:500,nextPayDate:'2024-03-02'}},bills:[{amount:100,dueDay:31,paidMonths:[]}]},'2024-02-28');
assert.equal(f.events[0].dueDate,'2024-02-29');assert.equal(f.days,3);
f = calculate({account:{type:'checking',paySchedule:{enabled:true,amount:500,nextPayDate:'2027-01-02'}},bills:[{amount:100,dueDay:1,paidMonths:['2026-12']}]},'2026-12-30');
assert.equal(f.days,3);assert.equal(f.events[0].dueDate,'2027-01-01');
f = calculate({bills:[{amount:100,dueDay:28,paidMonths:[]},{amount:300,dueDay:1,paidMonths:['2026-10']}],plan:{stop_at:200,bills:500}});
assert.equal(f.extraReserve,100);assert.equal(f.allowance,300,'manual reserve overlaps tracked bill outflows only once');
assert.equal(calculate({bills:[{amount:100,dueDay:28,paidMonths:[]}],plan:{stop_at:200,bills:50}}).extraReserve,0,'manual reserve does not hide known bill commitments');
assert.equal(calculate({plan:{stop_at:200,bills:500,bills_source:'tracked'}}).extraReserve,0,'tracked mode reserves bills only through payday');
const entries=[{date:'2026-10-26',type:'expense',amount:100},{date:'2026-10-28',type:'income',amount:500},{date:'2026-10-29',type:'expense',amount:700},{date:'2026-11-03',type:'expense',amount:100},{date:'2026-11-03',type:'income',amount:1500},{date:'2026-11-04',type:'expense',amount:800}];
f = calculate({transactions:entries});
assert.equal(f.balance,900);assert.equal(f.lowest,600);assert.equal(f.beforePay,600);
assert.equal(f.events.length,3,'already-recorded payday income does not double the expected deposit');
assert.equal(f.allowance,400);
f = calculate({startingBalance:100,transactions:[{date:'2026-10-28',type:'income',amount:1500}]});
assert.equal(f.allowance,0,'future income cannot be spent before it arrives');
assert.equal(f.gap,100,'the current low balance still needs the buffer');
f = calculate({startingBalance:100,bills:[{amount:500,dueDay:28,paidMonths:['2026-11']} ]});
assert.equal(f.lowest,-400);assert.equal(f.allowance,0);assert.equal(f.gap,600);
assert.equal(calculate({account:{type:'checking',paySchedule:{enabled:true,amount:10,nextPayDate:'2026-11-02'}}},'2026-10-31').days,2,'DST uses calendar days');
for (const type of ['credit','loan','401k','hsa','roth_ira','traditional_ira']) assert.equal(calculate({account:{type,paySchedule:{enabled:true}}}),null);
assert.equal(calculate({account:{type:'checking'}}),null,'manual-income accounts stay uncluttered');
for (const nextPayDate of ['2026-10-27','2026-10-20','2026-02-30','invalid','2028-01-01']) assert.equal(calculate({account:{type:'checking',paySchedule:{enabled:true,amount:1500,nextPayDate}}}).status,'review');
for (const amount of [0,-1,Infinity,'oops']) assert.equal(calculate({account:{type:'checking',paySchedule:{enabled:true,amount,nextPayDate:'2026-11-03'}}}).status,'review');
const frozen={account:{type:'checking',paySchedule:{enabled:true,amount:1500,nextPayDate:'2026-11-03'}},transactions:entries,bills:[{amount:100,dueDay:28,paidMonth:'2026-10'}],plan:{bills:200},startingBalance:1000};
const before=JSON.stringify(frozen);context.calculatePaydayForecast(frozen,'2026-10-27');assert.equal(JSON.stringify(frozen),before,'forecast never mutates schedules, transactions, paid status, or plan');
console.log('Payday forecast checks passed: calendar horizons, overdue and paid bills, month/year/leap boundaries, buffer/manual reserves, future entries, payday ordering, no duplicate deposits, insufficient funds, invalid schedules, account types, and read-only behavior.');
