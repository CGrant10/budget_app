const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../docs/app.js'), 'utf8');
const functions = ['calculateMonthComparison', 'calculateMonthlyPace', 'monthlyPaceSummary', 'renderMonthComparison', 'shiftMonthKey', 'monthKeyLabel', 'isRefundIncome', 'recordedCashflow', 'getSpendingInsights', 'financialReviewHtml'].map(name => {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, name);
  return source.slice(start, source.indexOf('\n}', start) + 2);
}).join('\n');
const context = vm.createContext({ state: { transactions: [], bills:[] }, dashMonth: '2026-09', today: () => '2026-09-07', localMonthKey:()=> '2026-09', calculateBillHealth:()=>({overdue:0}), fmt: n => '$' + n.toFixed(2) });
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
// This is a discretionary-spending comparison: paychecks affect balances,
// while only purchase refunds offset spending in this view.
assert.equal(result.current.income, 0);
assert.equal(result.current.net, -50);
assert.equal(result.current.count, 1);
const refunded = calc([
  txn('2026-09-02', 50),
  txn('2026-09-03', 15, 'income', {category:'Refund'}),
  txn('2026-09-04', 500, 'income', {description:'Paycheck'}),
  txn('2026-09-05', 100, 'income', {_xfer:true,category:'Refund'}),
], '2026-09', '2026-09-07');
assert.equal(refunded.current.refunds, 15);
assert.equal(refunded.current.expense, 35);
assert.equal(refunded.current.count, 2);
assert.equal(calc([], '2026-01', '2026-01-07').previousEnd, '2025-12-07');
assert.equal(calc([], '2026-02', '2026-10-12').end, '2026-02-28');
assert.equal(calc([], '2024-02', '2024-03-12').end, '2024-02-29');
assert.equal(calc([], '2024-03', '2024-03-31').previousEnd, '2024-02-29');
assert.equal(calc([], '2026-03', '2026-03-31').previousEnd, '2026-02-28');
assert.equal(calc([txn('2026-08-31', 90)], '2026-08', '2026-09-07').current.expense, 90);
assert.match(context.renderMonthComparison(), /No comparison yet/);
context.state.transactions = [txn('2026-08-01', 0), txn('2026-09-01', 10)];
assert.doesNotMatch(context.renderMonthComparison(), /Infinity|NaN/);
assert.match(context.renderMonthComparison(), /Over pace/);
context.state.transactions = [txn('2026-08-01', 100), txn('2026-09-01', 10)];
assert.match(context.renderMonthComparison(), /comparison-better">Under pace/);
assert.match(context.renderMonthComparison(), /\$42.86/);
console.log('Month comparison checks passed: date cutoffs, year rollover, leap years, full months, transfers, invalid amounts, empty history, zero baseline, and spending direction.');

assert.doesNotMatch(context.renderMonthComparison(), /Net income|Selected month|>Income</);
context.state.transactions.push(txn('2026-09-01', 10000, 'income'));
assert.match(context.renderMonthComparison(), /Under pace/);

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
assert.equal(billsOnly.current.count, 0);
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
assert.match(context.renderMonthComparison(), /Over pace/);
// Independently total each period with the existing dashboard spending rules.
for (const [month, expected] of [['2026-09', adjusted.current.expense], ['2026-08', adjusted.prior.expense]]) {
  const ledgerTotal = adjustmentHistory.filter(t => t.type === 'expense' && t.date >= month + '-01' && t.date <= month + '-07' && !t._xfer && !context.isExcludedFromSpend(t)).reduce((sum, t) => sum + t.amount, 0);
  assert.equal(expected, ledgerTotal);
}
console.log('Bill, balance-adjustment, manual-exclusion, and independent ledger-total checks passed.');

const pace = context.calculateMonthlyPace;
const history = [txn('2026-08-01',200), txn('2026-08-31',400), txn('2026-09-01',300), txn('2026-09-16',900)];
let p = pace(history,'2026-09','2026-09-15');
assert.equal(p.spent,300,'only recorded spending through today');
assert.equal(p.baseline,600,'the baseline includes the entire prior month, even entries after the current day');
assert.equal(p.projected,600);
assert.equal(p.expectedByNow,300);
assert.equal(p.delta,0);
assert.equal(p.status,'on','half a month at half of last month’s total is on pace');
assert.equal(p.daysInMonth,30,'current month length sets the projection, not last month’s length');
assert.equal(p.daysElapsed,15);
for (const [spent,status,projected] of [[200,'under',400],[400,'over',800],[314.99,'on',629.98],[315,'on',630],[315.01,'over',630.02],[285,'on',570],[284.99,'under',569.98]]) {
  const candidate = pace([txn('2026-08-31',600),txn('2026-09-15',spent)],'2026-09','2026-09-15');
  assert.equal(candidate.status,status,'five-percent status boundary for '+spent);
  assert.equal(candidate.projected,projected);
}
assert.equal(pace([txn('2026-01-31',280),txn('2026-02-14',140)],'2026-02','2026-02-14').projected,280);
assert.equal(pace([txn('2024-01-31',290),txn('2024-02-01',10)],'2024-02','2024-02-01').projected,290,'leap-year daily pace');
assert.equal(pace([txn('2025-12-31',310),txn('2026-01-01',10)],'2026-01','2026-01-01').status,'on','year rollover');
assert.equal(pace([txn('2026-02-28',280),txn('2026-03-31',280)],'2026-03','2026-03-31').status,'on','equal full totals remain on pace across different month lengths');
p = pace([txn('2026-08-01',600),txn('2026-09-01',400),txn('2026-09-02',100,'income',{category:'Refund'}),txn('2026-09-03',10000,'income'),txn('2026-09-03',1000,'expense',{_billTxnId:'rent'}),txn('2026-09-03',1000,'expense',{_xfer:true}),txn('2026-09-03',1000,'expense',{excludeFromBudget:true})], '2026-09','2026-09-15');
assert.equal(p.projected,600,'refunds offset spending; paychecks, bills, transfers, and manual exclusions do not alter discretionary pace');
assert.equal(pace([txn('2026-09-01',100)],'2026-09','2026-09-15').status,'no-baseline');
assert.equal(pace([txn('2026-08-31',600)],'2026-09','2026-09-15').status,'empty','missing current history is not presented as good pace');
assert.equal(pace([txn('2026-08-31',600)],'2026-09','2026-09-15').projected,null);
p = pace([txn('2026-08-31',0),txn('2026-09-01',10)],'2026-09','2026-09-15');
assert.equal(p.status,'over','a recorded zero baseline is handled without percentages');
assert.equal(p.projected,20);
p = pace(history,'2026-09','2026-10-15');
assert.equal(p.projected,1200,'completed months use actual spending without extrapolation');
assert.equal(p.daysElapsed,30);
assert.match(context.monthlyPaceSummary(p).headline,/\$600.00 more spent/);
p = pace(history,'2026-09','2026-08-15');
assert.equal(p.status,'future');assert.equal(p.projected,null);
context.state.transactions = [txn('2026-08-31',600),txn('2026-09-01',140)];
const html=context.renderMonthComparison();
assert.match(html,/Monthly spending pace/);assert.match(html,/>On pace</);
assert.match(html,/Estimated month-end/);assert.match(html,/\$600.00/);
assert.match(html,/within 5%/);assert.match(html,/Last month · full month/);
assert.doesNotMatch(html,/week|Through Sep 7 vs Aug 7/);
assert.match(context.renderMonthComparison(false,'2026-08'),/Spending vs last month/);
assert.doesNotMatch(context.renderMonthComparison(false,'2026-08'),/Estimated month-end|How pace works/);
const insights=context.getSpendingInsights('2026-09').join(' ');
assert.match(insights,/On pace/);assert.match(insights,/Estimated discretionary month-end: \$600.00/);
assert.doesNotMatch(insights,/comparable period|At this pace, you'll spend/,'no competing forecast with bill-inclusive cashflow');
assert.match(context.financialReviewHtml('2026-09'),/Monthly spending: on pace/);
context.state.transactions=[txn('2026-08-31',600),txn('2026-09-01',200)];
assert.match(context.renderMonthComparison(),/Over pace/);
assert.match(context.financialReviewHtml('2026-09'),/Monthly spending: over pace/);
assert.match(context.getSpendingInsights('2026-09').join(' '),/Over pace/);
console.log('Monthly pace checks passed: full prior-month baseline, projections, 5% boundaries, short/leap months, year rollover, refunds/exclusions, empty and zero history, completed/future months, and Home/Insights consistency.');
