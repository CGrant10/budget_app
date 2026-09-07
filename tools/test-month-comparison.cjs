const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../docs/app.js'), 'utf8');
const functions = ['calculateMonthComparison', 'renderMonthComparison', 'shiftMonthKey', 'monthKeyLabel'].map(name => {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, name);
  return source.slice(start, source.indexOf('\n}', start) + 2);
}).join('\n');
const context = vm.createContext({ state: { transactions: [] }, dashMonth: '2026-09', today: () => '2026-09-07', fmt: n => '$' + n.toFixed(2) });
vm.runInContext(functions, context);
const calc = context.calculateMonthComparison;
const txn = (date, amount, type = 'expense', extra = {}) => ({ date, amount, type, ...extra });
let result = calc([
  txn('2026-09-07', 50), txn('2026-09-08', 900), txn('2026-08-07', 100), txn('2026-08-08', 800),
  txn('2026-09-01', 200, 'income'), txn('2026-09-01', 300, 'income', { _xfer: true }),
  txn('2026-09-01', 400, 'transfer'), txn('2026-09-01', 'invalid')
], '2026-09', '2026-09-07');
assert.equal(result.current.expense, 50);
assert.equal(result.prior.expense, 100);
assert.equal(result.current.income, 200);
assert.equal(result.current.net, 150);
assert.equal(result.current.count, 2);
assert.equal(calc([], '2026-01', '2026-01-07').previousEnd, '2025-12-07');
assert.equal(calc([], '2024-03', '2024-03-31').previousEnd, '2024-02-29');
assert.equal(calc([], '2026-03', '2026-03-31').previousEnd, '2026-02-28');
assert.equal(calc([txn('2026-08-31', 90)], '2026-08', '2026-09-07').current.expense, 90);
assert.match(context.renderMonthComparison(), /No transactions recorded in the previous period/);
context.state.transactions = [txn('2026-08-01', 0), txn('2026-09-01', 10)];
assert.doesNotMatch(context.renderMonthComparison(), /Infinity|NaN/);
assert.match(context.renderMonthComparison(), /\$10.00 more/);
context.state.transactions = [txn('2026-08-01', 100), txn('2026-09-01', 50)];
assert.match(context.renderMonthComparison(), /comparison-better">\$50.00 less \(50.0%\)/);
console.log('Month comparison checks passed: date cutoffs, year rollover, leap years, full months, transfers, invalid amounts, empty history, zero baseline, and spending direction.');
