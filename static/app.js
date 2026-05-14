'use strict';

const CATEGORIES = ['Food','Transport','Housing','Entertainment','Health','Shopping','Income','Other'];

// ── state ──────────────────────────────────────────────────────────────────
let state = { transactions: [], weekly_plan: {} };
let lastCalcPerWeek = 0;

// ── api ────────────────────────────────────────────────────────────────────
const api = {
  async load() {
    const r = await fetch('/api/data');
    const d = await r.json();
    state.transactions = d.transactions || [];
    state.weekly_plan  = d.weekly_plan  || {};
  },
  async addTransaction(t) {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    });
    state.transactions.push(t);
  },
  async deleteTransaction(idx) {
    await fetch(`/api/transactions/${idx}`, { method: 'DELETE' });
    state.transactions.splice(idx, 1);
  },
  async patchTransaction(idx, updates) {
    await fetch(`/api/transactions/${idx}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    Object.assign(state.transactions[idx], updates);
  },
  async saveWeeklyPlan(plan) {
    await fetch('/api/weekly_plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    state.weekly_plan = plan;
  },
};

// ── helpers ────────────────────────────────────────────────────────────────
function totals() {
  let income = 0, expense = 0;
  const bycat = {};
  for (const t of state.transactions) {
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expense += t.amount;
      bycat[t.category] = (bycat[t.category] || 0) + t.amount;
    }
  }
  return { income, expense, bycat };
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function showStatus(id, msg, type, ms = 3000) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `form-status ${type}`;
  if (ms) setTimeout(() => { el.textContent = ''; el.className = 'form-status'; }, ms);
}

// ── tabs ───────────────────────────────────────────────────────────────────
let currentTab = 'dashboard';
let selectedLedgerIdx = null;

function showTab(key) {
  currentTab = key;
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === key));
  render();
}

function render() {
  const main = document.getElementById('main-content');
  switch (currentTab) {
    case 'dashboard': main.innerHTML = renderDashboard(); break;
    case 'add':       main.innerHTML = renderAdd();       break;
    case 'ledger':    main.innerHTML = renderLedger();    break;
    case 'weekly':    main.innerHTML = renderWeekly();    break;
    case 'import':    main.innerHTML = renderImport();    break;
  }
  attachHandlers();
}

// ── dashboard ──────────────────────────────────────────────────────────────
function renderDashboard() {
  const { income, expense, bycat } = totals();
  const balance  = income - expense;
  const balColor = balance >= 0 ? 'var(--success)' : 'var(--danger)';

  const cardDefs = [
    { title: 'BALANCE',  value: fmt(balance),                    color: balColor,          sub: 'income − expenses' },
    { title: 'INCOME',   value: fmt(income),                     color: 'var(--success)',  sub: 'total earned' },
    { title: 'EXPENSES', value: fmt(expense),                    color: 'var(--accent2)',  sub: 'total spent' },
    { title: 'ENTRIES',  value: String(state.transactions.length), color: 'var(--accent)', sub: 'transactions' },
  ];

  const cardsHtml = cardDefs.map(c => `
    <div class="card">
      <div class="card-title">${c.title}</div>
      <div class="card-value" style="color:${c.color}">${c.value}</div>
      <div class="card-sub">${c.sub}</div>
    </div>`).join('');

  const maxCat = Math.max(...Object.values(bycat), 1);
  const breakdownHtml = Object.entries(bycat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `
      <div class="breakdown-row">
        <span class="breakdown-label">${cat}</span>
        <div class="breakdown-bar-bg">
          <div class="breakdown-bar-fill" style="width:${(amt / maxCat * 100).toFixed(1)}%"></div>
        </div>
        <span class="breakdown-amt">${fmt(amt)}</span>
      </div>`).join('');

  return `
    <div class="page">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-sub">your financial snapshot</p>
      <div class="cards-grid">${cardsHtml}</div>
      ${Object.keys(bycat).length ? `
        <h2 class="section-title">Spending by Category</h2>
        <div class="breakdown">${breakdownHtml}</div>` : ''}
    </div>`;
}

// ── add ────────────────────────────────────────────────────────────────────
function renderAdd() {
  const catOptions = CATEGORIES.map(c => `<option>${c}</option>`).join('');
  return `
    <div class="page">
      <h1 class="page-title">Add Entry</h1>
      <p class="page-sub">record income or expense</p>
      <div class="form-card">
        <div class="form-row">
          <label class="form-label">Type</label>
          <div class="radio-group">
            <label class="radio-label"><input type="radio" name="etype" value="expense" checked> Expense</label>
            <label class="radio-label"><input type="radio" name="etype" value="income"> Income</label>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">Amount ($)</label>
          <input type="number" id="add-amount" class="form-input" placeholder="0.00" step="0.01" min="0" inputmode="decimal">
        </div>
        <div class="form-row">
          <label class="form-label">Description</label>
          <input type="text" id="add-desc" class="form-input" placeholder="What was this for?">
        </div>
        <div class="form-row">
          <label class="form-label">Category</label>
          <select id="add-cat" class="form-input form-select">${catOptions}</select>
        </div>
        <div class="form-row">
          <label class="form-label">Date</label>
          <input type="date" id="add-date" class="form-input" value="${today()}">
        </div>
        <div id="add-status" class="form-status"></div>
        <button id="add-btn" class="btn-primary">Add Transaction</button>
      </div>
    </div>`;
}

// ── ledger ─────────────────────────────────────────────────────────────────
function renderLedger() {
  const rows = [...state.transactions]
    .map((t, i) => ({ ...t, idx: i }))
    .reverse()
    .map(t => {
      const sign = t.type === 'income' ? '+' : '-';
      const cls  = t.type === 'income' ? 'income' : 'expense';
      return `
        <div class="ledger-row" data-idx="${t.idx}">
          <div class="ledger-main">
            <div class="ledger-desc">${t.description}</div>
            <div class="ledger-meta">${t.date} · ${t.category}</div>
          </div>
          <div class="ledger-right">
            <div class="ledger-amt ${cls}">${sign}${fmt(t.amount)}</div>
            <button class="ledger-delete" data-idx="${t.idx}">✕</button>
          </div>
        </div>`;
    }).join('');

  return `
    <div class="page">
      <h1 class="page-title">Ledger</h1>
      <p class="page-sub">all transactions</p>
      <div class="ledger-edit-bar">
        <span class="form-label">Edit date:</span>
        <input type="date" id="ledger-date-input" class="form-input">
        <button id="ledger-save-date" class="btn-sm">Save</button>
        <span id="ledger-date-status" class="status-inline"></span>
      </div>
      <div class="ledger-list">
        ${rows || '<p class="empty-msg">No transactions yet.</p>'}
      </div>
    </div>`;
}

// ── weekly ─────────────────────────────────────────────────────────────────
function renderWeekly() {
  const { income, expense } = totals();
  const wp = state.weekly_plan;
  const defBalance = wp.balance ?? (income - expense).toFixed(2);
  const defBills   = wp.bills   ?? '0';
  const defBuffer  = wp.buffer  ?? 10;
  const defPaydate = wp.paydate ?? (() => {
    const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0];
  })();

  const balance = income - expense;
  const balColor = balance >= 0 ? 'var(--success)' : 'var(--danger)';

  return `
    <div class="page">
      <h1 class="page-title">Weekly Planner</h1>
      <p class="page-sub">estimate how much you can spend each week</p>
      <div class="cards-grid" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">CURRENT BALANCE</div>
          <div class="card-value" style="color:${balColor}">${fmt(balance)}</div>
          <div class="card-sub">income − expenses</div>
        </div>
      </div>
      <div class="form-card">
        <div class="form-row">
          <label class="form-label">Remaining balance ($)</label>
          <input type="number" id="wk-balance" class="form-input" value="${defBalance}" step="0.01" inputmode="decimal">
        </div>
        <div class="form-row">
          <label class="form-label">Fixed bills still due ($)</label>
          <input type="number" id="wk-bills" class="form-input" value="${defBills}" step="0.01" inputmode="decimal">
        </div>
        <div class="form-row">
          <label class="form-label">Next paycheck date</label>
          <input type="date" id="wk-paydate" class="form-input" value="${defPaydate}">
        </div>
        <div class="form-row slider-row">
          <label class="form-label">
            Emergency buffer
            <span id="buf-label">${defBuffer}%</span>
          </label>
          <input type="range" id="wk-buffer" class="slider" min="0" max="30" value="${defBuffer}">
        </div>
        <div class="btn-row">
          <button id="wk-calc" class="btn-primary">Calculate</button>
          <button id="wk-save" class="btn-secondary">Save</button>
          <span id="wk-save-status" class="status-inline"></span>
        </div>
      </div>
      <div id="wk-results"></div>
    </div>`;
}

function calcWeekly() {
  const balance = parseFloat(document.getElementById('wk-balance')?.value)  || 0;
  const bills   = parseFloat(document.getElementById('wk-bills')?.value)    || 0;
  const bufPct  = parseInt(document.getElementById('wk-buffer')?.value)     || 0;
  const paydateStr = document.getElementById('wk-paydate')?.value || '';

  let days = 14;
  if (paydateStr) {
    const paydate = new Date(paydateStr + 'T00:00:00');
    const now     = new Date(); now.setHours(0,0,0,0);
    days = Math.max(1, Math.round((paydate - now) / 86400000) + 1);
  }

  const spendable = Math.max(0, balance - bills);
  const buffer    = spendable * bufPct / 100;
  const available = Math.max(0, spendable - buffer);
  const weeks     = Math.ceil(days / 7);
  const perWeek   = weeks  > 0 ? available / weeks : 0;
  lastCalcPerWeek = perWeek;
  const perDay    = days   > 0 ? available / days  : 0;

  // this-week spending (Mon → today)
  const now    = new Date(); now.setHours(0,0,0,0);
  const monday = new Date(now);
  monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  const mondayStr = monday.toISOString().split('T')[0];
  const weekSpent = state.transactions
    .filter(t => t.type === 'expense' && t.date >= mondayStr)
    .reduce((s, t) => s + t.amount, 0);
  const savedPerWeek = parseFloat(state.weekly_plan.per_week) || perWeek;
  const weekPct   = savedPerWeek > 0 ? Math.min(weekSpent / savedPerWeek, 1) : 0;
  const barColor  = weekPct >= 1 ? 'var(--danger)' : weekPct >= 0.8 ? 'var(--warn)' : 'var(--success)';

  const summaryCards = [
    ['SPENDABLE', fmt(available), 'var(--text)',    `after bills${bufPct ? ' + buffer' : ''}`],
    ['PER WEEK',  fmt(perWeek),   'var(--success)', `across ${weeks} week${weeks !== 1 ? 's' : ''}`],
    ['PER DAY',   fmt(perDay),    'var(--accent)',  'daily limit'],
    ...(bufPct ? [['BUFFER', fmt(buffer), 'var(--warn)', 'emergency fund']] : []),
  ].map(([t,v,c,s]) => `
    <div class="card">
      <div class="card-title">${t}</div>
      <div class="card-value" style="color:${c}">${v}</div>
      <div class="card-sub">${s}</div>
    </div>`).join('');

  // current week transactions
  const thisWeekTxns = state.transactions
    .filter(t => t.date >= mondayStr)
    .sort((a, b) => b.date.localeCompare(a.date));
  const weekIncomeAmt = thisWeekTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const thisWeekTxnHtml = thisWeekTxns.length
    ? thisWeekTxns.map(t => `
        <div class="pw-txn-row">
          <span class="pw-txn-date">${t.date}</span>
          <span class="pw-txn-amt" style="color:${t.type==='income'?'var(--success)':'var(--text)'}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</span>
          <span class="pw-txn-cat">${t.category||''}</span>
          <span class="pw-txn-desc">${t.description||''}</span>
        </div>`).join('')
    : '<p class="pw-empty">No transactions yet this week.</p>';

  const monLabel = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekRows = Array.from({ length: weeks }, (_, w) => {
    const s0 = w * 7, s1 = Math.min((w + 1) * 7, days);
    const amt = days > 0 ? (s1 - s0) / days * available : 0;
    const sd  = new Date(now); sd.setDate(now.getDate() + s0);
    const ed  = new Date(now); ed.setDate(now.getDate() + s1 - 1);
    const lbl = `${sd.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${ed.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
    const pct = available > 0 ? amt / available * 100 : 0;
    return `
      <div class="week-row">
        <span class="week-label">Wk ${w + 1}</span>
        <span class="week-dates">${lbl}</span>
        <div class="breakdown-bar-bg small">
          <div class="breakdown-bar-fill" style="width:${pct.toFixed(1)}%;background:var(--success)"></div>
        </div>
        <span class="week-amt">${fmt(amt)}</span>
      </div>`;
  }).join('');

  // ── past weeks ──
  const pastWeeksHtml = (() => {
    const rows = [];
    const monThis = new Date(monday);
    for (let i = 0; i < 8; i++) {
      const wkStart = new Date(monThis);
      wkStart.setDate(monThis.getDate() - (i + 1) * 7);
      const wkEnd = new Date(wkStart);
      wkEnd.setDate(wkStart.getDate() + 6);
      const wkStartStr = wkStart.toISOString().split('T')[0];
      const wkEndStr   = wkEnd.toISOString().split('T')[0];

      const weekTxns = state.transactions.filter(t => t.date >= wkStartStr && t.date <= wkEndStr);
      if (!weekTxns.length && i >= 4) continue;

      const spent  = weekTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const earned = weekTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const lbl    = `${wkStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${wkEnd.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;

      const txnHtml = weekTxns.length
        ? weekTxns.sort((a,b) => b.date.localeCompare(a.date)).map(t => `
            <div class="pw-txn-row">
              <span class="pw-txn-date">${t.date}</span>
              <span class="pw-txn-amt" style="color:${t.type==='income'?'var(--success)':'var(--text)'}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</span>
              <span class="pw-txn-cat">${t.category||''}</span>
              <span class="pw-txn-desc">${t.description||''}</span>
            </div>`).join('')
        : '<p class="pw-empty">No transactions this week.</p>';

      rows.push(`
        <div class="pw-week-row">
          <div class="pw-week-header">
            <span class="pw-week-dates">${lbl}</span>
            <span class="pw-week-spent" style="color:${spent?'var(--danger)':'var(--muted)'}">spent ${fmt(spent)}</span>
            ${earned ? `<span class="pw-week-earned">income ${fmt(earned)}</span>` : ''}
            <span class="pw-week-toggle">▼</span>
          </div>
          <div class="pw-week-txns">${txnHtml}</div>
        </div>`);
    }
    return rows.join('');
  })();

  const el = document.getElementById('wk-results');
  if (!el) return;
  el.innerHTML = `
    <div class="cards-grid">${summaryCards}</div>
    <div class="week-tracker">
      <div class="wt-header">
        <span class="wt-label">THIS WEEK</span>
        <span class="wt-dates">(Mon ${monLabel} – today)</span>
        <span class="wt-pct" style="color:${barColor}">${(weekPct * 100).toFixed(0)}% used</span>
        ${weekIncomeAmt ? `<span class="wt-income">+${fmt(weekIncomeAmt)} income</span>` : ''}
      </div>
      <div class="wt-amounts">
        <span class="wt-spent" style="color:${barColor}">${fmt(weekSpent)}</span>
        <span class="wt-of"> / ${fmt(savedPerWeek)} weekly budget</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${(weekPct * 100).toFixed(1)}%;background:${barColor}"></div>
      </div>
      <div class="wt-txns-section">
        <div class="wt-txns-label">TRANSACTIONS THIS WEEK</div>
        <div class="pw-week-txns" style="display:block">${thisWeekTxnHtml}</div>
      </div>
    </div>
    <h2 class="section-title">Week-by-week breakdown</h2>
    <div class="week-breakdown">${weekRows}</div>
    ${pastWeeksHtml ? `<h2 class="section-title" style="margin-top:20px">Past Weeks</h2><div class="pw-weeks">${pastWeeksHtml}</div>` : ''}`;

  el.querySelectorAll('.pw-week-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const txns = hdr.closest('.pw-week-row').querySelector('.pw-week-txns');
      const tog  = hdr.querySelector('.pw-week-toggle');
      const open = txns.style.display !== 'block';
      txns.style.display = open ? 'block' : 'none';
      if (tog) tog.textContent = open ? '▲' : '▼';
    });
  });
}

// ── import ─────────────────────────────────────────────────────────────────
function renderImport() {
  return `
    <div class="page">
      <h1 class="page-title">Import CSV</h1>
      <p class="page-sub">bulk-load transactions from a spreadsheet</p>
      <div class="form-card">
        <p class="code-hint">Expected columns:</p>
        <code class="code-block">date, type, category, description, amount</code>
        <p class="code-hint" style="margin-top:12px">Example row:</p>
        <code class="code-block">2024-03-15, expense, Food, "Grocery run", 87.50</code>
        <div id="import-status" class="form-status"></div>
        <label class="btn-primary" style="display:inline-block;margin-top:4px;cursor:pointer;text-align:center">
          Choose CSV File…
          <input type="file" id="import-file" accept=".csv" style="display:none">
        </label>
      </div>
    </div>`;
}

// ── event handlers ─────────────────────────────────────────────────────────
function attachHandlers() {
  switch (currentTab) {
    case 'add':    attachAdd();    break;
    case 'ledger': attachLedger(); break;
    case 'weekly': attachWeekly(); calcWeekly(); break;
    case 'import': attachImport(); break;
  }
}

async function autoUpdateWeeklyPlan() {
  const wp = state.weekly_plan;
  if (!wp || !wp.paydate) return;
  const { income, expense } = totals();
  const newBalance = income - expense;
  const bills  = parseFloat(wp.bills  || '0') || 0;
  const bufPct = parseInt(wp.buffer   || '0') || 0;
  const paydate = new Date(wp.paydate + 'T00:00:00');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const days = Math.max(1, Math.round((paydate - now) / 86400000) + 1);
  const spendable = Math.max(0, newBalance - bills);
  const available = Math.max(0, spendable - spendable * bufPct / 100);
  const weeks   = Math.ceil(days / 7);
  const perWeek = weeks > 0 ? available / weeks : 0;
  const plan = { ...wp, balance: newBalance.toFixed(2), per_week: perWeek };
  await api.saveWeeklyPlan(plan);
}

function attachAdd() {
  document.getElementById('add-btn')?.addEventListener('click', async () => {
    const amtVal = document.getElementById('add-amount').value;
    const amount = parseFloat(amtVal);
    if (!amtVal || isNaN(amount) || amount <= 0) {
      showStatus('add-status', 'Enter a valid amount.', 'error');
      return;
    }
    const t = {
      type:        document.querySelector('input[name="etype"]:checked').value,
      amount,
      description: document.getElementById('add-desc').value.trim() || '—',
      category:    document.getElementById('add-cat').value,
      date:        document.getElementById('add-date').value || today(),
    };
    await api.addTransaction(t);
    if (t.type === 'income') await autoUpdateWeeklyPlan();
    showStatus('add-status', `✓ Added ${t.type}: ${fmt(t.amount)} (${t.category})`, 'success');
    document.getElementById('add-amount').value = '';
    document.getElementById('add-desc').value   = '';

    if (t.type === 'expense') showRobbery(t.amount);
    else                      showPayday(t.amount);
  });
}

function attachLedger() {
  // row tap → populate date editor
  document.querySelectorAll('.ledger-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.ledger-delete')) return;
      const idx = parseInt(row.dataset.idx);
      selectedLedgerIdx = idx;
      document.querySelectorAll('.ledger-row').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      const inp = document.getElementById('ledger-date-input');
      if (inp) inp.value = state.transactions[idx]?.date || '';
    });
  });

  // delete
  document.querySelectorAll('.ledger-delete').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const t   = state.transactions[idx];
      if (confirm(`Delete: ${t.description} (${fmt(t.amount)})?`)) {
        await api.deleteTransaction(idx);
        selectedLedgerIdx = null;
        render();
      }
    });
  });

  // save date
  document.getElementById('ledger-save-date')?.addEventListener('click', async () => {
    if (selectedLedgerIdx === null) {
      showStatus('ledger-date-status', 'Tap a row first', 'error');
      return;
    }
    const newDate = document.getElementById('ledger-date-input').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      showStatus('ledger-date-status', 'Invalid date', 'error');
      return;
    }
    await api.patchTransaction(selectedLedgerIdx, { date: newDate });
    showStatus('ledger-date-status', '✓ Saved', 'success');
    render();
  });
}

function attachWeekly() {
  const bufSlider = document.getElementById('wk-buffer');
  const bufLabel  = document.getElementById('buf-label');

  bufSlider?.addEventListener('input', () => {
    bufLabel.textContent = bufSlider.value + '%';
    calcWeekly();
  });

  ['wk-paydate','wk-balance','wk-bills'].forEach(id =>
    document.getElementById(id)?.addEventListener('change', calcWeekly));

  document.getElementById('wk-calc')?.addEventListener('click', calcWeekly);

  document.getElementById('wk-save')?.addEventListener('click', async () => {
    const plan = {
      balance:  document.getElementById('wk-balance').value,
      bills:    document.getElementById('wk-bills').value,
      paydate:  document.getElementById('wk-paydate').value,
      buffer:   parseInt(document.getElementById('wk-buffer').value),
      per_week: lastCalcPerWeek,
    };
    await api.saveWeeklyPlan(plan);
    const el = document.getElementById('wk-save-status');
    if (el) {
      el.textContent = '✓ Saved';
      setTimeout(() => { el.textContent = ''; }, 3000);
    }
  });
}

function attachImport() {
  document.getElementById('import-file')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const r      = await fetch('/api/import', { method: 'POST', body: fd });
    const result = await r.json();
    if (result.ok) {
      await api.load();
      const msg = `✓ Imported ${result.added} transactions.` +
                  (result.errors ? ` (${result.errors} skipped)` : '');
      showStatus('import-status', msg, 'success', 0);
    } else {
      showStatus('import-status', `Error: ${result.error}`, 'error', 0);
    }
  });
}

// ── init ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn =>
  btn.addEventListener('click', () => showTab(btn.dataset.tab)));

(async () => {
  await api.load();
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/sw.js').catch(() => {});
  }
})();
