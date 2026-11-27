const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../docs/app.js'), 'utf8');
const ctx = vm.createContext({});
for (const name of ['billOccurrenceDate','billOccurrenceAmount','billDaysUntil','dashboardBalanceHistory','homeSpendingView','dashboardLimitStats','dashboardUpcomingBills','billDueDay','shiftMonthKey','weeklySpendingSummary']) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, name);
  vm.runInContext(source.slice(start, source.indexOf('\n}', start) + 2), ctx);
}
const limits = (daily,daySpent,weekSpent,target=200,ceiling=400) => ctx.dashboardLimitStats({dailyLimit:daily,daySpent,weekSpent,weeklySummary:ctx.weeklySpendingSummary(ceiling,weekSpent,target)});
let [day,week]=limits(25,5,55);
assert.equal(day.left,25); assert.equal(day.spent,5); assert(Math.abs(day.percent-20)<1e-9);
assert.equal(week.left,145); assert(Math.abs(week.percent-27.5)<1e-9);
[day,week]=limits(25,5,195); assert.equal(day.left,25,'daily allowance matches Weekly even when its weekly remainder is smaller');
[day,week]=limits(25,8,215); assert.equal(day.left,25); assert.equal(week.over,15); assert.equal(week.percent,100);
[day,week]=limits(200,26.40,312,200,500);assert.equal(day.left,200);assert.equal(day.over,0,'weekly overage is not a daily overage');assert.equal(week.over,112);
[day,week]=limits(60,5,200,200,500);assert.equal(day.left,60,'an exhausted weekly target does not erase the monthly daily allowance');assert.equal(week.over,0);
[day,week]=limits(0,0,0,0,0);assert.equal(day.percent,0);assert.equal(week.percent,0);
[day,week]=limits(10,-5,-20); assert.equal(day.spent,0); assert.equal(week.spent,0);
[day,week]=limits(0,10,10,200,0); assert.equal(day.left,0); assert.equal(week.left,0); assert.equal(week.over,10);
const bill=(name,dueDay,amount=20,extra={})=>({name,dueDay,amount,...extra});
const bills=[bill('Overdue',1),bill('Today',28),bill('Tomorrow',29),bill('Next month',2),bill('Later',6),bill('Paid now',28,30,{paidMonths:['2026-11']}),bill('Prepaid',2,35,{paidMonths:['2026-12']}),bill('Legacy paid',28,40,{paidMonth:'2026-11'}),bill('Bad',29,'bad'),bill('Negative',29,-10)];
const before=JSON.stringify(bills);
let rows=ctx.dashboardUpcomingBills(bills,'2026-11-28');
assert.equal(JSON.stringify(bills),before,'rendering never changes paid status or bill data');
assert(rows.some(b=>b.name==='Overdue'&&b.days===-27));
assert(rows.some(b=>b.name==='Today'&&b.days===0));
assert(rows.some(b=>b.name==='Tomorrow'&&b.days===1));
assert(rows.some(b=>b.name==='Next month'&&b.date==='2026-12-02'&&b.days===4));
assert(!rows.some(b=>['Bad','Negative','Legacy paid'].includes(b.name)));
assert(!rows.some(b=>b.name==='Later'&&b.date==='2026-12-06'));
assert(!rows.some(b=>b.name==='Paid now'&&b.date.startsWith('2026-11')));
assert(!rows.some(b=>b.name==='Prepaid'&&b.date.startsWith('2026-12')));
assert(rows.some(b=>b.name==='Prepaid'&&b.date==='2026-11-02'),'prepayment does not clear a different month');
rows=ctx.dashboardUpcomingBills([bill('Year end',31),bill('January',1)],'2026-12-29');
assert(rows.some(b=>b.date==='2027-01-01'&&b.days===3));
rows=ctx.dashboardUpcomingBills([bill('Leap',31)],'2028-02-27'); assert.equal(rows[0].date,'2028-02-29'); assert.equal(rows[0].days,2);
rows=ctx.dashboardUpcomingBills([bill('No leap',31)],'2027-02-27'); assert.equal(rows[0].date,'2027-02-28');
rows=ctx.dashboardUpcomingBills([bill('DST',9)],'2026-03-07'); assert.equal(rows[0].days,2);
rows=ctx.dashboardUpcomingBills([bill('Boundary',26),bill('Outside',27)],'2026-11-19'); assert(rows.some(b=>b.name==='Boundary')); assert(!rows.some(b=>b.name==='Outside'));
assert.equal(ctx.dashboardUpcomingBills([],'2026-11-19').length,0);
console.log('Dashboard checks passed: daily allowance consistency, independent weekly targets and protected buffers, overspending, refunds/zero, bill dates, month/year/leap/DST boundaries, paid/prepaid status, invalid amounts, and non-mutating rendering.');

const recorded=[
 {date:'2026-11-12',type:'income',amount:200},
 {date:'2026-11-13',type:'expense',amount:50},
 {date:'2026-11-15',type:'expense',amount:30},
 {date:'2026-11-17',type:'income',amount:10,category:'Refund'},
 {date:'2026-11-18',type:'expense',amount:20,_billTxnId:'bill',excludeFromBudget:true},
 {date:'2026-11-19',type:'expense',amount:40,_xfer:true},
 {date:'2026-11-20',type:'income',amount:10000},
 {date:'2026-11-19',type:'expense',amount:'invalid'},
];
const unchanged=JSON.stringify(recorded);
let history=ctx.dashboardBalanceHistory(recorded,1000,'2026-11-19');
assert.equal(JSON.stringify(history.map(p=>p.date)),JSON.stringify(['2026-11-13','2026-11-14','2026-11-15','2026-11-16','2026-11-17','2026-11-18','2026-11-19']));
assert.equal(JSON.stringify(history.map(p=>p.balance)),JSON.stringify([1150,1150,1120,1120,1130,1110,1070]),'cash history includes bills, refunds, transfers and the pre-window opening balance; future cash is excluded');
assert.equal(JSON.stringify(recorded),unchanged);
assert(ctx.dashboardBalanceHistory([],0,'2026-11-19').every(p=>p.balance===0),'empty account is an honest flat zero');
assert(ctx.dashboardBalanceHistory([],250,'2026-11-19').every(p=>p.balance===250),'starting balance remains visible without entries');
assert.equal(ctx.dashboardBalanceHistory([{date:'2026-11-19',type:'expense',amount:'12.34'}],'10','2026-11-19')[6].balance,-2.34);
assert(ctx.dashboardBalanceHistory([],Infinity,'2026-11-19').every(p=>p.balance===0));
for(const asOf of ['2026-03-09','2026-11-02','2027-01-02','2028-03-02']) {
 history=ctx.dashboardBalanceHistory([],0,asOf);assert.equal(history.length,7);assert.equal(history[6].date,asOf);
 for(let i=1;i<7;i++)assert.equal(Date.parse(history[i].date)-Date.parse(history[i-1].date),86400000);
}
assert(ctx.dashboardBalanceHistory([],0,'2028-03-02').some(p=>p.date==='2028-02-29'));
assert.equal(ctx.dashboardBalanceHistory([],0,'2027-01-02')[0].date,'2026-12-27');
console.log('Seven-day balance checks passed: daily chronology, opening cash, bill/refund/transfer effects, future exclusion, empty/flat/negative accounts, numeric strings, invalid values, non-mutating history, DST and leap/year boundaries.');
