const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../docs/app.js'), 'utf8');
const functions = ['_loadAccountData', 'totals', 'balanceAsOf', 'calcRunningBalances'].map(name => {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, name);
  return source.slice(start, source.indexOf('\n}', start) + 2);
}).join('\n');
const txn = (type, amount) => ({ type, amount, date: '2026-10-01', category: 'Other' });
const storage = new Map([
  ['main', JSON.stringify({ startingBalance: 5100, transactions: [txn('expense', 38)] })],
  ['savings', JSON.stringify({ startingBalance: 5110, transactions: [] })],
]);
const context = vm.createContext({
  state: {}, accountDataKey: id => id,
  localStorage: { getItem: key => storage.get(key) },
});
vm.runInContext('let _calcVer = 0, _totalsCache = null, _runBalCache = null, _balAsOfCache = { ver: -1, m: {} };\n' + functions, context);
const bal = () => context.balanceAsOf('2026-10-07');
context._loadAccountData('main');
assert.equal(bal(), 5062);
assert.equal(context.totals().expense, 38);
assert.equal(context.calcRunningBalances()[0], 5062);

// Accounts-page and browser-back navigation both load data directly, unlike
// api.switchAccount. An unchanged ledger must agree with the loaded balance.
context._loadAccountData('savings');
assert.equal(context.state.transactions.length, 0);
assert.equal(bal(), 5110, 'account load must not reuse another account\'s $5,062 balance');
assert.equal(context.totals().expense, 0);
assert.equal(Object.keys(context.calcRunningBalances()).length, 0);
vm.runInContext('_calcVer++', context); // background backup invalidates calculations
assert.equal(bal(), 5110, 'background work cannot cause a $48 display jump');

context._loadAccountData('main');
assert.equal(bal(), 5062, 'return navigation reloads the correct balance');
assert.equal(context.totals().expense, 38);
assert.equal(context.calcRunningBalances()[0], 5062);

// A restore can replace the same account ID while keeping the current page.
storage.set('main', JSON.stringify({ startingBalance: 100, transactions: [txn('income', 25)] }));
context._loadAccountData('main');
assert.equal(bal(), 125, 'restored data replaces all previous calculations');
assert.equal(context.totals().income, 25);
assert.equal(context.calcRunningBalances()[0], 125);
context._loadAccountData('missing');
assert.equal(bal(), 0, 'empty account does not inherit a cached balance');
assert.equal(context.totals().income, 0);
console.log('Account balance checks passed: direct switches, back navigation, unchanged ledgers, background invalidation, restores, totals, running balances, and empty accounts.');
