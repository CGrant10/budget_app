const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../docs/app.js'), 'utf8');
const names = ['_showFastAdd', 'isGamblingTransaction', 'calculateGamblingTotals', '_gamblingTrackerBody', 'isRefundIncome'];
const functions = names.map(name => {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, name);
  return source.slice(start, source.indexOf('\n}', start) + 2);
}).join('\n');

function element(dataset = {}) {
  return {
    dataset, value: '', style: {}, textContent: '', handlers: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(name, fn) { this.handlers[name] = fn; },
    focus() {}, remove() {},
  };
}

async function saveEntry(type, category, description = '') {
  const nodes = Object.fromEntries(['amount', 'desc', 'submit', 'cat-field', 'from-label']
    .map(id => ['#fas-' + id, element()]));
  nodes['#fas-amount'].value = '100';
  nodes['#fas-desc'].value = description;
  const types = ['income', 'expense'].map(type => element({ type }));
  const categories = ['Food', 'Gambling', 'Refund', 'Redeem'].map(cat => element({ cat }));
  const overlay = element();
  overlay.querySelectorAll = selector => selector === '.fas-type-btn' ? types
    : selector === '.fas-cat-chip' ? categories : [];
  overlay.querySelector = selector => nodes[selector] || null;
  const txns = [];
  const context = vm.createContext({
    document: { getElementById: () => null, createElement: () => overlay, body: { appendChild() {} } },
    state: { accounts: [{ id: 'main', name: 'Checking' }] }, currentAccountId: 'main',
    getCategoriesByUsage: () => categories.map(c => c.dataset.cat),
    getCommonTemplates: () => [], today: () => '2026-10-02', _escHtml: s => s,
    setTimeout() {}, _debounce: fn => fn, history: { pushState() {}, back() {} },
    _postTxnToAccount: (id, t) => txns.push(t), autoUpdateWeeklyPlan: async () => {},
    isExcludedFromSpend: () => false, haptic() {}, showPayday() {}, showRobbery() {},
    checkRoast() {}, checkSpendingAlert() {}, render() {}, fmt: n => '$' + n.toFixed(2),
  });
  vm.runInContext(functions, context);
  context._showFastAdd();
  types.find(t => t.dataset.type === type).handlers.click();
  categories.find(c => c.dataset.cat === category).handlers.click();
  await nodes['#fas-submit'].handlers.click();
  assert.equal(txns.length, 1);
  return { transaction: txns[0], context };
}

(async () => {
  const win = await saveEntry('income', 'Gambling');
  assert.equal(win.transaction.category, 'Gambling');
  for (const month of ['', '2026-10']) {
    const total = win.context.calculateGamblingTotals([win.transaction], month);
    assert.equal(total.wins, 100);
    assert.equal(total.losses, 0);
    assert.equal(total.net, 100);
    assert.match(win.context._gamblingTrackerBody(total, total), /\+\$100\.00/);
  }
  const loss = await saveEntry('expense', 'Gambling');
  const mixed = win.context.calculateGamblingTotals([win.transaction, { ...loss.transaction, amount: 40 }]);
  assert.equal(mixed.net, 60);
  assert.equal((await saveEntry('income', 'Food', 'Paycheck')).transaction.category, 'Income');
  assert.equal((await saveEntry('income', 'Refund', 'Store refund')).transaction.category, 'Refund');
  assert.equal(loss.transaction.category, 'Gambling');
  assert.equal(loss.context.calculateGamblingTotals([loss.transaction]).net, -100);
  const legacy = { type: 'income', category: 'Income', description: 'Gambling winnings', amount: 75, date: '2026-10-01' };
  const legacyTotals = win.context.calculateGamblingTotals([legacy], '2026-10');
  assert.equal(legacyTotals.wins, 75);
  assert.equal(legacyTotals.losses, 0);
  assert.equal(legacyTotals.net, 75);
  assert.equal(legacy.category, 'Income', 'existing ledger remains unchanged');
  assert.equal(win.context.calculateGamblingTotals([legacy], '2026-09').net, 0);
  assert.equal(win.context.calculateGamblingTotals([legacy]).net, 75);
  for (const description of ['DraftKings payout', 'FanDuel winnings', 'Casino win']) {
    assert.equal(win.context.calculateGamblingTotals([{ ...legacy, description }]).wins, 75);
  }
  for (const extra of [
    { description: 'Paycheck' }, { description: 'Casino paycheck' },
    { description: 'Casino refund' }, { category: 'Refund' },
    { category: 'Transfer', _xfer: 1 }, { _xfer: 1 },
    { type: 'expense' }, { amount: 'invalid' },
  ]) {
    assert.equal(win.context.calculateGamblingTotals([{ ...legacy, ...extra }]).net, 0);
  }
  assert.equal(win.context.calculateGamblingTotals([{ ...legacy, category: ' Gambling ', description: '' }]).net, 75);
  for (const entry of [
    { category: 'Income', description: 'Redeem' },
    { category: 'Redeem', description: '' },
    { category: 'Other', description: ' redeemed ' },
  ]) {
    const txn = { ...legacy, ...entry, amount: 100, date: '2026-10-01' };
    for (const month of ['2026-10', '']) {
      const totals = win.context.calculateGamblingTotals([txn], month);
      assert.equal(totals.wins, 100);
      assert.equal(totals.losses, 0);
      assert.equal(totals.net, 100);
      assert.match(win.context._gamblingTrackerBody(totals, totals), /\+\$100\.00/);
    }
    assert.equal(win.context.calculateGamblingTotals([txn], '2026-09').net, 0);
  }
  assert.equal(win.context.calculateGamblingTotals([{ ...legacy, description: 'Redeem gift card' }]).net, 0);
  const redeem = await saveEntry('income', 'Redeem');
  assert.equal(redeem.transaction.category, 'Redeem');
  assert.equal(redeem.context.calculateGamblingTotals([redeem.transaction], '2026-10').net, 100);
  console.log('Gambling checks passed: quick-add save, wins without losses, month/all-time totals, display, mixed results, expenses, ordinary income, and refunds.');
})().catch(error => { console.error(error); process.exitCode = 1; });
