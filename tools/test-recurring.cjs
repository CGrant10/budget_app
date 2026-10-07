const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '../docs/app.js'), 'utf8');
const start = source.indexOf('async function processRecurring(');
const fn = source.slice(start, source.indexOf('\n}', start) + 2);

function harness(transactions, accounts = [{ id: 'main', type: 'checking' }]) {
  let month = '2026-09';
  let saved;
  const context = vm.createContext({
    state: { transactions: structuredClone(transactions), accounts, startingBalance: 0 },
    currentAccountId: 'main', localMonthKey: () => month,
    crypto: { randomUUID },
    _save: () => { saved = structuredClone(context.state.transactions); },
    _saveAccounts() {},
  });
  vm.runInContext(fn, context);
  return {
    context,
    get transactions() { return context.state.transactions; },
    async run(nextMonth = month, reload = false) {
      month = nextMonth;
      if (reload && saved) context.state.transactions = structuredClone(saved);
      await context.processRecurring();
    },
  };
}
const entry = (extra = {}) => ({
  ts: 100, type: 'income', amount: 1000, category: 'Income',
  description: 'Paycheck', account: 'main', date: '2026-09-10',
  recurring: true, recur_month: '2026-09', ...extra,
});

(async () => {
  const h = harness([entry()]);
  await h.run();
  assert.equal(h.transactions.length, 1, 'no second entry in creation month');
  for (const month of ['2026-10', '2026-11', '2026-12']) {
    const before = h.transactions.length;
    await h.run(month, true);
    assert.equal(h.transactions.length, before + 1, 'one copy per month');
    await h.run(month, true);
    assert.equal(h.transactions.length, before + 1, 'reopening does not post twice');
    assert.equal(h.transactions.filter(t => t.recurring).length, 1);
  }
  assert.equal(h.transactions.reduce((sum, t) => sum + t.amount, 0), 4000);
  assert.equal(new Set(h.transactions.map(t => t.ts)).size, 4, 'copies have distinct ledger identities');

  const legacy = harness([
    entry({ recur_month: '2026-10' }),
    entry({ date: '2026-10-01', recur_month: '2026-10' }),
  ]);
  await legacy.run('2026-10');
  assert.equal(legacy.transactions.length, 2, 'migration preserves recorded amounts');
  assert.equal(legacy.transactions.filter(t => t.recurring).length, 1);
  await legacy.run('2026-11', true);
  assert.equal(legacy.transactions.length, 3, 'legacy copies cannot multiply again');

  const distinct = harness([
    entry(), entry({ ts: 101 }), entry({ ts: undefined }), entry({ ts: undefined }),
    entry({ ts: 102, type: 'expense', category: 'Home', amount: 50 }),
    entry({ ts: 103, recurring: false }),
  ]);
  await distinct.run('2026-10');
  assert.equal(distinct.transactions.length, 11, 'separate schedules and ordinary entries preserved');
  await distinct.run('2026-11', true);
  assert.equal(distinct.transactions.length, 16, 'expenses also recur exactly once');
  await distinct.run('2026-10', true);
  assert.equal(distinct.transactions.length, 16, 'clock moving backwards cannot repost');

  const missingMarker = harness([entry({ recur_month: undefined })]);
  await missingMarker.run('2026-09');
  assert.equal(missingMarker.transactions.length, 1, 'transaction date prevents duplicate on import');
  const future = harness([entry({ date: '2026-12-01', recur_month: '2026-12' })]);
  await future.run('2026-10');
  assert.equal(future.transactions.length, 1, 'future schedules are not posted early');

  const debt = harness([], [{ id: 'main', type: 'credit', interest_rate: 12 }]);
  debt.context.state.startingBalance = 1000;
  await debt.run('2026-10');
  await debt.run('2026-10', true);
  assert.equal(debt.transactions.length, 1, 'monthly interest still posts once');
  assert.equal(debt.transactions[0].amount, 10);
  console.log('Recurring checks passed: monthly income/expenses, reloads, legacy copies, independent schedules, identities, imports, clock rollback, future dates, and debt interest.');
})().catch(e => { console.error(e); process.exitCode = 1; });
