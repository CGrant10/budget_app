'use strict';

const CATEGORIES = ['Food','Transport','Housing','Entertainment','Health','Shopping','Income','Other'];

// ── audio ──────────────────────────────────────────────────────────────────
window.AudioContext = window.AudioContext || window.webkitAudioContext;
let _audioCtx = null;
function getAudio() { return _audioCtx || (_audioCtx = new AudioContext()); }

function playSound(type) {
  if (localStorage.getItem('sounds') === 'off') return;
  try {
    const ctx = getAudio();
    function note(freq, start, dur) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.25, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.05);
    }
    if (type === 'income') {
      note(523, 0, .08); note(659, .08, .08); note(784, .16, .15);
    } else {
      note(494, 0, .12); note(392, .12, .12); note(330, .24, .15); note(262, .39, .2);
    }
  } catch(e) {}
}

// ── roasts ─────────────────────────────────────────────────────────────────
const ROASTS = [
  "That's me money you're wasting on {cat}!",
  "You spent HOW MUCH on {cat}?! Me claws are shaking!",
  "I've seen barnacles with better budgets!",
  "Are ye made of money?! Because I'm not!",
  "Every dollar on {cat} is a dollar I could've had!",
  "SpongeBob spends less than you!",
  "That category is hemorrhaging money!",
  "I'm not cheap — YOU'RE irresponsible!"
];

function showRoast(msg) {
  const el = document.createElement('div');
  el.className = 'roast-toast';
  el.textContent = '🦀 ' + msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function checkRoast(category) {
  const m = new Date().toISOString().slice(0, 7);
  const total = state.transactions
    .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(m))
    .reduce((s, t) => s + t.amount, 0);
  const limit = parseFloat(state.budgets[category] || 0);
  if (!limit) return;
  if (total > limit) {
    const quip = ROASTS[Math.floor(Math.random() * ROASTS.length)].replace('{cat}', category);
    showRoast(quip);
  }
}

// ── state ──────────────────────────────────────────────────────────────────
let state = { transactions: [], weekly_plan: {}, budgets: {} };
let lastCalcPerWeek = 0;

// ── api ────────────────────────────────────────────────────────────────────
const api = {
  async load() {
    const r = await fetch('/api/data');
    const d = await r.json();
    state.transactions = d.transactions || [];
    state.weekly_plan  = d.weekly_plan  || {};
    state.budgets      = d.budgets      || {};
    return d;
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
  saveBudgets: (b) => fetch('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(b),
  }),
  patchTransaction: (idx, patch) => fetch('/api/transactions/' + idx, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }),
};

// ── recurring ──────────────────────────────────────────────────────────────
async function processRecurring() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  for (let i = 0; i < state.transactions.length; i++) {
    const t = state.transactions[i];
    if (t.recurring === true && t.recur_month !== currentMonth) {
      const copy = { ...t, date: currentMonth + '-01', recur_month: currentMonth };
      delete copy.id;
      await api.addTransaction(copy);
      await api.patchTransaction(i, { recur_month: currentMonth });
    }
  }
  const d = await api.load();
  state.transactions = d.transactions;
  state.budgets      = d.budgets      || {};
  state.weekly_plan  = d.weekly_plan  || {};
}

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

// ── sounds toggle ──────────────────────────────────────────────────────────
function initSoundsToggle() {
  const btn = document.getElementById('sounds-toggle');
  if (!btn) return;
  btn.textContent = localStorage.getItem('sounds') === 'off' ? '🔕' : '🔔';
  btn.onclick = () => {
    const off = localStorage.getItem('sounds') === 'off';
    localStorage.setItem('sounds', off ? 'on' : 'off');
    btn.textContent = off ? '🔔' : '🔕';
  };
}

// ── tabs ───────────────────────────────────────────────────────────────────
let currentTab = 'dashboard';
let selectedLedgerIdx = null;
let ledgerFilter = '';

function showTab(key) {
  if (currentTab === 'ledger' && key !== 'ledger') {
    ledgerFilter = '';
  }
  currentTab = key;
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === key));
  render();
}

// ── chart ──────────────────────────────────────────────────────────────────
let spendingChart = null;

function getLastSixWeeks() {
  const weeks = [];
  for (let i = 0; i < 6; i++) {
    const mon = new Date();
    mon.setHours(0, 0, 0, 0);
    mon.setDate(mon.getDate() - mon.getDay() + 1 - (5 - i) * 7);
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    const monStr = mon.toISOString().slice(0, 10);
    const sunStr = sun.toISOString().slice(0, 10);
    const label = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let income = 0, expense = 0;
    for (const t of state.transactions) {
      if (t.date >= monStr && t.date <= sunStr) {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      }
    }
    weeks.push({ label, income, expense });
  }
  return weeks;
}

function attachDashboard() {
  const weeks = getLastSixWeeks();
  const ctx = document.getElementById('spending-chart');
  if (ctx) {
    spendingChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeks.map(w => w.label),
        datasets: [
          { label: 'Income',   data: weeks.map(w => w.income),  backgroundColor: '#4ecb8d' },
          { label: 'Expenses', data: weeks.map(w => w.expense), backgroundColor: '#f7936a' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#e8e6f0', font: { family: 'Courier New', size: 11 } } } },
        scales: {
          x: { ticks: { color: '#7a7890', font: { family: 'Courier New', size: 10 } }, grid: { color: '#2e2e40' } },
          y: { ticks: { color: '#7a7890', font: { family: 'Courier New', size: 10 }, callback: v => '$' + v }, grid: { color: '#2e2e40' } },
        },
      },
    });
  }
}

// ── milestones ─────────────────────────────────────────────────────────────
function checkMilestones(prevBal, newBal) {
  if (prevBal < 0 && newBal >= 0) setTimeout(showBalanceMilestone, 500);
}

function getWeekNumber(d) {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

function checkWeekMilestone() {
  const perWeek = parseFloat(state.weekly_plan?.per_week || 0);
  if (!perWeek) return;
  const today = new Date();
  if (today.getDay() !== 0) return;
  const mon = new Date(today);
  mon.setDate(today.getDate() - 6);
  const monStr   = mon.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  const weekSpent = state.transactions
    .filter(t => t.type === 'expense' && t.date >= monStr && t.date <= todayStr)
    .reduce((s, t) => s + t.amount, 0);
  const isoWeek = today.getFullYear() + '-W' + String(getWeekNumber(today)).padStart(2, '0');
  if (weekSpent < perWeek && localStorage.getItem('last_week_celebrated') !== isoWeek) {
    localStorage.setItem('last_week_celebrated', isoWeek);
    setTimeout(showWeekWin, 500);
  }
}

// ── render ─────────────────────────────────────────────────────────────────
function render() {
  if (spendingChart) { spendingChart.destroy(); spendingChart = null; }
  const main = document.getElementById('main-content');
  switch (currentTab) {
    case 'dashboard': main.innerHTML = renderDashboard(); break;
    case 'add':       main.innerHTML = renderAdd();       break;
    case 'ledger':    main.innerHTML = renderLedger();    break;
    case 'weekly':    main.innerHTML = renderWeekly();    break;
    case 'import':    main.innerHTML = renderImport();    break;
    case 'budgets':   main.innerHTML = renderBudgets();   break;
  }
  attachHandlers();
}

// ── dashboard ──────────────────────────────────────────────────────────────
function renderDashboard() {
  const { income, expense, bycat } = totals();
  const balance  = income - expense;
  const balColor = balance >= 0 ? 'var(--success)' : 'var(--danger)';

  const cardDefs = [
    { title: 'BALANCE',  value: fmt(balance),                      color: balColor,          sub: 'income − expenses' },
    { title: 'INCOME',   value: fmt(income),                       color: 'var(--success)',  sub: 'total earned' },
    { title: 'EXPENSES', value: fmt(expense),                      color: 'var(--accent2)',  sub: 'total spent' },
    { title: 'ENTRIES',  value: String(state.transactions.length), color: 'var(--accent)',   sub: 'transactions' },
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
    .map(([cat, amt]) => {
      const limit = parseFloat(state.budgets[cat] || 0);
      let barColor = 'var(--accent)';
      let badge = '';
      if (limit > 0) {
        const pct = amt / limit;
        if (pct >= 1) {
          barColor = 'var(--danger)';
          badge = '<span class="budget-badge over">OVER!</span>';
        } else if (pct >= 0.8) {
          barColor = 'var(--warn)';
          badge = '<span class="budget-badge warn">80%</span>';
        }
      }
      return `
      <div class="breakdown-row">
        <span class="breakdown-label">${cat}</span>
        <div class="breakdown-bar-bg">
          <div class="breakdown-bar-fill" style="width:${(amt / maxCat * 100).toFixed(1)}%;background:${barColor}"></div>
        </div>
        <span class="breakdown-amt">${fmt(amt)}${badge}</span>
      </div>`;
    }).join('');

  return `
    <div class="page">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-sub">your financial snapshot</p>
      <div class="cards-grid">${cardsHtml}</div>
      <div class="section-title">Spending — Last 6 Weeks</div>
      <div class="chart-wrap"><canvas id="spending-chart"></canvas></div>
      ${Object.keys(bycat).length ? `
        <h2 class="section-title">Spending by Category</h2>
        <div class="breakdown">${breakdownHtml}</div>` : ''}
    </div>`;
}

// ── budgets ────────────────────────────────────────────────────────────────
function renderBudgets() {
  const rows = CATEGORIES.map(cat => `
    <div class="form-row">
      <label class="form-label">${cat}</label>
      <input type="number" class="form-input" id="budget-${cat}" placeholder="no limit" value="${state.budgets[cat] || ''}">
    </div>`).join('');
  return `
    <div class="page">
      <h1 class="page-title">Budget Limits</h1>
      <p class="page-sub">monthly cap per category</p>
      <div class="form-card">
        ${rows}
        <div class="btn-row">
          <button id="save-budgets" class="btn-primary">Save</button>
          <span id="budgets-status"></span>
        </div>
      </div>
    </div>`;
}

function attachBudgets() {
  document.getElementById('save-budgets')?.addEventListener('click', async () => {
    const dict = {};
    CATEGORIES.forEach(cat => {
      const val = document.getElementById('budget-' + cat)?.value;
      if (val) dict[cat] = parseFloat(val);
    });
    await api.saveBudgets(dict);
    state.budgets = dict;
    const status = document.getElementById('budgets-status');
    if (status) {
      status.textContent = '✓ Saved';
      setTimeout(() => { status.textContent = ''; }, 3000);
    }
  });
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
        <div class="form-row">
          <label class="form-label">Recurring</label>
          <label class="radio-label"><input type="checkbox" id="add-recurring"> Auto-add monthly</label>
        </div>
        <div id="add-status" class="form-status"></div>
        <button id="add-btn" class="btn-primary">Add Transaction</button>
      </div>
    </div>`;
}

// ── ledger ─────────────────────────────────────────────────────────────────
function renderLedger() {
  const allRows = state.transactions.map((t, i) => ({ ...t, _i: i }));
  const rows = allRows
    .slice().reverse()
    .filter(t => !ledgerFilter ||
      t.description.toLowerCase().includes(ledgerFilter) ||
      t.category.toLowerCase().includes(ledgerFilter) ||
      String(t.amount).includes(ledgerFilter))
    .map(t => {
      const sign = t.type === 'income' ? '+' : '-';
      const cls  = t.type === 'income' ? 'income' : 'expense';
      const prefix = t.recurring ? '↻ ' : '';
      return `
        <div class="ledger-row" data-idx="${t._i}">
          <div class="ledger-row-inner">
            <div class="ledger-main">
              <div class="ledger-desc">${prefix}${t.description}</div>
              <div class="ledger-meta">${t.date} · ${t.category}</div>
            </div>
            <div class="ledger-right">
              <div class="ledger-amt ${cls}">${sign}${fmt(t.amount)}</div>
              <button class="ledger-delete" data-idx="${t._i}">✕</button>
            </div>
          </div>
          <button class="swipe-delete-btn" data-idx="${t._i}">Delete</button>
        </div>`;
    }).join('');

  return `
    <div class="page">
      <h1 class="page-title">Ledger</h1>
      <p class="page-sub">all transactions</p>
      <input type="search" id="ledger-search" class="form-input" placeholder="Search transactions…" value="${ledgerFilter}" style="margin-bottom:12px;">
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

  const el = document.getElementById('wk-results');
  if (!el) return;
  el.innerHTML = `
    <div class="cards-grid">${summaryCards}</div>
    <div class="week-tracker">
      <div class="wt-header">
        <span class="wt-label">THIS WEEK</span>
        <span class="wt-dates">(Mon ${monLabel} – today)</span>
        <span class="wt-pct" style="color:${barColor}">${(weekPct * 100).toFixed(0)}% used</span>
      </div>
      <div class="wt-amounts">
        <span class="wt-spent" style="color:${barColor}">${fmt(weekSpent)}</span>
        <span class="wt-of"> / ${fmt(savedPerWeek)} weekly budget</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${(weekPct * 100).toFixed(1)}%;background:${barColor}"></div>
      </div>
    </div>
    <h2 class="section-title">Week-by-week breakdown</h2>
    <div class="week-breakdown">${weekRows}</div>`;
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

// ── swipe to delete ────────────────────────────────────────────────────────
function attachSwipeDelete() {
  let startX, startY, swipedRow = null;
  document.querySelectorAll('.ledger-row').forEach(row => {
    row.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    row.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - startX;
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dy > 20) return;
      if (dx < -40) {
        if (swipedRow && swipedRow !== row) swipedRow.classList.remove('swiped');
        row.classList.add('swiped');
        swipedRow = row;
      } else if (dx > 20) {
        row.classList.remove('swiped');
        if (swipedRow === row) swipedRow = null;
      }
    }, { passive: true });
  });
  document.addEventListener('touchstart', e => {
    if (swipedRow && !swipedRow.contains(e.target)) {
      swipedRow.classList.remove('swiped');
      swipedRow = null;
    }
  }, { passive: true });
  document.querySelectorAll('.swipe-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.idx);
      if (confirm('Delete this transaction?')) {
        await api.deleteTransaction(idx);
        ledgerFilter = '';
        render();
      }
    });
  });
}

// ── event handlers ─────────────────────────────────────────────────────────
function attachHandlers() {
  switch (currentTab) {
    case 'dashboard': attachDashboard(); break;
    case 'add':       attachAdd();       break;
    case 'ledger':    attachLedger();    break;
    case 'weekly':    attachWeekly(); calcWeekly(); break;
    case 'import':    attachImport();    break;
    case 'budgets':   attachBudgets();   break;
  }
}

function attachAdd() {
  document.getElementById('add-btn')?.addEventListener('click', async () => {
    const amtVal = document.getElementById('add-amount').value;
    const amount = parseFloat(amtVal);
    if (!amtVal || isNaN(amount) || amount <= 0) {
      showStatus('add-status', 'Enter a valid amount.', 'error');
      return;
    }
    const isRecurring = document.getElementById('add-recurring').checked;
    const t = {
      type:        document.querySelector('input[name="etype"]:checked').value,
      amount,
      description: document.getElementById('add-desc').value.trim() || '—',
      category:    document.getElementById('add-cat').value,
      date:        document.getElementById('add-date').value || today(),
      recurring:   isRecurring,
    };
    if (isRecurring) {
      t.recur_month = new Date().toISOString().slice(0, 7);
    }

    // milestone: capture balance before add
    const balFn = tx => tx.type === 'income' ? tx.amount : -tx.amount;
    const prevBal = state.transactions.reduce((s, tx) => s + balFn(tx), 0);

    await api.addTransaction(t);

    const newBal = state.transactions.reduce((s, tx) => s + balFn(tx), 0);

    showStatus('add-status', `✓ Added ${t.type}: ${fmt(t.amount)} (${t.category})`, 'success');
    document.getElementById('add-amount').value = '';
    document.getElementById('add-desc').value   = '';
    document.getElementById('add-recurring').checked = false;

    playSound(t.type);

    if (t.type === 'expense') {
      showRobbery(t.amount);
      checkRoast(t.category);
    } else {
      showPayday(t.amount);
    }

    checkMilestones(prevBal, newBal);
    checkWeekMilestone();
  });
}

function attachLedger() {
  // search filter
  document.getElementById('ledger-search')?.addEventListener('input', e => {
    ledgerFilter = e.target.value.toLowerCase();
    render();
  });

  // row tap → populate date editor
  document.querySelectorAll('.ledger-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.ledger-delete') || e.target.closest('.swipe-delete-btn')) return;
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
        ledgerFilter = '';
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

  attachSwipeDelete();
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
  await processRecurring();
  initSoundsToggle();
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/sw.js').catch(() => {});
  }
})();
