'use strict';

const VERSION = '1.5.1';
const CATEGORIES = ['Food','Snacks','Gas','Car','Boat','Tools','Home','Transport','Housing','Entertainment','Health','Shopping','Income','Other'];

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

// ── state + localStorage ───────────────────────────────────────────────────
let state = { transactions: [], weekly_plan: {}, budgets: {} };
let lastCalcPerWeek = 0;
const STORAGE_KEY   = 'slawminyaw';
const SETTINGS_KEY  = 'slawminyaw_settings';

function loadSettings() { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', required: true },
  { key: 'add',       label: 'Add',       icon: '➕' },
  { key: 'ledger',    label: 'Ledger',    icon: '📋' },
  { key: 'weekly',    label: 'Weekly',    icon: '📅' },
  { key: 'import',    label: 'Import',    icon: '📥' },
  { key: 'budgets',   label: 'Budgets',   icon: '💰' },
  { key: 'settings',  label: 'Settings',  icon: '⚙️',  required: true },
  { key: 'about',     label: 'About',     icon: 'ℹ️',  required: true },
];

function applySettings() {
  const s = loadSettings();
  const logo = document.querySelector('.logo');
  if (logo) logo.textContent = s.name ? s.name + "'s Budget" : 'SlawMinYaw';
  applyNavPosition(s.navPosition || 'bottom');
  applyNavItems(s.hiddenTabs || []);
}
function applyNavPosition(pos) {
  const app = document.getElementById('app');
  app.classList.remove('nav-top', 'nav-bottom', 'nav-left', 'nav-right');
  app.classList.add('nav-' + pos);
}
function applyNavItems(hiddenTabs) {
  NAV_ITEMS.forEach(item => {
    const btn = document.querySelector(`.nav-btn[data-tab="${item.key}"]`);
    if (btn) btn.style.display = hiddenTabs.includes(item.key) ? 'none' : '';
  });
}

function _save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    transactions: state.transactions,
    weekly_plan:  state.weekly_plan,
    budgets:      state.budgets,
  }));
}

const api = {
  async load() {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state.transactions = d.transactions || [];
    state.weekly_plan  = d.weekly_plan  || {};
    state.budgets      = d.budgets      || {};
    return state;
  },
  async addTransaction(t) {
    state.transactions.push(t);
    _save();
  },
  async deleteTransaction(idx) {
    state.transactions.splice(idx, 1);
    _save();
  },
  async patchTransaction(idx, updates) {
    Object.assign(state.transactions[idx], updates);
    _save();
  },
  async saveWeeklyPlan(plan) {
    state.weekly_plan = plan;
    _save();
  },
  async saveBudgets(b) {
    state.budgets = b;
    _save();
  },
};

// ── recurring ──────────────────────────────────────────────────────────────
async function processRecurring() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const len = state.transactions.length;
  for (let i = 0; i < len; i++) {
    const t = state.transactions[i];
    if (t.recurring === true && t.recur_month !== currentMonth) {
      state.transactions.push({ ...t, date: currentMonth + '-01', recur_month: currentMonth });
      state.transactions[i] = { ...t, recur_month: currentMonth };
    }
  }
  _save();
}

// ── helpers ────────────────────────────────────────────────────────────────
function totals() {
  let income = 0, expense = 0;
  const bycat = {};
  for (const t of state.transactions) {
    if (t.type === 'income') { income += t.amount; }
    else { expense += t.amount; bycat[t.category] = (bycat[t.category] || 0) + t.amount; }
  }
  return { income, expense, bycat };
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() { return new Date().toISOString().split('T')[0]; }

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
  if (currentTab === 'ledger' && key !== 'ledger') ledgerFilter = '';
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
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    const monStr = mon.toISOString().slice(0, 10);
    const sunStr = sun.toISOString().slice(0, 10);
    const label = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let income = 0, expense = 0;
    for (const t of state.transactions) {
      if (t.date >= monStr && t.date <= sunStr) {
        if (t.type === 'income') income += t.amount; else expense += t.amount;
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
  const mon = new Date(today); mon.setDate(today.getDate() - 6);
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
    case 'settings':  main.innerHTML = renderSettings();  break;
    case 'about':     main.innerHTML = renderAbout();     break;
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
  const breakdownHtml = Object.entries(bycat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
    const limit = parseFloat(state.budgets[cat] || 0);
    let barColor = 'var(--accent)', badge = '';
    if (limit > 0) {
      const pct = amt / limit;
      if (pct >= 1)   { barColor = 'var(--danger)'; badge = '<span class="budget-badge over">OVER!</span>'; }
      else if (pct >= 0.8) { barColor = 'var(--warn)';   badge = '<span class="budget-badge warn">80%</span>'; }
    }
    return `
      <div class="breakdown-row">
        <span class="breakdown-label">${cat}</span>
        <div class="breakdown-bar-bg">
          <div class="breakdown-bar-fill" style="width:${(amt/maxCat*100).toFixed(1)}%;background:${barColor}"></div>
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
      ${Object.keys(bycat).length ? `<h2 class="section-title">Spending by Category</h2><div class="breakdown">${breakdownHtml}</div>` : ''}
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
    const status = document.getElementById('budgets-status');
    if (status) { status.textContent = '✓ Saved'; setTimeout(() => { status.textContent = ''; }, 3000); }
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
  const rows = allRows.slice().reverse()
    .filter(t => !ledgerFilter ||
      t.description.toLowerCase().includes(ledgerFilter) ||
      t.category.toLowerCase().includes(ledgerFilter) ||
      String(t.amount).includes(ledgerFilter))
    .map(t => {
      const sign = t.type === 'income' ? '+' : '-';
      const cls  = t.type === 'income' ? 'income' : 'expense';
      const prefix = t.recurring ? '↻ ' : '';
      const catOptions = CATEGORIES.map(c =>
        `<option value="${c}"${c === t.category ? ' selected' : ''}>${c}</option>`).join('');
      return `
        <div class="ledger-row" data-idx="${t._i}">
          <div class="ledger-row-inner">
            <div class="ledger-main">
              <div class="ledger-desc">${prefix}${t.description}</div>
              <div class="ledger-meta">${t.date} · ${t.category}</div>
            </div>
            <div class="ledger-right">
              <div class="ledger-amt ${cls}">${sign}${fmt(t.amount)}</div>
              <button class="ledger-edit-btn" data-idx="${t._i}" title="Edit">✏️</button>
              <button class="ledger-delete" data-idx="${t._i}">✕</button>
            </div>
          </div>
          <div class="ledger-inline-edit">
            <div class="ie-grid">
              <select class="form-input ie-type">
                <option value="expense"${t.type==='expense'?' selected':''}>Expense</option>
                <option value="income"${t.type==='income'?' selected':''}>Income</option>
              </select>
              <input type="date" class="form-input ie-date" value="${t.date}">
              <select class="form-input ie-cat">${catOptions}</select>
              <input type="text" class="form-input ie-desc" value="${t.description}" placeholder="Description">
              <input type="number" class="form-input ie-amount" value="${t.amount}" step="0.01" min="0" placeholder="Amount">
            </div>
            <div class="ie-btns">
              <button class="btn-sm ie-save" data-idx="${t._i}">Save</button>
              <button class="ie-cancel">Cancel</button>
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
          <label class="form-label">Emergency buffer <span id="buf-label">${defBuffer}%</span></label>
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
  const balance    = parseFloat(document.getElementById('wk-balance')?.value)  || 0;
  const bills      = parseFloat(document.getElementById('wk-bills')?.value)    || 0;
  const bufPct     = parseInt(document.getElementById('wk-buffer')?.value)     || 0;
  const paydateStr = document.getElementById('wk-paydate')?.value || '';
  let days = 14;
  if (paydateStr) {
    const paydate = new Date(paydateStr + 'T00:00:00');
    const now = new Date(); now.setHours(0,0,0,0);
    days = Math.max(1, Math.round((paydate - now) / 86400000) + 1);
  }
  const spendable = Math.max(0, balance - bills);
  const buffer    = spendable * bufPct / 100;
  const available = Math.max(0, spendable - buffer);
  const weeks     = Math.ceil(days / 7);
  const perWeek   = weeks > 0 ? available / weeks : 0;
  lastCalcPerWeek = perWeek;
  const perDay    = days > 0 ? available / days : 0;

  const now    = new Date(); now.setHours(0,0,0,0);
  const monday = new Date(now);
  monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  const mondayStr = monday.toISOString().split('T')[0];
  const weekExpenses     = state.transactions.filter(t => t.type==='expense' && t.date>=mondayStr).reduce((s,t)=>s+t.amount,0);
  const weekIncomeOffset = state.transactions.filter(t => t.type==='income'  && t.date>=mondayStr).reduce((s,t)=>s+t.amount,0);
  const weekNet  = Math.max(0, weekExpenses - weekIncomeOffset);
  const weekPct  = perWeek > 0 ? Math.min(weekNet / perWeek, 1) : 0;
  const barColor = weekPct >= 1 ? 'var(--danger)' : weekPct >= 0.8 ? 'var(--warn)' : 'var(--success)';

  const summaryCards = [
    ['SPENDABLE', fmt(available), 'var(--text)',    `after bills${bufPct?' + buffer':''}`],
    ['PER WEEK',  fmt(perWeek),   'var(--success)', `across ${weeks} week${weeks!==1?'s':''}`],
    ['PER DAY',   fmt(perDay),    'var(--accent)',  'daily limit'],
    ...(bufPct ? [['BUFFER', fmt(buffer), 'var(--warn)', 'emergency fund']] : []),
  ].map(([t,v,c,s]) => `<div class="card"><div class="card-title">${t}</div><div class="card-value" style="color:${c}">${v}</div><div class="card-sub">${s}</div></div>`).join('');

  const thisWeekTxns = state.transactions.filter(t=>t.date>=mondayStr).sort((a,b)=>b.date.localeCompare(a.date));
  const thisWeekTxnHtml = thisWeekTxns.length
    ? thisWeekTxns.map(t=>`<div class="pw-txn-row"><span class="pw-txn-date">${t.date}</span><span class="pw-txn-amt" style="color:${t.type==='income'?'var(--success)':'var(--text)'}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</span><span class="pw-txn-cat">${t.category||''}</span><span class="pw-txn-desc">${t.description||''}</span></div>`).join('')
    : '<p class="pw-empty">No transactions yet this week.</p>';

  const monLabel     = monday.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const paydate      = paydateStr ? new Date(paydateStr+'T00:00:00') : new Date(now.getTime()+(days-1)*86400000);
  const daysFromMon  = Math.max(1, Math.round((paydate - monday) / 86400000) + 1);
  const weeksDisplay = Math.ceil(daysFromMon / 7);

  const weekRows = Array.from({length: weeksDisplay}, (_, w) => {
    const sd = new Date(monday); sd.setDate(monday.getDate() + w*7);
    const ed = new Date(monday); ed.setDate(monday.getDate() + (w+1)*7 - 1);
    if (ed > paydate) ed.setTime(paydate.getTime());
    const wkS = sd.toISOString().split('T')[0];
    const wkE = ed.toISOString().split('T')[0];
    const lbl = `${sd.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${ed.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
    const wkTxns = state.transactions.filter(t=>t.date>=wkS&&t.date<=wkE);
    const wkExp  = wkTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const wkInc  = wkTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const wkNet  = Math.max(0, wkExp - wkInc);
    const wkPct  = perWeek > 0 ? Math.min(wkNet/perWeek*100,100) : 0;
    const wkColor = wkPct>=100?'var(--danger)':wkPct>=80?'var(--warn)':wkNet>0?'var(--success)':'var(--muted)';
    const txnHtml = wkTxns.length
      ? wkTxns.sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`<div class="pw-txn-row"><span class="pw-txn-date">${t.date}</span><span class="pw-txn-amt" style="color:${t.type==='income'?'var(--success)':'var(--text)'}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</span><span class="pw-txn-cat">${t.category||''}</span><span class="pw-txn-desc">${t.description||''}</span></div>`).join('')
      : '<p class="pw-empty">No transactions.</p>';
    return `<div class="wkb-row"><div class="wkb-header"><span class="week-label">Wk ${w+1}</span><span class="week-dates">${lbl}</span><div class="breakdown-bar-bg small"><div class="breakdown-bar-fill" style="width:${wkPct.toFixed(1)}%;background:${wkColor}"></div></div><span class="wkb-amounts" style="color:${wkColor}">${fmt(wkNet)} / ${fmt(perWeek)}</span><span class="pw-week-toggle">▼</span></div><div class="pw-week-txns">${txnHtml}</div></div>`;
  }).join('');

  const pastWeeksHtml = (() => {
    const rows = [];
    for (let i = 0; i < 8; i++) {
      const wkStart = new Date(monday); wkStart.setDate(monday.getDate() - (i+1)*7);
      const wkEnd   = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6);
      const wkS = wkStart.toISOString().split('T')[0];
      const wkE = wkEnd.toISOString().split('T')[0];
      const weekTxns = state.transactions.filter(t=>t.date>=wkS&&t.date<=wkE);
      if (!weekTxns.length && i >= 4) continue;
      const spent  = weekTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
      const earned = weekTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
      const lbl = `${wkStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${wkEnd.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
      const txnHtml = weekTxns.length
        ? weekTxns.sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`<div class="pw-txn-row"><span class="pw-txn-date">${t.date}</span><span class="pw-txn-amt" style="color:${t.type==='income'?'var(--success)':'var(--text)'}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</span><span class="pw-txn-cat">${t.category||''}</span><span class="pw-txn-desc">${t.description||''}</span></div>`).join('')
        : '<p class="pw-empty">No transactions this week.</p>';
      rows.push(`<div class="pw-week-row"><div class="pw-week-header"><span class="pw-week-dates">${lbl}</span><span class="pw-week-spent" style="color:${spent?'var(--danger)':'var(--muted)'}">spent ${fmt(spent)}</span>${earned?`<span class="pw-week-earned">income ${fmt(earned)}</span>`:''}<span class="pw-week-toggle">▼</span></div><div class="pw-week-txns">${txnHtml}</div></div>`);
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
        <span class="wt-pct" style="color:${barColor}">${(weekPct*100).toFixed(0)}% used</span>
      </div>
      <div class="wt-amounts">
        <span class="wt-spent" style="color:${barColor}">${fmt(weekNet)}</span>
        <span class="wt-of"> / ${fmt(perWeek)} weekly budget</span>
      </div>
      ${weekIncomeOffset?`<div class="wt-offset">${fmt(weekExpenses)} spent − ${fmt(weekIncomeOffset)} income = ${fmt(weekNet)} net</div>`:''}
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${(weekPct*100).toFixed(1)}%;background:${barColor}"></div>
      </div>
      <div class="wt-txns-section">
        <button class="wt-txns-toggle">▼  show transactions</button>
        <div class="pw-week-txns wt-txns-body">${thisWeekTxnHtml}</div>
      </div>
    </div>
    <h2 class="section-title">Week-by-week breakdown</h2>
    <div class="wkb-rows">${weekRows}</div>
    ${pastWeeksHtml?`<h2 class="section-title" style="margin-top:20px">Past Weeks</h2><div class="pw-weeks">${pastWeeksHtml}</div>`:''}`;

  el.querySelector('.wt-txns-toggle')?.addEventListener('click', function() {
    const body = this.nextElementSibling;
    const open = body.style.display !== 'block';
    body.style.display = open ? 'block' : 'none';
    this.textContent = open ? '▲  hide transactions' : '▼  show transactions';
  });
  el.querySelectorAll('.wkb-header, .pw-week-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const row  = hdr.closest('.wkb-row, .pw-week-row');
      const txns = row.querySelector('.pw-week-txns');
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
      <h1 class="page-title">Import / Export</h1>
      <p class="page-sub">move data between desktop and mobile</p>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Import from Desktop</h2>
        <p class="code-hint">Choose the backup file exported from the desktop app to load all your data here.</p>
        <div id="json-import-status" class="form-status"></div>
        <label class="btn-primary" style="display:inline-block;margin-top:10px;cursor:pointer;text-align:center;width:100%;box-sizing:border-box">
          ⬆ Load Desktop Backup
          <input type="file" id="import-json-file" accept=".json" style="display:none">
        </label>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Export from Phone</h2>
        <p class="code-hint">Download your current mobile data as a backup or to move it back to the desktop app.</p>
        <button id="export-json-btn" class="btn-primary" style="margin-top:10px;width:100%">⬇ Download SlawMinYaw Backup</button>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Import CSV</h2>
        <p class="page-sub" style="margin:0 0 8px">bulk-load transactions from a spreadsheet</p>
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

// ── settings ───────────────────────────────────────────────────────────────
function renderSettings() {
  const s = loadSettings();
  const navPos = s.navPosition || 'bottom';
  const hiddenTabs = s.hiddenTabs || [];
  const navOpts = ['bottom','top','left','right'].map(p =>
    `<button class="nav-pos-btn${navPos===p?' active':''}" data-pos="${p}">${p.charAt(0).toUpperCase()+p.slice(1)}</button>`
  ).join('');
  const tabToggles = NAV_ITEMS.map(item => `
    <label class="tab-toggle${item.required?' tab-toggle--disabled':''}">
      <span class="tab-toggle-icon">${item.icon}</span>
      <span class="tab-toggle-label">${item.label}</span>
      <input type="checkbox" class="tab-toggle-input" data-tab="${item.key}"
        ${!hiddenTabs.includes(item.key) ? 'checked' : ''}
        ${item.required ? 'disabled' : ''}>
      <span class="tab-toggle-switch"></span>
    </label>`).join('');
  return `
    <div class="page">
      <h1 class="page-title">Settings</h1>
      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Personalize</h2>
        <div class="form-row">
          <label class="form-label">Your name</label>
          <input type="text" id="setting-name" class="form-input" value="${s.name || ''}" placeholder="e.g. Cole">
        </div>
        <div class="btn-row">
          <button id="settings-save" class="btn-primary">Save</button>
          <span id="settings-status" class="status-inline"></span>
        </div>
      </div>
      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Navigation Position</h2>
        <p class="code-hint" style="margin-bottom:12px">Choose which side of the screen the nav bar sits on.</p>
        <div class="nav-pos-grid">${navOpts}</div>
      </div>
      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Customize Nav</h2>
        <p class="code-hint" style="margin-bottom:12px">Show or hide tabs in the nav bar.</p>
        <div class="tab-toggles">${tabToggles}</div>
      </div>
    </div>`;
}

function attachSettings() {
  document.getElementById('settings-save')?.addEventListener('click', () => {
    const s = loadSettings();
    s.name = document.getElementById('setting-name').value.trim();
    saveSettings(s);
    applySettings();
    showStatus('settings-status', '✓ Saved', 'success', 2000);
  });

  document.querySelectorAll('.nav-pos-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = loadSettings();
      s.navPosition = btn.dataset.pos;
      saveSettings(s);
      applyNavPosition(btn.dataset.pos);
      document.querySelectorAll('.nav-pos-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  document.querySelectorAll('.tab-toggle-input').forEach(cb => {
    cb.addEventListener('change', () => {
      const s = loadSettings();
      const hidden = [];
      document.querySelectorAll('.tab-toggle-input').forEach(c => {
        if (!c.checked && !c.disabled) hidden.push(c.dataset.tab);
      });
      s.hiddenTabs = hidden;
      saveSettings(s);
      applyNavItems(hidden);
    });
  });
}

// ── about ──────────────────────────────────────────────────────────────────
const QUOTES = [
  "A budget is telling your money where to go instead of wondering where it went. — Dave Ramsey",
  "Do not save what is left after spending, but spend what is left after saving. — Warren Buffett",
  "Wealth is not about having a lot of money; it's about having a lot of options. — Chris Rock",
  "Financial freedom is available to those who learn about it and work for it. — Robert Kiyosaki",
  "It's not how much money you make, but how much money you keep. — Robert Kiyosaki",
  "The secret to wealth is simple: find a way to do more for others than anyone else does. — Tony Robbins",
  "Money is a tool. Used properly it makes something beautiful; used wrong, it makes a mess. — Bradley Vinson",
  "Every dollar you own is a soldier you can send to work for you. — Unknown",
];

function renderAbout() {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const built = new Date().getFullYear();
  const s = loadSettings();
  const userName = s.name ? `${s.name}'s Budget` : null;
  return `
    <div class="page">
      <h1 class="page-title">About</h1>
      <div class="form-card" style="text-align:center;padding:28px 20px">
        <div style="font-size:2.4rem;margin-bottom:4px">💸</div>
        ${userName ? `<div style="font-size:1.5rem;font-weight:700;color:var(--accent)">${userName}</div><div style="font-size:.8rem;color:var(--muted);margin-bottom:4px">Powered by</div>` : ''}
        <div style="font-size:${userName?'1.1rem':'1.5rem'};font-weight:700;color:var(--accent)">SlawMinYaw</div>
        <div style="font-size:.85rem;color:var(--muted);margin-bottom:16px">money moves</div>
        <div style="font-size:.75rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Version</div>
        <div style="font-size:1.1rem;font-weight:600;color:var(--text);margin-bottom:20px">v${VERSION}</div>
        <hr style="border:none;border-top:1px solid var(--border);margin:0 0 20px">
        <div style="font-size:.75rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">Quote of the Day</div>
        <p style="font-size:.9rem;color:var(--text);line-height:1.6;font-style:italic;margin:0">"${quote}"</p>
      </div>
      <div class="form-card" style="text-align:center">
        <p class="code-hint" style="margin-bottom:12px">If the app feels out of date, tap below to clear the cache and reload the latest version.</p>
        <button id="force-update-btn" class="btn-primary" style="width:100%">🔄 Force Update</button>
        <div id="force-update-status" class="form-status" style="margin-top:8px"></div>
      </div>
      <p style="text-align:center;font-size:.75rem;color:var(--muted);margin-top:8px">© ${built} SlawMinYaw. All rights reserved.</p>
    </div>`;
}

function attachAbout() {
  document.getElementById('force-update-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('force-update-btn');
    const status = document.getElementById('force-update-status');
    btn.disabled = true;
    btn.textContent = 'Clearing cache…';
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      btn.textContent = 'Reloading…';
      window.location.href = window.location.pathname + '?v=' + Date.now();
    } catch(e) {
      status.textContent = 'Error: ' + e.message;
      btn.disabled = false;
      btn.textContent = '🔄 Force Update';
    }
  });
}

function parseCSVLine(line) {
  const result = []; let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

// ── swipe to delete ────────────────────────────────────────────────────────
function attachSwipeDelete() {
  let startX, startY, swipedRow = null;
  document.querySelectorAll('.ledger-row').forEach(row => {
    row.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
    row.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - startX;
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dy > 20) return;
      if (dx < -40) { if (swipedRow && swipedRow !== row) swipedRow.classList.remove('swiped'); row.classList.add('swiped'); swipedRow = row; }
      else if (dx > 20) { row.classList.remove('swiped'); if (swipedRow === row) swipedRow = null; }
    }, { passive: true });
  });
  document.addEventListener('touchstart', e => {
    if (swipedRow && !swipedRow.contains(e.target)) { swipedRow.classList.remove('swiped'); swipedRow = null; }
  }, { passive: true });
  document.querySelectorAll('.swipe-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.idx);
      if (confirm('Delete this transaction?')) { await api.deleteTransaction(idx); ledgerFilter = ''; render(); }
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
    case 'settings':  attachSettings();  break;
    case 'about':     attachAbout();     break;
  }
}

async function autoUpdateWeeklyPlan(incomeAdded) {
  const wp = state.weekly_plan;
  if (!wp || !wp.paydate || !wp.per_week) return;
  const storedBalance = parseFloat(wp.balance || '0') || 0;
  const newBalance = storedBalance + incomeAdded;
  const bills  = parseFloat(wp.bills  || '0') || 0;
  const bufPct = parseInt(wp.buffer   || '0') || 0;
  const paydate = new Date(wp.paydate + 'T00:00:00');
  const now = new Date(); now.setHours(0,0,0,0);
  const days = Math.max(1, Math.round((paydate - now) / 86400000) + 1);
  const spendable = Math.max(0, newBalance - bills);
  const available = Math.max(0, spendable - spendable * bufPct / 100);
  const weeks   = Math.ceil(days / 7);
  const perWeek = weeks > 0 ? available / weeks : 0;
  await api.saveWeeklyPlan({ ...wp, balance: newBalance.toFixed(2), per_week: perWeek });
}

function attachAdd() {
  document.getElementById('add-btn')?.addEventListener('click', async () => {
    const amtVal = document.getElementById('add-amount').value;
    const amount = parseFloat(amtVal);
    if (!amtVal || isNaN(amount) || amount <= 0) { showStatus('add-status', 'Enter a valid amount.', 'error'); return; }
    const isRecurring = document.getElementById('add-recurring').checked;
    const t = {
      type:        document.querySelector('input[name="etype"]:checked').value,
      amount,
      description: document.getElementById('add-desc').value.trim() || '—',
      category:    document.getElementById('add-cat').value,
      date:        document.getElementById('add-date').value || today(),
      recurring:   isRecurring,
    };
    if (isRecurring) t.recur_month = new Date().toISOString().slice(0, 7);
    const balFn  = tx => tx.type === 'income' ? tx.amount : -tx.amount;
    const prevBal = state.transactions.reduce((s, tx) => s + balFn(tx), 0);
    await api.addTransaction(t);
    if (t.type === 'income') await autoUpdateWeeklyPlan(t.amount);
    const newBal = state.transactions.reduce((s, tx) => s + balFn(tx), 0);
    showStatus('add-status', `✓ Added ${t.type}: ${fmt(t.amount)} (${t.category})`, 'success');
    document.getElementById('add-amount').value = '';
    document.getElementById('add-desc').value   = '';
    document.getElementById('add-recurring').checked = false;
    playSound(t.type);
    if (t.type === 'expense') { showRobbery(t.amount); checkRoast(t.category); }
    else { showPayday(t.amount); }
    checkMilestones(prevBal, newBal);
    checkWeekMilestone();
  });
}

function attachLedger() {
  document.getElementById('ledger-search')?.addEventListener('input', e => { ledgerFilter = e.target.value.toLowerCase(); render(); });

  document.querySelectorAll('.ledger-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const row = btn.closest('.ledger-row');
      const editDiv = row.querySelector('.ledger-inline-edit');
      const isOpen = editDiv.style.display === 'block';
      document.querySelectorAll('.ledger-inline-edit').forEach(d => d.style.display = 'none');
      document.querySelectorAll('.ledger-row').forEach(r => r.classList.remove('selected'));
      if (!isOpen) { editDiv.style.display = 'block'; row.classList.add('selected'); }
    });
  });

  document.querySelectorAll('.ie-save').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const idx  = parseInt(btn.dataset.idx);
      const edit = btn.closest('.ledger-inline-edit');
      await api.patchTransaction(idx, {
        type:        edit.querySelector('.ie-type').value,
        date:        edit.querySelector('.ie-date').value,
        category:    edit.querySelector('.ie-cat').value,
        description: edit.querySelector('.ie-desc').value,
        amount:      parseFloat(edit.querySelector('.ie-amount').value) || 0,
      });
      render();
    });
  });

  document.querySelectorAll('.ie-cancel').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      btn.closest('.ledger-inline-edit').style.display = 'none';
      btn.closest('.ledger-row').classList.remove('selected');
    });
  });

  document.querySelectorAll('.ledger-delete').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const t   = state.transactions[idx];
      if (confirm(`Delete: ${t.description} (${fmt(t.amount)})?`)) {
        await api.deleteTransaction(idx); selectedLedgerIdx = null; ledgerFilter = ''; render();
      }
    });
  });

  attachSwipeDelete();
}

function attachWeekly() {
  const bufSlider = document.getElementById('wk-buffer');
  const bufLabel  = document.getElementById('buf-label');
  bufSlider?.addEventListener('input', () => { bufLabel.textContent = bufSlider.value + '%'; calcWeekly(); });
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
    if (el) { el.textContent = '✓ Saved'; setTimeout(() => { el.textContent = ''; }, 3000); }
  });
}

function attachImport() {
  document.getElementById('import-json-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.transactions) throw new Error('Invalid backup file');
        state.transactions = data.transactions || [];
        state.weekly_plan  = data.weekly_plan  || {};
        state.budgets      = data.budgets      || {};
        _save();
        showStatus('json-import-status', `✓ Loaded ${state.transactions.length} transactions from backup.`, 'success', 0);
        render();
      } catch(err) {
        showStatus('json-import-status', `Error: ${err.message}`, 'error', 0);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    const payload = JSON.stringify({
      transactions: state.transactions,
      weekly_plan:  state.weekly_plan,
      budgets:      state.budgets,
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `slawminyaw-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('import-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = ev.target.result.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g,''));
      let added = 0, errors = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          const vals = parseCSVLine(line);
          const row  = {};
          headers.forEach((h, j) => row[h] = (vals[j]||'').replace(/"/g,'').trim());
          const amount = parseFloat((row.amount||'0').replace('$','').replace(',',''));
          if (isNaN(amount)) { errors++; continue; }
          state.transactions.push({
            date: row.date || today(), type: (row.type||'expense').toLowerCase(),
            category: row.category||'Other', description: row.description||'—', amount,
          });
          added++;
        } catch(err) { errors++; }
      }
      _save();
      showStatus('import-status', `✓ Imported ${added} transactions.${errors?` (${errors} skipped)`:''}`, 'success', 0);
      render();
    };
    reader.readAsText(file);
  });
}

// ── init ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn =>
  btn.addEventListener('click', () => showTab(btn.dataset.tab)));

(async () => {
  await api.load();
  await processRecurring();
  initSoundsToggle();
  applySettings();
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      // Force an update check every time the app is opened
      reg.update();
      window.addEventListener('focus', () => reg.update());
    }).catch(() => {});
    // When a new service worker takes over, reload to get fresh files
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.href = window.location.pathname + '?v=' + Date.now();
    });
  }
})();
