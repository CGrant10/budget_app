const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../docs/app.js'), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} exists`);
  const lineEnd = source.indexOf('\n', start);
  const end = source.slice(start, lineEnd).endsWith('}') ? lineEnd : source.indexOf('\n}', start) + 2;
  return source.slice(start, end);
}
let clock = '2026-10-08T12:00:00';
class TestDate extends Date {
  constructor(...args) { super(...(args.length ? args : [clock])); }
}
const context = vm.createContext({Date:TestDate, state:{bills:[]},localMonthKey:()=>clock.slice(0,7)});
for (const name of ['billDueDay','getDaysUntilDue','billDueLabel','billPaidMonths','isBillPaidFor','getUpcomingBills','billBadgeHtml']) {
  vm.runInContext(extract(name), context);
}
assert.equal(context.getDaysUntilDue(1), -7, 'unpaid October rent stays overdue');
assert.equal(context.getDaysUntilDue(8), 0);
assert.equal(context.getDaysUntilDue(9), 1);
assert.equal(context.getDaysUntilDue(1,'2026-11'), 24, 'explicit future month remains future');
assert.match(context.billDueLabel(-7), /Overdue by 7 days/);
assert.match(context.billBadgeHtml({dueDay:1,paidMonths:[]},'2026-10',true), /OVERDUE/);
assert.match(context.billBadgeHtml({dueDay:1,paidMonths:['2026-10']},'2026-10',true), /PAID/);
assert.doesNotMatch(context.billBadgeHtml({dueDay:1,paidMonths:[]},'2026-11',false), /OVERDUE/);
context.state.bills = [
  {id:'upcoming',dueDay:9,paidMonths:[]},
  {id:'paid',dueDay:1,paidMonths:['2026-10']},
  {id:'overdue',dueDay:1,paidMonths:[]},
  {id:'later',dueDay:24,paidMonths:[]},
];
assert.deepEqual(Array.from(context.getUpcomingBills(3),b=>b.id), ['overdue','upcoming']);
clock = '2026-02-28T12:00:00';
assert.equal(context.billDueDay(31),28);
assert.equal(context.getDaysUntilDue(31),0, 'short months use their last day');
clock = '2028-02-28T12:00:00';
assert.equal(context.billDueDay(31),29);
assert.equal(context.getDaysUntilDue(31),1, 'leap-year February');
clock = '2026-03-07T12:00:00';
assert.equal(context.getDaysUntilDue(9),2, 'calendar-day arithmetic across daylight saving');
console.log('Bill checks passed: overdue/current/future months, paid filtering, ordering, short months, leap years, and daylight saving.');
