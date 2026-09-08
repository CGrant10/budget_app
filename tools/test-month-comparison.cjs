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
vm.runInContext(source.match(/function isBillTxn\(t\) \{[^\n]+/)[0], context);
vm.runInContext(source.match(/function isExcludedFromSpend\(t\) \{[^\n]+/)[0], context);
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
assert.match(context.renderMonthComparison(), /No comparison yet/);
context.state.transactions = [txn('2026-08-01', 0), txn('2026-09-01', 10)];
assert.doesNotMatch(context.renderMonthComparison(), /Infinity|NaN/);
assert.match(context.renderMonthComparison(), /\$10.00 more/);
context.state.transactions = [txn('2026-08-01', 100), txn('2026-09-01', 50)];
assert.match(context.renderMonthComparison(), /comparison-better">\$50.00 less spent/);
console.log('Month comparison checks passed: date cutoffs, year rollover, leap years, full months, transfers, invalid amounts, empty history, zero baseline, and spending direction.');

assert.doesNotMatch(context.renderMonthComparison(), /Net income|Selected month|>Income</);
context.state.transactions.push(txn('2026-09-01', 10000, 'income'));
assert.match(context.renderMonthComparison(), /\$50.00 less spent/);

assert.match(context.renderMonthComparison(), /class="dawg-section-card month-comparison"/);
assert.match(context.renderMonthComparison(true), /class="sk-card month-comparison"/);
const withoutBills = calc([
  txn('2026-09-01', 1200, 'expense', { _billTxnId: 'rent-sep' }),
  txn('2026-08-01', 1100, 'expense', { _billTxnId: 'rent-aug' }),
  txn('2026-09-03', 50), txn('2026-08-03', 250)
], '2026-09', '2026-09-07');
assert.equal(withoutBills.current.expense, 50);
assert.equal(withoutBills.prior.expense, 250);
const billsOnly = calc([txn('2026-09-01', 1000, 'expense', { _billTxnId: 'rent' })], '2026-09', '2026-09-07');
assert.equal(billsOnly.current.expense, 0);
assert.equal(billsOnly.current.count, 1);
assert.doesNotMatch(context.renderMonthComparison(), /Bills & excluded spending omitted/);
const adjustmentHistory = [
  txn('2026-09-01', 800, 'expense', { category: 'Adjustment', excludeFromBudget: true }),
  txn('2026-08-01', 150, 'expense', { excludeFromBudget: true }),
  txn('2026-09-04', 100), txn('2026-08-04', 300)
];
const adjusted = calc(adjustmentHistory, '2026-09', '2026-09-07');
assert.equal(adjusted.current.expense, 100);
assert.equal(adjusted.prior.expense, 300);
assert.equal(adjusted.current.expense - adjusted.prior.expense, -200);
context.state.transactions = adjustmentHistory;
assert.match(context.renderMonthComparison(), /\$200.00 less spent/);
// Independently total each period with the existing dashboard spending rules.
for (const [month, expected] of [['2026-09', adjusted.current.expense], ['2026-08', adjusted.prior.expense]]) {
  const ledgerTotal = adjustmentHistory.filter(t => t.type === 'expense' && t.date >= month + '-01' && t.date <= month + '-07' && !t._xfer && !context.isExcludedFromSpend(t)).reduce((sum, t) => sum + t.amount, 0);
  assert.equal(expected, ledgerTotal);
}
console.log('Bill, balance-adjustment, manual-exclusion, and independent ledger-total checks passed.');
