'use strict';

const VERSION = '5.43.76';
const DEFAULT_CATEGORIES = ['Food','Gas','Car','Boat','Tools','Home','Entertainment','Health','Other'];

function getCategories() {
  const s = loadSettings();
  return [...DEFAULT_CATEGORIES, ...(s.customCategories || [])];
}

// ── auto-categorization ──────────────────────────────────────────────────────
// Guesses a category from a transaction description. Priority:
//   1) your own history — a past transaction with the same (normalized) description
//   2) built-in merchant/keyword hints
//   3) 'Other'
// Built-in hints map to the default categories; learned matches can be any
// category you've used (including custom ones).
const _CAT_KEYWORDS = [
  ['Food',          ['restaurant','cafe','coffee','starbucks','dunkin','mcdonald','burger','pizza','taco','chipotle','grocery','groceries','supermarket',' market','doordash','uber eats','ubereats','grubhub','deli','bakery','diner','sushi','subway','wendy','kfc','panera','safeway','kroger','aldi','trader joe','whole foods','food']],
  ['Gas',           ['fuel','shell','chevron','exxon','mobil','marathon','speedway','conoco','sunoco','valero','citgo','petro','gas station',' gas']],
  ['Car',           ['car wash','autozone','o\'reilly','oreilly','napa','tire','mechanic','dmv','parking','toll','jiffy lube','auto parts']],
  ['Home',          ['rent','mortgage','lowes','home depot','ikea','furniture','electric','water bill','utility','utilities','internet','comcast','xfinity','spectrum','at&t','verizon','t-mobile','insurance']],
  ['Entertainment', ['netflix','spotify','hulu','disney','movie','cinema','theater','theatre','steam','xbox','playstation','hbo','prime video','concert','ticketmaster','twitch']],
  ['Health',        ['pharmacy','cvs','walgreens','doctor','dental','dentist','clinic','hospital','gym','fitness','medical','rite aid']],
  ['Tools',         ['hardware','harbor freight','ace hardware',' tool']],
];
function _normDesc(s) {
  return (s || '').toLowerCase().replace(/[0-9]+/g, '').replace(/[^a-z& ]/g, ' ').replace(/\s+/g, ' ').trim();
}
// Build a normalized-description → most-frequent-category index from history.
// Pass the result into _guessCategory to avoid rebuilding it per row on import.
function _learnedCategoryMap() {
  const counts = {};
  for (const t of state.transactions) {
    if (!t.description || !t.category || t.category === 'Other' || t.type === 'income') continue;
    const k = _normDesc(t.description);
    if (!k) continue;
    (counts[k] || (counts[k] = {}))[t.category] = (counts[k][t.category] || 0) + 1;
  }
  const out = {};
  for (const k in counts) out[k] = Object.entries(counts[k]).sort((a, b) => b[1] - a[1])[0][0];
  return out;
}
function _guessCategory(description, type, learned) {
  if (type === 'income') return 'Income';
  if (!description) return 'Other';
  const norm = _normDesc(description);
  const map  = learned || _learnedCategoryMap();
  if (norm && map[norm]) return map[norm];
  const lc = ' ' + description.toLowerCase() + ' ';
  for (const [cat, words] of _CAT_KEYWORDS) {
    for (const w of words) { if (lc.includes(w)) return cat; }
  }
  return 'Other';
}

// Reusable line-icon SVGs (Feather-style) — used in place of emoji on buttons/labels.
function _svg(inner, size) {
  return `<svg viewBox="0 0 24 24" width="${size||14}" height="${size||14}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px">${inner}</svg>`;
}
const ICONS = {
  download: _svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  upload:   _svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'),
  dollar:   _svg('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  link:     _svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', 11),
  card:     _svg('<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>'),
  bank:     _svg('<line x1="3" y1="21" x2="21" y2="21"/><polyline points="5 7 12 3.5 19 7"/><line x1="5" y1="10" x2="5" y2="18"/><line x1="10" y1="10" x2="10" y2="18"/><line x1="14" y1="10" x2="14" y2="18"/><line x1="19" y1="10" x2="19" y2="18"/>'),
  bell:     _svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
  bellOff:  _svg('<path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/>'),
  refresh:  _svg('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),
};

const CHANGELOG = [
  { version: '5.43.76', date: '2026-07-13', changes: [
    'Average spending is now customizable: tap the Bills chip or any category chip on the Insights "Average spending" card to leave it out of your per day/week/month averages. Your choices are remembered',
  ]},
  { version: '5.43.75', date: '2026-07-13', changes: [
    'New on Insights: an Average spending card showing your typical per day, per week, and per month spend, based on the last 90 days of expenses (or your whole history if shorter)',
  ]},
  { version: '5.43.74', date: '2026-07-13', changes: [
    'Moved the hide-balances eye button into the top-right corner next to the edit pencil so it no longer overlaps the "TOTAL BALANCE" label',
  ]},
  { version: '5.43.73', date: '2026-07-13', changes: [
    'Polish pass: light themes now use a slightly darker secondary text color so small labels meet accessibility contrast against the light background',
    'The Challenges page empty state now shows the illustrated mascot card, matching every other list instead of a plain line of text',
    'Under the hood: added a shared type-scale and elevation-shadow token set and consolidated a few duplicate shadows — groundwork for keeping the look consistent as the app grows (no visible change)',
  ]},
  { version: '5.43.72', date: '2026-07-13', changes: [
    'New: Hide balances — tap the eye icon on the balance card (or Settings → Privacy) to blur every dollar amount across the app, so you can open it in public without flashing your finances. The choice sticks until you turn it back off',
  ]},
  { version: '5.43.71', date: '2026-07-13', changes: [
    'Fixed a display bug where transactions, bills, goals, accounts, or categories containing quotes or angle brackets (like a 7" pipe or "AT&T") rendered incorrectly or broke the inline edit form — all user-entered text is now escaped consistently everywhere it appears (ledger, dashboard, bills, goals, debt, retirement, import preview, and confirm dialogs)',
    'Consolidated a duplicate internal escape helper that had been silently weakening quote handling app-wide',
  ]},
  { version: '5.43.70', date: '2026-07-06', changes: [
    'Gengar theme now shows the whole ghost line on the dashboard — Gengar front and center, flanked by animated Haunter and Gastly',
  ]},
  { version: '5.43.69', date: '2026-07-06', changes: [
    'Removed the Beta Dashboard toggle experiment',
  ]},
  { version: '5.43.66', date: '2026-07-06', changes: [
    'Dashboard balance chart now shows a loading shimmer instead of blank space while the chart library loads (only noticeable on a very first visit or slow connection)',
    'Notes & Reminders empty state now shows the illustrated "no notes yet" card (matching the Ledger) instead of unstyled plain text',
    'Light mode contrast fixes — nav labels, "View all" links, and the dashboard\'s "LOCK TF IN." text were below readable contrast against light backgrounds; darkened just enough to pass while keeping the same accent color everywhere else',
  ]},
  { version: '5.43.65', date: '2026-07-06', changes: [
    'Shrunk the Doberman and DAWG hero artwork (several were multiple megabytes at print resolution) — faster loads with no visible quality loss',
  ]},
  { version: '5.43.61', date: '2026-07-01', changes: [
    'Find matching amount — a new "Find $" button on the Ledger: enter an amount and a date range and it lists the expenses that add up to it, as single items, pairs, or triples. Perfect for tracking down which charges make up a bank-vs-app difference',
  ]},
  { version: '5.43.60', date: '2026-07-01', changes: [
    'Find duplicates — a new "Duplicates" button on the Ledger scans for repeated transactions (same amount, type & description, ignoring capitalization) and lets you delete the accidental copy with one tap. Great for tracking down a double-charged bill when your balance doesn\'t match the bank',
  ]},
  { version: '5.43.59', date: '2026-07-01', changes: [
    'New Monthly Report — tap "Monthly savings report" on the Insights page to see a full spending summary for any month (defaults to last month)',
    'The report shows income, total spent, and what you could save (net + savings rate), with a per-category breakdown including how many transactions each',
    'Tick/untick categories to include or exclude them from the totals — instantly see how much you\'d save without them (e.g. "cutting these is worth $155/mo"). Browse month-to-month with the arrows',
  ]},
  { version: '5.43.58', date: '2026-06-26', changes: [
    'Edit existing bills — each bill now has an Edit button that opens an inline form to change its name, amount, due day, and category (no need to delete and re-add)',
  ]},
  { version: '5.43.57', date: '2026-06-26', changes: [
    'New full Spending Breakdown page — tap "View full breakdown" on the dashboard to see every category for the month, not just the top 8',
    'On that page, tap any category to hide it from the dashboard preview (the dashboard still shows your top 8 visible categories). Hidden categories stay listed on the full page, dimmed and tagged, and your choice is remembered',
    'Dashboard Spending Breakdown card is back to a clean top-8 preview (the inline toggle chips moved to the new page)',
  ]},
  { version: '5.43.56', date: '2026-06-26', changes: [
    'Spending Breakdown now shows every category (no longer capped at the top 8) on both the dashboard and the Insights range summary',
    'Tap the category chips above the breakdown to hide or show individual categories — your choice is remembered and shared across both views. Hidden categories are only removed from the list; the total and each category\'s percentage still include them',
  ]},
  { version: '5.43.55', date: '2026-06-26', changes: [
    'Custom range summary on the Insights page — pick any start and end date to total your spending by category, with per-category bars, each category\'s share of the total, transaction count, and income in that window',
  ]},
  { version: '5.43.54', date: '2026-06-26', changes: [
    'Tapping a Frequent chip in quick-add now selects its category even when that category isn\'t one of the default chips (e.g. an imported or custom category) — it\'s added as a highlighted chip instead of leaving none selected',
  ]},
  { version: '5.43.53', date: '2026-06-26', changes: [
    'Frequent expense chips now appear sooner — a habit surfaces after 4 logged days (was 6), counts up to every-third-day cadence, and stays for a full week before fading',
    'Frequent chips now group by the same word regardless of capitalization or punctuation — "Coffee", "coffee" and "coffee." count as one habit (different words like Coffee vs Starbucks stay separate)',
  ]},
  { version: '5.43.52', date: '2026-06-23', changes: [
    'Frequent expense templates — the Add Entry page and the quick-add sheet now suggest things you log almost every day (like a daily coffee) as one-tap chips that pre-fill the amount, category, and description',
    'Suggestions learn automatically from your last 30 days and only appear for daily / every-other-day habits — nothing to set up, and they fade out if you stop logging them',
  ]},
  { version: '5.43.26', date: '2026-06-11', changes: [
    'Team logo nav circle size reduced so logos have breathing room inside the button',
    'Pokemon sprite in accounts overview hero capped to container height so it no longer overlaps the account text',
    'Team dashboard taglines updated: Bears BEAR DOWN ON YOUR BUDGET, Dodgers THINK BLUE SPEND LESS, Knights GO KNIGHT OR GO HOME, Celtics BUDGET DIFFERENT HERE',
    'Init errors now show a visible message instead of a blank screen',
  ]},
  { version: '5.43.25', date: '2026-06-11', changes: [
    'Emergency rollback to v5.43.21 — restored last known working state',
  ]},
  { version: '5.43.21', date: '2026-06-10', changes: [
    'Fixed the theme mode buttons (Dark / Light / Terminal / Pokémon / Teams) overflowing off the screen — the row now wraps to a second line so the Teams option is reachable',
  ]},
  { version: '5.43.20', date: '2026-06-10', changes: [
    'The RGB-split glitch now recolors to match each theme instead of always being red/cyan. Pokémon and team themes keep the full glitch identity in their own colors — Gengar purple/magenta, Charizard orange/gold, Squirtle blue/aqua, Bears orange/blue, Dodgers blue/red, Knights gold/red, Celtics green/gold. The classic red/cyan stays for the default and terminal themes',
    'Pokémon eerie FX tuned: the vignette is softer, and Charizard\'s embers / Squirtle\'s bubbles now drift up at random positions and speeds (instead of an even row) — and sit behind the cards as background ambiance',
  ]},
  { version: '5.43.19', date: '2026-06-10', changes: [
    'New Sports Teams theme mode — a 5th tab in Settings > Theme with Chicago Bears, LA Dodgers, Vegas Golden Knights, and Boston Celtics. Each swaps the mascot to the team logo with the team colors and slogan (BEAR DOWN / THINK BLUE / VEGAS BORN / DIFFERENT HERE)',
    'Pokémon themes now have an eerie ambient effect: Gengar darkens with a shadow vignette, Charizard drifts embers, Squirtle floats bubbles up from the deep',
    'Gengar keeps the RGB-glitch identity now (it\'s a ghost — it fits); Charizard and Squirtle stay calm/glitch-free',
    'Fixed the blown-up, blurry mascot on the dashboard for Pokémon themes — sprites (especially Squirtle) are now size-capped and pixel-crisp instead of stretched',
  ]},
  { version: '5.43.18', date: '2026-06-10', changes: [
    'Transaction animations now match your theme. Pokémon themes get eerie, on-theme flavor text (Gengar "the shadows stir… / it hides in your shadow", Charizard ember lines, Squirtle tide lines) with the mascot sprite in the terminal bar and no glitch — the amount fades in calmly. Terminal themes type their own shell/language syntax instead: VS Code Python (ledger.post), PowerShell (New-Expense/Add-Income/Move-Funds), CMD (post EXPENSE, :: comments), and Kali/Mint/Ubuntu bash (budget post --expense). Every other theme is unchanged',
  ]},
  { version: '5.43.17', date: '2026-06-10', changes: [
    'Center nav button (the mascot) is now vertically centered in the bottom bar instead of sitting raised above it; its glow shadow was adjusted to match',
  ]},
  { version: '5.43.16', date: '2026-06-10', changes: [
    'New Pokémon theme mode — a 4th tab in Settings > Theme (beside Dark/Light/Terminal) with three starters: Gengar (shadow purple), Charizard (flame orange), and Squirtle (wave blue). Each swaps the whole palette, replaces the Doberman mascot with the Pokémon\'s animated sprite (splash, nav, dashboard, accounts, about), retheme the splash tagline, and changes the dashboard hero line (DEBT DIES IN THE DARK / REDUCE IT TO ASH / WASH AWAY YOUR DEBT). Picking a Pokémon turns off the Doberman bark + RGB-glitch effects; every other theme keeps them exactly as before',
  ]},
  { version: '5.43.15', date: '2026-06-10', changes: [
    'New "Liquid Glass" bottom nav (iOS 26 style) — the bar now floats as a rounded frosted-glass island that blurs and saturates the content scrolling beneath it, with a specular top highlight. The active tab is a glossier accent lozenge (the old underline is gone). Glass tint follows your theme; top/side nav positions are unchanged',
  ]},
  { version: '5.43.14', date: '2026-06-09', changes: [
    'Dialed back the green glow throughout — softer halo on the doberman, fainter hero glow, calmer nav (smaller active dot, gentler center-button pulse, dimmer top line), and budget tiles no longer cast a green halo. The RGB-split glitch effects are untouched',
  ]},
  { version: '5.43.13', date: '2026-06-09', changes: [
    'Fixed: the update button now applies the new version immediately instead of only after leaving and reopening the app. It no longer unregisters the service worker before reloading, so the reload pulls fresh files on the spot',
  ]},
  { version: '5.43.12', date: '2026-06-09', changes: [
    'Accounts overview: more breathing room (looser account rows + clearer spacing between groups) and the net-worth block shrunk way down to a compact one-line stat — it was over-emphasized',
  ]},
  { version: '5.43.11', date: '2026-06-09', changes: [
    'Brighter "Crisp" light mode — near-white background (#f5f5f7) with clean white cards that lift off the page via soft shadows + hairline borders, stronger text contrast, and a green accent tuned for white. Applied to every light theme (Light, Sky, Rose, Sand, Silver, Custom Light)',
  ]},
  { version: '5.43.10', date: '2026-06-09', changes: [
    'Accounts overview hero now matches the "Tightened" mockup: the barking Doberman + "My Accounts" sit in a row, with a version-status dot and the update button on their own row below. The dog stays fully visible (never cropped) and keeps its bark + glitch animation',
    'Net worth meter is now a two-segment assets/debt bar (green + red) with the larger value',
  ]},
  { version: '5.43.9', date: '2026-06-09', changes: [
    'Fixed the update button loading the splash screen twice — the page no longer double-reloads when the fresh service worker takes over after a forced update',
    'Transfers now play the transaction animation like income/expense do (it was being skipped)',
    'The transaction + update animation box now follows your current theme instead of always being dark — in light mode it\'s light, and the terminal themes (CMD, PowerShell, VS Code, Kali, Mint, Ubuntu) render it in their own palette',
  ]},
  { version: '5.43.8', date: '2026-06-09', changes: [
    'Accounts overview tightened: larger net-worth value, a crisper rounded gradient assets-vs-debt meter, and slightly larger balances/names — same layout, just sharper',
  ]},
  { version: '5.43.7', date: '2026-06-09', changes: [
    'Reverted the nav bar change — that was only meant to be a mockup, not installed. The bottom nav is back to the original floating Doberman button. (Bills calendar layout stays.)',
  ]},
  { version: '5.43.6', date: '2026-06-09', changes: [
    'Bills page redesigned (calendar-forward): a Total / Remaining / Paid summary, the month calendar promoted to the top with a clear paid (green) / due (amber) / overdue (red) dot system + legend, then the bill list',
    'Nav bar refresh: the Doberman button is now centered inside the bar (no longer floating above it), the top edge is a clean continuous hairline, and the active tab gets an accent pill behind its icon — bark and glitch effects kept',
  ]},
  { version: '5.43.5', date: '2026-06-09', changes: [
    'Dashboard "Airy" pass — bigger, higher-contrast labels and numbers, roomier tile spacing, and a taller progress bar. The tiny micro-cap labels were the main thing making the dashboard hard to read',
  ]},
  { version: '5.43.4', date: '2026-06-09', changes: [
    'Fixed the update button — version.txt had drifted behind the app version, so the updater could never reconcile (it kept offering a phantom update or stayed silent). Releases now keep version.txt in lockstep with the app version',
    'Accounts overview: account-type icons toned down from neon to deeper, readable tones and given a stronger tinted chip — much easier to read in both light and dark mode',
  ]},
  { version: '5.43.3', date: '2026-06-09', changes: [
    'Cleaner look: removed the CRT scan-line texture from the dashboard hero banner',
    'Light mode: dashboard bento tiles no longer use the dark→black gradient (it read as muddy grey) — they now use clean light surfaces with the accent kept on the budget tiles',
    'Light mode: "Budget DAWGs" on the splash screen now has a white outline + halo so it stays legible over the dog',
    'ADJ. PER DAY card now says how far off pace you are in dollars (e.g. "↓ $42 behind pace" / "↑ $357 ahead of pace") instead of a vague label — measured against spreading your weekly budget evenly across the 7 days',
    'Weekly Planner is now hidden for credit-card and loan accounts (you pay those down, not budget them) — the nav swaps in the Debt tab and the planner page redirects there',
  ]},
  { version: '5.43.2', date: '2026-06-09', changes: [
    'Fixed: scheduled paychecks could post twice (or flood the ledger from a stale pay date) — auto-entry now ignores overlapping runs and caps catch-up at 600 periods',
    'Fixed: the Daily History tile counted bill payments and excluded items against your discretionary daily budget, showing bogus "over budget" days',
    'Fixed: on the last evening of a month, spending insights and the monthly-pace line could go blank (a timezone/month rollover bug)',
    'Fixed: the "beat last month" challenge could lock in pass/fail a day early at month-end (same timezone bug)',
    'Hardened startup: corrupted saved data no longer prevents the app from loading — it backs up the bad data and falls back to defaults',
  ]},
  { version: '5.43.1', date: '2026-06-09', changes: [
    'Income no longer erases what you\'ve spent — money you spent this week/today stays counted as spent. Income only raises your spendable balance (how much you\'re able to spend), not how much you\'ve already spent. Removed the "spent − income = net" line from the week tracker',
  ]},
  { version: '5.43.0', date: '2026-06-05', changes: [
    'Dashboard time-range switch (1W/1M/3M/6M/1Y/ALL) is now a sliding segmented control — a springy accent pill glides to the selected range',
    'Bento dashboard — tile grid restyled with richer gradient surfaces and an accent glow on the budget stat tiles, keeping the HUD corner accents',
    'Account switching shows a brief shimmer placeholder so a new account\'s data feels like it loads in',
    'Lock screen keypad redesigned — chunky tactile keys that depress with an accent glow, and the PIN dots glow as you type',
  ]},
  { version: '5.42.1', date: '2026-06-05', changes: [
    'Quick-add sheet: the phone back button now closes it instead of leaving the page',
    'Quick-add sheet feels lighter — softer backdrop, less blur, tighter spacing, smaller amount field, and a height cap so it no longer takes over the whole screen',
  ]},
  { version: '5.42.0', date: '2026-06-05', changes: [
    'Tapping the update button now opens a terminal window — it types "checking remote… / comparing version…" then either "vX.XX found — installing ▋" (and pulls the update) or "up to date ✓". Matches the boot-screen vibe',
  ]},
  { version: '5.41.0', date: '2026-06-05', changes: [
    'Splash screen now boots up — under the title, a terminal log types itself out (mounting accounts… ok, syncing balances… ok, loading ledger… ok) then drops a green READY ▋ where the old progress bar was. The doberman bark and glitch are untouched',
    'Splash hold extended slightly (2.6s) so the boot sequence finishes before it wipes to the app',
  ]},
  { version: '5.40.0', date: '2026-06-05', changes: [
    'New transaction animation — "Terminal Boot": a mini command line types itself out (auth → posting → memo) then drops your amount with an RGB-glitch snap and a blinking cursor. Works for expense, income, transfer, and auto-detected paychecks',
    'Accounts overview polish: smaller "Track a Transaction" button, more breathing room between account rows, and slightly smaller header/row text',
  ]},
  { version: '5.39.0', date: '2026-06-05', changes: [
    'Quick-add (Track a Transaction) now lets you pick which account the expense or income goes to — an Account row of chips, defaulting to your current account',
    'Quick-add gained a Transfer type: choose a From and To account to move money (or pay down a credit/loan) without leaving the sheet',
    'Quick-add readability: larger account/category chips, a bigger description field with an accent focus ring, and clear uppercase section labels',
  ]},
  { version: '5.38.1', date: '2026-06-05', changes: [
    'Moved Track Transaction button to the accounts overview page — full-width sticky bar at the bottom, reachable by either thumb. Removed the floating FAB from the dashboard.',
  ]},
  { version: '5.38.0', date: '2026-06-05', changes: [
    'Performance: trimmed Google Fonts from 16 families to 2 — only Plus Jakarta Sans and Bangers load at startup; Cascadia Code loads on-demand for the PowerShell theme only',
    'Performance: totals() and monthTotals() are now memoized — they scan transactions once per save instead of ~16 times per render',
    'Performance: Intl.NumberFormat instance cached for fmt() — ~8× faster currency formatting across hundreds of calls per render',
  ]},
  { version: '5.37.0', date: '2026-06-05', changes: [
    'Hybrid pass: Insights page — income summary, top categories, and debt payoff are now calm hairline sections instead of separate cards',
    'Fast-add FAB: a green + button appears on the dashboard. Tap it to log a transaction right there — amount, expense/income toggle, category chips, optional description — without navigating to the Add tab',
    'Removed clean-mockup.html from the public site',
  ]},
  { version: '5.36.1', date: '2026-06-05', changes: [
    'Fix: sparkline month labels now visible — added bottom layout padding so labels render inside the canvas instead of being clipped',
  ]},
  { version: '5.36.0', date: '2026-06-05', changes: [
    'Dashboard sparkline now defaults to ALL — your full balance history as one continuous line flowing month to month',
    'Month boundary markers: subtle vertical hairlines with a month label (Jan, Feb…) appear where each month starts on the graph',
  ]},
  { version: '5.35.1', date: '2026-06-05', changes: [
    'Removed CRT scanline overlay — cleaner look across all themes',
  ]},
  { version: '5.35.0', date: '2026-06-05', changes: [
    'Weekly planner: month sections are now collapsible — tap the month header to expand or collapse. Past months start collapsed so the current month is front and centre',
  ]},
  { version: '5.34.1', date: '2026-06-05', changes: [
    'Fix: swiping left/right on the accounts overview no longer accidentally changes tabs',
    'Fix: nav bar now correctly highlights Dashboard after switching into an account',
  ]},
  { version: '5.34.0', date: '2026-06-05', changes: [
    'Hybrid look: Notes & Reminders is now a calm hairline list to match Bills, Goals, Debt and the ledger. Overdue and due-today notes keep a faint colored wash so they still stand out at a glance',
  ]},
  { version: '5.33.0', date: '2026-06-04', changes: [
    'Transfers and payments now post to BOTH accounts reliably — use Add → Transfer, pick From and To/Pay, and it records money out of the source and into the destination. Transferring to a credit card or loan reduces what you owe (shows as a payment on that account)',
    'Transfers are labeled clearly (Payment ↔ for loans/credit) and no longer count as discretionary weekly spending',
  ]},
  { version: '5.32.1', date: '2026-06-04', changes: [
    'Fixed the Per Week / Per Day meter bars not showing on the dashboard',
    'Accounts overview now shows flat grouped rows (with tinted type icons) instead of cards, matching the design',
    'Debt accounts flattened into the same calm list style',
  ]},
  { version: '5.32.0', date: '2026-06-04', changes: [
    'Dashboard budget tiles (Per Week / Per Day) now use clean horizontal meters instead of rings — easier to read at a glance. Your customizable layout, tiles, and the DAWG hero are unchanged',
  ]},
  { version: '5.31.0', date: '2026-06-04', changes: [
    'Hybrid look rolling out: Bills and Goals are now calm hairline lists (matching the ledger and accounts) instead of chunky cards',
  ]},
  { version: '5.30.0', date: '2026-06-04', changes: [
    'Accounts overview redesigned — a compact Net Worth bar with an assets-vs-debt meter, and your accounts grouped into Cash / Investing / Debt with a subtotal for each. The header stays put while the account list scrolls',
  ]},
  { version: '5.29.0', date: '2026-06-04', changes: [
    'Accounts overview now leads with your Net Worth (assets − debts) in a clean summary card',
    'Removed the "spent this month" line from the balance card on cash accounts — it was always red and not useful (debt accounts still show payments made)',
    'Removed the floating + button',
  ]},
  { version: '5.28.2', date: '2026-06-04', changes: [
    'Swapped emoji icons for clean line icons across buttons and labels — Import/Export, Restore, Deduct cash, loan link, Credit/Loan tabs, the sounds toggle, and Force Update',
  ]},
  { version: '5.28.1', date: '2026-06-04', changes: [
    'Moved the floating + (quick-add) button to the bottom-left so it no longer crowds the tutorial button or sits over your transaction amounts',
  ]},
  { version: '5.28.0', date: '2026-06-04', changes: [
    'Cleaner "hybrid" look (phase 1): the ledger is now a calm, hairline-separated list instead of chunky cards, and a couple of emoji buttons (Reconcile, CSV) became crisp line icons — all the DAWG branding and glitch effects stay',
  ]},
  { version: '5.27.1', date: '2026-06-04', changes: [
    'Dollar amounts now use fixed-width digits so they line up cleanly in columns across the ledger and cards',
  ]},
  { version: '5.27.0', date: '2026-06-04', changes: [
    'Duplicate-entry guard — if you add a transaction matching one you logged moments ago, the app asks "Possible duplicate — add anyway?"',
    'Add screen now suggests descriptions you\'ve used before as you type',
    'Debt page shows total minimum payment; Goals page shows total saved vs total target with a combined progress bar',
    'Ledger gets a "✕ Clear filters" button when any search/filter is active',
  ]},
  { version: '5.26.0', date: '2026-06-04', changes: [
    'Reconcile to bank — tap "⇄ Reconcile to bank" on the dashboard balance, enter what your bank actually says, and the app logs a one-line adjustment to match it (works for cash and loan/credit accounts; adjustments are kept out of your weekly spending)',
  ]},
  { version: '5.25.1', date: '2026-06-04', changes: [
    'Loan-linked bill payments now reliably appear in that loan account\'s payment history — and linking a bill that\'s already paid back-posts the payments so the loan reflects them',
    'Linked payments are dated to the month they pay for, so they land in the right month on the loan\'s history',
  ]},
  { version: '5.25.0', date: '2026-06-04', changes: [
    'New Insights & Trends page (hamburger menu) — net worth across all accounts, savings rate, a 6-month spending trend chart, top categories with month-over-month change, and debt payoff progress',
  ]},
  { version: '5.24.1', date: '2026-06-04', changes: [
    'Paid bills now clearly show whether the cash was deducted from your balance — if you marked one paid without deducting (e.g. tapped "Just Mark Paid" or dismissed the popup), it shows "Not deducted" with a one-tap "Deduct cash" button to fix it',
    'This recovers any payment where the deduction was skipped — no need to unmark and re-mark',
  ]},
  { version: '5.24.0', date: '2026-06-04', changes: [
    'Retirement accounts can now auto-contribute on a schedule you set (Settings → the account → Scheduled contribution): pick an amount, frequency, and next date and it posts your contribution automatically — even for dates missed while the app was closed',
    'Scheduled contributions are also factored into the retirement growth projection',
  ]},
  { version: '5.23.0', date: '2026-06-04', changes: [
    'Bills can now be linked to a loan or credit account ("Pays loan" on each bill, or when adding one) — marking the bill paid automatically pays down that loan\'s balance',
    'When you mark a linked bill paid, the loan always updates; you still choose "Log & Deduct" (also take it from your checking balance) or "Just Mark Paid" (loan only). Marking it unpaid reverses the loan payment too',
  ]},
  { version: '5.22.0', date: '2026-06-04', changes: [
    'Floating "+" button — add a transaction instantly from any screen',
    'Calculator keypad on the amount field — tap the calculator icon for fast thumb entry with live math (e.g. 12.50 + 3 = 15.50)',
    'Ledger row density toggle (≡ / ≣) — switch between comfortable and compact rows; compact hides the running balance for a tighter list',
  ]},
  { version: '5.21.2', date: '2026-06-04', changes: [
    'Accessibility: the app now respects your device\'s "Reduce Motion" setting (calms the dog/glitch animations and page transitions), and status messages/toasts are announced by screen readers',
  ]},
  { version: '5.21.1', date: '2026-06-04', changes: [
    'Backups now include EVERY account, not just the one you\'re viewing — restoring a backup brings back all accounts and their full transaction history (older single-account backups still restore fine)',
  ]},
  { version: '5.21.0', date: '2026-06-04', changes: [
    'New "Simple Tracking" mode (Settings → App Mode) — strips the app down to balance + transactions: a clean dashboard, a simpler Add screen, and budgeting features hidden from the menu. Switch back to Full Budgeting anytime; nothing is deleted',
  ]},
  { version: '5.20.9', date: '2026-06-04', changes: [
    'Hamburger menu now labels the tab "Import / Export" instead of just "Import"',
  ]},
  { version: '5.20.8', date: '2026-06-04', changes: [
    'Fixed ledger search closing the keyboard after a keystroke — typing now filters the list live without losing focus',
    'The backup reminder\'s "Back up" button now opens the Import/Export tab and scrolls right to the backup section',
    'Added Settings to the hamburger menu, so you can always reach it even if you remove it from your nav bar',
  ]},
  { version: '5.20.7', date: '2026-06-04', changes: [
    'Accessibility: keyboard focus outlines, screen-reader labels on the ledger edit/delete buttons, and the week-by-week rows can now be expanded with the keyboard (Enter/Space)',
  ]},
  { version: '5.20.6', date: '2026-06-04', changes: [
    'Added a developer test page (tests.html) covering the budget/date math, so future changes are less likely to reintroduce calculation bugs',
  ]},
  { version: '5.20.5', date: '2026-06-04', changes: [
    'Backup reminder — the dashboard now shows a banner when it has been over 30 days (or never) since your last backup, and Settings shows when you last backed up',
    'Backups are now complete — they also include your challenges, notes, starting balance, and settings (not just transactions/bills/goals/accounts)',
  ]},
  { version: '5.20.4', date: '2026-06-04', changes: [
    'Fixed a timezone bug where the current month/day could roll over early in the evening — all "current month"/"today" keys now use your local time instead of UTC',
  ]},
  { version: '5.20.3', date: '2026-06-04', changes: [
    'Weekly Planner is fully month-based now — removed the leftover "Next paycheck date" field and "Start New Cycle" button that no longer affected anything',
    'Dashboard "Weekly Plan" tile now shows This Month / Per Day / Days Left in the month (matching the planner) instead of paycheck-based payday info',
  ]},
  { version: '5.20.2', date: '2026-06-02', changes: [
    'Ledger now keeps your scroll position after editing or deleting a transaction — no more jumping back to the top',
    'A search filter you have active also stays put when you delete a row',
  ]},
  { version: '5.20.1', date: '2026-06-02', changes: [
    'Any transaction can now be excluded from your weekly spending — tick "Don\'t count toward weekly spending" when adding a transaction, or when editing one in the ledger',
    'Excluded transactions show a "not in weekly" tag in the ledger and are left out of the weekly/daily trackers, breakdown, and dashboard tiles (same treatment as bills)',
  ]},
  { version: '5.20.0', date: '2026-06-02', changes: [
    'Bills page now has a month navigator (‹ June 2026 ›) — jump to next month to pay bills early, with a "Today" button to jump back',
    'Bills can be paid for multiple months independently — paying next month early no longer wipes out the current month\'s paid status',
    'Mark Paid now asks "Log & Deduct" vs "Just Mark Paid" — choose Just Mark Paid to record a bill as paid without deducting it from your balance (no double-deduction if you already recorded it)',
  ]},
  { version: '5.19.0', date: '2026-06-02', changes: [
    'Ledger now has two tabs — Transactions and Bills — so bill payments (logged via the Bills tab) are separated from your normal spending',
    'Bills no longer count as overspending — bill payments are excluded from the weekly/daily spend tracker and the week-by-week breakdown, since they are already reserved via the "Fixed bills" field',
    'Dashboard Per Week and Per Day tiles now use the same month-based math as the Weekly Planner, so the numbers match across both pages',
  ]},
  { version: '5.18.9', date: '2026-06-02', changes: [
    'Weekly Planner is now month-based — "This Month" shows your spendable balance for the current calendar month, and the per-week / per-day limits spread that balance across the weeks and days left in the month',
    'Week-by-week breakdown shows every week of the current month (not just until your next paycheck), with the month total ("· $X to spend") labeled on the month header',
    'Per-week budget on each upcoming week is the same even share of your remaining monthly balance — fixes the wrong per-week figures that came from dividing by days-until-paycheck',
  ]},
  { version: '5.18.8', date: '2026-06-02', changes: [
    'Update button fix — the "vX available — tap to update" pill now fully clears the cache and unregisters the service worker before reloading, so it actually pulls the new version (previously it reloaded straight from the stale cache)',
  ]},
  { version: '5.18.7', date: '2026-06-02', changes: [
    'Weekly Planner: week-by-week breakdown now always extends through the current week — fixes the new month (e.g. June) failing to appear when the saved paycheck date had already passed',
  ]},
  { version: '5.18.6', date: '2026-05-31', changes: [
    'Weekly Planner: Forfeit button on past weeks — dims the week and auto-opens Start New Cycle so you can move on; tap ↩ Undo to restore it',
  ]},
  { version: '5.18.5', date: '2026-05-31', changes: [
    'Bills: calendar dots now update in-place when marking paid/unpaid — no stale state',
    'Bills: deleting a paid bill also removes its logged expense from the ledger',
    'Bills: refund fallback now scoped to the month the bill was paid — prevents accidentally deleting an unrelated expense with the same name and amount',
    'Notes: badge now appears on the DAWG bottom nav button too, not just the hidden nav list',
    'Weekly Planner: calcWeekly is debounced 300ms — no more full list rebuild on every keystroke',
  ]},
  { version: '5.18.4', date: '2026-05-31', changes: [
    'Weekly Planner: all weeks now render in one continuous list — current week stays grouped under its month with past weeks instead of appearing in a separate section',
  ]},
  { version: '5.18.3', date: '2026-05-31', changes: [
    'Weekly Planner: fixed "Jun 1 – Jun 1" single-day ghost week when paydate lands on a Monday',
  ]},
  { version: '5.18.2', date: '2026-05-31', changes: [
    'Weekly Planner: week-by-week breakdown is now grouped by month with a labeled divider between each month',
  ]},
  { version: '5.18.1', date: '2026-05-31', changes: [
    'Weekly Planner: "Start New Cycle" button — set your next paydate, carry over bills and stop-at, and start fresh without losing your history',
    'Cycle gap is remembered so the next paydate pre-fills automatically based on your usual pay frequency',
  ]},
  { version: '5.18.0', date: '2026-05-31', changes: [
    'Bills: marking unpaid removes the expense from the ledger and restores the balance — confirmed with a toast showing what was removed',
    'Bills: fallback match is now case/trim-insensitive so minor naming differences no longer block the delete',
  ]},
  { version: '5.17.9', date: '2026-05-31', changes: [
    'Bills: marking unpaid now refunds even for bills paid before expense tracking was added — falls back to matching by bill name and amount if no ID is on file',
  ]},
  { version: '5.17.8', date: '2026-05-31', changes: [
    'Bills: mark paid/unpaid now updates the card in-place — page position never changes',
  ]},
  { version: '5.17.7', date: '2026-05-31', changes: [
    'Bills: paid cards now visually dim with a green left border so paid vs unpaid is instantly obvious',
    'Bills: marking a bill unpaid now automatically deletes the expense that was logged when it was marked paid — no more double-deduction',
  ]},
  { version: '5.17.6', date: '2026-05-27', changes: [
    'Notes & Reminders added to hamburger drawer — accessible even without it pinned to the nav bar',
  ]},
  { version: '5.17.5', date: '2026-05-27', changes: [
    'Notes & Reminders tab — jot freeform notes with an optional due date; overdue and due-today items show a badge on the nav icon and a toast alert on app open',
    'Notes are stored globally across all accounts so your reminders are always visible',
  ]},
  { version: '5.17.4', date: '2026-05-27', changes: [
    'Light mode brightened — all backgrounds shifted ~12 points lighter for a cleaner feel across all light themes (Default, Sky, Rose, Sand, Silver)',
    'New "Slate" grey accent option added to dark mode theme picker',
    'New "Silver" grey accent option added to light mode theme picker',
  ]},
  { version: '5.17.3', date: '2026-05-27', changes: [
    'Custom accent color now applies everywhere — 35+ hardcoded green rgba values replaced with color-mix(var(--accent)) so rings, glows, focus borders, and tints all follow your chosen color',
    'Toasts slide out smoothly on dismiss instead of popping out instantly',
    'Multiple toasts stack vertically instead of overlapping — each one offsets 60px below the last',
    'Toast position uses topbar height variable so they never land behind the header on any device',
    'Insight card rotates with a slide-up-out / glitch-snap-in transition instead of a plain opacity fade',
    'Dashboard hero banner gets a subtle CRT scanline texture — repeating horizontal lines at 3px pitch for depth',
    'color-mix() fallbacks added for Safari 15 — older devices get the default accent color instead of transparent elements',
    'will-change: transform added to animated elements (dog, LOCK TF IN, splash, failed tile) for smoother compositing; nav blur reduced from 20px to 12px',
    'Dashboard nav center button now has a hover state on desktop with accent glow',
  ]},
  { version: '5.17.2', date: '2026-05-27', changes: [
    'Accounts page dog barks within ~1.5s of opening — fixed by using a negative animation-delay to start mid-cycle instead of waiting the full 5s + 4s cycle',
  ]},
  { version: '5.17.1', date: '2026-05-27', changes: [
    'Splash bark restored to original timing (~289ms) — one bark per cycle for both splash and hero',
  ]},
  { version: '5.17.0', date: '2026-05-27', changes: [
    'Bark animation timing tightened — each bark frame now holds ~150-240ms instead of 1.3s+, snaps back to idle immediately after',
  ]},
  { version: '5.16.9', date: '2026-05-27', changes: [
    'Dashboard hero and accounts page doberman now do the same glitch-snap bark animation as the splash screen — 8s cycle with two barks per round and a chromatic aberration burst before each cut',
    'Dashboard and accounts bark on an offset timer so they fire at different times',
  ]},
  { version: '5.16.8', date: '2026-05-27', changes: [
    'Per-day tile now nets income against expenses for the day — same logic weekSpent uses, so adding income reduces what counts as "spent today"',
  ]},
  { version: '5.16.7', date: '2026-05-27', changes: [
    'Splash bark animation upgraded — chromatic aberration glitch burst fires ~34ms before each cut (green/pink RGB split + brightness spike), then the mad dawg snaps in with a skewX overshoot that settles in ~25ms, like a corrupted sprite sheet',
    'Splash screen extended to 4.2s so you see 3 full bark cycles before dismiss — tap anywhere to skip as before',
  ]},
  { version: '5.16.6', date: '2026-05-27', changes: [
    'Fix splash dog layout — switched from position:absolute stacking to CSS grid overlap so both bark frames stay centered at the correct size',
  ]},
  { version: '5.16.5', date: '2026-05-27', changes: [
    'Splash screen dog now barks — alternates between the idle doberman and the mad dawg in a double-bark rhythm with a scale pop on each bark frame',
  ]},
  { version: '5.16.4', date: '2026-05-27', changes: [
    'Per-day tile limit is now truly dynamic: available-above-buffer ÷ days-to-paydate — shows $0 allowance when below buffer, auto-adjusts daily as balance changes',
    'Per-week FAILED tile now always shows spent / weekly-limit denominator, plus "−$X below buffer" when the cause is a balance shortfall',
    'Per-day FAILED tile shows daySpent / $0 when below buffer so you can see exactly why allowance is zero',
  ]},
  { version: '5.16.3', date: '2026-05-27', changes: [
    'Both budget tiles now show FAILED when your live balance is below the buffer floor — previously the tiles showed a normal spendable amount even while you were already dipping into your buffer',
    'Per-week tile FAILED shows "−$X below buffer" when the cause is a balance shortfall rather than raw overspending this week',
    'Per-day tile FAILED shows "−$X below buffer" for the same reason — you can see exactly how much you need to recover before spending resumes',
    'Ring fills to 100% red on both tiles whenever the below-buffer FAILED state is active',
  ]},
  { version: '5.16.2', date: '2026-05-27', changes: [
    'Per-day budget tile now derives its daily limit from the weekly limit ÷ 7 — consistent with the planner, never shows $0/day when available balance is split across remaining pay-period days',
    'Per-day tile FAILED state now mirrors the per-week tile exactly — shows red FAILED label, spent/limit line, and over-amount',
    'Fixed per-day tile showing stale "0/49.01" denominator by removing dependency on _livePerDay (raw available ÷ remaining days)',
  ]},
  { version: '5.16.1', date: '2026-05-27', changes: [
    'Design system unification — border-radius standardized to 18px for cards, 14px for list rows across the entire app',
    'All progress bars are now parallelogram-shaped with video game tick marks — weekly tracker, health score, goals, budget, and week-by-week breakdown all match',
    'Input focus glow is now green to match the accent color instead of leftover blue',
    'Toasts use theme variables — roast and alert toasts now respect your current theme instead of hardcoded dark hex values',
    'Page titles now have a left accent tick matching the section title language, applied consistently on every page',
    'Week-by-week rows upgraded to glass treatment with gloss reflection — current week gets an accent glow border',
    'Past week rows now use muted text + muted border instead of a blanket opacity reduction — they read as archived, not broken',
    'Active nav button now shows a green scan-line underline and a subtle green tint background — immediately clear which tab is active',
    'Secondary buttons are now ghost style (neutral border, text color) instead of green — cleaner primary/secondary hierarchy',
    'Over-limit ⚠ in the ring tile is now larger and bolder — matches the weight of the % number it replaces',
    'FAILED pulse animation is more dramatic — adds a scale pop and stronger glow burst on the beat',
  ]},
  { version: '5.15.2', date: '2026-05-26', changes: [
    'Code cleanup pass — removed dead functions (fitLogo, getLastSixWeeks, closeTutorial, stale splash canvas block), stale event listeners, and redundant console.warn calls',
    'Performance: merged multiple transaction scan passes into single loops across the dashboard, planner, sparkline, and add-transaction flow — fewer iterations over your data',
    'Budget suggestion engine rewritten from O(categories × transactions) to O(transactions) — single pre-grouped scan instead of repeated full-list filters',
    'Removed duplicate today() logic — both today() and localDateStr() now share one implementation',
  ]},
  { version: '5.15.0', date: '2026-05-26', changes: [
    'Dashboard per-week and per-day tiles now correctly recover your spending limit even when you have dipped into your buffer — uses start-of-week balance as a last-resort fallback',
    'Budget limit in the weekly planner also recovers correctly using the same fallback chain — no more showing $0 as the denominator',
    'Per-week value stored in your plan now always preserves the last known positive limit instead of being overwritten with $0 when available balance drops to zero',
  ]},
  { version: '5.13.9', date: '2026-05-26', changes: [
    'Spending breakdown icons are now SVGs matching the rest of the app — Food, Gas, Car, Entertainment, Health, and more all have custom icons',
    'Spending breakdown bars are video game styled — parallelogram clip shape with quarter-segment tick marks',
    'Dashboard per-week and per-day tiles now always show your spending vs. your limit, and say FAILED with the overage amount when you go over',
    'Weekly planner tracker turns red and shows overage when you exceed your weekly limit — bar no longer stops at 100%',
    'Budget limit survives dipping into your buffer — the committed per-week/day limit is stored separately and never zeroed out',
    'Page title glitch effect now fires correctly on slide transitions',
    'Accounts page and settings page styled with cyberpunk corner accents',
  ]},
  { version: '5.11.0', date: '2026-05-22', changes: [
    'Glitch effects upgraded — LOCK TF IN. and splash screen now use 6-frame burst patterns with text-shadow chromatic aberration, per-frame clip-path slice variation, brightness/saturation flashes, and a micro-jitter between bursts',
    'Tutorial sparkline: removed the dot pop-in at the end of the line animation',
    'Dashboard sparkline redraws left→right on loop — line wipes in with the dot traveling at the tip; when fully drawn the dot pulses at the end, then the cycle repeats',
  ]},
  { version: '5.10.9', date: '2026-05-22', changes: [
    'Removed currency symbol background art from the dashboard hero — cleaner look',
    'LOCK TF IN. text now occasionally glitches with an RGB-split burst (red/cyan channel layers) matching the splash screen style',
    'Custom color wheel is now available in Light mode — appears as the last chip in the Light accent row and applies your chosen color over the light theme base',
  ]},
  { version: '5.10.8', date: '2026-05-22', changes: [
    'Swipe-to-delete confirmation now responds on first tap every time — fixed layout shift caused by row slide-back animation interfering with modal button',
    'Splash screen text glitch — Budget DAWGs title now glitches with RGB-split channel layers (red/cyan pseudo-elements, clip-path burst effect); canvas glitch removed',
    'About page now fully respects your chosen theme — previously reset to base dark/light when navigating to the About screen',
    'Account selector: first account card outline no longer clips at the top edge when tapped',
    'Dashboard sparkline line now fades from transparent on the left to full color on the right; the dot has moved from the travelling pulse to a static pulsing glow at the latest data point',
  ]},
  { version: '5.10.7', date: '2026-05-22', changes: [
    'Custom theme is now its own standalone theme — picking a color via the color wheel no longer modifies your current theme; it switches to the dedicated Custom theme entry',
    'Color picker upgraded to a full canvas HSL color wheel — no more sliders; tap any point on the wheel to choose hue/saturation, use the brightness bar for lightness',
    'Preset accent colors softened across all themes for a less harsh look',
    'Light mode dimmed further — background and surface tones reduced so whites are easier on the eyes',
    'Dashboard hero background art — faint currency symbols ($ ¥ € £ ₿) layer behind the doberman and Lock TF In tagline for a subtle money-themed atmosphere',
  ]},
  { version: '5.10.6', date: '2026-05-22', changes: [
    'Splash screen glitch effect — faint money symbol field with periodic RGB-split glitch bursts instead of matrix rain; toggle off with ✦ hide effects',
    'Income/expense/transfer animations completely rebuilt — centered fullscreen overlay with large draw-in SVG icons, big amount text, and professional card pop animation',
    'Tutorial dashboard step now shows an animated sparkline chart instead of bar columns — matches the actual dashboard chart style',
    'Fixed muted text contrast on Kali Linux and Ubuntu themes for better readability',
  ]},
  { version: '5.10.5', date: '2026-05-22', changes: [
    'Weekly planner now shows Adjusted Per Day card — dynamically recalculates your daily rate based on what\'s left of this week\'s budget divided by days remaining',
    'Custom accent color wheel — pick any color in Settings > Theme to override the preset accent on any dark or light theme; tap Reset to revert',
    'Accent color now applies everywhere — success/positive indicators and gradients all update when you change the accent color',
  ]},
  { version: '5.10.4', date: '2026-05-22', changes: [
    'Linux terminal themes added — Kali Linux (dark navy + cyan), Linux Mint (dark + green), and Ubuntu (purple + orange) in the Terminal theme section',
    'VS Code theme now shows both Java and Python syntax: page titles use Java class syntax (class PageName {), section headers use Python def syntax (def sectionName():)',
    'Splash screen matrix money animation — falling currency and binary symbols rain down in the accent color; tap ✦ hide effects to revert to the clean minimal splash',
  ]},
  { version: '5.10.3', date: '2026-05-22', changes: [
    'Terminal themes (VS Code, PowerShell, CMD) now style every page title and section header in code syntax — VS Code uses def/(): Python style, PowerShell uses $var = style, CMD uses @/:: style',
    'Per Day budget tile now dynamically adjusts — if you overspend one day the remaining budget is divided across days left in the week instead of using the static plan rate',
    'Fixed ledger swipe-to-delete conflicting with tab navigation — swiping left on a ledger row no longer jumps to the next section',
  ]},
  { version: '5.10.0', date: '2026-05-22', changes: [
    'Layout editor scroll fixed — tile list now scrolls correctly when there are many tiles',
    'Net Worth tile now shows when unhidden in Customize Layout — removed the duplicate settings-toggle gate',
    'Half-width tiles no longer clip their content — added overflow protection',
    'Customize Layout tile icons replaced with themed SVG icons that follow the accent color',
    'Removed the "Dashboard Tiles" settings section — Customize Layout is the single place to show/hide tiles',
    'Removed dead _showBudget/_showBreakdown/_showGoals/_showTxns/_showNetWorth settings gates — layout editor handles visibility',
  ]},
  { version: '5.9.0', date: '2026-05-22', changes: [
    'App tutorial completely rebuilt — each step now shows a looping CSS animation demonstrating how to use the feature, independent of the user\'s actual data',
    'Removed spotlight dependency on user data — tour works perfectly on empty accounts or first launch',
    'Simplified from 23 steps to 14 focused steps covering every key feature with action-oriented instructions',
  ]},
  { version: '5.8.0', date: '2026-05-22', changes: [
    '6 new dashboard tiles — every section of the app is now available on the dashboard: Upcoming Bills, Debt Summary, Weekly Plan snapshot, Category Budgets, Monthly Stats, and Quick Add',
    'Upcoming Bills tile: shows next unpaid bills sorted by due date with color-coded urgency and a running total',
    'Debt Summary tile: all debt accounts at a glance with balances and total owed',
    'Weekly Plan tile: per-day budget, days until paydate, and upcoming bills at a glance — tap to update the plan',
    'Category Budgets tile: spending-vs-cap bars for every budget category you\'ve set',
    'Monthly Stats tile: clean income / expenses / net summary for the selected month',
    'Quick Add tile: one-tap EXPENSE and INCOME buttons to jump straight to the add form',
    'Fixed app tutorial crashing when opened from the accounts overview screen',
  ]},
  { version: '5.7.0', date: '2026-05-22', changes: [
    'App tutorial massively expanded — 23 steps covering every feature with instructions on how to use each one, not just descriptions',
    'New tour steps: hamburger menu, account switcher pill, all-accounts overview button, customize layout button, debt payoff planner usage, goals contribution flow, settings accounts / theme / privacy walk-through, force update button',
    'Each step now tells you what to tap or fill in, not just what the section is',
  ]},
  { version: '5.6.0', date: '2026-05-22', changes: [
    'Add to Home Screen button in the menu drawer — on Android/Chrome it triggers the native install prompt; on iOS it shows a one-tap tip explaining the Share → Add to Home Screen flow',
    'Text selection disabled app-wide so long-pressing nav labels, tile titles, and other UI text no longer triggers the copy menu; re-enabled on all input fields and text you\'d actually want to copy',
  ]},
  { version: '5.5.9', date: '2026-05-22', changes: [
    'Walkthrough tour spotlight now actually highlights what it\'s describing — steps were targeting #main-content (the whole page) so the dark overlay had nowhere to show',
    'Spotlight box-shadow is now set directly in JS so it appears immediately, not dependent on the CSS animation timing',
    'Tab-switch delay increased and a retry added — if the target element isn\'t rendered yet the tour waits and tries again instead of snapping to a centered fallback',
    'Removed smooth scroll before measuring element position (was a race condition); uses instant scroll + rAF for accurate placement every time',
    'Updated nav bar tour step text to match the new tap-to-swap editor',
  ]},
  { version: '5.5.8', date: '2026-05-22', changes: [
    'Per Day tile now mirrors the weekly planner exactly — uses the saved per_day value directly, no rolling adjustments',
    'Daily History tile still shows each day this week vs your plan rate',
  ]},
  { version: '5.5.7', date: '2026-05-22', changes: [
    'Fixed rolling daily limit showing wrong amount — was dividing the weekly budget by days-left-in-week, which gives incorrect results for pay periods that aren\'t a multiple of 7 days',
    'Rolling limit now uses the full pay period: (per_day × total days) minus all spending since the plan was saved, divided by days remaining until paydate',
  ]},
  { version: '5.5.6', date: '2026-05-22', changes: [
    'New Daily History tile shows every day of the current week with a bar, amount spent, and an over-budget badge so you can see your daily pattern at a glance',
    'Per Day tile now shows a rolling adjusted limit — if you overspent earlier in the week your remaining days get a smaller limit; if you came in under, you get more room',
    'A small "↓ adj from $X/day" or "↑ extra from $X/day" label appears on the tile whenever today\'s limit differs from the plan rate',
  ]},
  { version: '5.5.5', date: '2026-05-22', changes: [
    'Per Day tile on the dashboard now shows the exact same number as the Weekly Planner — both use available ÷ days-until-paycheck; previously the tile used per-week ÷ 7 which gave a different result whenever the pay period isn\'t a perfect multiple of 7 days',
    'per_day is now saved to the weekly plan on every Save and auto-update so the dashboard always has the correct value',
  ]},
  { version: '5.5.4', date: '2026-05-22', changes: [
    'Fixed Per Day budget tile resetting at ~7 pm — the app was using UTC midnight instead of local midnight to determine "today", causing the tile to flip to the next date hours early',
    'All date comparisons throughout the app now use local calendar date; a new localDateStr() helper ensures consistency everywhere',
  ]},
  { version: '5.5.3', date: '2026-05-21', changes: [
    'Dashboard tile drag no longer creates a double empty space — the dragged tile is replaced by the placeholder (one slot, not two), and cancelling always restores it cleanly',
    'Tile drag motion uses requestAnimationFrame for smooth updates and skips redundant DOM moves, so reordering feels fluid',
    'Nav bar editor replaced with tap-to-swap: tap any of the 4 slots, then pick any section from the list to put it there — swaps automatically if it\'s already in another slot',
    'Settings is now available as a nav bar option (was incorrectly locked out before)',
  ]},
  { version: '5.5.2', date: '2026-05-21', changes: [
    'Tour card is now compact — icon and title in one row, skip × lives inside the card so it never floats over spotlighted tiles',
    'Card positions itself above or below the spotlight (measures available space, picks the side with room) so the highlighted element is always fully visible',
    'Dark overlay now comes entirely from the spotlight ring\'s box-shadow; backdrop is transparent during spotlight steps so clicks anywhere advance the tour',
    'Finishing or skipping the tour drops you back on the dashboard',
  ]},
  { version: '5.5.1', date: '2026-05-21', changes: [
    'Long-press on the nav bar now works reliably on mobile — a movement threshold prevents tiny finger drift from cancelling the hold gesture',
    'Budget Overview tiles now show "Budget Overview" as the card title with "Per Week" / "Per Day" as a subtitle label beneath it',
    'Nav slide transitions now follow visual position: left-side nav items slide in from the left, right-side items from the right, and stay correct even after customizing which sections are in each slot',
    'Added a dedicated Customize Your Nav Bar step to the guided tour; "You\'re All Set!" step updated to note the tour stays current with new features',
  ]},
  { version: '5.5.0', date: '2026-05-21', changes: [
    'Guided walkthrough tour — tap the ? button to take a live tour of every section; the app navigates for you while a spotlight highlights each area',
    'Tour uses smooth outline SVG icons throughout, a pulsing accent spotlight on each target, dot-step progress, and Back/Next navigation',
    'Skip button always visible in the top-right; tapping Done or finishing the last step closes the tour cleanly',
  ]},
  { version: '5.4.3', date: '2026-05-21', changes: [
    'Tile layout editor now shows half-width tiles side-by-side in a real 2-column preview so you can see exactly how cards will share a line',
    'Nav bar is now fully customizable — long-press the bottom nav bar to open the editor; drag any section into the top 4 slots to add it, drag below the line to remove it',
    'Live nav preview at the top of the editor updates in real time as you drag',
  ]},
  { version: '5.4.2', date: '2026-05-21', changes: [
    'Customize Layout redesigned for mobile — opens a bottom sheet showing all tiles as a scrollable list you can drag to reorder',
    'Each tile block shows its icon, name, a Half/Full size toggle, and a show/hide eye button — everything visible at a glance',
    'Drag handle on each row makes reordering feel natural on a phone without accidentally triggering buttons',
    'Hidden tiles stay visible in the editor (dimmed with a "Hidden" badge) so you can easily bring them back',
  ]},
  { version: '5.4.1', date: '2026-05-21', changes: [
    'Force Update now always shows the What\'s New popup after reloading — works from both the accounts page shortcut and the About page',
    'Added changelog entries for v5.2.0 through v5.4.0 that were previously missing',
  ]},
  { version: '5.4.0', date: '2026-05-21', changes: [
    'Dashboard tiles now show how much you\'ve spent (not your budget limit) as the main number — subtitle shows "spent / allowed" at a glance',
    'Customize Layout is now a live edit mode: tap it and the dashboard enters edit state directly — tiles wiggle, drag them around the grid and watch the layout reorder in real time',
    'Ghost + dashed placeholder highlight exactly where a tile will land as you drag',
    'Per-tile size toggle and show/hide buttons overlay each card in edit mode — hidden tiles appear dimmed so you can drag them back',
    'Preset layouts (Default, Budget, Compact, Spending) apply instantly from the inline bar below the grid',
  ]},
  { version: '5.3.0', date: '2026-05-21', changes: [
    'Dashboard is now a fully customizable tile grid — tap Customize Layout to reorder, resize (half/full width), and show or hide each card',
    'Four preset layouts: Default, Budget, Compact, and Spending focus',
    'Transaction icons redesigned: clean red devil SVG for expenses, green happy face for income, gold coin for paychecks',
  ]},
  { version: '5.2.0', date: '2026-05-21', changes: [
    'Category field is now a plain text input with autocomplete — type anything, new categories save automatically',
    'Budget Overview card replaced with compact ring-progress tiles for per-week and per-day spending',
    'Spending Breakdown promoted to a full-width card so the category bars are easier to read',
  ]},
  { version: '5.1.4', date: '2026-05-21', changes: [
    'Every page now uses the exact same cascade animation as the accounts page — items fade and slide in from the left with staggered timing',
  ]},
  { version: '5.1.3', date: '2026-05-21', changes: [
    'Transaction animations: expenses trigger an evil red growling doberman, income brings a hype bounce with confetti — paycheck gets the full celebration treatment',
    'Animations fire for every theme, auto-dismiss with a depleting progress bar, and tap-to-skip',
  ]},
  { version: '5.1.2', date: '2026-05-21', changes: [
    'Cascade slide-in now works on every page — tiles, rows, and cards animate into position with a staggered slide as each page loads',
    'Accounts overview shows the app version; "up to date" appears in green once the version check confirms you\'re on the latest build',
  ]},
  { version: '5.1.1', date: '2026-05-21', changes: [
    'Every page now staggers its cards and rows into view — the same sliding-tile effect as the accounts picker, applied universally to transactions, bills, goals, budget rows, debt cards, retirement accounts, and weekly entries',
  ]},
  { version: '5.1.0', date: '2026-05-21', changes: [
    'Dashboard tab now uses a smooth zoom-in transition instead of a slide; back-navigating to Dashboard zooms out',
    'Slide transition internal rewrite: node-moving + double requestAnimationFrame eliminates the flash-of-new-content and ensures the animation always starts from a committed painted frame',
  ]},
  { version: '5.0.9', date: '2026-05-21', changes: [
    'True dual-panel page slide: both the outgoing and incoming pages animate simultaneously, giving a natural "physically sliding between pages" feel instead of an abrupt snap',
  ]},
  { version: '5.0.8', date: '2026-05-21', changes: [
    'Slide direction now treats Dashboard as the centre: Add and Ledger slide in from the right (move left), Weekly/Bills/Settings etc. slide in from the left (move right)',
  ]},
  { version: '5.0.7', date: '2026-05-21', changes: [
    'Tab slide transition smoothed — longer duration (.34s), more travel (60px), and a spring ease-out curve so it glides in instead of snapping',
  ]},
  { version: '5.0.6', date: '2026-05-21', changes: [
    'Directional slide transitions now only apply between bottom nav bar tabs — hamburger-only pages (About, Challenges, etc.) use a plain fade as before',
  ]},
  { version: '5.0.5', date: '2026-05-21', changes: [
    'Tab navigation now slides directionally — tapping a tab to the right of your current one slides in from the right; tapping left slides from the left',
    'System back button mirrors the same slide direction when navigating backwards through tab history',
    'All Accounts button fixed — was hidden for single-account setups, now always visible',
  ]},
  { version: '5.0.4', date: '2026-05-21', changes: [
    'Notification bell replaced with an All Accounts grid button — taps open the account picker with a zoom-out transition; hidden on single-account setups',
  ]},
  { version: '5.0.3', date: '2026-05-21', changes: [
    'Pages always open at the top — scroll position is reset on every navigation so you never land mid-page',
    'Keyboard Done/checkmark now dismisses the keyboard without triggering Save — tap Save yourself when ready',
  ]},
  { version: '5.0.2', date: '2026-05-21', changes: [
    'Accounts overview: dead space at the top (reserved for the hidden topbar) is now removed — picker fills the full screen edge to edge',
    'Account tile tap: brief scale + accent glow press animation before the dashboard zooms in, making the transition feel intentional',
  ]},
  { version: '5.0.1', date: '2026-05-21', changes: [
    'Android system back button now navigates within the app — goes back through tab history, account picker, and account switches before exiting',
    'Back button also closes the side drawer or account dropdown if either is open',
  ]},
  { version: '5.0.0', date: '2026-05-21', changes: [
    'Eliminated raw-layout flash on load: app is invisible until the first render completes, then fades in — no more glimpse of the old header/nav before content paints',
  ]},
  { version: '4.9.9', date: '2026-05-21', changes: [
    'Projected @ 65 now uses a proper FV formula: compounds existing balance AND factors in estimated monthly contributions (from paycheck link settings, or annualised YTD if no paycheck is linked)',
    'Add Contribution opens a dedicated bottom-sheet modal — amount, date, type (My Contribution / Employer Match / Rollover / Other), and optional note — no longer navigates to the transactions page',
    'Accounts overview: header (logo + My Accounts title) stays fixed at the top; only the account tiles scroll',
  ]},
  { version: '4.9.8', date: '2026-05-20', changes: [
    'Retirement contributions now accept a flat dollar amount per paycheck (in addition to or instead of a percentage) — both fields shown side-by-side for My Contribution and Employer Match',
    'Flat dollar contributions fire automatically even when no gross pay is set — no longer requires a gross amount to auto-contribute',
    'If both % and $ are filled, they are added together each payday (e.g. 6% of gross + $50 extra)',
  ]},
  { version: '4.9.7', date: '2026-05-20', changes: [
    'Retirement/IRA dashboards now show a balance history sparkline with 1W/1M/3M/6M/1Y/ALL range selector, matching the regular account dashboard graph',
  ]},
  { version: '4.9.6', date: '2026-05-20', changes: [
    'Paycheck gross pay: add a "Gross pay per check" field to the paycheck schedule so retirement accounts can auto-calculate contributions from pre-tax income',
    'Retirement auto-contributions: link a retirement account to a paycheck account; when a paycheck fires, employee and employer contributions are automatically posted to the retirement account based on your contribution % and employer match %',
  ]},
  { version: '4.9.5', date: '2026-05-20', changes: [
    'Paycheck Estimator: tap "Don\'t know your net pay? Estimate it" in the paycheck schedule to open a gross-to-net calculator — enter gross pay, filing status, state tax %, and pre-tax deductions to get an itemized breakdown (federal tax, FICA, state, deductions) with a one-tap "Use this amount" button',
    'Federal tax estimate uses 2025 IRS brackets for single and married filers',
  ]},
  { version: '4.9.4', date: '2026-05-20', changes: [
    'Accounts overview page: top nav bar (hamburger / account pill / bell) now hides when the account picker is open',
  ]},
  { version: '4.9.3', date: '2026-05-20', changes: [
    'Retirement accounts: add your contribution % and employer match % on the account card — shows a Contribution Split card on the dashboard with your rate, employer rate, and total effective rate',
    'Edit button (pencil icon) added to the dashboard balance card for every account type — taps through to Manage Accounts with that account\'s card pre-expanded and scrolled into view',
  ]},
  { version: '4.9.2', date: '2026-05-20', changes: [
    'Retirement account dashboard: switching to a Roth IRA, 401(k), Traditional IRA, or HSA account now shows a clean retirement-only view instead of the standard budget dashboard',
    'Retirement dashboard shows: portfolio balance, total invested, YTD contributions vs IRS limit, projected value at age 65, and recent contribution history',
    'No budget tiles, spending breakdown, or transaction noise on retirement account dashboards',
  ]},
  { version: '4.9.1', date: '2026-05-20', changes: [
    'Debt account cards now have a "Fill from a bill" dropdown — pick any bill to instantly auto-fill the monthly payment and due day, eliminating duplicate entry',
    'Loan/credit OWED balance now has a pencil edit icon — tap it to update the starting balance without touching existing transactions',
  ]},
  { version: '4.9.0', date: '2026-05-20', changes: [
    'Retirement Hub tab: track Roth IRA, Traditional IRA, 401(k), and HSA accounts separately from regular accounts',
    'Per-account contribution tracker shows year-to-date contributions vs. 2025 IRS limits with a visual progress bar',
    'Catch-up contribution limits automatically applied for users age 50+ when birth year is set on the account',
    'Growth Projector: enter monthly contribution, expected annual return, current age, and target retirement age to see projected balance at retirement with 5-year milestones',
    'Growth breakdown shows starting balance vs. contributions vs. investment growth at a glance',
    'Roth IRA, Traditional IRA, 401(k), HSA added as selectable account types with unique icons and colors',
    'One-tap Add Contribution button on each retirement card switches to the Add tab on that account',
  ]},
  { version: '4.8.0', date: '2026-05-20', changes: [
    'Paycheck Scheduler: set a pay amount, frequency (weekly / bi-weekly / semi-monthly / monthly), and next pay date on any checking or savings account — income is auto-entered on pay day, even for missed dates you haven\'t opened the app',
    'Paychecks auto-applied on app open and when returning to the app; a green toast confirms each entry',
    'Income Budget Planner: appears on the Budgets page when a paycheck schedule is active — shows monthly income estimate, bills deducted, 20% savings recommendation, and suggested per-category spending amounts',
    'Budget Planner bars are colored per-category; apply individual rows or all at once to your budget limits',
  ]},
  { version: '4.7.6', date: '2026-05-20', changes: [
    'Progress bars now use a boosted visual scale — 30% raw fill looks ~50% wide so small values are never invisible',
  ]},
  { version: '4.7.5', date: '2026-05-20', changes: [
    'Bills calendar: tap any highlighted day to see a detail panel listing bills due that day with quick Mark Paid buttons',
    'Smart Budget Suggestions: new users with no spending history now get a Starter Budget Pack with sensible defaults instead of a blank page',
    'Spending Breakdown bars: taller and per-category colored instead of all one accent color',
    'Goal bars on the dashboard also slightly taller',
  ]},
  { version: '4.7.4', date: '2026-05-20', changes: [
    'Theme picker redesigned: Dark / Light / Terminal mode toggle replaces the dropdown',
    'Dark mode accent options: Green, OLED, Blue, Orange, Gold, Auto',
    'Light mode accent options: Mint, Sky, Rose, Sand',
    'Terminal section shows VS Code, PowerShell, CMD — settings unchanged',
    'Removed Gengar, DAWG, and DAWG Light themes',
  ]},
  { version: '4.7.3', date: '2026-05-20', changes: [
    'CSV import now has Append / Overwrite toggle — Append adds to existing data (default), Overwrite replaces all transactions with the imported file',
    'Overwrite mode shows a danger confirmation before wiping existing transactions',
  ]},
  { version: '4.7.2', date: '2026-05-20', changes: [
    'Smart Budget Suggestions: auto-generated per-category budget ideas based on your last 3 months of spending',
    'Apply individual suggestions or all at once with one tap on the Budgets page',
    'Savings Challenges: four challenge types — No-Spend Weekend, 52-Week, Spending Freeze, and Beat Last Month',
    'No-Spend Weekend and category challenges auto-track progress from your transactions',
    '52-Week challenge has a full 52-cell check-off grid with streak counter',
    'Completion celebration screen shown when a challenge is finished',
    'Challenges accessible from the drawer menu',
  ]},
  { version: '4.7.1', date: '2026-05-20', changes: [
    'Account pill icon now uses the correct text color instead of rendering black',
  ]},
  { version: '4.7.0', date: '2026-05-20', changes: [
    'All delete and destructive actions now use styled in-app modals instead of browser confirm dialogs',
    'PIN setup now uses an in-app styled form instead of a browser prompt dialog',
    'PIN is now stored as a SHA-256 hash — existing plain-text PINs migrate automatically on next login',
    'All localStorage saves wrapped in try/catch — a "storage full" toast appears instead of silent data loss',
    'Ledger search is now debounced — no more full re-render on every keypress',
    'Toggling multiple dashboard tiles now batches re-renders instead of firing one per toggle',
    'Google Fonts now served cache-first from the service worker — faster loads on repeat visits',
    'Sparkline animation loop properly cancelled when switching away from the dashboard',
    'Account dropdown close listener no longer accumulates on rapid open/close',
    'JSON backup restore now shows a confirmation modal before overwriting all data',
    'CSV import button shows "Importing…" and disables while importing large files',
    'Dead legacy dashboard code removed (~270 lines)',
    'Sounds and tutorial buttons now have proper accessible labels',
  ]},
  { version: '4.6.8', date: '2026-05-20', changes: [
    'Top nav account pill now shows the correct account type SVG icon instead of a fixed bank logo',
  ]},
  { version: '4.6.7', date: '2026-05-20', changes: [
    'Top nav account dropdown now uses SVG icons matching the rest of the app',
  ]},
  { version: '4.6.6', date: '2026-05-20', changes: [
    'Line graph turns red when your account balance is negative',
    'Budget ring: green under 75%, yellow 75–90%, red at 90%+',
    'Weekly budget carry-over: overspending in a past week reduces this week\'s budget',
    'Biometric/PIN lock: back button can no longer bypass the lock screen',
    'Negative balance popup: logo removed, cleaner look',
  ]},
  { version: '4.6.5', date: '2026-05-20', changes: [
    'Account picker rows now use SVG icons matching the rest of the app — no more 3D emoji',
    'Account type icons are tinted to match each account\'s color stripe',
  ]},
  { version: '4.6.4', date: '2026-05-20', changes: [
    'Fixed negative balance popup logo not loading',
  ]},
  { version: '4.6.3', date: '2026-05-20', changes: [
    'Nav bar active state: only the icon stroke is colored — no filled background square',
    'Negative balance popup now shows the Budgeting DAWGs logo instead of emoji',
  ]},
  { version: '4.6.2', date: '2026-05-20', changes: [
    'Drawer menu icons replaced with SVG icons matching the nav bar and account styles',
    'Fixed: 0% APR debt no longer shows estimated interest — was incorrectly counting payment rounding as interest',
  ]},
  { version: '4.6.1', date: '2026-05-20', changes: [
    'Past month balance now shows the balance as of that month\'s end, not the current live balance',
    'Sparkline graph clips to the selected month when browsing past months',
    'Account save button flashes ✓ Saved and keeps the card expanded instead of closing it',
  ]},
  { version: '4.6.0', date: '2026-05-20', changes: [
    'Nav bar active state: accent-colored pill behind the icon with white outline (inverted) instead of a fully filled solid shape',
    'Account type chips now use matching SVG icons (bank, dollar, card, file, bill) instead of emoji',
  ]},
  { version: '4.5.9', date: '2026-05-20', changes: [
    'Dashboard month ‹ back button now works (handlers were wired to the wrong function)',
    'Negative balance on non-debt accounts now displays in red',
  ]},
  { version: '4.5.8', date: '2026-05-20', changes: [
    'Accounts page now has a ← Back button to return directly to Settings',
    'Account card expand/collapse button is larger and easier to tap',
    'Eliminated the large gap above section title text inside cards (was 44px, now flush)',
  ]},
  { version: '4.5.7', date: '2026-05-20', changes: [
    'Due date picker now shows the day with an ordinal suffix (e.g. 15th) instead of MM-DD',
    'Starting balance and payment fields now accept negative values (e.g. -$50.00)',
    'Negative balance triggers a friendly pop-up to motivate you to get it together',
  ]},
  { version: '4.5.6', date: '2026-05-20', changes: [
    'Account cards are now collapsible — tap the header to expand/collapse each one',
    'Single Save button on each account card handles name, type, APR, due date, and payment all at once',
    'APR of 0% now saves and displays correctly (0.00%)',
    'Theme dropdown styled to match app colors instead of browser default',
    'Fixed brief glimpse of app content before biometric lock screen appears',
    'Tightened spacing in dashboard tiles',
  ]},
  { version: '4.5.5', date: '2026-05-20', changes: [
    'Monthly payment and Starting Balance fields now auto-format as $##.## on blur',
    'APR field auto-formats as ##.##% on blur',
    'Due date picker shows a calendar icon and displays the selected day as MM-DD',
    'Due date picker button defaults to "Choose due date" before a day is selected',
    'Starting balance input has a more noticeable accent border',
    'Add Account type chips are now more visually distinct',
  ]},
  { version: '4.5.4', date: '2026-05-20', changes: [
    'Accounts now has its own dedicated page — tap Accounts in Settings or the drawer to manage',
    'Theme is now a compact dropdown instead of a list of buttons',
    'Account type shown as large tap-to-select chips, making it obvious which type is selected',
    'Removed the Limit $ field from credit/loan accounts',
  ]},
  { version: '4.5.3', date: '2026-05-20', changes: [
    'Sparkline dot now rides along the line of the graph instead of sweeping a full vertical bar',
    'Due date now uses a tap-to-open day picker (days 1–28 grid) instead of a number input',
  ]},
  { version: '4.5.2', date: '2026-05-20', changes: [
    'Account cards fully rebuilt for mobile — dedicated CSS class, font-size 16px prevents iOS zoom, 2-column grid for debt fields, no more overflow clipping',
    'Switch account in Settings now stays on the Settings page instead of jumping to the dashboard',
    'Sparkline scanner — vertical sweep line with trailing glow moves continuously left to right across the chart',
    'Biometric lock screen — a full-screen blocker now appears immediately while waiting for Face ID/fingerprint, hiding app content',
  ]},
  { version: '4.5.1', date: '2026-05-20', changes: [
    'Account cards in Settings fixed — names and type dropdowns now display correctly; inputs no longer leak outside the card',
    'Sparkline pulse — a glowing dot with an expanding ring animates at the right edge of the balance chart',
  ]},
  { version: '4.5.0', date: '2026-05-20', changes: [
    'Settings overhaul — removed Navigation Position and Customize Nav sections; merged Account starting balance into the Accounts card',
    'Account cards redesigned — name and type are now clearly readable and fully editable; dedicated Save button handles both name and type changes',
    'Dashboard Tiles — added Net Worth and Spending Insights toggles, both off by default',
    'Notification bell dot fixed — badge now correctly appears when bills are due within 3 days',
    'Phone lock — use your device biometric (Face ID, fingerprint, or pattern) to unlock the app instead of a PIN',
  ]},
  { version: '4.4.1', date: '2026-05-20', changes: [
    'Excel-friendly CSV export — adds UTF-8 BOM so Excel opens without a wizard, Signed Amount column for easy SUM formulas, Running Balance column, and an "Export All Accounts" option',
    'Import overhaul — handles Excel date formats (5/20/2026, 05/20/26, etc.), bank export column names (Debit/Credit, Transaction Amount, Withdrawal/Deposit), accounting negatives like (123.45), and UTF-8 BOM files',
    'Import preview — shows the first 5 rows before committing so you can verify the data looks right',
    'Download blank template button — get a pre-formatted CSV to fill in and import',
  ]},
  { version: '4.4.0', date: '2026-05-20', changes: [
    'Dashboard month navigator — browse any past month\'s spending breakdown and transactions directly from the dashboard',
    'Split transactions — enter a total amount then split it across multiple categories; each split becomes its own transaction',
    'Debt payoff calculator — set a monthly payment on any credit/loan account and see the estimated payoff date, total months, and total interest',
    'Account switching now always lands on the dashboard instead of the tab you were on',
    'Export button renamed from "SlawMinYaw Backup" to "Budget DAWGs Backup"',
  ]},
  { version: '4.3.9', date: '2026-05-20', changes: [
    'What\'s New popup: removed dog emoji from the "Got it" button',
  ]},
  { version: '4.3.8', date: '2026-05-20', changes: [
    'Recent transactions tile now shows the 5 most recent transactions with the newest at the top',
    'What\'s New popup fixed — was silently skipping the popup when no changelog entry matched the current version',
  ]},
  { version: '4.3.7', date: '2026-05-20', changes: [
    'Critical fix: missing closing brace in renderDashboard() was preventing all JavaScript from running — caused the splash screen to get permanently stuck',
    'Transactions now store a timestamp (ts) for stable same-day sort ordering',
    'Hero tagline updated to LOCK TF IN.',
  ]},
  { version: '4.3.4', date: '2026-05-19', changes: [
    'Splash screen escape — tap anywhere on the splash to skip it; a "tap to continue" hint appears after 3.5s; hard 5s timeout removes splash regardless',
    'Init error handling — if the app fails to load after the splash, a clear error message and reload button are shown instead of a blank screen',
    'Service worker reload loop fixed — removed the redundant controllerchange reload that caused repeated splash screens on updates',
  ]},
  { version: '4.3.3', date: '2026-05-19', changes: [
    'Persistent top bar — hamburger, account switcher, and notification bell now stay visible on every page, not just the dashboard',
    'What\'s New popup — a one-time modal shows the latest changes after each update; dismissed with "Got it" and never shown again for that version',
    'Splash screen fix — added a reload guard so the app no longer gets stuck in an infinite refresh loop when the service worker cache is stale',
  ]},
  { version: '4.3.1', date: '2026-05-19', changes: [
    'All themes now use the DAWG layout — hamburger, account pill, and bottom nav bar are universal',
    'View Budget button on the dashboard now navigates to the Weekly Planner',
    'Dashboard tiles are customizable — toggle Budget Overview, Spending Breakdown, Goals, and Recent Transactions in Settings',
    'Credit and loan accounts: budget overview hidden; loan accounts: spending breakdown hidden; both get a dedicated Payment Due tile',
    'Debt account sparkline: red when balance is high, yellow at mid-range, green when paid down to under 25%',
    'Accounts overview styled to match the DAWG hero layout',
  ]},
  { version: '4.3.0', date: '2026-05-19', changes: [
    'Integrated arc nav bar — the doberman center button is part of the nav bar with a matching cutout',
    'Credit and loan account support — APR, payment due day, and credit limit fields in account settings',
    'Monthly interest auto-charge — interest is automatically posted as a transaction each month',
    'Balance color — debt account balances shift from green to red as they grow relative to the limit',
    'Payment-only transaction filter — credit and loan accounts show only payment transactions',
  ]},
  { version: '4.2.3', date: '2026-05-19', changes: [
    'DAWG hero: $MY budgeting DAWGS logo image (newicon.png) replaces the text lockup; shown in a frosted white pill on dark, transparent on light',
  ]},
  { version: '4.2.2', date: '2026-05-19', changes: [
    'DAWG hero: $MY / budgeting DAWGS logo added to top-left; account switcher sits top-right in the same bar',
  ]},
  { version: '4.2.1', date: '2026-05-19', changes: [
    'DAWG Light: all accent colors now use CSS variables — neon green no longer bleeds through on the light theme',
    'DAWG Light: balance amount, hero tagline, and text elements use dark colors; only bars, percentages, and action labels use the theme accent',
    'DAWG Light: sparkline and donut chart colors read from theme variables so they adapt correctly',
    'DAWG Light: accent updated to a cleaner mid-green (#22aa22) matching the mockup',
  ]},
  { version: '4.2.0', date: '2026-05-19', changes: [
    'DAWG theme: account switcher button (⊞) added to top-right of hero — appears only when multiple accounts exist',
    'DAWG theme: fixed header reappearing on the About page',
  ]},
  { version: '4.1.9', date: '2026-05-19', changes: [
    'DAWG theme: top header bar hidden — the hero banner fully replaces it',
    'DAWG theme: nav bar reverted to the standard full nav',
    'New DAWG Light ☀️ theme — same DAWG layout in a clean white/green palette',
  ]},
  { version: '4.1.8', date: '2026-05-19', changes: [
    'DAWG theme: nav bar redesigned to 5-tab minimal layout (Dashboard, Transactions, raised doberman Add button, Goals, Profile) matching the mockup',
    'DAWG theme: Budget Overview donut now shows this week\'s spending vs your weekly planner budget — falls back to monthly budget total if no weekly plan is saved',
  ]},
  { version: '4.1.7', date: '2026-05-19', changes: [
    'New DAWG theme 🐕 — completely redesigned dashboard with hero banner, balance sparkline with time ranges (1W/1M/3M/6M/1Y/ALL), donut budget overview, and neon-green black aesthetic',
  ]},
  { version: '4.1.6', date: '2026-05-19', changes: [
    'Debt dashboard: fixed + button not navigating — event listener now wired before the chart early-return guard so it works on debt accounts that have no chart',
  ]},
  { version: '4.1.5', date: '2026-05-19', changes: [
    'Weekly planner: past weeks now show spent vs budget (e.g. $300 / $320) with a frozen mini progress bar — adjusting the buffer slider or other settings never changes past week budget figures',
    'Debt dashboard: small + button added to Payment History header — tapping it jumps straight to the Add tab to log a transaction',
  ]},
  { version: '4.1.4', date: '2026-05-19', changes: [
    'Savings/checking: "Set your starting balance" prompt no longer appears when a starting balance is already saved',
    'Loan & credit card dashboards: income and expense tiles removed — debt accounts show only what you owe',
    'Loan dashboard: all income, expense, health, chart, breakdown, and insights sections hidden — loans show balance owed and payment history only',
    'Net worth tile hidden for debt accounts (credit cards and loans)',
    'Debt dashboard: due date pulled from matching bill entry and shown on the account card',
    'Debt dashboard: transaction list section renamed to "Payment History"',
  ]},
  { version: '4.1.3', date: '2026-05-19', changes: [
    'Weekly planner: past weeks now live in a frozen DOM section — they are written once and never re-rendered when balance, buffer, or paydate changes',
    'Weekly planner: dragging the emergency buffer slider no longer triggers the swipe-to-change-tabs gesture',
  ]},
  { version: '4.1.2', date: '2026-05-19', changes: [
    'Weekly planner: past weeks are now frozen — adjusting balance, buffer, or paydate only affects the current week and ahead; past weeks show actual spending only with no live budget target',
  ]},
  { version: '4.1.1', date: '2026-05-19', changes: [
    'Text Size setting removed',
    'Tutorial rewritten — covers all current tabs including Goals, Budgets, Debt calculator, and terminal themes',
    'Bar chart corners sharpened — borderRadius reduced from 5px to 2px for a cleaner look',
    'Category colors follow the active theme — chart and breakdown rebuild with theme-matched colors on every dashboard visit',
  ]},
  { version: '4.0.9', date: '2026-05-19', changes: [
    'Terminal themes now use their authentic fonts: VS Code → Consolas/Menlo, PowerShell → Cascadia Code (loaded from CDN), CMD → Lucida Console',
  ]},
  { version: '4.0.8', date: '2026-05-19', changes: [
    'CMD theme: muted text brightened (#005f00 → #2d9a2d) — secondary text is now readable on the black background',
    'Font now reverts to Default when switching back to any non-terminal theme (Dark, OLED, Light, Denim, Ember, etc.)',
  ]},
  { version: '4.0.7', date: '2026-05-19', changes: [
    'manifest.json: fixed purple theme_color (#7c6af7 → #111112) and background_color — eliminates the purple status bar line and purple flash on first open',
  ]},
  { version: '4.0.6', date: '2026-05-19', changes: [
    'Account picker: header/title bar is hidden while on the My Accounts screen — only appears once an account is selected',
  ]},
  { version: '4.0.5', date: '2026-05-19', changes: [
    'CMD theme updated to classic black/green — true terminal green (#00c300) text and accent on pure black background',
    'VS Code, PowerShell, and CMD themes now auto-apply monospace font when selected — font follows the theme',
    'Insights card background now follows the active theme\'s gradient instead of being hardcoded dark green',
    'Font switcher now changes every text element including the header brand name',
  ]},
  { version: '4.0.4', date: '2026-05-19', changes: [
    'Three new themes: VS Code Dark+, PowerShell (navy/cyan), CMD (black/amber with classic CGA palette)',
    'Font switcher in Settings — Default (Plus Jakarta Sans), System (native OS font), Terminal (Consolas/Menlo monospace)',
  ]},
  { version: '4.0.3', date: '2026-05-19', changes: [
    'OLED Black theme — true #000000 background, pixels are literally off on OLED screens',
    'Splash screen cleaned up — "SlawMinYaw\'s" subtitle removed, page title updated to "Budget DAWGs"',
    'Tutorial Settings tip updated — no longer mentions the removed personalization options',
    'Empty states — Ledger, Bills, and Goals now show the doberman with a friendly prompt instead of blank space',
  ]},
  { version: '4.0.2', date: '2026-05-19', changes: [
    'Status bar color now matches the app background — updates live when theme changes',
  ]},
  { version: '4.0.1', date: '2026-05-19', changes: [
    'Insights card: background is now deep black-green → brand green gradient (no more brownish/amber end)',
    'Settings: Personalize section removed (app title, font picker, caps, color)',
    'Goals nav icon: outer rings stay as outlines when active; only the bullseye fills; a dart appears pointing at the center',
  ]},
  { version: '4.0.0', date: '2026-05-19', changes: [
    'Header revamp — removed the shrinking text logo; replaced with doberman image + "BUDGET DAWGS" in clean uppercase tracking',
    'Light mode: accent updated to brand green (#4ecb8d) matching dark mode; gray/green gradient on buttons',
    'Insights card: claw logo removed — text only, cleaner look',
  ]},
  { version: '3.9.9', date: '2026-05-19', changes: [
    'Insight card: replaced complex paw SVG with 3 clean solid-black bear claws — no toe pads, no shine lines, no blue tint',
    'Buttons/bars: dark mode gradient is now deep forest grey → brand green (#2d3830 → #4ecb8d) for the gray/green look',
  ]},
  { version: '3.9.8', date: '2026-05-19', changes: [
    'Dark mode accent updated to brand green (#4ecb8d) — matches the doberman collar and logo green used in animations',
    'Insights card: SVG viewBox extended so the full paw pad is no longer clipped; black claws now visible against the green gradient card',
  ]},
  { version: '3.9.7', date: '2026-05-19', changes: [
    'Dark mode: accent gradient now derives from the active theme — no more hardcoded blue-purple; dark mode stays neutral grey',
    'Account overview: no longer offset in left/right side-nav mode — fills full width when sidebar is hidden',
  ]},
  { version: '3.9.6', date: '2026-05-19', changes: [
    'Insights card: paw replaced with a hand-drawn SVG Doberman claw — sharp hooked claws, heavy black pads, claw shine highlights',
  ]},
  { version: '3.9.5', date: '2026-05-19', changes: [
    'Side-nav footer: accounts ⊞ button now appears correctly in the sidebar footer (was staying in the hidden header)',
    'Side-nav footer: removed cramped dropdown — use the ⊞ button to open the account picker and switch accounts from there',
    'Side-nav brand mark: doberman image replaces the paw emoji at the top of the sidebar',
    'Account picker: doberman image added to the "My Accounts" header alongside the title',
  ]},
  { version: '3.9.4', date: '2026-05-19', changes: [
    'Side-nav revamp — header is fully hidden in left/right nav mode; sidebar owns the full column top to bottom with no conflicts',
    'Sidebar brand mark — 🐾 icon at the top of the sidebar in side-nav mode',
    'Sidebar footer — account switcher and sounds toggle move to the bottom of the sidebar in side-nav mode, return to the header when switching back to bottom/top nav',
  ]},
  { version: '3.9.3', date: '2026-05-19', changes: [
    'Nav sidebar — solid background replaces frosted glass in side-nav mode; header clipped to its own column so title can no longer visually bleed into the sidebar',
  ]},
  { version: '3.9.2', date: '2026-05-19', changes: [
    'Nav sidebar — header no longer overlaps the sidebar; header starts at the sidebar edge so the sidebar runs full screen height top to bottom unobstructed',
  ]},
  { version: '3.9.1', date: '2026-05-19', changes: [
    'Nav sidebar fix — sidebar is now position:fixed so it spans the full screen from top to bottom, no longer cut off at the header bar',
  ]},
  { version: '3.9.0', date: '2026-05-19', changes: [
    'Haptic feedback — phone vibrates on transaction save, milestone hit, and bill marked paid',
    'Swipe between tabs — swipe left/right on the main content area to move to the next or previous tab',
    'Auto (System) theme — new theme option that follows your device dark/light preference automatically',
    'Month-over-month deltas — Income and Expenses cards now show ↑/↓ vs last month in red/green',
    'Spending insights rotating card — insights cycle automatically every 4 seconds with dot indicators',
    'Bill calendar — mini monthly calendar on the Bills tab highlights every bill\'s due date',
    'Debt payoff calculator — enter a monthly budget and get Snowball vs Avalanche payoff timelines',
    'Nav sidebar fix — left/right nav scrolls vertically when items overflow',
  ]},
  { version: '3.8.2', date: '2026-05-18', changes: [
    'What\'s New fix — 3.8.x changelog entries were missing, section now populates correctly',
  ]},
  { version: '3.8.1', date: '2026-05-18', changes: [
    'Doberman animations fully rebuilt — bezier-curve body silhouette, multi-stop linear and radial gradients on fur, chest, paws, eyes, collar, and tag',
    'Eyes now have 4 layers: dark socket, radial gradient amber iris, pupil, and two gleam dots',
    'Spinning coin — rotates using a cosine-scaled ellipse with a 4-stop specular gradient',
    'Animation text upgraded to Plus Jakarta Sans with drop shadow',
    'Expense: leash vibrates when taut, coin leaves speed trails on escape, teardrop is a bezier shape',
    'Income: dog kicks up dust puffs while running, coins cast ground shadows, 10-particle sparkle burst at end',
  ]},
  { version: '3.8.0', date: '2026-05-18', changes: [
    'Changelog backfilled — What\'s New now shows all updates from 3.7.4 onward',
  ]},
  { version: '3.7.9', date: '2026-05-18', changes: [
    'About page: doberman displayed full-width — other icon removed',
  ]},
  { version: '3.7.8', date: '2026-05-18', changes: [
    'Brand-new Doberman transaction animations — canvas-drawn Doberman replaces SpongeBob as the default character',
    'Expense animation: "Money slipped the leash" — coin strains on a purple leash, leash snaps, coin bolts off screen, dog sits sad with teardrop',
    'Income animation: "Fetch the bag" — coins arc in, Doberman sprints to fetch them, returns celebrating with sparkles and wagging tail',
    'Gengar and Jurassic Park theme animations unchanged',
  ]},
  { version: '3.7.7', date: '2026-05-18', changes: [
    'Transaction animations restored — expense triggers the robbery animation, income triggers the payday animation; gated by the sounds toggle',
  ]},
  { version: '3.7.6', date: '2026-05-18', changes: [
    'About page: doberman and app icon displayed side-by-side in the top card',
  ]},
  { version: '3.7.5', date: '2026-05-18', changes: [
    'Nav bar icons replaced with inline SVG — all 11 tabs now use outline SVG icons that fill solid with the accent color when selected',
    'Interior icon details (grid lines, text rows, i-symbol) use a knockout effect in the active/filled state',
    'About page: doberman mascot card added with "Money on a leash." tagline',
  ]},
  { version: '3.7.4', date: '2026-05-18', changes: [
    'Nav bar SVG icons introduced — outline when inactive, filled accent when active (initial implementation)',
  ]},
  { version: '3.7.3', date: '2026-05-18', changes: [
    'Splash cleaned up — fire and ambient glow removed; clean minimal dark screen with dog, text, and progress bar only',
    'App title font locked to Plus Jakarta Sans 800 — consistent with the rest of the app; custom font picker no longer overrides it',
    'App title cut-off on side nav fixed — nav position change now calls fitLogo() so the logo remeasures against the new header width immediately',
  ]},
  { version: '3.7.2', date: '2026-05-18', changes: [
    'Splash background flash fixed — inline script before first paint reads saved theme and applies --bg + body.light before the browser renders anything; light theme no longer shows a dark splash',
  ]},
  { version: '3.7.1', date: '2026-05-18', changes: [
    'Logo re-measured after document.fonts.ready — prevents the brief overflow flash when a custom font (Bangers, Press Start 2P, etc.) finishes loading after applySettings fires',
  ]},
  { version: '3.7.0', date: '2026-05-18', changes: [
    'Dashboard scroll fixed — animation class (anim-zoom-in has overflow:hidden) was never removed after playing, blocking scroll on first load; animationend listener now strips it immediately',
    'Header logo always shows fully — replaced max-width:55% with flex:1 so logo takes exactly the space left after the right controls; .header-right wrapper is flex-shrink:0 so it is never squished',
    'fitLogo() simplified — with flex:1, scrollWidth > offsetWidth is the only check needed; works correctly on all nav positions',
  ]},
  { version: '3.6.9', date: '2026-05-18', changes: [
    'Header logo hard-capped to left 55% of header — can never grow into the account switcher or sounds button regardless of font or text length',
    'Account switcher and sounds button are flex-shrink:0 so they are never squished or hidden',
    'fitLogo() now measures against the 55% cap directly instead of computing sibling widths (more reliable)',
  ]},
  { version: '3.6.8', date: '2026-05-18', changes: [
    'Splash: lens flare removed',
    'Splash: CSS fire added at the doberman\'s feet — 7 animated flame tongues (teardrop shapes, fire gradient, blurred) rise from behind the dog with staggered timing; large ambient base glow underneath',
    'Splash brand text now glows with a warm orange/red fire color to match the flames',
  ]},
  { version: '3.6.7', date: '2026-05-18', changes: [
    'Header title always stays one line — white-space:nowrap + fitLogo() shrinks font-size automatically when a wide font (e.g. Press Start 2P) is selected',
    'Nav-left / nav-right header fix — header content was rendering over the sidebar column; now offset by sidebar width so logo, switcher, and sounds button stay in the actual content area',
  ]},
  { version: '3.6.6', date: '2026-05-18', changes: [
    'Lens flare upgraded — replaced quick streak with a proper 1.6s two-layer flare: large diffuse blue-white corona (heavily blurred) + tighter bright core slightly ahead, both drift slowly across the base of "Budget DAWGs"',
  ]},
  { version: '3.6.5', date: '2026-05-18', changes: [
    'Splash screen fix — was rendering in top half of screen due to CSS specificity bug (#splash-screen position:relative was overriding position:fixed)',
    'Lens-flare shine added — a soft white light brushes left→right along the base of "Budget DAWGs" after the text appears',
  ]},
  { version: '3.6.4', date: '2026-05-18', changes: [
    'Splash screen redesigned — clean minimal layout: dog slides in smoothly, brand text in design-system colors, slim accent gradient progress bar replaces dollar coin chaos',
    'Account picker redesigned — premium vertical list replaces 2-col emoji grid; each account gets a colored type stripe, large balance right-aligned, chevron; rows slide in staggered from left',
  ]},
  { version: '3.6.3', date: '2026-05-18', changes: [
    'Removed all blue tints from glass surfaces — cards, hero balance card, and nav pill are now clear neutral glass',
    'All glow effects changed to white/clear — nav active icon, inner highlights throughout',
    'Glossy top-shine reflection added to every card surface via ::after overlay',
    'Ambient screen top-light via body::before radial gradient — gives the whole UI a "lit from above" feel',
    'Stronger inner edge highlights on all cards — top edge bright white, bottom edge deep shadow',
    'Button shadows changed from blue glow to neutral depth with bright white inner highlight',
  ]},
  { version: '3.6.2', date: '2026-05-18', changes: [
    'Font upgraded to Plus Jakarta Sans — the standard for premium fintech products (Stripe, Notion, Linear)',
    'Light mode header gradient removed — clean solid white surface now',
    'Balance card redesigned as a full-width hero — 40px number with gradient blue/purple glow background',
    'All cards now use true glassmorphism — layered gradient bg, inner top highlight, deep shadow',
    'Section titles get a gradient accent left-bar marker',
    'Primary button upgraded to accent gradient with blue glow shadow',
    'All progress/breakdown bars now fill with the accent gradient',
    'Nav active pill uses gradient highlight',
    'Light mode: white card surfaces with soft shadows throughout',
    'Net worth total upgraded to 2rem/800 weight commanding number',
  ]},
  { version: '3.6.1', date: '2026-05-18', changes: [
    'Splash doberman updated to transparent-background PNG — no more black square, shadow now hugs the dog outline',
  ]},
  { version: '3.6.0', date: '2026-05-18', changes: [
    'Full UI redesign — premium design system overhaul',
    'Typography: all Georgia and Courier New replaced with Outfit; page titles 26px/800 weight; card values 22px/800 weight; section labels now uppercase tracking style',
    'Colors: accent upgraded to #5b8de8 (vibrant blue); iOS-quality success/danger/warn colors; richer darker backgrounds with proper surface layering',
    'Cards: 16px radius, subtle white border, drop shadow — every card in the app',
    'Buttons: gradient primary, 10px radius, Outfit 600 weight, scale-press feedback',
    'Inputs: 10px radius, Outfit font, glowing focus ring',
    'Nav bar: frosted glass backdrop-blur, active state gets soft blue pill background',
    'Toggle switches: larger (48×26px) and more premium feeling',
  ]},
  { version: '3.5.9', date: '2026-05-18', changes: [
    'Splash screen doberman updated to custom photo — SMY collar, dollar tag, black background blends seamlessly',
  ]},
  { version: '3.5.8', date: '2026-05-18', changes: [
    'Splash: dog replaced with a mean SVG doberman — black coat, rust/tan markings, angry V brows, snarl with fangs',
    'Fixed zoom transition: account tile tap now correctly zooms into the dashboard (was calling render() twice, second call reset animation to fade)',
    'Zoom-out back to picker now clips overflow during animation to prevent edge bleed',
    'Tagline updated to "Money on a leash."',
  ]},
  { version: '3.5.7', date: '2026-05-18', changes: [
    'Splash screen: animated intro on every app open — dog bounces in, title slams in, dollar coins shoot outward, fades out before app loads',
    'Account transitions: tap tile to zoom into dashboard, tap ⊞ to zoom back out to picker',
  ]},
  { version: '3.5.6', date: '2026-05-18', changes: [
    'Pinch-to-zoom disabled — viewport locked to prevent accidental scaling on iOS and Android',
    'iPhone header fix — header height now grows to include the notch / Dynamic Island safe-area inset so content no longer gets squished',
  ]},
  { version: '3.5.5', date: '2026-05-18', changes: [
    'Page transitions: tap an account tile to slide into its dashboard (slides in from right)',
    'Tap ⊞ to return to account picker — content slides out to the left',
    'Nav tab switches use a smooth fade-up animation',
    'Account picker tiles stagger in with a cascading entrance animation',
  ]},
  { version: '3.5.4', date: '2026-05-15', changes: [
    'Weekly breakdown no longer resets when a new week starts — one continuous list from earliest week with data through to paydate',
    'Current week is highlighted with an accent border and THIS WEEK badge; past weeks are slightly dimmed',
    'Removed the separate "Past Weeks" section — everything is in one stable ordered list',
  ]},
  { version: '3.5.3', date: '2026-05-15', changes: [
    'Net worth: loan accounts now subtract from net worth (same as credit) — was incorrectly added as a positive asset',
    'Net worth rows now show "(Loan)" or "(Credit)" label and "Owes: $X" in red for all debt accounts',
  ]},
  { version: '3.5.2', date: '2026-05-15', changes: [
    'Credit card dashboard: once balance is set, first-run box replaced with account name, balance owed, this-month spending by category, and recent transactions (payments in green, charges in red)',
    'Loan dashboard: same card shows account name, balance owed, and payment history list',
    'Set-balance prompt remains for debt accounts that have no balance entered yet',
  ]},
  { version: '3.5.1', date: '2026-05-15', changes: [
    'Loan accounts now show balance owed in red (same as credit cards) — was incorrectly treated as a positive asset',
    'Dashboard balance card shows "LOAN BALANCE" / "BALANCE OWED" with "(Loan)" or "(Credit)" sub-label',
    'Tutorial rewritten — 10 slides covering accounts picker, month navigator, running balance, chart tap, debt tab, bills, and settings',
  ]},
  { version: '3.5.0', date: '2026-05-15', changes: [
    'Account picker: opening the app with multiple accounts now shows a tile grid — tap one to enter its dashboard',
    'Each tile shows account type icon, name, and current balance (or amount owed for credit/loan)',
    'Header gets a ⊞ button to return to the account picker at any time',
    'Single-account users see no change — picker is skipped',
  ]},
  { version: '3.4.0', date: '2026-05-15', changes: [
    'New Debt tab (💳): dedicated dashboard for credit cards and loans',
    'Shows total owed, per-account balance, payoff progress bar, payment history, and charges',
    'Add accounts with type Credit or Loan in Settings → Accounts',
    'Loan added as a new account type option',
  ]},
  { version: '3.3.3', date: '2026-05-15', changes: [
    'Dashboard balance now shows end-of-month balance when browsing past months, not current live balance',
    'Balance sub-label updates to e.g. "end of Apr 2026" for past months',
  ]},
  { version: '3.3.2', date: '2026-05-15', changes: [
    'Fixed UTC date parsing bug — new Date("YYYY-MM-01") rolls back to prior month in negative-offset timezones; all month date construction now uses local-time new Date(year, month, 1)',
  ]},
  { version: '3.3.1', date: '2026-05-15', changes: [
    'Monthly pace insight no longer shows on past months (refDate was day 2 of that month, making math explode)',
    'All inputs now show a Done checkmark on mobile keyboard instead of Next (enterkeyhint=done)',
  ]},
  { version: '3.3.0', date: '2026-05-15', changes: [
    'Month navigator on dashboard: browse spending data for any past month',
    'Running balance in ledger: each row shows the account balance after that transaction',
    'Chart tap: tap any bar or pie segment to see all transactions in that category',
    'inputmode=decimal on all amount inputs for better mobile keyboard experience',
    'Top spend insight now uses cleaner label with triangle indicator',
  ]},
  { version: '3.2.0', date: '2026-05-15', changes: [
    'Health score rebuilt: savings rate (50%), balance buffer (25%), bills paid (25%) — no budget limits required',
    'Credit card accounts now subtract from net worth correctly',
    'Auto-log bill: marking a bill paid offers to add it as an expense transaction',
    'Spending insights: month-over-month comparison, biggest category, savings rate, monthly pace',
    'Transfer between accounts: move money without affecting income/expense totals',
    'PIN lock: set a 4-digit PIN in Settings → Privacy to lock the app',
    'Customizable dashboard: toggle sections on/off from Settings',
  ]},
  { version: '3.1.0', date: '2026-05-15', changes: [
    'Net worth view on dashboard: total across all accounts when you have 2+',
    'CSV export: download full transaction history from the Ledger tab',
    'Bill notifications: get alerted about bills due in 3 days when you open the app',
    'Bills nav tab shows a badge count when bills are due soon',
  ]},
  { version: '3.0.1', date: '2026-05-15', changes: [
    'Press Start 2P actually works now — font value had double-quotes inside a double-quoted HTML attribute (data-font), snapping it to empty string',
  ]},
  { version: '3.0.0', date: '2026-05-15', changes: [
    'Transaction animations removed',
    'Press Start 2P font fixed — digit in name requires CSS quoting, now applies correctly',
    'Gengar background finally visible — overlay was hidden behind body solid background, moved inside #app',
  ]},
  { version: '2.9.9', date: '2026-05-15', changes: [
    'App title shadow softened with blur — no more hard edge, light mode looks much cleaner',
    'Light mode theme dot now shows white circle with border instead of purple',
    'Dusk theme removed',
    'Gengar background ghost is more visible (opacity raised)',
    'Jurassic Park theme: removed green tint from backgrounds, neutral dark grey base with amber/green accents only',
  ]},
  { version: '2.9.8', date: '2026-05-15', changes: [
    'Transaction animations fixed — syntax error in animations.js was silently killing all of them',
    'Font picker previews now work correctly — double-quote HTML escape bug resolved',
    'Removed all heart emojis from the app',
    'Gengar theme now uses neutral dark grey backgrounds (matches Dusk base)',
    'Gengar theme: gengar.png appears as a faint ghost watermark in the background',
    'Gengar removed from About page',
    'Added 8-bit font: Press Start 2P',
  ]},
  { version: '2.9.7', date: '2026-05-15', changes: [
    'Font picker: all 14 fonts now appear correctly (group keys were mismatched)',
    'Font picker preview now actually shows each font — CSS override removed',
    'Capitalization: option 3 changed to lowercase, option 4 added: Small Caps (Aᴀ)',
    'About page now shows your custom newicon.png',
    'Gengar theme: About page shows gengar.png below the main icon',
  ]},
  { version: '2.9.6', date: '2026-05-15', changes: [
    'New theme: Gengar 👻 — deep purple ghost vibes with shadow accents',
    'New theme: Jurassic Park 🦖 — amber/jungle green, holds onto your butts',
    'Gengar theme: transaction animations replaced with Gengar canvas art',
    'Jurassic Park theme: transaction animations replaced with T-Rex canvas art',
    'Nav burst particles now match your theme (👻💜🔮 or 🦖🌿🦕)',
  ]},
  { version: '2.9.5', date: '2026-05-15', changes: [
    'Font list overhauled: 14 curated fonts in Anime, Modern, and Cursive groups',
    'App title drop shadow replaced glow — diagonal offset shadow, no bloom',
    'Transaction animation popup redesigned: blurred backdrop, accent border, Bangers title, randomized dismiss labels',
    'About page icon enlarged to 90%',
  ]},
  { version: '2.9.4', date: '2026-05-15', changes: [
    'App title now uses accent color with a diagonal drop shadow — feels like part of the theme',
    'Font picker replaced with live preview dropdown: hover any font to instantly see your title in it',
    'About page icon sized to 60% of its card',
  ]},
  { version: '2.9.3', date: '2026-05-15', changes: [
    'Nav tabs: tapping any tab now bursts a shower of $ and 💸 particles',
  ]},
  { version: '2.9.2', date: '2026-05-15', changes: [
    'App title now uses Bangers font by default — comic/anime style',
    'Nav labels switched to Bangers font; active icon gets a subtle glow + scale',
    'Header has an accent-color underline for edge',
    'Settings cards now have proper spacing between them',
    'Font picker: added Grunge/Anime group — Bangers, Russo One, Righteous, Exo 2, Permanent Marker, Boogaloo',
  ]},
  { version: '2.9.1', date: '2026-05-15', changes: [
    "Default app name updated to SlawMinYaw's Budget DAWGs",
  ]},
  { version: '2.9.0', date: '2026-05-15', changes: [
    'Starting balance: set your real account balance in Settings → Account (or on the first-run card)',
    'Balance cards now include your starting balance — no need to log it as income',
    'Tutorial: 8-slide guided walkthrough, launched from About or the floating ? button',
  ]},
  { version: '2.8.5', date: '2026-05-15', changes: [
    'Bar chart now shows spending by category (same data as pie chart, just a different view)',
    'About page icon now fills the full card width',
  ]},
  { version: '2.8.4', date: '2026-05-15', changes: [
    'About icon: removed pixel-art sharpening filter that was hurting logo quality, tightened drop-shadow',
    'About icon moved closer to the version number',
    'What\'s New now only shows updates for the current version series (e.g. v2.8.x)',
  ]},
  { version: '2.8.3', date: '2026-05-15', changes: [
    'App title now has a subtle drop shadow for depth',
    'Emergency buffer card color changed to a soft sky teal — lighter and easier on the eyes',
  ]},
  { version: '2.8.2', date: '2026-05-15', changes: [
    'Expense amounts are now red everywhere: dashboard, weekly, all transaction rows',
    'Weekly Per Week and Per Day budgets now use the warning (amber) color',
    'Emergency buffer card uses the accent (steel blue) color — reserved, not spent',
  ]},
  { version: '2.8.1', date: '2026-05-15', changes: [
    'Expense amounts now always show in red across all themes',
  ]},
  { version: '2.8.0', date: '2026-05-15', changes: [
    'Dark mode is now fully neutral grey — all purple removed from accents, text, and UI',
    'Font picker converted to a clean dropdown grouped by style',
  ]},
  { version: '2.7.9', date: '2026-05-15', changes: [
    'About icon now has a subtle drop shadow for definition and clarity',
    'Font picker expanded: added cursive/script options — Dancing Script, Pacifico, Satisfy, Great Vibes, Lobster',
    'Added modern extras: Raleway, Josefin Sans, Cormorant Garamond',
    'New capitalization option for the app title: Normal, UPPER, or Title Case',
  ]},
  { version: '2.7.8', date: '2026-05-15', changes: [
    'Removed Moss (green) theme — conflicts with the logo color',
    'About page always shows in Dark or Light colors regardless of active theme',
  ]},
  { version: '2.7.7', date: '2026-05-15', changes: [
    'Dark mode is now true neutral dark grey — no purple or colored tinting',
    'All dark themes share the same neutral backgrounds; only accent and category colors change',
    'Category dot colors tuned per theme to be distinct and intentional',
  ]},
  { version: '2.7.6', date: '2026-05-15', changes: [
    'Each theme now recolors category dots/bars/charts to match — everything shifts together',
    'Theme selector redesigned: clean list with accent color dot and checkmark, no weird preview boxes',
  ]},
  { version: '2.7.5', date: '2026-05-15', changes: [
    'About page: removed name text, icon fills the full card width',
    'Added spacing between the top card and What\'s New / Force Update cards',
  ]},
  { version: '2.7.4', date: '2026-05-15', changes: [
    'Themes renamed back to Dark / Light as primary, with Dusk / Denim / Moss / Ember as extras',
    'All accent colors softened and desaturated across every theme',
    'App title now uses the text color at slight opacity — clean and modern, not a bright accent',
    'Custom logo color overrides the opacity so it shows at full strength',
  ]},
  { version: '2.7.3', date: '2026-05-15', changes: [
    'About icon now uses correct transparency — shows clean logo on any background',
    'Themes completely redesigned with real color: Slate, Pebble, Dusk (purple), Denim (navy), Moss (green), Ember (warm amber)',
    '8 font choices added: Outfit, Inter, DM Sans, Nunito, Space Grotesk, Playfair, Georgia, Mono',
  ]},
  { version: '2.7.2', date: '2026-05-15', changes: [
    'All 6 themes redesigned with softer, muted modern palettes',
    'Themes renamed: Slate, Pebble, Dusk, Denim, Moss, Ink',
    'About page icon now shows original grey background with rounded corners',
  ]},
  { version: '2.7.1', date: '2026-05-15', changes: [
    'Chart text, legend, and grid lines now adapt to any theme (fixes light mode readability)',
    'About page icon shown as-is — no more blend mode or opacity alteration',
    'Nav bar tightened: smaller icons, compact labels, labels truncate cleanly',
  ]},
  { version: '2.7.0', date: '2026-05-15', changes: [
    'Preset color themes: Dark, Light, Ocean, Sunset, Forest, Midnight',
    'Logo font and color customization in Settings',
    'Custom categories — add your own and remove them anytime',
    'Removed built-in categories: Snacks, Transport, Housing, Shopping, Income',
    'Ledger: sort by date/amount, filter by type, category, and date range',
  ]},
  { version: '2.6.4', date: '2026-05-15', changes: [
    'About page now shows transparent brand icon blended into the background',
    'Added this changelog — updates will now show what changed',
  ]},
  { version: '2.6.3', date: '2026-05-14', changes: [
    'Pie chart text now readable in dark mode',
    'Pie chart moved left, legend moved right',
    'Reduced pie chart border thickness',
    'Health score rebuilt: Savings Rate, Budget Control, Bills, Goals',
  ]},
  { version: '2.6.2', date: '2026-05-13', changes: [
    'Multi-account budgeting — add and switch between accounts from the header',
    'Accounts can be renamed or deleted',
    'Each account has fully isolated transactions, budgets, and bills',
  ]},
  { version: '2.6.1', date: '2026-05-12', changes: [
    'Fixed chart freeze when switching between bar and pie',
    'Switched to Outfit font throughout',
    'Personalized name no longer appends extra text',
    'Removed "money moves" tagline',
  ]},
];

// Shared neutral dark base — pure grey, no color cast
const _D = { bg:'#111112', surface:'#1a1a1b', surface2:'#242425', card:'#1e1e1f', text:'#e2e2e4', muted:'#888890', border:'#28282a', font:'default' };

const THEMES = {
  dark: {
    label:'Dark', shortLabel:'Green',
    ..._D,
    accent:'#62b898', accent2:'#997060', success:'#62b898', warn:'#c0a038', danger:'#c05050',
    grad:'linear-gradient(135deg, #283530 0%, #62b898 100%)',
    cats:{ Food:'#62b898', Gas:'#c05858', Car:'#6888a8', Boat:'#4898a8', Tools:'#b87840', Home:'#7ca048', Entertainment:'#8890a8', Health:'#4090a8', Other:'#787880' },
  },
  oled: {
    label:'OLED Black', shortLabel:'OLED',
    bg:'#000000', surface:'#0a0a0a', surface2:'#101010', card:'#0c0c0c',
    text:'#e2e2e4', muted:'#888890', border:'#1c1c1c',
    accent:'#62b898', accent2:'#997060', success:'#62b898', warn:'#c0a038', danger:'#c05050',
    grad:'linear-gradient(135deg, #000a04 0%, #62b898 100%)',
    font:'default',
    cats:{ Food:'#62b898', Gas:'#c05858', Car:'#6888a8', Boat:'#4898a8', Tools:'#b87840', Home:'#7ca048', Entertainment:'#8890a8', Health:'#4090a8', Other:'#787880' },
  },
  vscode: {
    label:'VS Code',
    bg:'#1e1e1e', surface:'#252526', surface2:'#2d2d2d', card:'#252526',
    text:'#d4d4d4', muted:'#6a9955', border:'#3e3e42',
    accent:'#569cd6', accent2:'#4ec9b0', success:'#4ec9b0', warn:'#ce9178', danger:'#f44747',
    grad:'linear-gradient(135deg, #1a3a5c 0%, #569cd6 100%)',
    font:'vscode',
    cats:{ Food:'#4ec9b0', Gas:'#f44747', Car:'#569cd6', Boat:'#9cdcfe', Tools:'#ce9178', Home:'#b5cea8', Entertainment:'#c586c0', Health:'#4fc1ff', Other:'#858585' },
  },
  powershell: {
    label:'PowerShell',
    bg:'#012456', surface:'#063070', surface2:'#0a3a80', card:'#073268',
    text:'#eeedf0', muted:'#8ab8d0', border:'#1255a0',
    accent:'#26c6da', accent2:'#f1e05a', success:'#4caf50', warn:'#f1e05a', danger:'#ef5350',
    grad:'linear-gradient(135deg, #012456 0%, #26c6da 100%)',
    font:'powershell',
    cats:{ Food:'#26c6da', Gas:'#ef5350', Car:'#42a5f5', Boat:'#29b6f6', Tools:'#ffa726', Home:'#66bb6a', Entertainment:'#ab47bc', Health:'#26c6da', Other:'#8ab8d0' },
  },
  cmd: {
    label:'CMD',
    bg:'#0c0c0c', surface:'#0f1a0f', surface2:'#162416', card:'#111a11',
    text:'#00c300', muted:'#2d9a2d', border:'#1e4a1e',
    accent:'#00c300', accent2:'#00ff41', success:'#00ff41', warn:'#ffff00', danger:'#ff3333',
    grad:'linear-gradient(135deg, #000000 0%, #003300 60%, #00c300 100%)',
    font:'cmd',
    cats:{ Food:'#00c300', Gas:'#ff3333', Car:'#00aaff', Boat:'#00ffff', Tools:'#ffaa00', Home:'#aaff00', Entertainment:'#ff55ff', Health:'#00aaff', Other:'#888888' },
  },
  kali: {
    label: 'Kali Linux',
    bg: '#1a1a2e', surface: '#16213e', surface2: '#0f3460', card: '#16213e',
    text: '#e0e0e0', muted: '#7a9aae', border: '#1e3a5e',
    accent: '#00d4ff', accent2: '#267bf0', success: '#00ff88', warn: '#f1c40f', danger: '#e74c3c',
    grad: 'linear-gradient(135deg, #0f3460 0%, #00d4ff 100%)',
    font: 'kali',
    cats: { Food:'#00ff88', Gas:'#e74c3c', Car:'#267bf0', Boat:'#00d4ff', Tools:'#f39c12', Home:'#2ecc71', Entertainment:'#9b59b6', Health:'#00d4ff', Other:'#4a6a7a' },
  },
  mintlinux: {
    label: 'Linux Mint',
    bg: '#1c2128', surface: '#22272e', surface2: '#2d333b', card: '#22272e',
    text: '#adbac7', muted: '#768390', border: '#373e47',
    accent: '#87cf3e', accent2: '#5fa832', success: '#87cf3e', warn: '#d9a520', danger: '#e05252',
    grad: 'linear-gradient(135deg, #1c3010 0%, #87cf3e 100%)',
    font: 'default',
    cats: { Food:'#87cf3e', Gas:'#e05252', Car:'#4080c0', Boat:'#40c0b0', Tools:'#d9a520', Home:'#87cf3e', Entertainment:'#a070c0', Health:'#4898c8', Other:'#768390' },
  },
  ubuntu: {
    label: 'Ubuntu',
    bg: '#300a24', surface: '#2c0a20', surface2: '#3a1035', card: '#350c28',
    text: '#eeeeee', muted: '#c0a8b8', border: '#5a1a40',
    accent: '#e95420', accent2: '#77216f', success: '#6cc644', warn: '#f1c40f', danger: '#e74c3c',
    grad: 'linear-gradient(135deg, #300a24 0%, #e95420 100%)',
    font: 'ubuntu',
    cats: { Food:'#6cc644', Gas:'#e95420', Car:'#4284f3', Boat:'#6cc644', Tools:'#f39c12', Home:'#6cc644', Entertainment:'#77216f', Health:'#4284f3', Other:'#a08898' },
  },
  light: {
    label:'Light', shortLabel:'Mint',
    bg:'#f5f5f7', surface:'#ffffff', surface2:'#ececef', card:'#ffffff',
    accent:'#2fa56f', accent2:'#9a7850', success:'#3a9e6e', warn:'#9a7d12', danger:'#cc3b30',
    grad:'linear-gradient(135deg, #1a4030 0%, #5ab592 100%)',
    text:'#1d1d1f', muted:'#5b5b60', border:'#e3e3e6', light:true, font:'default',
    cats:{ Food:'#4aaa80', Gas:'#a84040', Car:'#4858a0', Boat:'#308898', Tools:'#986030', Home:'#608038', Entertainment:'#804898', Health:'#308898', Other:'#606078' },
  },
  denim: {
    label:'Denim', shortLabel:'Blue',
    ..._D,
    accent:'#6090b4', accent2:'#a88050', success:'#62a880', warn:'#c0a038', danger:'#c05050',
    cats:{ Food:'#52a872', Gas:'#c05858', Car:'#4070b0', Boat:'#3898b8', Tools:'#b07840', Home:'#608898', Entertainment:'#6060a8', Health:'#3898b8', Other:'#607898' },
  },
  ember: {
    label:'Ember', shortLabel:'Orange',
    ..._D,
    accent:'#b88252', accent2:'#b06248', success:'#52a872', warn:'#c0a038', danger:'#c05050',
    cats:{ Food:'#78a858', Gas:'#c85040', Car:'#b07830', Boat:'#509880', Tools:'#c86830', Home:'#a89840', Entertainment:'#b06070', Health:'#609878', Other:'#988060' },
  },
  jurassicpark: {
    label:'Gold', shortLabel:'Gold',
    ..._D,
    accent:'#b8a048', accent2:'#b06040', success:'#5aaa40', warn:'#c8a020', danger:'#c84030',
    cats:{ Food:'#5aaa40', Gas:'#c84030', Car:'#c8a020', Boat:'#409870', Tools:'#c86020', Home:'#80a830', Entertainment:'#a07020', Health:'#50a860', Other:'#788858' },
  },
  darkslate: {
    label:'Slate', shortLabel:'Slate',
    ..._D,
    accent:'#8890a0', accent2:'#7a8090', success:'#8890a0', warn:'#c0a038', danger:'#c05050',
    grad:'linear-gradient(135deg, #1c2028 0%, #8890a0 100%)',
    cats:{ Food:'#7888a0', Gas:'#c05858', Car:'#6878a8', Boat:'#5888a0', Tools:'#b07840', Home:'#788888', Entertainment:'#887898', Health:'#5898a8', Other:'#787880' },
  },
  lux: {
    label:'Obsidian', shortLabel:'Obsidian',
    bg:'#0c0d10', surface:'#15171c', surface2:'#1e2128', card:'#16181d',
    text:'#eceef2', muted:'#8a8f9c', border:'rgba(212,175,98,.16)',
    accent:'#1fa97a', accent2:'#d4af62', success:'#2bbd86', warn:'#d4af62', danger:'#d6614e',
    grad:'linear-gradient(135deg, #15171c 0%, #1fa97a 100%)', font:'default',
    cats:{ Food:'#1fa97a', Gas:'#d6614e', Car:'#5b8bb0', Boat:'#3f9aa8', Tools:'#d4af62', Home:'#7ca25a', Entertainment:'#9a7cc0', Health:'#4f9ab0', Other:'#8a8f9c' },
  },
  auto: { label:'Auto (System)', shortLabel:'Auto', ..._D, accent:'#62b898', accent2:'#a07858', success:'#62b898', warn:'#c0a038', danger:'#c05050', grad:'linear-gradient(135deg, #283530 0%, #62b898 100%)' },
  custom: {
    label:'Custom', shortLabel:'Custom',
    ..._D,
    accent:'#62b898', accent2:'#62b898', success:'#62b898', warn:'#c0a038', danger:'#c05050',
    grad:'linear-gradient(135deg, #242425 0%, #62b898 100%)',
  },
  customlight: {
    label:'Custom', shortLabel:'Custom',
    bg:'#f5f5f7', surface:'#ffffff', surface2:'#ececef', card:'#ffffff',
    text:'#1d1d1f', muted:'#5b5b60', border:'#e3e3e6', light:true, font:'default',
    accent:'#5ab592', accent2:'#5ab592', success:'#5ab592', warn:'#a08030', danger:'#c05050',
    grad:'linear-gradient(135deg, #d8d8d5 0%, #5ab592 100%)',
  },
  // ── Light mode accent variants ──────────────────────────────────────────
  lightsky: {
    label:'Sky', shortLabel:'Sky',
    bg:'#f5f5f7', surface:'#ffffff', surface2:'#ececef', card:'#ffffff',
    accent:'#5492bc', accent2:'#c07840', success:'#2e9a68', warn:'#b07800', danger:'#a84040',
    grad:'linear-gradient(135deg, #1a304a 0%, #5492bc 100%)',
    text:'#1d1d1f', muted:'#5b5b60', border:'#e3e3e6', light:true, font:'default',
    cats:{ Food:'#2e9a68', Gas:'#a84040', Car:'#5492bc', Boat:'#2888a8', Tools:'#986030', Home:'#608038', Entertainment:'#7848a8', Health:'#3888a0', Other:'#606078' },
  },
  lightrose: {
    label:'Rose', shortLabel:'Rose',
    bg:'#f5f5f7', surface:'#ffffff', surface2:'#ececef', card:'#ffffff',
    accent:'#b05878', accent2:'#987838', success:'#2ea870', warn:'#988018', danger:'#a84040',
    grad:'linear-gradient(135deg, #4a1a2c 0%, #b05878 100%)',
    text:'#1d1d1f', muted:'#5b5b60', border:'#e3e3e6', light:true, font:'default',
    cats:{ Food:'#2ea870', Gas:'#a84040', Car:'#4858a8', Boat:'#308898', Tools:'#986030', Home:'#608038', Entertainment:'#b05878', Health:'#308898', Other:'#606078' },
  },
  lightsand: {
    label:'Sand', shortLabel:'Sand',
    bg:'#f5f5f7', surface:'#ffffff', surface2:'#ececef', card:'#ffffff',
    accent:'#a8843c', accent2:'#c05830', success:'#2ea870', warn:'#988018', danger:'#a84040',
    grad:'linear-gradient(135deg, #4a3010 0%, #a8843c 100%)',
    text:'#1d1d1f', muted:'#5b5b60', border:'#e3e3e6', light:true, font:'default',
    cats:{ Food:'#2ea870', Gas:'#a84040', Car:'#4858a0', Boat:'#308898', Tools:'#a8843c', Home:'#608038', Entertainment:'#804898', Health:'#308898', Other:'#606078' },
  },
  lightsilver: {
    label:'Silver', shortLabel:'Silver',
    bg:'#f5f5f7', surface:'#ffffff', surface2:'#ececef', card:'#ffffff',
    accent:'#70788a', accent2:'#8a8080', success:'#4a9870', warn:'#988018', danger:'#a84040',
    grad:'linear-gradient(135deg, #282c38 0%, #70788a 100%)',
    text:'#1d1d1f', muted:'#5b5b60', border:'#e3e3e6', light:true, font:'default',
    cats:{ Food:'#4a9870', Gas:'#a84040', Car:'#5068a0', Boat:'#407890', Tools:'#986030', Home:'#608038', Entertainment:'#706890', Health:'#407890', Other:'#606078' },
  },
  // ── Pokémon themes ──────────────────────────────────────────────────────
  gengar: {
    label:'Gengar', shortLabel:'Gengar', pokemon:true, mascot:'./poke-gengar.gif',
    tagline:'DEBT DIES<br>IN THE DARK.', splashTagline:'Ghost-type budgeting.',
    bg:'#14101c', surface:'#1c1726', surface2:'#2a2236', card:'#241d31',
    text:'#f0ecf7', muted:'#9a8fb0', border:'rgba(179,136,255,.18)',
    accent:'#b388ff', accent2:'#7c5fd6', success:'#43c98a', warn:'#e0c14a', danger:'#ff6b6b',
    gl1:'rgba(179,136,255,.95)', gl2:'rgba(236,90,210,.85)',
    grad:'linear-gradient(135deg, #2a2236 0%, #b388ff 100%)', font:'default',
    cats:{ Food:'#b388ff', Gas:'#ff6b6b', Car:'#7c8cff', Boat:'#5fd6c0', Tools:'#d9a520', Home:'#9a7cff', Entertainment:'#e07cd0', Health:'#5fb6e0', Other:'#9a8fb0' },
  },
  charizard: {
    label:'Charizard', shortLabel:'Charizard', pokemon:true, mascot:'./poke-charizard.gif',
    tagline:'REDUCE IT<br>TO ASH.', splashTagline:'Burn through debt.',
    bg:'#160f0c', surface:'#221712', surface2:'#33241b', card:'#2c1d15',
    text:'#f8efe8', muted:'#b29a8c', border:'rgba(255,122,60,.18)',
    accent:'#ff7a3c', accent2:'#ffb14d', success:'#5ec98a', warn:'#ffb14d', danger:'#ff5a3c',
    gl1:'rgba(255,90,40,.95)', gl2:'rgba(255,200,70,.85)',
    grad:'linear-gradient(135deg, #33241b 0%, #ff7a3c 100%)', font:'default',
    cats:{ Food:'#ffb14d', Gas:'#ff5a3c', Car:'#ff7a3c', Boat:'#5fc0d6', Tools:'#e0a020', Home:'#ff9a52', Entertainment:'#e07cd0', Health:'#5fb6e0', Other:'#b29a8c' },
  },
  squirtle: {
    label:'Squirtle', shortLabel:'Squirtle', pokemon:true, mascot:'./poke-squirtle.gif',
    tagline:'WASH AWAY<br>YOUR DEBT.', splashTagline:'Make it rain.',
    bg:'#0b1117', surface:'#121d25', surface2:'#1b2c37', card:'#16242e',
    text:'#e9f3f8', muted:'#8aa4b1', border:'rgba(70,166,236,.18)',
    accent:'#46a6ec', accent2:'#76d6e0', success:'#43c98a', warn:'#e0c14a', danger:'#ff6b6b',
    gl1:'rgba(70,166,236,.95)', gl2:'rgba(120,235,235,.85)',
    grad:'linear-gradient(135deg, #1b2c37 0%, #46a6ec 100%)', font:'default',
    cats:{ Food:'#46a6ec', Gas:'#ff6b6b', Car:'#5a7cf0', Boat:'#46c0ec', Tools:'#e0a020', Home:'#52c0a0', Entertainment:'#9a7cff', Health:'#46a6ec', Other:'#8aa4b1' },
  },
  // ── Sports team themes ──────────────────────────────────────────────────
  bears: {
    label:'Chicago Bears', shortLabel:'Bears', team:true, mascot:'./team-bears.png',
    tagline:'BEAR DOWN<br>ON YOUR BUDGET.', splashTagline:'Bear Down, Chicago.',
    bg:'#0b162a', surface:'#11203c', surface2:'#16284a', card:'#16284a',
    text:'#f3f4f6', muted:'#8b97ad', border:'rgba(227,90,35,.26)',
    accent:'#e35a23', accent2:'#0b162a', success:'#43c98a', warn:'#e0a14a', danger:'#ff6b6b',
    gl1:'rgba(227,90,35,.95)', gl2:'rgba(95,150,235,.85)',
    grad:'linear-gradient(135deg, #11203c 0%, #e35a23 100%)', font:'default',
    cats:{ Food:'#e35a23', Gas:'#ff6b6b', Car:'#5a7cf0', Boat:'#46c0ec', Tools:'#e0a020', Home:'#e8852a', Entertainment:'#9a7cff', Health:'#46a6ec', Other:'#8b97ad' },
  },
  dodgers: {
    label:'LA Dodgers', shortLabel:'Dodgers', team:true, mascot:'./team-dodgers.png',
    tagline:'THINK BLUE,<br>SPEND LESS.', splashTagline:'It’s time for Dodger baseball.',
    bg:'#0a1c34', surface:'#0e2748', surface2:'#123158', card:'#123158',
    text:'#eef3f9', muted:'#8ba0bd', border:'rgba(58,134,214,.28)',
    accent:'#3a86d6', accent2:'#ef3e42', success:'#43c98a', warn:'#e0c14a', danger:'#ef3e42',
    gl1:'rgba(58,134,214,.95)', gl2:'rgba(239,62,66,.85)',
    grad:'linear-gradient(135deg, #0e2748 0%, #3a86d6 100%)', font:'default',
    cats:{ Food:'#3a86d6', Gas:'#ef3e42', Car:'#5a7cf0', Boat:'#46c0ec', Tools:'#e0a020', Home:'#52a0d6', Entertainment:'#9a7cff', Health:'#46a6ec', Other:'#8ba0bd' },
  },
  knights: {
    label:'Vegas Golden Knights', shortLabel:'Knights', team:true, mascot:'./team-knights.png',
    tagline:'GO KNIGHT<br>OR GO HOME.', splashTagline:'Knights of the realm.',
    bg:'#16191b', surface:'#20262a', surface2:'#272f33', card:'#272f33',
    text:'#f1f3f4', muted:'#99a1a6', border:'rgba(193,164,99,.3)',
    accent:'#c1a463', accent2:'#c8102e', success:'#43c98a', warn:'#c1a463', danger:'#c8102e',
    gl1:'rgba(193,164,99,.98)', gl2:'rgba(200,16,46,.85)',
    grad:'linear-gradient(135deg, #20262a 0%, #c1a463 100%)', font:'default',
    cats:{ Food:'#c1a463', Gas:'#c8102e', Car:'#5a7cf0', Boat:'#46c0ec', Tools:'#d8b66a', Home:'#a0894f', Entertainment:'#9a7cff', Health:'#46a6ec', Other:'#99a1a6' },
  },
  celtics: {
    label:'Boston Celtics', shortLabel:'Celtics', team:true, mascot:'./team-celtics.png',
    tagline:'BUDGET<br>DIFFERENT HERE.', splashTagline:'Banner 18.',
    bg:'#07150d', surface:'#0c2014', surface2:'#0f2a19', card:'#0f2a19',
    text:'#eef3ee', muted:'#87a492', border:'rgba(33,176,102,.28)',
    accent:'#21b066', accent2:'#ba9653', success:'#21b066', warn:'#ba9653', danger:'#ff6b6b',
    gl1:'rgba(33,176,102,.95)', gl2:'rgba(186,150,83,.85)',
    grad:'linear-gradient(135deg, #0c2014 0%, #21b066 100%)', font:'default',
    cats:{ Food:'#21b066', Gas:'#ff6b6b', Car:'#5a7cf0', Boat:'#46c0ec', Tools:'#ba9653', Home:'#2bbf74', Entertainment:'#9a7cff', Health:'#46a6ec', Other:'#87a492' },
  },
};

let CAT_COLORS = {
  Food:          '#4ecb8d',
  Gas:           '#f76a6a',
  Car:           '#7c6af7',
  Boat:          '#4ecbcb',
  Tools:         '#f7936a',
  Home:          '#8dcb4e',
  Entertainment: '#f76ab5',
  Health:        '#4eaecb',
  Other:         '#9896a4',
};

// ── empty state ────────────────────────────────────────────────────────────
function emptyState(title, hint = '') {
  return `<div class="empty-state">
    <img src="${mascotSrc()}" class="empty-dob" alt="">
    <div class="empty-title">${title}</div>
    ${hint ? `<div class="empty-hint">${hint}</div>` : ''}
  </div>`;
}

// ── haptic feedback ────────────────────────────────────────────────────────
function haptic(pattern = [10]) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch(e) {}
}

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
  "I'm not cheap — YOU'RE irresponsible!",
];

function showRoast(msg) {
  const el = document.createElement('div');
  el.className = 'roast-toast';
  el.textContent = '🦀 ' + msg;
  const existingToasts = document.querySelectorAll('.roast-toast, .alert-toast');
  const offset = existingToasts.length * 60;
  el.style.top = `calc(var(--topbar-h, 56px) + var(--safe-top, 0px) + 12px + ${offset}px)`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-dismiss');
    setTimeout(() => el.remove(), 260);
  }, 3500 - 260);
}

function checkRoast(category) {
  const m = localMonthKey();
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

// ── paycheck schedule helpers ──────────────────────────────────────────────
function _nextPayDate(dateStr, frequency) {
  const d = new Date(dateStr + 'T00:00:00');
  switch (frequency) {
    case 'weekly':       d.setDate(d.getDate() + 7);  break;
    case 'biweekly':     d.setDate(d.getDate() + 14); break;
    case 'semimonthly':
      if (d.getDate() < 15) d.setDate(15);
      else { d.setMonth(d.getMonth() + 1); d.setDate(1); }
      break;
    case 'monthly':      d.setMonth(d.getMonth() + 1); break;
    default:             d.setDate(d.getDate() + 14);
  }
  return d.toISOString().slice(0, 10);
}

function _payMonthlyMultiplier(frequency) {
  return { weekly: 4.33, biweekly: 2.167, semimonthly: 2, monthly: 1 }[frequency] || 2.167;
}

// ── Gross-to-net paycheck estimator ────────────────────────────────────────
function _estimateNetPay({ gross, frequency, filingStatus, stateTaxPct, pretaxDeductions }) {
  const periods = { weekly:52, biweekly:26, semimonthly:24, monthly:12 }[frequency] || 26;
  const annualGross   = gross * periods;
  const annualPreTax  = pretaxDeductions * periods;
  const stdDeduction  = filingStatus === 'married' ? 30000 : 15000;
  const taxableIncome = Math.max(0, annualGross - stdDeduction - annualPreTax);

  // 2025 US federal income tax brackets
  const brackets = filingStatus === 'married'
    ? [[23850,.10],[96950,.12],[206700,.22],[394600,.24],[501050,.32],[751600,.35],[Infinity,.37]]
    : [[11925,.10],[48475,.12],[103350,.22],[197300,.24],[250525,.32],[626350,.35],[Infinity,.37]];
  let annualFed = 0, prev = 0;
  for (const [limit, rate] of brackets) {
    if (taxableIncome <= prev) break;
    annualFed += Math.min(taxableIncome - prev, limit - prev) * rate;
    prev = limit;
  }

  const perCheckFed   = annualFed / periods;
  const fica          = gross * 0.0765;           // SS 6.2% + Medicare 1.45%
  const stateTax      = gross * (stateTaxPct / 100);
  const net           = Math.max(0, gross - perCheckFed - fica - stateTax - pretaxDeductions);
  return { gross, perCheckFed, fica, stateTax, pretaxDeductions, net };
}

// ── Transaction animations ─────────────────────────────────────────────────
// Expense = evil doberman, Income = hype doberman, Paycheck = extra hype
const _EXPENSE_MSGS = [
  "Woof. Wallet just got bitten.",
  "Ruff. Another one gone.",
  "Budget took damage. Oof.",
  "The dawg is not pleased.",
  "Money out. Dawg growling.",
  "Another bite out of the bag.",
];
const _INCOME_MSGS = [
  "Ka-ching! Secured.",
  "Dawg eatin' good!",
  "Money in the bag!",
  "The dawg gets paid.",
  "Secured. No cap.",
  "Stack it up, dawg.",
];
const _PAYCHECK_MSGS = [
  "PAYDAY DROPPED!",
  "THE CHECK CLEARED!",
  "GET PAID, DAWG.",
  "PAYCHECK HIT DIFFERENT.",
  "DIRECT DEPOSIT SECURED.",
];

const _TRANSFER_MSGS = [
  'TRANSFER SENT.',
  'FUNDS MOVED.',
  'ACCOUNTS SYNCED.',
  'MONEY SHIFTED.',
];

function _escHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function showRobbery(amount, desc) { _showTxnAnim('expense', amount, desc); }
function showPayday(amount, desc)   { _showTxnAnim('income',  amount, desc); }
function showTransfer(amount, desc) { _showTxnAnim('transfer', amount, desc); }

function _showPaycheckToast(amount) {
  // Auto-paycheck fires from _checkPaychecks — reuse the full anim
  _showTxnAnim('income', amount, 'Paycheck');
}

// Per-theme flavor for the transaction "terminal boot" animation.
// Pokémon themes → eerie on-theme lines (no glitch); terminal themes → that shell's syntax; everything else → default DAWG.
function _txnFlavor(isExpense, isTransfer, isPaycheck) {
  const theme = loadSettings().theme || 'dark';
  const t = THEMES[theme] || {};
  const k = isExpense ? 'expense' : isTransfer ? 'transfer' : 'income';

  const POKE = {
    gengar:{ expense:['the shadows stir…','draining your wallet…','it hides in your shadow'],
             income:['a presence lingers…','tribute accepted…','the dark provides'],
             transfer:['the shadows stir…','phasing funds across…','now you see it…'] },
    charizard:{ expense:['embers wake…','scorching the ledger…','reduced to ash'],
                income:['the flame is fed…','fuel secured…','the fire grows'],
                transfer:['embers wake…','carrying the flame…','spreading the burn'] },
    squirtle:{ expense:['the tide turns…','washing it away…','swallowed by the deep'],
               income:['the current returns…','the well fills…','the tide brings plenty'],
               transfer:['the tide turns…','redirecting the current…','it flows elsewhere'] }
  };
  if (t.pokemon && POKE[theme]) {
    const p = POKE[theme][k];
    return { title:`${theme}:~$`, prompt:'&gt;', cmt:'//', ok:'',
      l1:p[0], l2:p[1], headline:p[2], calm:false, cmtMemo:true,
      sprite: t.mascot ? `<img class="txn-term-spr" src="${t.mascot}" alt="">` : '' };
  }

  const TERM = {
    vscode:    { title:'budget.py',           prompt:'&gt;&gt;&gt;', cmt:'#',  lang:'py' },
    powershell:{ title:'PS budgetdawgs&gt;',  prompt:'PS&gt;',        cmt:'#',  lang:'ps' },
    cmd:       { title:'C:\\budgetdawgs&gt;', prompt:'&gt;',          cmt:'::', lang:'cmd'},
    kali:      { title:'┌──(kali㉿dawgs)',    prompt:'$',            cmt:'#',  lang:'bash'},
    mintlinux: { title:'dawgs@mint:~$',       prompt:'$',            cmt:'#',  lang:'bash'},
    ubuntu:    { title:'dawgs@ubuntu:~$',     prompt:'$',            cmt:'#',  lang:'bash'}
  };
  if (TERM[theme]) {
    const c = TERM[theme]; let l1, l2;
    if (c.lang === 'py')       { l1=`<span class="txn-kw">auth</span>.session()`; l2=`<span class="txn-kw">ledger</span>.post(<span class="txn-str">"${k}"</span>)`; }
    else if (c.lang === 'ps')  { const v = isExpense?'New-Expense':isTransfer?'Move-Funds':'Add-Income'; l1=`<span class="txn-kw">$s</span> = Connect-Budget`; l2=`<span class="txn-kw">${v}</span> -Amount`; }
    else if (c.lang === 'cmd') { l1=`auth.exe /session`; l2=`post <span class="txn-kw">${k.toUpperCase()}</span>`; }
    else                       { l1=`./auth <span class="txn-kw">--session</span>`; l2=`budget post <span class="txn-kw">--${k}</span>`; }
    const hl = isExpense ? 'posted to ledger' : isTransfer ? 'moved between accounts' : 'funds received';
    return { title:c.title, prompt:c.prompt, cmt:c.cmt, ok:' <span class="txn-ok">ok</span>',
      l1, l2, headline:hl, calm:false, cmtMemo:true, sprite:'' };
  }

  // Default DAWG (and any other theme) — original behavior
  const verb = isTransfer ? 'transfer' : isPaycheck ? 'deposit' : isExpense ? 'expense' : 'income';
  return { title:'budgetdawgs:~$', prompt:'&gt;', cmt:'//', ok:' <span class="txn-ok">ok</span>',
    l1:'auth session…', l2:`posting ${verb}…`, headline:null, calm:false, cmtMemo:false, sprite:'' };
}

function _showTxnAnim(type, amount, desc) {
  document.getElementById('txn-anim')?.remove();

  const isExpense  = type === 'expense';
  const isTransfer = type === 'transfer';
  const isPaycheck = !isExpense && !isTransfer && /paycheck|pay.?check|direct.?deposit|payday|salary|wages|payroll/i.test(desc || '');
  const variant    = isPaycheck ? 'paycheck' : type;

  const msgs     = isTransfer ? _TRANSFER_MSGS : isPaycheck ? _PAYCHECK_MSGS : (isExpense ? _EXPENSE_MSGS : _INCOME_MSGS);
  const amtStr   = isTransfer ? fmt(amount) : `${isExpense ? '−' : '+'}${fmt(amount)}`;

  // ── Terminal Boot: a mini command log types itself out, then the amount ──
  const accent = isExpense ? 'var(--danger)' : isTransfer ? 'var(--accent)' : isPaycheck ? '#ffd60a' : 'var(--success)';
  const fl       = _txnFlavor(isExpense, isTransfer, isPaycheck);
  const headline = fl.headline || msgs[Math.floor(Math.random() * msgs.length)];
  const memo     = (desc && desc !== '—') ? _escHtml(desc) : '';

  // line delays (seconds) — memo line is optional, so timings shift when absent
  const dMemo = memo ? '0.78s' : null;
  const dBig  = memo ? '1.12s' : '0.78s';
  const dMsg  = memo ? '1.46s' : '1.12s';

  const memoLine = memo
    ? (fl.cmtMemo
        ? `<div class="txn-tline" style="--d:${dMemo}"><span class="txn-cmt">${fl.cmt} ${memo}</span></div>`
        : `<div class="txn-tline" style="--d:${dMemo}">&gt; memo: ${memo}</div>`)
    : '';

  const el = document.createElement('div');
  el.id        = 'txn-anim';
  el.className = `txn-anim txn-anim--${variant}`;
  el.style.setProperty('--txn-accent', accent);
  el.innerHTML = `
    <div class="txn-anim-card txn-term">
      <div class="txn-term-bar">
        <span class="txn-term-dot"></span><span class="txn-term-dot"></span><span class="txn-term-dot"></span>
        <span class="txn-term-title">${fl.title}</span>${fl.sprite}
      </div>
      <div class="txn-term-body">
        <div class="txn-tline" style="--d:.06s">${fl.prompt} ${fl.l1}${fl.ok}</div>
        <div class="txn-tline" style="--d:.42s">${fl.prompt} ${fl.l2}${fl.ok}</div>
        ${memoLine}
        <div class="txn-tbig${fl.calm ? ' txn-tbig--calm' : ''}" style="--d:${dBig}"><span class="txn-tamt">${amtStr}</span><span class="txn-tcur">▋</span></div>
        <div class="txn-tline txn-tmsg" style="--d:${dMsg}">${fl.cmt} ${_escHtml(headline)}</div>
      </div>
      <div class="txn-anim-progress"><div class="txn-anim-progress-bar"></div></div>
    </div>`;

  document.body.appendChild(el);

  const dur = isPaycheck ? 3600 : 2700;
  requestAnimationFrame(() => {
    const bar = el.querySelector('.txn-anim-progress-bar');
    if (bar) { bar.style.transition = `width ${dur}ms linear`; bar.style.width = '0%'; }
  });

  const timer = setTimeout(() => _dismissTxnAnim(el), dur);
  el.addEventListener('click', () => { clearTimeout(timer); _dismissTxnAnim(el); }, { once: true });
}

function _dismissTxnAnim(el) {
  if (!el?.isConnected) return;
  el.classList.add('txn-anim--out');
  setTimeout(() => el?.remove(), 380);
}

let _paychecksRunning = false;
async function _checkPaychecks() {
  // Fires on every window focus — bail if a prior run is still awaiting, or two
  // concurrent runs read the same un-persisted schedule and post duplicate paychecks.
  if (_paychecksRunning) return;
  _paychecksRunning = true;
  try {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = localDateStr(today);
  let changed = false;
  for (const acct of state.accounts) {
    const ps = acct.paySchedule;
    if (!ps?.enabled || !ps.amount || !ps.nextPayDate) continue;
    // Process all missed pay dates up to and including today. Guard caps catch-up at
    // 600 periods so a stale/garbled nextPayDate (e.g. an old backup) can't flood the ledger.
    let guard = 0;
    while (ps.nextPayDate <= todayStr && ps.lastAutoAdded !== ps.nextPayDate && guard++ < 600) {
      const payDate = ps.nextPayDate; // capture before advancing
      const prevId = currentAccountId;
      // Post net paycheck to the source account
      currentAccountId = acct.id;
      _loadAccountData(acct.id);
      await api.addTransaction({
        type: 'income', amount: ps.amount,
        description: ps.description || 'Paycheck',
        category: 'Income', date: payDate, account: acct.id,
      });
      currentAccountId = prevId;
      _loadAccountData(prevId);
      // Auto-contribute to linked retirement accounts
      const linkedRetire = state.accounts.filter(ra =>
        RETIRE_TYPES.includes(ra.type) && ra.linkedPaycheckAcctId === acct.id
      );
      for (const retAcct of linkedRetire) {
        const gross     = ps.grossAmount || 0;
        const empAmt    = +((gross * (retAcct.myContribPct    || 0) / 100) + (retAcct.myContribAmt    || 0)).toFixed(2);
        const matchAmt  = +((gross * (retAcct.employerMatchPct || 0) / 100) + (retAcct.employerMatchAmt || 0)).toFixed(2);
        const savedId2  = currentAccountId;
        currentAccountId = retAcct.id;
        _loadAccountData(retAcct.id);
        if (empAmt > 0) {
          await api.addTransaction({
            type: 'income', amount: empAmt,
            description: `${ps.description || 'Paycheck'} — My Contribution`,
            category: 'Income', date: payDate, account: retAcct.id,
          });
        }
        if (matchAmt > 0) {
          await api.addTransaction({
            type: 'income', amount: matchAmt,
            description: `${ps.description || 'Paycheck'} — Employer Match`,
            category: 'Income', date: payDate, account: retAcct.id,
          });
        }
        currentAccountId = savedId2;
        _loadAccountData(savedId2);
      }
      ps.lastAutoAdded = payDate;
      ps.nextPayDate   = _nextPayDate(payDate, ps.frequency);
      changed = true;
      if (acct.id === currentAccountId) _showPaycheckToast(ps.amount, ps.nextPayDate);
    }
  }
  if (changed) { await api.saveAccounts(state.accounts); render(); }
  } finally {
    _paychecksRunning = false;
  }
}

// Auto-posts standalone retirement contributions on each scheduled date (incl. missed ones).
async function _checkContributions() {
  const todayStr = today();
  let changed = false;
  for (const acct of state.accounts) {
    if (!RETIRE_TYPES.includes(acct.type)) continue;
    const cs = acct.contribSchedule;
    if (!cs?.enabled || !cs.amount || !cs.nextDate) continue;
    let guard = 0;
    while (cs.nextDate <= todayStr && cs.lastAutoAdded !== cs.nextDate && guard++ < 600) {
      const d = cs.nextDate;
      _postTxnToAccount(acct.id, {
        type: 'income', amount: cs.amount, description: 'Scheduled contribution',
        category: 'Income', date: d, account: acct.id,
      });
      cs.lastAutoAdded = d;
      cs.nextDate = _nextPayDate(d, cs.frequency);
      changed = true;
    }
  }
  if (changed) { await api.saveAccounts(state.accounts); render(); }
}

// ── Add Contribution modal ─────────────────────────────────────────────────
function showAddContribModal(acctId) {
  const acct    = state.accounts.find(a => a.id === acctId);
  const typeName = (RETIRE_LIMITS[acct?.type] || {}).label || 'Retirement';
  const todayStr = today();
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;padding:0';
  ov.innerHTML = `
    <div style="background:var(--card);border:1.5px solid var(--border);border-radius:22px 22px 0 0;padding:24px 20px 36px;width:100%;max-width:480px;box-shadow:0 -8px 40px rgba(0,0,0,.6)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
        <span style="font-size:1rem;font-weight:800;color:var(--text)">Add Contribution</span>
        <button id="_ac-close" style="background:none;border:none;color:var(--muted);font-size:1.4rem;cursor:pointer;line-height:1;padding:0 2px">&times;</button>
      </div>
      <p style="font-size:.78rem;color:var(--muted);margin:0 0 16px">${acct?.name} · ${typeName}</p>
      <div style="margin-bottom:12px">
        <label style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);display:block;margin-bottom:5px">Amount</label>
        <div style="position:relative">
          <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:.9rem">$</span>
          <input id="_ac-amount" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0.00"
            style="width:100%;box-sizing:border-box;padding:11px 12px 11px 26px;background:var(--surface2);border:1.5px solid var(--border);border-radius:11px;color:var(--text);font-size:1rem;font-weight:700;font-family:var(--font-body);outline:none">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div>
          <label style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);display:block;margin-bottom:5px">Date</label>
          <input id="_ac-date" type="date" value="${todayStr}"
            style="width:100%;box-sizing:border-box;padding:11px 10px;background:var(--surface2);border:1.5px solid var(--border);border-radius:11px;color:var(--text);font-size:.88rem;font-family:var(--font-body);outline:none">
        </div>
        <div>
          <label style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);display:block;margin-bottom:5px">Type</label>
          <select id="_ac-type"
            style="width:100%;box-sizing:border-box;padding:11px 10px;background:var(--surface2);border:1.5px solid var(--border);border-radius:11px;color:var(--text);font-size:.88rem;font-family:var(--font-body);outline:none;cursor:pointer">
            <option value="contribution">My Contribution</option>
            <option value="match">Employer Match</option>
            <option value="rollover">Rollover</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div style="margin-bottom:20px">
        <label style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);display:block;margin-bottom:5px">Note <span style="font-weight:400">(optional)</span></label>
        <input id="_ac-note" type="text" placeholder="e.g. Bi-weekly contribution"
          style="width:100%;box-sizing:border-box;padding:11px 12px;background:var(--surface2);border:1.5px solid var(--border);border-radius:11px;color:var(--text);font-size:.88rem;font-family:var(--font-body);outline:none">
      </div>
      <button id="_ac-save" style="width:100%;padding:14px;background:var(--accent);color:var(--bg);border:none;border-radius:13px;font-size:.95rem;font-weight:800;cursor:pointer;font-family:var(--font-body)">Add Contribution</button>
      <div id="_ac-err" style="color:var(--danger);font-size:.78rem;text-align:center;margin-top:8px;display:none"></div>
    </div>`;
  document.body.appendChild(ov);
  const amtEl  = ov.querySelector('#_ac-amount');
  const dateEl = ov.querySelector('#_ac-date');
  const typeEl = ov.querySelector('#_ac-type');
  const noteEl = ov.querySelector('#_ac-note');
  const errEl  = ov.querySelector('#_ac-err');
  const saveBtn = ov.querySelector('#_ac-save');
  setTimeout(() => amtEl.focus(), 80);
  ov.querySelector('#_ac-close').addEventListener('click', () => ov.remove());
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  saveBtn.addEventListener('click', async () => {
    const amount = parseFloat(amtEl.value);
    if (!amount || amount <= 0) {
      errEl.textContent = 'Please enter a valid amount.';
      errEl.style.display = '';
      return;
    }
    const typeLabels = { contribution: 'My Contribution', match: 'Employer Match', rollover: 'Rollover', other: 'Contribution' };
    const desc = noteEl.value.trim() || typeLabels[typeEl.value] || 'Contribution';
    const savedId = currentAccountId;
    currentAccountId = acctId;
    _loadAccountData(acctId);
    await api.addTransaction({ type: 'income', amount, description: desc, category: 'Income', date: dateEl.value, account: acctId });
    currentAccountId = savedId;
    _loadAccountData(savedId);
    ov.remove();
    render();
  });
}

// ── utilities ──────────────────────────────────────────────────────────────
function _debounce(fn, ms = 250) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
// Visually boost bar fill — makes small values look less empty while 100% stays 100%.
// x^0.6 curve: 10%→25%, 20%→38%, 30%→49%, 50%→66%, 75%→83%, 100%→100%
function _boostBar(pct) {
  if (pct <= 0) return 0;
  return +(Math.pow(Math.min(pct, 100) / 100, 0.6) * 100).toFixed(1);
}

async function _hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('dawg:' + pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel } = {}) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  ov.innerHTML = `<div style="background:var(--card);border:1.5px solid var(--border);border-radius:18px;padding:24px 20px;max-width:320px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.6)">
    ${title ? `<div style="font-size:1rem;font-weight:800;color:var(--text);margin-bottom:8px">${title}</div>` : ''}
    <p style="font-size:.87rem;color:var(--muted);margin:0 0 20px;line-height:1.55">${message}</p>
    <div style="display:flex;gap:10px">
      <button id="_mc-cancel" style="flex:1;padding:10px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body)">${cancelText}</button>
      <button id="_mc-confirm" style="flex:1;padding:10px;border:none;border-radius:10px;background:${danger?'var(--danger)':'var(--accent)'};color:${danger?'#fff':'var(--bg)'};font-size:.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body)">${confirmText}</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  const close = (cb) => { ov.remove(); cb?.(); };
  ov.querySelector('#_mc-confirm').addEventListener('click', () => close(onConfirm));
  ov.querySelector('#_mc-cancel').addEventListener('click',  () => close(onCancel));
  ov.addEventListener('click', e => { if (e.target === ov) close(onCancel); });
}

// Promise-based confirm (resolves true on confirm, false on cancel/dismiss).
function confirmAsync(opts) {
  return new Promise(res => showConfirmModal({ ...opts, onConfirm: () => res(true), onCancel: () => res(false) }));
}

function showPinSetupModal(onSuccess) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  ov.innerHTML = `<div style="background:var(--card);border:1.5px solid var(--border);border-radius:18px;padding:24px 20px;max-width:300px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.6)">
    <div style="font-size:1rem;font-weight:800;color:var(--text);margin-bottom:16px">Set PIN</div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <input id="_pin-in1" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN"
        style="padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:1.1rem;font-family:var(--font-body);letter-spacing:.3em;text-align:center;outline:none;width:100%;box-sizing:border-box">
      <input id="_pin-in2" type="password" inputmode="numeric" maxlength="4" placeholder="Confirm PIN"
        style="padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:1.1rem;font-family:var(--font-body);letter-spacing:.3em;text-align:center;outline:none;width:100%;box-sizing:border-box">
      <div id="_pin-err" style="font-size:.8rem;color:var(--danger);min-height:18px;text-align:center"></div>
      <div style="display:flex;gap:10px">
        <button id="_pin-cancel" style="flex:1;padding:10px;border:1.5px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body)">Cancel</button>
        <button id="_pin-save" style="flex:1;padding:10px;border:none;border-radius:10px;background:var(--accent);color:var(--bg);font-size:.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body)">Save PIN</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(ov);
  ov.querySelector('#_pin-cancel').addEventListener('click', () => ov.remove());
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.querySelector('#_pin-save').addEventListener('click', async () => {
    const p1 = ov.querySelector('#_pin-in1').value;
    const p2 = ov.querySelector('#_pin-in2').value;
    const err = ov.querySelector('#_pin-err');
    if (!/^\d{4}$/.test(p1)) { err.textContent = 'PIN must be exactly 4 digits.'; return; }
    if (p1 !== p2) { err.textContent = 'PINs do not match.'; return; }
    const hash = await _hashPin(p1);
    localStorage.setItem('slawminyaw_pin', hash);
    ov.remove();
    onSuccess?.();
  });
}

function _showSaveError() {
  // Show a non-blocking toast if a localStorage save fails
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:10002;background:var(--danger);color:#fff;padding:10px 18px;border-radius:10px;font-size:.85rem;font-weight:700;pointer-events:none;text-align:center';
  el.textContent = '⚠ Save failed — storage may be full';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── spending alert ─────────────────────────────────────────────────────────
function showAlert(msg) {
  const el = document.createElement('div');
  el.className = 'alert-toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = msg;
  const existingToasts = document.querySelectorAll('.roast-toast, .alert-toast');
  const offset = existingToasts.length * 60;
  el.style.top = `calc(var(--topbar-h, 56px) + var(--safe-top, 0px) + 12px + ${offset}px)`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-dismiss');
    setTimeout(() => el.remove(), 260);
  }, 4500 - 260);
}

function checkSpendingAlert(category) {
  const m = localMonthKey();
  const spent = state.transactions
    .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(m))
    .reduce((s, t) => s + t.amount, 0);
  const limit = parseFloat(state.budgets[category] || 0);
  if (!limit) return;
  const pct = spent / limit;
  if (pct >= 1) {
    showAlert(`🚨 Over budget! ${category}: ${fmt(spent)} / ${fmt(limit)}`);
  } else if (pct >= 0.8) {
    showAlert(`⚠️ ${category} at ${Math.round(pct * 100)}% of budget (${fmt(spent)} / ${fmt(limit)})`);
  }
}

// ── state + localStorage ───────────────────────────────────────────────────
let state = { transactions: [], weekly_plan: {}, budgets: {}, bills: [], goals: [], challenges: [], accounts: [], startingBalance: 0 };
let lastCalcPerWeek = 0;
let lastCalcPerDay  = 0;
let _wkCalcTimer    = null;
let dashChartMode = 'bar';
let currentAccountId = 'main';
const STORAGE_KEY  = 'slawminyaw';
const SETTINGS_KEY = 'slawminyaw_settings';
const ACCOUNTS_KEY = 'slawminyaw_accounts';
const NOTES_KEY = 'slawminyaw_notes';
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); } catch { return []; }
}
function saveNotes(notes) {
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch(e) { console.warn('Budget DAWGs: notes save failed', e); }
}
function accountDataKey(id) { return 'slawminyaw_data_' + id; }

// Settings are read on every render and every tab swipe, so the JSON.parse adds
// up. Cache the parsed object and hand back a shallow copy (cheap, and avoids
// callers aliasing the cache). saveSettings refreshes the cache.
let _settingsCache = null;
function loadSettings() {
  if (!_settingsCache) {
    try { _settingsCache = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { _settingsCache = {}; }
  }
  return { ..._settingsCache };
}
function saveSettings(s) {
  _settingsCache = s;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch(e) { console.warn('Budget DAWGs: settings save failed', e); }
}
function defaultAccounts() { return [{ id: 'main', name: 'Main', type: 'checking' }]; }

// ── Spending-breakdown category visibility ───────────────────────────────────
// Categories the user has toggled off are hidden from the breakdown lists
// (dashboard card + Insights range summary). Totals and percentages still
// include them — this only hides the row. Persisted in settings so the choice
// sticks and is shared across both views.
function getHiddenCats() {
  const h = loadSettings().hiddenBreakdownCats;
  return Array.isArray(h) ? h : [];
}
function isCatHidden(cat) { return getHiddenCats().includes(cat); }
function toggleHiddenCat(cat) {
  const s = loadSettings();
  const h = Array.isArray(s.hiddenBreakdownCats) ? s.hiddenBreakdownCats.slice() : [];
  const i = h.indexOf(cat);
  if (i >= 0) h.splice(i, 1); else h.push(cat);
  s.hiddenBreakdownCats = h;
  saveSettings(s);
}
// ── Average-spending exclusions ──────────────────────────────────────────────
// Separate from the breakdown's hiddenBreakdownCats: these categories (and,
// optionally, bill payments) are left OUT of the Insights "Average spending"
// figures so the average reflects only the discretionary spending you care about.
function getAvgExcludedCats() {
  const h = loadSettings().avgExcludeCats;
  return Array.isArray(h) ? h : [];
}
function isAvgCatExcluded(cat) { return getAvgExcludedCats().includes(cat); }
function toggleAvgExcludedCat(cat) {
  const s = loadSettings();
  const h = Array.isArray(s.avgExcludeCats) ? s.avgExcludeCats.slice() : [];
  const i = h.indexOf(cat);
  if (i >= 0) h.splice(i, 1); else h.push(cat);
  s.avgExcludeCats = h;
  saveSettings(s);
}
function getAvgExcludeBills() { return !!loadSettings().avgExcludeBills; }
function toggleAvgExcludeBills() {
  const s = loadSettings();
  s.avgExcludeBills = !s.avgExcludeBills;
  saveSettings(s);
}

// Toggle-chip row listing every category present (shown + hidden). Off chips are
// dimmed. `cats` is [{name, color}]. Caller wires clicks on `.cat-toggle`.
function _catToggleChipsHTML(cats) {
  if (!cats || !cats.length) return '';
  return `<div class="cat-toggle-row">${cats.map(c => {
    const off = isCatHidden(c.name);
    return `<button type="button" class="cat-toggle${off ? ' cat-toggle-off' : ''}" data-cat="${_escHtml(c.name)}" aria-pressed="${off ? 'false' : 'true'}" title="${off ? 'Show' : 'Hide'} ${_escHtml(c.name)}">
      <span class="cat-dot" style="background:${c.color}"></span>${_escHtml(c.name)}</button>`;
  }).join('')}</div>`;
}

// Credit cards and loans are debt — you pay these down, you don't budget weekly spending
// against them, so the Weekly Planner is hidden for them.
function _isDebtAcct(a) { return !!a && (a.type === 'credit' || a.type === 'loan'); }
function _currentAcct() { return state.accounts.find(a => a.id === currentAccountId); }

// Simple (Tracker) mode hides the budgeting features for users who only want
// to track balance + transactions. 'full' is the default for existing users.
function isSimpleMode() { return loadSettings().appMode === 'simple'; }

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', required: true,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>` },
  { key: 'add',       label: 'Add',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>` },
  { key: 'ledger',    label: 'Ledger',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>` },
  { key: 'weekly',    label: 'Weekly',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>` },
  { key: 'bills',     label: 'Bills',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><path d="M12 10v7M14.5 11.5a2.5 2.5 0 0 0-5 0c0 1.5 1.1 2.2 2.5 2.7s2.5 1.2 2.5 2.7a2.5 2.5 0 0 1-5 0"/></svg>` },
  { key: 'debt',      label: 'Debt',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="6" width="20" height="14" rx="2"/><line x1="2" y1="11" x2="22" y2="11"/><line x1="6" y1="15" x2="9" y2="15"/></svg>` },
  { key: 'goals',     label: 'Goals',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>` },
  { key: 'import',    label: 'Import',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v13"/><polyline points="7,12 12,17 17,12"/><path d="M3 19h18"/></svg>` },
  { key: 'budgets',   label: 'Budgets',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="5" y1="20" x2="5" y2="9"/><line x1="12" y1="20" x2="12" y2="3"/><line x1="19" y1="20" x2="19" y2="13"/></svg>` },
  { key: 'notes',     label: 'Notes',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>` },
  { key: 'settings',  label: 'Settings',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>` },
  { key: 'about',     label: 'About',     required: true,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="17"/><circle cx="12" cy="7.5" r=".6" fill="currentColor" stroke="none"/></svg>` },
];

const DEFAULT_NAV_LAYOUT = ['add', 'ledger', 'weekly', 'settings'];

function loadNavLayout() {
  const s = loadSettings();
  if (s.navLayout && Array.isArray(s.navLayout) && s.navLayout.length >= 1) {
    const allKeys = NAV_ITEMS.filter(n => !n.required).map(n => n.key);
    const valid = s.navLayout.filter(k => allKeys.includes(k));
    if (valid.length >= 1) {
      const padded = [...valid];
      for (const def of DEFAULT_NAV_LAYOUT) {
        if (padded.length >= 4) break;
        if (!padded.includes(def)) padded.push(def);
      }
      return padded.slice(0, 4);
    }
  }
  return [...DEFAULT_NAV_LAYOUT];
}
function saveNavLayout(layout) {
  const s = loadSettings(); s.navLayout = layout.slice(0, 4); saveSettings(s);
}

function applySettings() {
  const s = loadSettings();
  applyNavPosition(s.navPosition || 'bottom');
  applyNavItems(s.hiddenTabs || []);
  applyTheme(s.theme || 'dark');
  applyFontStyle(s.fontStyle || 'default');
  // "Reduce motion & effects" — freezes the infinite idle glitch loops to save
  // battery and calm the UI. CSS handles the rest via body.fx-reduced.
  document.body.classList.toggle('fx-reduced', !!s.reduceFx);
  // Privacy: blur all money amounts if the user left "hide balances" on.
  _applyAmountsHidden();
}


function applyFontStyle(style) {
  const map = {
    default:    "'Plus Jakarta Sans', sans-serif",
    system:     "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    terminal:   "'Consolas', 'Menlo', 'Monaco', 'Courier New', monospace",
    // Theme-specific authentic fonts
    vscode:     "'Consolas', 'Menlo', 'Monaco', 'Courier New', monospace",
    powershell: "'Cascadia Code', 'Cascadia Mono', 'Consolas', 'Courier New', monospace",
    cmd:        "'Lucida Console', 'Consolas', 'Courier New', monospace",
    kali:       "'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace",
    ubuntu:     "'Ubuntu Mono', 'Consolas', 'Courier New', monospace",
  };
  // Lazy-load Cascadia Code only when the PowerShell theme is active
  if (style === 'powershell' && !document.getElementById('font-cascadia')) {
    const l = document.createElement('link');
    l.id   = 'font-cascadia'; l.rel = 'stylesheet';
    l.href = 'https://cdn.jsdelivr.net/npm/@fontsource/cascadia-code@4.2.1/index.css';
    document.head.appendChild(l);
  }
  document.documentElement.style.setProperty('--font-body', map[style] || map.default);
}

function applyNavPosition(pos) {
  const app = document.getElementById('app');
  app.classList.remove('nav-top', 'nav-bottom', 'nav-left', 'nav-right');
  app.classList.add('nav-' + pos);

  const isSide      = pos === 'left' || pos === 'right';
  const nav         = document.querySelector('.bottom-nav');
  const headerRight = document.querySelector('.header-right');
  const soundsBtn   = document.getElementById('sounds-toggle');
  const homeBtn     = document.getElementById('acct-home-btn');

  if (isSide && nav) {
    // Brand mark — doberman image
    if (!nav.querySelector('.nav-side-brand')) {
      const brand = document.createElement('div');
      brand.className = 'nav-side-brand';
      const img = document.createElement('img');
      img.src = mascotSrc();
      img.alt = 'Budget DAWGs';
      img.className = 'nav-side-dob';
      brand.appendChild(img);
      nav.insertBefore(brand, nav.firstChild);
    }
    // Footer — accounts (home) button + sounds
    if (!nav.querySelector('.nav-side-footer')) {
      const footer = document.createElement('div');
      footer.className = 'nav-side-footer';
      if (homeBtn)   footer.appendChild(homeBtn);
      if (soundsBtn) footer.appendChild(soundsBtn);
      nav.appendChild(footer);
    }
  } else {
    // Remove sidebar chrome
    nav?.querySelector('.nav-side-brand')?.remove();
    const footer = nav?.querySelector('.nav-side-footer');
    if (footer) {
      // Restore sounds + home btn to header-right
      if (headerRight) {
        if (homeBtn)   headerRight.insertBefore(homeBtn, headerRight.firstChild);
        if (soundsBtn) headerRight.appendChild(soundsBtn);
      }
      footer.remove();
    }
  }
}

function applyNavItems(hiddenTabs) {
  NAV_ITEMS.forEach(item => {
    const btn = document.querySelector(`.nav-btn[data-tab="${item.key}"]`);
    if (btn) btn.style.display = hiddenTabs.includes(item.key) ? 'none' : '';
  });
}

// Current mascot image — Pokémon sprite for Pokémon themes, else the Doberman
function mascotSrc() {
  const t = THEMES[loadSettings().theme];
  return (t && t.mascot) ? t.mascot : './doberman.png';
}
// Dashboard hero tagline — themed for Pokémon, else the DAWG "LOCK TF IN." glitch tagline
function heroTaglineHTML() {
  const t = THEMES[loadSettings().theme];
  if (t && (t.pokemon || t.team) && t.tagline) return `<div class="dawg-hero-tagline">${t.tagline}</div>`;
  return `<div class="dawg-hero-tagline">YOUR DAWG<br>IS WATCHING.<br><em class="dawg-lockin" data-glitch="LOCK TF IN.">LOCK TF IN.</em></div>`;
}
// Dashboard hero mascot — the Gengar theme shows the full ghost line (Haunter · Gengar ·
// Gastly). Gengar (center) is the vibrant Gen-4 sprite; the animated Gen-5 flankers keep
// the group in motion. Every other theme keeps the single mascot + bark pair untouched.
function heroMascotHTML() {
  if (loadSettings().theme === 'gengar') {
    return `<div class="dawg-hero-dob gengar-trio">
        <img src="./poke-haunter.gif" class="gtrio-side gtrio-l" alt="">
        <img src="./poke-gengar.gif"  class="gtrio-mid" alt="">
        <img src="./poke-gastly.gif"  class="gtrio-side gtrio-r" alt="">
      </div>`;
  }
  return `<div class="dawg-hero-dob">
          <img src="${mascotSrc()}" class="dawg-dob-idle" alt="">
          <img src="./maddawg.png"  class="dawg-dob-bark" alt="">
        </div>`;
}

// Eerie ambient overlay for Pokémon themes (vignette + per-mon particles). Removed for all other themes.
function _applyThemeFx(theme) {
  document.getElementById('poke-fx')?.remove();
  const t = THEMES[theme] || {};
  if (!t.pokemon) return;
  const fx = document.createElement('div');
  fx.id = 'poke-fx';
  fx.setAttribute('aria-hidden', 'true');
  let inner = '<div class="pf-vig"></div>';
  const rnd = (a, b) => a + Math.random() * (b - a);
  if (theme === 'charizard' || theme === 'squirtle') {
    const cls = theme === 'charizard' ? 'pf-ember' : 'pf-bubble';
    for (let i = 0; i < 9; i++) {
      const left  = rnd(4, 94).toFixed(1);
      const dur   = rnd(5, 9).toFixed(1);
      const delay = rnd(0, dur).toFixed(1);           // negative → already mid-flight, desynced
      const dx    = Math.round(rnd(-26, 26));
      const sz    = (theme === 'charizard' ? rnd(3, 6) : rnd(5, 11)).toFixed(1);
      inner += `<i class="${cls}" style="left:${left}%;width:${sz}px;height:${sz}px;--dx:${dx}px;animation-duration:${dur}s;animation-delay:-${delay}s"></i>`;
    }
  }
  fx.innerHTML = inner;
  document.body.appendChild(fx);
}

function applyTheme(theme) {
  if (theme === 'auto') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  const t = THEMES[theme] || THEMES.dark || THEMES[Object.keys(THEMES)[0]];
  const root = document.documentElement;
  root.style.setProperty('--bg',       t.bg);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
  root.style.setProperty('--surface',  t.surface);
  root.style.setProperty('--surface2', t.surface2);
  root.style.setProperty('--card',     t.card);
  root.style.setProperty('--accent',   t.accent);
  root.style.setProperty('--accent2',  t.accent2);
  root.style.setProperty('--accent-gradient', t.grad || `linear-gradient(135deg, ${t.accent} 0%, ${t.accent2} 100%)`);
  root.style.setProperty('--success',  t.success);
  root.style.setProperty('--warn',     t.warn);
  root.style.setProperty('--danger',   t.danger);
  root.style.setProperty('--text',     t.text);
  root.style.setProperty('--muted',    t.muted);
  root.style.setProperty('--border',   t.border);
  // RGB-split glitch colors — theme-specific, fall back to the classic red/cyan
  root.style.setProperty('--gl-1', t.gl1 || 'rgba(255,48,48,.9)');
  root.style.setProperty('--gl-2', t.gl2 || 'rgba(0,216,255,.9)');
  document.body.classList.toggle('light', !!t.light);
  document.body.classList.toggle('theme-lux', theme === 'lux');  // luxury flourishes (gold micro-accents)
  // Terminal theme body classes — used for code-syntax styled titles in CSS
  document.body.classList.remove('theme-vscode', 'theme-powershell', 'theme-cmd', 'theme-kali', 'theme-mintlinux', 'theme-ubuntu');
  if (['vscode', 'powershell', 'cmd', 'kali', 'mintlinux', 'ubuntu'].includes(theme)) {
    document.body.classList.add('theme-' + theme);
  }
  // Pokémon themes — body.theme-pokemon gates off the Doberman/glitch identity (see CSS)
  document.body.classList.remove('theme-pokemon','theme-team','theme-gengar','theme-charizard','theme-squirtle','theme-bears','theme-dodgers','theme-knights','theme-celtics');
  if (t.pokemon) document.body.classList.add('theme-pokemon', 'theme-' + theme);
  if (t.team)    document.body.classList.add('theme-team', 'theme-' + theme);
  _applyThemeFx(theme);
  // Swap mascot + splash tagline on the persistent (non-re-rendered) elements
  const _mascot = t.mascot || './doberman.png';
  document.querySelectorAll('.splash-dob-idle, .brand-dob, .dawg-nav-dob, .nav-side-dob').forEach(img => { img.src = _mascot; });
  const _splashTag = document.querySelector('.splash-tagline');
  if (_splashTag) _splashTag.textContent = t.splashTagline || 'Money on a leash.';
  // Custom / Customlight themes: apply the saved custom accent color
  if (theme === 'custom' || theme === 'customlight') {
    const _cc = loadSettings().customAccent;
    if (_cc) {
      root.style.setProperty('--accent',          _cc);
      root.style.setProperty('--accent2',         _cc);
      root.style.setProperty('--success',         _cc);
      root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${t.surface2} 0%, ${_cc} 100%)`);
    }
  }
  // Update category colors to match theme
  if (t.cats) Object.assign(CAT_COLORS, t.cats);
  // Auto-apply bundled font for terminal-style themes
  if (t.font) {
    applyFontStyle(t.font);
    const _fs = loadSettings();
    _fs.fontStyle = t.font;
    saveSettings(_fs);
  }
  // All themes use the DAWG layout — always enable dawg-mode
  document.getElementById('app')?.classList.add('dawg-mode');
}

function _save() {
  _calcVer++;  // invalidate totals/monthTotals memos
  try {
    localStorage.setItem(accountDataKey(currentAccountId), JSON.stringify({
      transactions:    state.transactions,
      weekly_plan:     state.weekly_plan,
      budgets:         state.budgets,
      bills:           state.bills,
      goals:           state.goals,
      challenges:      state.challenges,
      startingBalance: state.startingBalance,
    }));
  } catch(e) { _showSaveError(); }
}
function _saveAccounts() {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state.accounts));
  } catch(e) { _showSaveError(); }
}
function _loadAccountData(id) {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(accountDataKey(id)) || '{}'); } catch(e) { d = {}; }
  state.transactions    = d.transactions    || [];
  state.weekly_plan     = d.weekly_plan     || {};
  state.budgets         = d.budgets         || {};
  state.bills           = d.bills           || [];
  state.goals           = d.goals           || [];
  state.challenges      = d.challenges      || [];
  state.startingBalance = parseFloat(d.startingBalance) || 0;
}

const api = {
  async load() {
    const accStr = localStorage.getItem(ACCOUNTS_KEY);
    let parsedAccts = null;
    if (accStr) {
      try { parsedAccts = JSON.parse(accStr); }
      catch (e) { console.error('Corrupt accounts data — keeping a backup and resetting', e);
        try { localStorage.setItem(ACCOUNTS_KEY + '_corrupt_backup', accStr); } catch {} }
    }
    if (Array.isArray(parsedAccts) && parsedAccts.length) {
      state.accounts = parsedAccts;
    } else if (accStr && parsedAccts === null) {
      // Stored data was present but unparseable — fall back to defaults rather than bricking boot.
      state.accounts = defaultAccounts();
      _saveAccounts();
    } else {
      // Migrate from old single-key format
      let old = {};
      try { old = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { old = {}; }
      state.accounts = old.accounts || defaultAccounts();
      _saveAccounts();
      if (old.transactions !== undefined || old.budgets !== undefined) {
        localStorage.setItem(accountDataKey('main'), JSON.stringify({
          transactions: old.transactions || [],
          weekly_plan:  old.weekly_plan  || {},
          budgets:      old.budgets      || {},
          bills:        old.bills        || [],
          goals:        old.goals        || [],
        }));
      }
    }
    if (!state.accounts.length) state.accounts = defaultAccounts();
    if (!state.accounts.find(a => a.id === 'main')) {
      state.accounts.unshift({ id: 'main', name: 'Main', type: 'checking' });
      _saveAccounts();
    }
    _loadAccountData(currentAccountId);
  },
  async switchAccount(id, useSkeleton = false) {
    currentAccountId = id;
    _loadAccountData(id);
    _calcVer++; // new account's transactions — invalidate memos
    updateAccountSwitcher();
    currentTab = 'dashboard'; // always land on dashboard when switching accounts
    // Rebuild the bottom nav for this account (e.g. hide Weekly for debt accounts)
    renderDawgNav();
    // Sync nav active states — switchAccount bypasses showTab() so we do it here
    document.querySelectorAll('.nav-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === 'dashboard'));
    document.querySelectorAll('.dawg-nav-btn[data-tab]').forEach(b =>
      b.classList.toggle('dawg-nav-active', b.dataset.tab === 'dashboard'));
    // In-app switches show a brief shimmer so the new account's data feels loaded
    if (useSkeleton) {
      const _m = document.getElementById('main-content');
      if (_m) { _pageTransition = 'fade'; _m.innerHTML = _dawgSkeleton(); await new Promise(r => setTimeout(r, 260)); }
    }
    render();
  },
  async addAccount(name, type) {
    const id = 'acct_' + Date.now();
    state.accounts.push({ id, name, type });
    _saveAccounts();
    localStorage.setItem(accountDataKey(id), JSON.stringify({
      transactions: [], weekly_plan: {}, budgets: {}, bills: [], goals: []
    }));
    updateAccountSwitcher();
  },
  async deleteAccount(id) {
    if (id === 'main') return;
    state.accounts = state.accounts.filter(a => a.id !== id);
    localStorage.removeItem(accountDataKey(id));
    _saveAccounts();
    if (currentAccountId === id) {
      currentAccountId = 'main';
      _loadAccountData('main');
    }
    updateAccountSwitcher();
  },
  async renameAccount(id, name) {
    const acct = state.accounts.find(a => a.id === id);
    if (acct) { acct.name = name; _saveAccounts(); updateAccountSwitcher(); }
  },
  async addTransaction(t)          { state.transactions.push(t); _save(); },
  async deleteTransaction(idx)     { state.transactions.splice(idx, 1); _save(); },
  async patchTransaction(idx, upd) { Object.assign(state.transactions[idx], upd); _save(); },
  async saveWeeklyPlan(plan)       { state.weekly_plan = plan; _save(); },
  async saveBudgets(b)             { state.budgets = b; _save(); },
  async saveBills(bills)           { state.bills = bills; _save(); },
  async saveGoals(goals)           { state.goals = goals; _save(); },
  async saveChallenges(c)          { state.challenges = c; _save(); },
  async saveAccounts(accounts)     { state.accounts = accounts; _saveAccounts(); },
};

// ── recurring ──────────────────────────────────────────────────────────────
async function processRecurring() {
  const currentMonth = localMonthKey();
  const len = state.transactions.length;
  for (let i = 0; i < len; i++) {
    const t = state.transactions[i];
    if (t.recurring === true && t.recur_month !== currentMonth) {
      state.transactions.push({ ...t, date: currentMonth + '-01', recur_month: currentMonth });
      state.transactions[i] = { ...t, recur_month: currentMonth };
    }
  }
  // Monthly interest for credit/loan accounts (current account only)
  const acct = state.accounts.find(a => a.id === currentAccountId);
  if (acct && (acct.type === 'credit' || acct.type === 'loan') &&
      parseFloat(acct.interest_rate || 0) > 0 &&
      acct.last_interest_month !== currentMonth) {
    let ai = 0, ae = 0;
    for (const t of state.transactions) { if (t.type==='income') ai+=t.amount; else ae+=t.amount; }
    const bal = Math.max(0, (state.startingBalance || 0) + ae - ai);
    if (bal > 0) {
      const monthlyInterest = parseFloat((bal * parseFloat(acct.interest_rate) / 100 / 12).toFixed(2));
      if (monthlyInterest >= 0.01) {
        const interestId = `_interest_${currentMonth}_${acct.id}`;
        if (!state.transactions.find(t => t.id === interestId)) {
          state.transactions.push({
            id: interestId, type:'expense', amount: monthlyInterest,
            category:'Interest', description:`Interest charge (${acct.interest_rate}% APR)`,
            date: currentMonth + '-01', _auto: true,
          });
        }
      }
    }
    acct.last_interest_month = currentMonth;
    _saveAccounts();
  }
  _save();
}

// ── helpers ────────────────────────────────────────────────────────────────
// ── computation cache — invalidated on every _save() ────────────────────────
let _calcVer = 0;          // bumped by _save(); memos keyed on this
let _totalsCache = null;   // { ver, result }
const _monthCache = {};    // { [monthStr+ver]: result }
let _runBalCache = null;   // { ver, map } — memo for calcRunningBalances()
let _balAsOfCache = { ver: -1, m: {} };  // memo for balanceAsOf(), keyed by dateStr
let _netWorthCache = null; // { key, result } — memo for getNetWorth()

function totals() {
  if (_totalsCache && _totalsCache.ver === _calcVer) return _totalsCache.result;
  let income = 0, expense = 0;
  const bycat = {};
  for (const t of state.transactions) {
    if (t.type === 'income') { income += t.amount; }
    else { expense += t.amount; bycat[t.category] = (bycat[t.category] || 0) + t.amount; }
  }
  const result = { income, expense, bycat };
  _totalsCache = { ver: _calcVer, result };
  return result;
}

function monthTotals(monthStr) {
  const key = monthStr + '|' + _calcVer;
  if (_monthCache[key]) return _monthCache[key];
  let income = 0, expense = 0;
  const bycat = {};
  for (const t of state.transactions) {
    if (!t.date || !t.date.startsWith(monthStr)) continue;
    if (t.type === 'income') { income += t.amount; }
    else { expense += t.amount; bycat[t.category] = (bycat[t.category] || 0) + t.amount; }
  }
  const result = { income, expense, bycat };
  // Prune old keys (keep cache from growing unbounded across month browsing)
  const keys = Object.keys(_monthCache);
  if (keys.length > 12) delete _monthCache[keys[0]];
  _monthCache[key] = result;
  return result;
}

// Average actual spending (per day / week / month) over a trailing window of the
// current account's expense history. Rate-based: weekly and monthly are the daily
// average scaled, so the three numbers stay internally consistent. Counts the same
// non-income transactions as monthTotals() so it matches the "Expenses" figures.
function _spendingAverages(windowDays = 90) {
  const exCats  = getAvgExcludedCats();
  const exBills = getAvgExcludeBills();
  let earliest = null;
  const exps = [];
  for (const t of state.transactions) {
    if (t.type === 'income' || !t.date) continue;
    if (exBills && isBillTxn(t)) continue;               // user excluded bill payments
    if (exCats.includes(t.category)) continue;           // user excluded this category
    exps.push(t);
    if (!earliest || t.date < earliest) earliest = t.date;
  }
  if (!exps.length) return null;
  const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
  const firstD = new Date(earliest + 'T00:00:00');
  const spanDays = Math.max(1, Math.floor((todayD - firstD) / 86400000) + 1);
  const win = Math.min(windowDays, spanDays);          // don't divide by more days than we have
  const cutoff = new Date(todayD); cutoff.setDate(cutoff.getDate() - (win - 1));
  const cutoffStr = localDateStr(cutoff);
  const todayStr = today();
  let total = 0;
  for (const t of exps) {
    if (t.date >= cutoffStr && t.date <= todayStr) total += Number(t.amount) || 0;
  }
  const daily = total / win;
  return { daily, weekly: daily * 7, monthly: daily * 365.25 / 12, windowDays: win, total };
}

// True if the current account has any expense transaction at all (before exclusions).
function _hasAnyExpense() {
  return state.transactions.some(t => t.type !== 'income' && t.date);
}

// Chip row for the Average-spending card: a Bills toggle (if any bill payments
// exist) plus one chip per expense category. Dimmed = excluded from the average.
// Handler is wired in attachInsights on `.avg-cat-toggle`.
function _avgExclusionChipsHTML() {
  const set = new Map();
  for (const t of state.transactions) {
    if (t.type === 'income' || !t.date) continue;
    const c = t.category || 'Other';
    if (!set.has(c)) set.set(c, CAT_COLORS[c] || '#9896a4');
  }
  const cats = [...set.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const billsOff = getAvgExcludeBills();
  const anyBills = state.transactions.some(isBillTxn);
  const billChip = anyBills
    ? `<button type="button" class="cat-toggle avg-cat-toggle${billsOff ? ' cat-toggle-off' : ''}" data-avgbills="1" aria-pressed="${billsOff ? 'false' : 'true'}" title="${billsOff ? 'Include' : 'Exclude'} bill payments">🧾 Bills</button>`
    : '';
  const catChips = cats.map(([name, color]) => {
    const off = isAvgCatExcluded(name);
    return `<button type="button" class="cat-toggle avg-cat-toggle${off ? ' cat-toggle-off' : ''}" data-cat="${_escHtml(name)}" aria-pressed="${off ? 'false' : 'true'}" title="${off ? 'Include' : 'Exclude'} ${_escHtml(name)}"><span class="cat-dot" style="background:${color}"></span>${_escHtml(name)}</button>`;
  }).join('');
  if (!billChip && !catChips) return '';
  return `<div class="avg-exclude-wrap">
    <div class="avg-exclude-lbl">Tap to exclude from the average</div>
    <div class="cat-toggle-row">${billChip}${catChips}</div>
  </div>`;
}

// Cached formatter — ~8× faster than calling toLocaleString() with options each time
const _usd = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function fmt(n) { return '$' + _usd.format(Number(n)); }

// Returns YYYY-MM-DD for any Date in LOCAL time (never UTC — toISOString flips at ~6 pm US).
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function today() { return localDateStr(new Date()); }
// Returns YYYY-MM for any Date in LOCAL time. Use instead of toISOString().slice(0,7),
// which uses UTC and can roll to the next month on the last evening of a month (US).
function localMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

// _escHtml is defined once, earlier in the file (escapes & < > " '). This spot
// used to redefine a weaker copy that dropped the single-quote escape; removed
// so the complete version wins everywhere.

// ── "commonly used" expense templates ────────────────────────────────────────
// Surfaces expenses the user logs on a (roughly) twice-a-week-or-more
// cadence — e.g. a daily coffee — so we can offer a one-tap pre-fill on the
// Add page and the quick-add sheet. Expenses only; learns the usual price.
// Deterministic (pure read of state.transactions) so callers can recompute it
// to map a chip index back to its template.
function getCommonTemplates(limit = 3) {
  const txns = state.transactions || [];
  if (txns.length < 6) return [];
  const WINDOW      = 30;   // days of history considered
  const MIN_DAYS    = 4;    // distinct days seen → an emerging habit, not a one-off
  const MAX_GAP     = 3;    // median spacing ≤ every third day (twice-a-week+)
  const STALE_AFTER = 7;    // drop it only if not seen in the last week

  const dayNum = s => {     // YYYY-MM-DD → integer day index (local, DST-safe)
    const [y, m, d] = s.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  };
  const todayNum = dayNum(today());
  const cutoff   = todayNum - WINDOW;

  // Normalize a description for grouping: case-insensitive, punctuation- and
  // whitespace-agnostic — so "Coffee", "coffee" and "coffee." are the same word,
  // but genuinely different words (coffee vs Starbucks) stay separate.
  const norm = s => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();

  const groups = new Map();
  for (const t of txns) {
    if (t.type !== 'expense' || t._xfer) continue;
    if (t.category === 'Transfer' || t.category === 'Payment') continue;
    if (!t.date) continue;
    const dn = dayNum(t.date);
    if (dn < cutoff || dn > todayNum) continue;
    const desc = (t.description || '').trim();
    const cat  = t.category || 'Other';
    const key  = `${cat}|${norm(desc)}`;
    let g = groups.get(key);
    if (!g) { g = { cat, days: [], amounts: [], descFreq: new Map() }; groups.set(key, g); }
    g.days.push(dn);
    g.amounts.push(Number(t.amount) || 0);
    if (desc) g.descFreq.set(desc, (g.descFreq.get(desc) || 0) + 1);  // track original spellings for the label
  }

  const out = [];
  for (const g of groups.values()) {
    const uniqDays = [...new Set(g.days)].sort((a, b) => a - b);
    if (uniqDays.length < MIN_DAYS) continue;
    if (todayNum - uniqDays[uniqDays.length - 1] > STALE_AFTER) continue;
    const gaps = [];
    for (let i = 1; i < uniqDays.length; i++) gaps.push(uniqDays[i] - uniqDays[i - 1]);
    gaps.sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)];
    if (median > MAX_GAP) continue;
    // usual price = most frequent amount; tie-break → most recent
    const freq = new Map();
    g.amounts.forEach(a => freq.set(a, (freq.get(a) || 0) + 1));
    let amount = g.amounts[g.amounts.length - 1], best = -1;
    for (const [a, c] of freq) if (c > best) { best = c; amount = a; }
    // label = most-frequently-typed original spelling for this group
    let desc = '', dBest = -1;
    for (const [d, c] of g.descFreq) if (c > dBest) { dBest = c; desc = d; }
    out.push({ type: 'expense', category: g.cat, description: desc, amount, count: uniqDays.length });
  }
  out.sort((a, b) => b.count - a.count);
  return out.slice(0, limit);
}

// ── animated count-ups ───────────────────────────────────────────────────────
// Rolls a number from its previously-shown value to the new one with easing —
// the single biggest "premium" tell on the balance hero and stat tiles. Honors
// reduced-motion (OS pref or the in-app "Reduce motion & effects" setting).
function _reduceMotion() {
  if (loadSettings().reduceFx) return true;
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

// ── privacy: hide balances (blur all money amounts) ──────────────────────────
function _amountsHidden() { return !!loadSettings().hideAmounts; }
function _eyeIconSvg(hidden) {
  return hidden
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}
function _applyAmountsHidden() { document.body.classList.toggle('amounts-hidden', _amountsHidden()); }
function toggleAmountsHidden() {
  const s = loadSettings();
  s.hideAmounts = !s.hideAmounts;
  saveSettings(s);
  _applyAmountsHidden();
  try { navigator.vibrate && navigator.vibrate(8); } catch {}
  // Refresh any visible eye toggles to match the new state.
  document.querySelectorAll('.dash-privacy-btn').forEach(b => {
    b.classList.toggle('is-hidden', s.hideAmounts);
    b.title = s.hideAmounts ? 'Show amounts' : 'Hide amounts';
    b.setAttribute('aria-pressed', s.hideAmounts ? 'true' : 'false');
    b.innerHTML = _eyeIconSvg(s.hideAmounts);
  });
  const cb = document.getElementById('hide-amounts-settings');
  if (cb) cb.checked = s.hideAmounts;
}
function _countUp(el, from, to, fmtFn, duration = 700) {
  const ease = t => 1 - Math.pow(1 - t, 3);  // easeOutCubic
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = fmtFn(from + (to - from) * ease(t));
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = fmtFn(to);
  }
  requestAnimationFrame(frame);
}
// Scan a container for [data-countup] elements and roll each from 0 to its
// target. Runs on every dashboard/accounts render so the number feels alive
// each time you land on the page (not just once). Honors reduced-motion.
function _runCountUps(root) {
  (root || document).querySelectorAll('[data-countup]').forEach(el => {
    const to = parseFloat(el.getAttribute('data-countup'));
    if (isNaN(to)) return;
    const fmtFn = el.getAttribute('data-countup-int')
      ? (v => Math.round(v).toLocaleString('en-US'))
      : fmt;
    if (_reduceMotion()) { el.textContent = fmtFn(to); return; }
    _countUp(el, 0, to, fmtFn);
  });
}

// ── premium chart defaults ───────────────────────────────────────────────────
// One-time global Chart.js styling so every chart (spending, insights, debt)
// gets smooth easing, rounded bars, and a polished floating tooltip without
// per-chart config. Chart.js loads before app.js, so window.Chart exists here.
function _initChartDefaults() {
  if (!window.Chart) return;
  const C = window.Chart;
  C.defaults.font.family = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
  C.defaults.font.size = 11;
  C.defaults.animation = _reduceMotion()
    ? false
    : { duration: 750, easing: 'easeOutQuart' };
  C.defaults.elements.bar.borderRadius = 6;
  C.defaults.elements.bar.borderSkipped = false;
  C.defaults.elements.point.radius = 0;
  C.defaults.elements.point.hoverRadius = 4;
  C.defaults.elements.line.tension = 0.4;
  Object.assign(C.defaults.plugins.tooltip, {
    backgroundColor: 'rgba(18,18,22,.94)',
    titleColor: '#ffffff',
    bodyColor: '#e6e6ea',
    padding: 10,
    cornerRadius: 10,
    borderColor: 'rgba(255,255,255,.08)',
    borderWidth: 1,
    boxPadding: 5,
    titleFont: { weight: '700', size: 12 },
    bodyFont: { weight: '500', size: 12 },
  });
}

// Chart.js is lazy-loaded (not a render-blocking <script>) so the app paints and
// becomes interactive without waiting on ~200KB. _ensureChart() injects it once,
// applies our defaults, and resolves; chart-creating code awaits it. If it fails
// to load (offline), charts are simply skipped — the rest of the app is fine.
let _chartPromise = null;
function _ensureChart() {
  if (window.Chart) return Promise.resolve(true);
  if (_chartPromise) return _chartPromise;
  _chartPromise = new Promise(resolve => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
    s.onload  = () => { _initChartDefaults(); resolve(true); };
    s.onerror = () => { _chartPromise = null; resolve(false); };
    document.head.appendChild(s);
  });
  return _chartPromise;
}
// Run fn once Chart.js is available. If it's already loaded (every render after
// the first), run synchronously — matching the original, proven creation timing.
// Only the very first chart waits on the lazy download.
function _withChart(fn) {
  if (window.Chart) { fn(); return; }
  _ensureChart().then(ok => { if (ok && window.Chart) fn(); });
}

// ── backup reminder ──────────────────────────────────────────────────────────
// Whole numbers of days since the last JSON backup, or null if never.
function daysSinceBackup() {
  const s = loadSettings();
  if (!s.lastBackupDate) return null;
  const last = new Date(s.lastBackupDate + 'T00:00:00');
  const now  = new Date(); now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((now - last) / 86400000));
}
function markBackupDone() {
  const s = loadSettings(); s.lastBackupDate = today(); saveSettings(s);
}
const BACKUP_STALE_DAYS = 30;
let _backupBannerDismissed = false;   // per-session
function backupStatusHtml() {
  const n = daysSinceBackup();
  const hasData = (state.transactions?.length || 0) > 0;
  let txt, color;
  if (n === null)      { txt = hasData ? 'Never backed up yet — download one to be safe' : 'No backup yet'; color = hasData ? 'var(--warn)' : 'var(--muted)'; }
  else if (n === 0)    { txt = '✓ Backed up today'; color = 'var(--success)'; }
  else                 { txt = `Last backup: ${n} day${n !== 1 ? 's' : ''} ago`; color = n > BACKUP_STALE_DAYS ? 'var(--warn)' : 'var(--muted)'; }
  return `<p class="code-hint" id="backup-status" style="margin-top:8px;color:${color}">${txt}</p>`;
}
// Banner shown atop the dashboard when a backup is overdue.
function backupBannerHtml() {
  if (_backupBannerDismissed) return '';
  if ((state.transactions?.length || 0) === 0) return '';
  const n = daysSinceBackup();
  if (n !== null && n <= BACKUP_STALE_DAYS) return '';
  const msg = n === null ? "You haven't backed up your data yet." : `It's been ${n} days since your last backup.`;
  return `
    <div class="backup-banner" id="backup-banner">
      <span class="backup-banner-icon">⚠</span>
      <span class="backup-banner-msg">${msg} Your data lives only on this device.</span>
      <button class="backup-banner-go" id="backup-banner-go">Back up</button>
      <button class="backup-banner-x" id="backup-banner-x" aria-label="Dismiss">✕</button>
    </div>`;
}

function showStatus(id, msg, type, ms = 3000) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  el.textContent = msg;
  el.className = `form-status ${type}`;
  if (ms) setTimeout(() => { el.textContent = ''; el.className = 'form-status'; }, ms);
}

// ── calculator keypad for amount entry ──────────────────────────────────────
// Safe left-to-right evaluator for + − × ÷ with normal precedence. No eval().
function _evalExpr(raw) {
  let expr = String(raw).replace(/[×x]/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  while (/[+\-*/.]$/.test(expr)) expr = expr.slice(0, -1);   // drop trailing operator/dot
  if (!expr) return NaN;
  const tokens = expr.match(/(\d*\.?\d+)|[+\-*/]/g);
  if (!tokens) return NaN;
  const mid = [];   // pass 1: resolve * and /
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '*' || t === '/') {
      const a = mid.pop(), b = parseFloat(tokens[++i]);
      if (!isFinite(a) || !isFinite(b)) return NaN;
      mid.push(t === '*' ? a * b : a / b);
    } else if (t === '+' || t === '-') { mid.push(t); }
    else mid.push(parseFloat(t));
  }
  let res = mid[0];   // pass 2: resolve + and -
  for (let i = 1; i < mid.length; i += 2) {
    const op = mid[i], v = mid[i + 1];
    if (!isFinite(v)) return NaN;
    res = op === '+' ? res + v : res - v;
  }
  return isFinite(res) ? res : NaN;
}

// Opens an on-screen calculator keypad that writes its result into `target` (an input).
function openCalcKeypad(target) {
  if (!target) return;
  document.getElementById('calc-overlay')?.remove();
  let expr = (target.value !== '' && isFinite(parseFloat(target.value))) ? String(parseFloat(target.value)) : '';
  const keys = [['7','7'],['8','8'],['9','9'],['/','÷'],['4','4'],['5','5'],['6','6'],['*','×'],['1','1'],['2','2'],['3','3'],['-','−'],['C','C'],['0','0'],['.','.'],['+','+']];
  const ov = document.createElement('div');
  ov.id = 'calc-overlay';
  ov.className = 'calc-overlay';
  ov.innerHTML = `
    <div class="calc-card" role="dialog" aria-label="Calculator">
      <div class="calc-display">
        <div class="calc-display-nums"><div class="calc-expr" id="calc-expr">${expr || '0'}</div><div class="calc-res" id="calc-res"></div></div>
        <button class="calc-back" id="calc-back" aria-label="Backspace">⌫</button>
      </div>
      <div class="calc-grid">
        ${keys.map(([k, lbl]) => `<button class="calc-key${'+-*/'.includes(k) ? ' calc-op' : k === 'C' ? ' calc-fn' : ''}" data-k="${k}">${lbl}</button>`).join('')}
      </div>
      <div class="calc-actions">
        <button class="calc-cancel" id="calc-cancel">Cancel</button>
        <button class="calc-done" id="calc-done">Done</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const exprEl = ov.querySelector('#calc-expr');
  const resEl  = ov.querySelector('#calc-res');
  const refresh = () => {
    exprEl.textContent = expr || '0';
    const hasOp = /[+\-*/]/.test(expr.slice(1));
    const r = _evalExpr(expr);
    resEl.textContent = (hasOp && isFinite(r)) ? '= ' + fmt(Math.max(0, Math.round(r * 100) / 100)) : '';
  };
  const press = k => {
    if (k === 'C') expr = '';
    else if ('+-*/'.includes(k)) {
      if (!expr) { if (k === '-') expr = '-'; }
      else if ('+-*/'.includes(expr.slice(-1))) expr = expr.slice(0, -1) + k;
      else expr += k;
    } else if (k === '.') {
      const seg = expr.split(/[+\-*/]/).pop();
      if (!seg.includes('.')) expr += (seg === '' ? '0.' : '.');
    } else expr += k;
    refresh();
  };
  ov.querySelectorAll('.calc-key').forEach(b => b.addEventListener('click', () => press(b.dataset.k)));
  ov.querySelector('#calc-back').addEventListener('click', () => { expr = expr.slice(0, -1); refresh(); });
  const close = () => ov.remove();
  ov.querySelector('#calc-cancel').addEventListener('click', close);
  ov.querySelector('#calc-done').addEventListener('click', () => {
    const r = _evalExpr(expr);
    const v = isFinite(r) ? Math.max(0, Math.round(r * 100) / 100) : 0;
    target.value = v || '';
    target.dispatchEvent(new Event('input', { bubbles: true }));
    close();
  });
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  refresh();
}

// ── reconcile to bank ────────────────────────────────────────────────────────
// Sets the current account's balance to a number you type by logging a one-line
// adjustment transaction (excluded from weekly spending).
function showReconcileModal() {
  const acct   = state.accounts.find(a => a.id === currentAccountId);
  const isDebt = acct && (acct.type === 'credit' || acct.type === 'loan');
  const { income, expense } = totals();
  const net     = income - expense;
  const start   = state.startingBalance || 0;
  const current = isDebt ? Math.max(0, start - net) : (start + net);
  const ov = document.createElement('div');
  ov.id = 'reconcile-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center';
  ov.innerHTML = `
    <div class="reconcile-card" role="dialog" aria-label="Reconcile balance">
      <div class="reconcile-title">Reconcile ${acct?.name || 'account'}</div>
      <div class="reconcile-cur">In the app now: <strong>${fmt(current)}</strong>${isDebt ? ' owed' : ''}</div>
      <label class="form-label" style="font-size:.74rem;margin-top:10px;display:block">${isDebt ? 'Actual balance owed ($)' : 'Actual balance from your bank ($)'}</label>
      <input type="number" id="reconcile-input" class="form-input" inputmode="decimal" step="0.01" placeholder="${current.toFixed(2)}">
      <div id="reconcile-diff" class="reconcile-diff"></div>
      <div class="reconcile-actions">
        <button id="reconcile-cancel" class="calc-cancel">Cancel</button>
        <button id="reconcile-save" class="calc-done">Adjust</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const input  = ov.querySelector('#reconcile-input');
  const diffEl = ov.querySelector('#reconcile-diff');
  const close  = () => ov.remove();
  const calcDelta = () => {
    const target = parseFloat(input.value);
    return isFinite(target) ? { target, delta: +(target - current).toFixed(2) } : null;
  };
  const refresh = () => {
    const r = calcDelta();
    if (!r) { diffEl.textContent = ''; return; }
    if (Math.abs(r.delta) < 0.005) { diffEl.innerHTML = '<span style="color:var(--success)">✓ Already matches</span>'; return; }
    const word = isDebt
      ? (r.delta > 0 ? `record a ${fmt(r.delta)} charge` : `record a ${fmt(-r.delta)} payment`)
      : (r.delta > 0 ? `add ${fmt(r.delta)} income` : `add a ${fmt(-r.delta)} expense`);
    diffEl.innerHTML = `Off by <strong>${fmt(Math.abs(r.delta))}</strong> — will ${word}`;
  };
  input.addEventListener('input', refresh);
  setTimeout(() => input.focus(), 50);
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  ov.querySelector('#reconcile-cancel').addEventListener('click', close);
  ov.querySelector('#reconcile-save').addEventListener('click', async () => {
    const r = calcDelta();
    if (!r || Math.abs(r.delta) < 0.005) { close(); return; }
    let type, amount;
    if (isDebt) {
      if (r.target > current) { type = 'expense'; amount = r.target - current; }  // more owed = charge
      else                    { type = 'income';  amount = current - r.target; }  // less owed = payment
    } else {
      if (r.delta > 0) { type = 'income';  amount = r.delta; }
      else             { type = 'expense'; amount = -r.delta; }
    }
    await api.addTransaction({
      type, amount: +amount.toFixed(2), description: 'Balance adjustment',
      category: 'Adjustment', date: today(), account: currentAccountId, excludeFromBudget: true,
    });
    close();
    showAlert(`✓ Reconciled to ${fmt(r.target)}`);
    render();
  });
}

// ── sounds toggle ──────────────────────────────────────────────────────────
function initSoundsToggle() {
  const btn = document.getElementById('sounds-toggle');
  if (!btn) return;
  btn.innerHTML = localStorage.getItem('sounds') === 'off' ? ICONS.bellOff : ICONS.bell;
  btn.onclick = () => {
    const off = localStorage.getItem('sounds') === 'off';
    localStorage.setItem('sounds', off ? 'on' : 'off');
    btn.innerHTML = off ? ICONS.bell : ICONS.bellOff;
  };
}

// ── health score ───────────────────────────────────────────────────────────
function calcHealthScore() {
  const m = localMonthKey();
  const { income, expense } = monthTotals(m);

  // ── Savings Rate (50 pts) ──────────────────────────────────────
  let savingsScore, savingsLabel;
  if (income <= 0) {
    savingsScore = 25; savingsLabel = 'No income recorded yet';
  } else {
    const rate = (income - expense) / income;
    const pct  = (rate * 100).toFixed(0);
    if      (rate >= 0.30) { savingsScore = 50; savingsLabel = `Saving ${pct}% of income — excellent`; }
    else if (rate >= 0.20) { savingsScore = 40; savingsLabel = `Saving ${pct}% of income — great`; }
    else if (rate >= 0.10) { savingsScore = 28; savingsLabel = `Saving ${pct}% of income — good, aim for 20%+`; }
    else if (rate >= 0.01) { savingsScore = 15; savingsLabel = `Saving ${pct}% — aim for 10%+`; }
    else if (rate >= -0.05){ savingsScore = 5;  savingsLabel = 'Nearly breaking even'; }
    else                   { savingsScore = 0;  savingsLabel = 'Spending more than earning'; }
  }

  // ── Balance Health (25 pts) ────────────────────────────────────
  let balanceScore, balanceLabel;
  {
    let allIncome = 0, allExpense = 0;
    for (const acctId of [currentAccountId]) {
      const d = JSON.parse(localStorage.getItem(accountDataKey(acctId)) || '{}');
      const txns = d.transactions || [];
      for (const t of txns) {
        if (t.type === 'income') allIncome += t.amount;
        else allExpense += t.amount;
      }
    }
    const balance = (state.startingBalance || 0) + allIncome - allExpense;
    if (income <= 0) {
      balanceScore = 12; balanceLabel = 'No income to compare buffer against';
    } else {
      const ratio = balance / income;
      const rx    = ratio.toFixed(1);
      if      (ratio >= 3)   { balanceScore = 25; balanceLabel = `Strong buffer — ${rx}× monthly income`; }
      else if (ratio >= 1)   { balanceScore = 18; balanceLabel = `Healthy buffer — ${rx}× monthly income`; }
      else if (ratio >= 0.5) { balanceScore = 12; balanceLabel = 'Thin buffer — aim for 1 month of income'; }
      else if (balance > 0)  { balanceScore = 6;  balanceLabel = 'Positive balance but low buffer'; }
      else                   { balanceScore = 0;  balanceLabel = 'Balance is negative'; }
    }
  }

  // ── Bills (25 pts) ─────────────────────────────────────────────
  let billScore, billLabel;
  if (state.bills.length === 0) {
    billScore = 25; billLabel = 'No bills tracked';
  } else {
    const n    = state.bills.length;
    const paid = state.bills.filter(b => isBillPaidFor(b, m)).length;
    const pct  = paid / n;
    if      (pct === 1)    { billScore = 25; billLabel = `${paid} of ${n} bills paid this month`; }
    else if (pct >= 0.75)  { billScore = 18; billLabel = `${paid} of ${n} bills paid this month`; }
    else if (pct >= 0.50)  { billScore = 12; billLabel = `${paid} of ${n} bills paid this month`; }
    else if (pct >= 0.25)  { billScore = 6;  billLabel = `${paid} of ${n} bills paid this month`; }
    else                   { billScore = 0;  billLabel = `${paid} of ${n} bills paid this month`; }
  }

  const total = Math.min(savingsScore + balanceScore + billScore, 100);
  let grade, color;
  if      (total >= 90) { grade = 'A+'; color = 'var(--success)'; }
  else if (total >= 80) { grade = 'A';  color = 'var(--success)'; }
  else if (total >= 70) { grade = 'B';  color = '#8dcb4e'; }
  else if (total >= 55) { grade = 'C';  color = 'var(--warn)'; }
  else if (total >= 40) { grade = 'D';  color = 'var(--accent2)'; }
  else                  { grade = 'F';  color = 'var(--danger)'; }

  return { total, grade, color, savingsScore, balanceScore, billScore,
           savingsLabel, balanceLabel, billLabel };
}

// ── tabs ───────────────────────────────────────────────────────────────────
let currentTab = 'dashboard';
let dashMonth = localMonthKey();
let debtSubTab = 'credit'; // 'credit' | 'loan'
let _pendingAccountExpand = null; // account id to auto-expand when Accounts tab renders
let _quickAddType = null;         // pre-select expense/income when navigating from Quick Add tile
let debtCalcMode = 'snowball'; // 'snowball' | 'avalanche'
let debtMonthlyPay = '';
let showingAccountPicker = false;
let _pageTransition = 'fade'; // 'fade' | 'slide-left' | 'slide-right'
let _slideCleanupTimer  = null;  // tracks in-flight slide animation cleanup
let _slidePendingHTML  = null;  // newHTML of the currently-animating slide (used to recover on rapid re-nav)
// ── back-navigation stack ──────────────────────────────────────────────────
let _navStack = [];        // [{tab, picker, accountId}]
let _navigatingBack = false;
function _navPush() {
  if (_navigatingBack) return;
  _navStack.push({ tab: currentTab, picker: showingAccountPicker, accountId: currentAccountId });
  history.pushState({ dawgNav: true }, '');
}
// Logical order for slide direction — dashboard is the centre point.
// Tabs to its LEFT slide left-to-right when selected from dashboard (content comes from left = "move right").
// Tabs to its RIGHT slide right-to-left when selected from dashboard (content comes from right = "move left").
// Only these tabs get directional slides; hamburger-only pages fade.
const NAV_TABS = ['dashboard','add','ledger','weekly','bills','debt','goals','import','budgets','retirement','insights','settings'];
let selectedLedgerIdx = null;
let ledgerFilter = '';
let ledgerSort = 'date-desc';
let ledgerTypeFilter = 'all';
let ledgerView = 'transactions';   // 'transactions' (non-bill) | 'bills'
let billsMonth = localMonthKey();   // YYYY-MM shown on the Bills page
let ledgerCatFilter = '';
let ledgerDateFrom = '';
let ledgerDateTo = '';
let _ledgerShowAll = false;          // when true, render the full filtered list (past the cap)
const LEDGER_CAP = 300;              // max rows put in the DOM at once before a "Show all" button
let ledgerAllAccounts = false;       // when true, the ledger searches across every account (read-only)
let _insightTimer = null;
let _dawgSparkGlobal = null; // module-level ref so tab switches can destroy it
let _splitRows    = []; // [{cat, amount}] for split-transaction mode

function showAccountEdit(acctId) {
  _pendingAccountExpand = acctId;
  showTab('accounts');
}

function showTab(key) {
  // Weekly Planner is not applicable to debt accounts — send them to the Debt view instead.
  if (key === 'weekly' && _isDebtAcct(_currentAcct())) key = 'debt';
  _navPush();
  if (currentTab === 'ledger' && key !== 'ledger') {
    ledgerFilter = ''; ledgerSort = 'date-desc'; ledgerTypeFilter = 'all';
    ledgerCatFilter = ''; ledgerDateFrom = ''; ledgerDateTo = ''; ledgerView = 'transactions';
  }
  if (currentTab === 'bills' && key !== 'bills') billsMonth = localMonthKey();
  if (_insightTimer) { clearInterval(_insightTimer); _insightTimer = null; }
  if (_dawgSparkGlobal) { _dawgSparkGlobal.destroy(); _dawgSparkGlobal = null; }
  // Re-apply the active theme if leaving the about page (about used to reset it; no longer needed)
  const activeTheme = (loadSettings().theme) || 'dark';
  if (currentTab === 'about' && key !== 'about') {
    applyTheme(activeTheme);
  }
  // Always keep dawg-mode (universal layout)
  document.getElementById('app')?.classList.add('dawg-mode');
  // Dashboard always zooms in; slide between other nav tabs; hamburger pages fade
  // In DAWG mode the visual order is: [slot0] [slot1] [🐕 dashboard] [slot2] [slot3]
  // so we derive direction from visual position rather than NAV_TABS order.
  if (key === 'dashboard') {
    _pageTransition = 'zoom-in';
  } else if (document.getElementById('app')?.classList.contains('dawg-mode')) {
    const layout = loadNavLayout(); // [slot0, slot1, slot2, slot3]
    // visual positions: slot0→0, slot1→1, dashboard→2, slot2→3, slot3→4, unlisted→-1
    const visPos = (k) => {
      if (k === 'dashboard') return 2;
      const li = layout.indexOf(k);
      return li === 0 ? 0 : li === 1 ? 1 : li === 2 ? 3 : li === 3 ? 4 : -1;
    };
    const fv = visPos(currentTab);
    const tv = visPos(key);
    if (fv !== -1 && tv !== -1 && fv !== tv) {
      _pageTransition = tv > fv ? 'slide-right' : 'slide-left';
    } else {
      _pageTransition = 'fade';
    }
  } else {
    const fromIdx = NAV_TABS.indexOf(currentTab);
    const toIdx   = NAV_TABS.indexOf(key);
    const bothInNav = fromIdx !== -1 && toIdx !== -1;
    _pageTransition = (bothInNav && fromIdx !== toIdx)
      ? (toIdx > fromIdx ? 'slide-right' : 'slide-left')
      : 'fade';
  }
  currentTab = key;
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === key));
  document.querySelectorAll('.dawg-nav-btn[data-tab]').forEach(b =>
    b.classList.toggle('dawg-nav-active', b.dataset.tab === key));
  _screenFlash(); // green flash + page title glitch on every tab change
  render();
}

// ── chart ──────────────────────────────────────────────────────────────────
let spendingChart = null;
let _insightsChart = null;
let _insTrend = { labels: [], data: [] };   // 6-month expense trend, set by renderInsights()

function showCatModal(cat) {
  const m = dashMonth;
  const txns = state.transactions
    .filter(t => t.type === 'expense' && t.category === cat && t.date.startsWith(m))
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = txns.reduce((s, t) => s + t.amount, 0);
  const catColor = CAT_COLORS[cat] || 'var(--accent)';
  const rowsHtml = txns.length
    ? txns.map(t => `<div class="cat-modal-row"><span class="cat-modal-date">${t.date.slice(5)}</span><span class="cat-modal-desc">${_escHtml(t.description)}</span><span class="cat-modal-amt">-${fmt(t.amount)}</span></div>`).join('')
    : '<p style="color:var(--muted);font-size:.85rem;text-align:center;padding:12px">No transactions</p>';

  let overlay = document.getElementById('cat-modal-overlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'cat-modal-overlay';
  overlay.className = 'cat-modal-overlay';
  overlay.innerHTML = `
    <div class="cat-modal-card">
      <div class="cat-modal-header">
        <span class="cat-dot" style="background:${catColor}"></span>
        <span class="cat-modal-title">${cat}</span>
        <span class="cat-modal-total" style="color:var(--danger)">-${fmt(total)}</span>
        <button class="cat-modal-close" id="cat-modal-close">✕</button>
      </div>
      <div class="cat-modal-rows">${rowsHtml}</div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('cat-modal-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}


function getMonthCatData(monthStr) {
  const m = monthStr || localMonthKey();
  const { bycat } = monthTotals(m);
  const entries = Object.entries(bycat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return {
    labels: entries.map(([c]) => c),
    data:   entries.map(([, v]) => v),
    colors: entries.map(([c]) => CAT_COLORS[c] || '#9896a4'),
  };
}

// Per-category expense totals between two YYYY-MM-DD dates (inclusive). Skips
// internal transfers; returns categories sorted high→low plus a grand total,
// income in the same window, and the transaction count. Used by the custom
// date-range summary on the Insights page.
function rangeCategoryTotals(start, end) {
  // tolerate inputs given in either order
  if (start && end && start > end) { const t = start; start = end; end = t; }
  const bycat = {}, bycatN = {};
  let total = 0, income = 0, count = 0;
  for (const t of (state.transactions || [])) {
    if (t._xfer) continue;
    if (!t.date) continue;
    if (start && t.date < start) continue;
    if (end && t.date > end) continue;
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') { income += amt; continue; }
    if (t.type !== 'expense') continue;
    if (t.category === 'Transfer' || t.category === 'Payment') continue;
    const cat = t.category || 'Other';
    bycat[cat] = (bycat[cat] || 0) + amt;
    bycatN[cat] = (bycatN[cat] || 0) + 1;
    total += amt; count++;
  }
  const cats = Object.entries(bycat)
    .filter(([, v]) => v > 0)
    .map(([name, amt]) => ({ name, amt, count: bycatN[name] || 0, color: CAT_COLORS[name] || '#9896a4' }))
    .sort((a, b) => b.amt - a.amt);
  return { cats, total, income, count, start, end };
}

// End-of-month YYYY-MM-DD for a YYYY-MM key (handles 28/29/30/31).
function _monthEndDate(mKey) {
  const [y, m] = mKey.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${mKey}-${String(last).padStart(2, '0')}`;
}

// Inner markup for the Insights date-range summary results — recomputed on
// every "Run summary" tap, so it lives in its own function.
function _rangeSummaryHTML(start, end) {
  const { cats, total, income, count } = rangeCategoryTotals(start, end);
  if (!count) return '<p class="code-hint" style="margin:6px 0 0">No expenses recorded in this range.</p>';
  const max = Math.max(...cats.map(c => c.amt), 1);
  const rows = cats.map(c => `
    <div class="ins-cat">
      <div class="ins-cat-top">
        <span><span class="cat-dot" style="background:${c.color}"></span>${_escHtml(c.name)}</span>
        <span>${fmt(c.amt)} <span style="color:var(--muted);font-size:.7rem">${(c.amt / total * 100).toFixed(0)}%</span></span>
      </div>
      <div class="ins-bar-bg"><div class="ins-bar-fill" style="width:${(c.amt / max * 100).toFixed(1)}%;background:${c.color}"></div></div>
    </div>`).join('');
  return `
    <div class="ins-row ins-row-net" style="margin:10px 0 4px"><span>Total spent</span><span style="color:var(--danger);font-weight:700">${fmt(total)}</span></div>
    <p class="code-hint" style="margin:0 0 10px">${count} transaction${count === 1 ? '' : 's'} across ${cats.length} categor${cats.length === 1 ? 'y' : 'ies'}${income > 0 ? ` · ${fmt(income)} income` : ''}</p>
    ${rows}`;
}

function attachDashboard() {
  // Debt dashboard quick-add — must be wired before any early-return guards
  const debtQuickAdd = document.getElementById('debt-dash-quick-add');
  if (debtQuickAdd) {
    debtQuickAdd.addEventListener('click', () => showTab('add'));
  }

  // Starting balance (first-run card) — also before early-return
  const sbSave = document.getElementById('starting-bal-save');
  if (sbSave) {
    sbSave.addEventListener('click', async () => {
      const val = parseFloat(document.getElementById('starting-bal-input')?.value);
      if (isNaN(val)) return;
      state.startingBalance = val;
      _save();
      const st = document.getElementById('starting-bal-status');
      if (st) { st.textContent = '✓ Balance set!'; }
      setTimeout(() => render(), 800);
    });
  }

  const chartEl = document.getElementById('spending-chart');
  if (!chartEl) return;
  if (spendingChart) { spendingChart.destroy(); spendingChart = null; }

  // Read current theme colors so charts adapt to any theme (dark, light, ocean, etc.)
  const cs        = getComputedStyle(document.documentElement);
  const textColor = cs.getPropertyValue('--text').trim()   || '#e8e6f0';
  const mutedColor= cs.getPropertyValue('--muted').trim()  || '#b0aec8';
  const gridColor = cs.getPropertyValue('--border').trim() || '#2e2e40';
  const bgColor   = cs.getPropertyValue('--bg').trim()     || '#0f0f14';

  if (dashChartMode === 'bar') {
    const { labels, data, colors } = getMonthCatData(dashMonth);
    if (!data.length) {
      const wrap = chartEl.closest('.chart-wrap');
      if (wrap) wrap.innerHTML = '<p class="empty-msg" style="padding:40px 0;text-align:center">No spending this month yet.</p>';
    } else {
      _withChart(() => { if (!document.body.contains(chartEl) || !chartEl.getContext || !chartEl.getContext('2d')) return; Chart.getChart(chartEl)?.destroy(); spendingChart = new Chart(chartEl, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Spent',
            data,
            backgroundColor: colors,
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (event, elements) => {
            if (!elements.length) return;
            const cat = labels[elements[0].index];
            showCatModal(cat);
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: ctx => ` ${fmt(ctx.raw)}` },
            },
          },
          scales: {
            x: { ticks: { color: mutedColor, font: { size: 11 } }, grid: { color: 'transparent' } },
            y: { ticks: { color: mutedColor, font: { size: 11 }, callback: v => '$' + v }, grid: { color: gridColor } },
          },
        },
      }); });
    }
  } else {
    const { labels, data, colors } = getMonthCatData(dashMonth);
    if (!data.length) {
      const wrap = chartEl.closest('.chart-wrap');
      if (wrap) wrap.innerHTML = '<p class="empty-msg" style="padding:40px 0;text-align:center">No spending this month yet.</p>';
    } else {
      const total = data.reduce((s, v) => s + v, 0);
      _withChart(() => { if (!document.body.contains(chartEl) || !chartEl.getContext || !chartEl.getContext('2d')) return; Chart.getChart(chartEl)?.destroy(); spendingChart = new Chart(chartEl, {
        type: 'pie',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, borderColor: bgColor, borderWidth: 1 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (event, elements) => {
            if (!elements.length) return;
            const cat = labels[elements[0].index];
            showCatModal(cat);
          },
          plugins: {
            legend: {
              position: 'right',
              align: 'center',
              labels: {
                color: textColor,
                font: { size: 12, family: 'Plus Jakarta Sans' },
                boxWidth: 13,
                padding: 10,
                generateLabels: (chart) => {
                  const ds = chart.data.datasets[0];
                  return chart.data.labels.map((lbl, i) => ({
                    text: `${lbl}  ${fmt(ds.data[i])}  (${((ds.data[i]/total)*100).toFixed(0)}%)`,
                    fillStyle: ds.backgroundColor[i],
                    strokeStyle: 'transparent',
                    fontColor: textColor,
                    lineWidth: 0,
                    hidden: false,
                    index: i,
                  }));
                },
              },
            },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}  (${((ctx.raw/total)*100).toFixed(1)}%)`,
              },
            },
          },
        },
      }); });
    }
  }

  // Month navigator handlers
  document.getElementById('dash-month-prev')?.addEventListener('click', () => {
    const yr = parseInt(dashMonth.slice(0,4)), mo = parseInt(dashMonth.slice(5,7)) - 1;
    const d = new Date(yr, mo - 1, 1);
    dashMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0');
    render();
  });
  document.getElementById('dash-month-next')?.addEventListener('click', () => {
    const now = localMonthKey();
    if (dashMonth >= now) return;
    const yr = parseInt(dashMonth.slice(0,4)), mo = parseInt(dashMonth.slice(5,7)) - 1;
    const d = new Date(yr, mo + 1, 1);
    dashMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0');
    render();
  });

  // Use onclick to prevent duplicate handlers accumulating across re-renders
  const toggleBtn = document.getElementById('chart-toggle-btn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      dashChartMode = dashChartMode === 'bar' ? 'pie' : 'bar';
      if (spendingChart) { spendingChart.destroy(); spendingChart = null; }
      // Always rebuild a fresh canvas to avoid Chart.js state issues
      const wrap = document.querySelector('.chart-wrap');
      if (wrap) wrap.innerHTML = '<canvas id="spending-chart"></canvas>';
      const btn = document.getElementById('chart-toggle-btn');
      if (btn) btn.textContent = dashChartMode === 'bar' ? '🥧 Pie' : '📊 Bar';
      const titleEl = document.querySelector('.chart-section-title');
      if (titleEl) titleEl.textContent = 'This Month by Category';
      attachDashboard();
    };
  }

  // Rotating insights card
  const rotator = document.getElementById('insight-rotator');
  if (rotator) {
    try {
      const allInsights = JSON.parse(rotator.dataset.insights || '[]');
      if (allInsights.length > 1) {
        let insightIdx = 0;
        if (_insightTimer) clearInterval(_insightTimer);
        _insightTimer = setInterval(() => {
          insightIdx = (insightIdx + 1) % allInsights.length;
          const textEl  = document.getElementById('insight-text');
          const dots    = rotator.querySelectorAll('.insight-dot');
          if (textEl) {
            textEl.style.transition = 'opacity .15s, transform .15s';
            textEl.style.opacity = '0';
            textEl.style.transform = 'translateY(-8px)';
            setTimeout(() => {
              textEl.textContent = allInsights[insightIdx];
              textEl.style.transition = 'none';
              textEl.style.transform = 'translateY(10px)';
              textEl.style.filter = 'drop-shadow(-4px 0 0 var(--accent)) drop-shadow(4px 0 0 rgba(255,60,120,.7)) brightness(1.4)';
              // force reflow
              void textEl.offsetHeight;
              textEl.style.transition = 'opacity .2s, transform .2s, filter .15s';
              textEl.style.opacity = '1';
              textEl.style.transform = 'translateY(0)';
              textEl.style.filter = 'none';
            }, 160);
          }
          dots.forEach((d, i) => d.classList.toggle('active', i === insightIdx));
        }, 4000);
      }
    } catch(e) {}
  }
}

// ── milestones ─────────────────────────────────────────────────────────────
function checkMilestones(prevBal, newBal) {
  if (prevBal < 0 && newBal >= 0) { haptic([40, 80, 40, 80, 80]); setTimeout(showBalanceMilestone, 500); }
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
  const monStr   = localDateStr(mon);
  const todayStr = localDateStr(today);
  const weekSpent = state.transactions
    .filter(t => t.type === 'expense' && t.date >= monStr && t.date <= todayStr)
    .reduce((s, t) => s + t.amount, 0);
  const isoWeek = today.getFullYear() + '-W' + String(getWeekNumber(today)).padStart(2, '0');
  if (weekSpent < perWeek && localStorage.getItem('last_week_celebrated') !== isoWeek) {
    localStorage.setItem('last_week_celebrated', isoWeek);
    setTimeout(showWeekWin, 500);
  }
}

// ── bills helpers ──────────────────────────────────────────────────────────
function getDaysUntilDue(dueDay) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (thisMonth < now) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
    return Math.ceil((nextMonth - now) / 86400000);
  }
  return Math.ceil((thisMonth - now) / 86400000);
}

function getUpcomingBills(days = 7) {
  const m = localMonthKey();
  return state.bills
    .filter(b => !isBillPaidFor(b, m) && getDaysUntilDue(b.dueDay) <= days)
    .sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay));
}

// ── bill badge ─────────────────────────────────────────────────────────────
function updateBillBadge() {
  const count = getUpcomingBills(3).length;
  document.querySelectorAll('.nav-bill-badge').forEach(el => el.remove());
  if (count > 0) {
    const btn = document.querySelector('.nav-btn[data-tab="bills"]');
    if (btn) {
      const badge = document.createElement('span');
      badge.className = 'nav-bill-badge';
      badge.textContent = count;
      btn.appendChild(badge);
    }
  }
}

// ── notes badge ─────────────────────────────────────────────────────────────
function updateNotesBadge() {
  const todayStr = today();
  const count = loadNotes().filter(n => !n.done && n.dueDate && n.dueDate <= todayStr).length;
  document.querySelectorAll('.nav-notes-badge').forEach(el => el.remove());
  if (count > 0) {
    [
      document.querySelector('.nav-btn[data-tab="notes"]'),
      document.querySelector('.dawg-nav-btn[data-tab="notes"]'),
    ].filter(Boolean).forEach(btn => {
      const badge = document.createElement('span');
      badge.className = 'nav-notes-badge nav-bill-badge';
      badge.textContent = count;
      btn.style.position = 'relative';
      btn.appendChild(badge);
    });
  }
}

let _shownNotesAlert = false;
function checkNotesAlert() {
  if (_shownNotesAlert) return;
  _shownNotesAlert = true;
  const todayStr = today();
  const overdue  = loadNotes().filter(n => !n.done && n.dueDate && n.dueDate < todayStr);
  const dueToday = loadNotes().filter(n => !n.done && n.dueDate === todayStr);
  if (overdue.length === 0 && dueToday.length === 0) return;
  const parts = [];
  if (overdue.length)  parts.push(`${overdue.length} overdue reminder${overdue.length > 1 ? 's' : ''}`);
  if (dueToday.length) parts.push(`${dueToday.length} due today`);
  setTimeout(() => showAlert(`📝 ${parts.join(' · ')} — check your Notes`), 600);
}

// ── net worth ──────────────────────────────────────────────────────────────
function getNetWorth() {
  // Re-parsing every account's full localStorage blob is the costly part. The
  // only things that change a balance are a _save() (bumps _calcVer) or an
  // account add/remove/type-change (changes the signature below), so memoize on
  // both and skip the parse on repeat dashboard/accounts renders.
  const key = _calcVer + '|' + state.accounts.map(a => a.id + ':' + a.type + ':' + a.name).join('|');
  if (_netWorthCache && _netWorthCache.key === key) return _netWorthCache.result;
  const items = state.accounts.map(a => {
    const d = JSON.parse(localStorage.getItem(accountDataKey(a.id)) || '{}');
    const txns = d.transactions || [];
    const startingBal = parseFloat(d.startingBalance) || 0;
    let income = 0, expense = 0;
    for (const t of txns) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    const isDebt = a.type === 'credit' || a.type === 'loan';
    // For credit/loan: startingBal is existing debt; expenses increase debt, income (payments) reduce it
    const balance = isDebt
      ? -(startingBal + expense - income)   // net worth contribution is negative
      : startingBal + income - expense;
    return { name: a.name, balance, type: a.type };
  });
  const total = items.reduce((s, a) => s + a.balance, 0);
  _netWorthCache = { key, result: { accounts: items, total } };
  return _netWorthCache.result;
}

// ── running balances ──────────────────────────────────────────────────────
function calcRunningBalances() {
  if (_runBalCache && _runBalCache.ver === _calcVer) return _runBalCache.map;
  const sorted = state.transactions
    .map((t, i) => ({ ...t, _i: i }))
    .sort((a, b) => a.date.localeCompare(b.date) || a._i - b._i);
  let running = state.startingBalance || 0;
  const map = {};
  for (const t of sorted) {
    running += t.type === 'income' ? t.amount : -t.amount;
    map[t._i] = running;
  }
  _runBalCache = { ver: _calcVer, map };
  return map;
}

// ── spending insights ──────────────────────────────────────────────────────
function getSpendingInsights(monthStr) {
  const refDate = monthStr
    ? new Date(parseInt(monthStr.slice(0,4)), parseInt(monthStr.slice(5,7)) - 1, 1)
    : new Date();
  const thisM = monthStr || localMonthKey(refDate);
  const lastM = localMonthKey(new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1));
  const cur  = monthTotals(thisM);
  const prev = monthTotals(lastM);
  const insights = [];

  // Savings rate this month
  if (cur.income > 0) {
    const rate  = ((cur.income - cur.expense) / cur.income * 100).toFixed(0);
    const saved = cur.income - cur.expense;
    if (saved > 0) insights.push(`💰 You've kept ${rate}% of income this month — ${fmt(saved)} saved`);
    else insights.push(`⚠️ Spending exceeds income by ${fmt(-saved)} this month`);
  }

  // Month over month total spending
  if (prev.expense > 0 && cur.expense > 0) {
    const diff = cur.expense - prev.expense;
    const pct  = Math.abs(diff / prev.expense * 100).toFixed(0);
    if (diff > 0) insights.push(`📈 Spending up ${pct}% from last month (+${fmt(diff)})`);
    else insights.push(`📉 Spending down ${pct}% from last month (${fmt(diff)})`);
  }

  // Biggest category this month
  const cats = Object.entries(cur.bycat).sort((a, b) => b[1] - a[1]);
  if (cats.length > 0) insights.push(`🔺 Top spend: ${cats[0][0]} at ${fmt(cats[0][1])}`);

  // Monthly pace — only meaningful for the current month
  const currentM = localMonthKey();
  if (thisM === currentM) {
    const now2 = new Date();
    const day = now2.getDate();
    const daysInMonth = new Date(now2.getFullYear(), now2.getMonth() + 1, 0).getDate();
    if (cur.expense > 0 && day < daysInMonth) {
      const pace = (cur.expense / day * daysInMonth).toFixed(2);
      insights.push(`📅 At this pace, you'll spend ${fmt(parseFloat(pace))} this month`);
    }
  }

  return insights;
}

// ── debt payoff calculator ─────────────────────────────────────────────────
function calcDebtPayoff(owed, apr, monthlyPmt) {
  const pmt  = parseFloat(monthlyPmt || 0);
  const rate = parseFloat(apr || 0) / 100 / 12; // monthly interest rate
  if (!owed || owed <= 0 || pmt <= 0) return null;
  // If payment doesn't cover first month's interest, payoff is impossible
  if (rate > 0 && pmt <= owed * rate) return null;
  let bal               = owed;
  let months            = 0;
  let totalInterestPaid = 0;
  const MAX             = 600; // 50-year cap
  while (bal > 0.01 && months < MAX) {
    const monthlyInterest = rate > 0 ? bal * rate : 0;
    totalInterestPaid += monthlyInterest;
    bal = bal + monthlyInterest - pmt;
    if (bal < 0) bal = 0;
    months++;
  }
  if (months >= MAX) return null;
  const dt = new Date();
  dt.setMonth(dt.getMonth() + months);
  const totalPaid     = +(owed + totalInterestPaid).toFixed(2);
  const totalInterest = +(Math.max(0, totalInterestPaid)).toFixed(2);
  return {
    months,
    label:         dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    totalPaid,
    totalInterest,
  };
}

// ── debt ───────────────────────────────────────────────────────────────────
function renderDebt() {
  const creditAccts = state.accounts.filter(a => a.type === 'credit');
  const loanAccts   = state.accounts.filter(a => a.type === 'loan');
  const allDebt     = [...creditAccts, ...loanAccts];

  if (allDebt.length === 0) {
    return `<div class="page">
      <h1 class="page-title">Debt</h1>
      <p class="page-sub">credit cards &amp; loans</p>
      <div class="form-card" style="text-align:center;padding:32px 20px">
        <div style="margin-bottom:12px;color:var(--muted)">${_svg('<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>', 34)}</div>
        <p style="color:var(--muted);font-size:.9rem">No credit card or loan accounts yet.</p>
        <p style="color:var(--muted);font-size:.82rem;margin-top:6px">Go to Settings → Accounts and add an account with type <strong>Credit</strong> or <strong>Loan</strong>, then set the starting balance to what you currently owe.</p>
      </div>
    </div>`;
  }

  // Calculate owed amount for each account
  function getOwed(acct) {
    const d = JSON.parse(localStorage.getItem(accountDataKey(acct.id)) || '{}');
    const txns = d.transactions || [];
    const startingBal = parseFloat(d.startingBalance) || 0;
    let income = 0, expense = 0;
    for (const t of txns) { if (t.type === 'income') income += t.amount; else expense += t.amount; }
    return { owed: Math.max(0, startingBal + expense - income), txns, startingBal, income, expense };
  }

  const totalOwed = allDebt.reduce((s, a) => s + getOwed(a).owed, 0);
  const totalMinPmt = allDebt.reduce((s, a) => s + (getOwed(a).owed > 0 ? (parseFloat(a.monthly_payment) || 0) : 0), 0);

  // Determine which sub-tabs have accounts
  const hasCredit = creditAccts.length > 0;
  const hasLoans  = loanAccts.length  > 0;
  // Snap debtSubTab to a valid value
  if (debtSubTab === 'credit' && !hasCredit) debtSubTab = 'loan';
  if (debtSubTab === 'loan'   && !hasLoans)  debtSubTab = 'credit';

  const subNavHtml = (hasCredit && hasLoans) ? `
    <div class="debt-subnav">
      <button class="debt-pill${debtSubTab === 'credit' ? ' active' : ''}" data-sub="credit">${ICONS.card} Credit Cards</button>
      <button class="debt-pill${debtSubTab === 'loan'   ? ' active' : ''}" data-sub="loan">${ICONS.bank} Loans</button>
    </div>` : '';

  const acctList = debtSubTab === 'credit' ? creditAccts : loanAccts;

  const acctCards = acctList.map(acct => {
    const { owed, txns, startingBal } = getOwed(acct);
    const paidDown = Math.max(0, startingBal - owed);
    const pct      = startingBal > 0 ? Math.min(paidDown / startingBal * 100, 100) : 0;
    const barColor = pct >= 75 ? 'var(--success)' : pct >= 40 ? 'var(--warn)' : 'var(--accent)';

    // Payment transactions (income = paying down the debt)
    const payments = txns.filter(t => t.type === 'income').sort((a, b) => b.date.localeCompare(a.date));
    const lastPmt  = payments[0];

    const paymentRows = payments.slice(0, 20).map(t => `
      <div class="debt-txn-row">
        <span class="debt-txn-date">${t.date}</span>
        <span class="debt-txn-desc">${_escHtml(t.description || 'Payment')}</span>
        <span class="debt-txn-amt success">-${fmt(t.amount)}</span>
      </div>`).join('');

    // Charge/expense transactions
    const charges = txns.filter(t => t.type === 'expense').sort((a, b) => b.date.localeCompare(a.date));
    const chargeRows = charges.slice(0, 20).map(t => `
      <div class="debt-txn-row">
        <span class="debt-txn-date">${t.date}</span>
        <span class="debt-txn-desc">${_escHtml(t.description || t.category || '—')}</span>
        <span class="debt-txn-amt danger">+${fmt(t.amount)}</span>
      </div>`).join('');

    const progressHtml = startingBal > 0 ? `
      <div class="debt-progress-wrap">
        <div class="debt-progress-bg">
          <div class="debt-progress-fill" style="width:${pct.toFixed(1)}%;background:${barColor}"></div>
        </div>
        <div class="debt-progress-labels">
          <span style="color:var(--muted);font-size:.75rem">Paid: ${fmt(paidDown)} (${pct.toFixed(0)}%)</span>
          <span style="color:var(--muted);font-size:.75rem">Original: ${fmt(startingBal)}</span>
        </div>
      </div>` : '';

    const lastPmtHtml = lastPmt ? `
      <div class="debt-last-pmt">Last payment: <strong style="color:var(--success)">-${fmt(lastPmt.amount)}</strong> on ${lastPmt.date}</div>` : '';

    const _po = calcDebtPayoff(owed, acct.interest_rate, acct.monthly_payment);
    const _noPayoff = acct.monthly_payment && owed > 0 && !_po;
    const payoffHtml = _po
      ? `<div class="debt-payoff-row">
          <span class="debt-payoff-label">Est. payoff</span>
          <span class="debt-payoff-val" style="color:var(--success)">${_po.label}</span>
          <span class="debt-payoff-sub">${_po.months} mo · ${fmt(_po.totalInterest)} interest · ${fmt(_po.totalPaid)} total</span>
        </div>`
      : _noPayoff
        ? `<div class="debt-payoff-row" style="color:var(--warn)">⚠️ Monthly payment doesn't cover interest — increase it</div>`
        : '';

    return `
      <div class="debt-acct-card">
        <div class="debt-acct-header">
          <div class="debt-acct-name">${_escHtml(acct.name)}</div>
          <div class="debt-acct-type">${acct.type === 'loan' ? `${ICONS.bank} Loan` : `${ICONS.card} Credit`}</div>
        </div>
        <div class="debt-owed-row">
          <span class="debt-owed-label">OWED</span>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="debt-owed-value" style="color:${owed > 0 ? 'var(--danger)' : 'var(--success)'}">${fmt(owed)}</span>
            <button class="debt-bal-edit-btn" data-id="${acct.id}" data-starting="${startingBal}" title="Edit starting balance">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
        </div>
        ${progressHtml}
        ${lastPmtHtml}
        ${payoffHtml}
        <div class="debt-section-toggle" data-id="${acct.id}" data-section="payments">
          <span>Payments (${payments.length})</span><span class="debt-toggle-arrow">▼</span>
        </div>
        <div class="debt-txn-list hidden" id="debt-payments-${acct.id}">${paymentRows || '<p class="empty-msg">No payments recorded.</p>'}</div>
        ${charges.length ? `
        <div class="debt-section-toggle" data-id="${acct.id}" data-section="charges">
          <span>${acct.type === 'loan' ? 'Fees / Charges' : 'Charges'} (${charges.length})</span><span class="debt-toggle-arrow">▼</span>
        </div>
        <div class="debt-txn-list hidden" id="debt-charges-${acct.id}">${chargeRows}</div>` : ''}
      </div>`;
  }).join('');

  // ── payoff calculator ──────────────────────────────────────────────────────
  const payoffCalcHtml = (() => {
    const budget = parseFloat(debtMonthlyPay) || 0;
    // Build sorted debt list for the chosen strategy
    const debtList = allDebt.map(a => {
      const { owed } = getOwed(a);
      return { name: a.name, owed };
    }).filter(d => d.owed > 0);

    let resultHtml = '';
    if (budget > 0 && debtList.length > 0) {
      const sorted = [...debtList].sort((a, b) =>
        debtCalcMode === 'snowball' ? a.owed - b.owed : b.owed - a.owed);
      // Simulate month-by-month payoff
      const remaining = sorted.map(d => ({ ...d }));
      const payoffMonths = {};
      let month = 0;
      const MAX = 600;
      while (remaining.some(d => d.owed > 0.01) && month < MAX) {
        month++;
        let leftover = budget;
        for (const d of remaining) {
          if (d.owed <= 0) continue;
          const pay = Math.min(leftover, d.owed);
          d.owed -= pay;
          leftover -= pay;
          if (d.owed < 0.01 && !payoffMonths[d.name]) {
            const dt = new Date(); dt.setMonth(dt.getMonth() + month);
            payoffMonths[d.name] = { months: month, label: dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) };
          }
          if (leftover <= 0) break;
        }
      }
      const totalMonths = month >= MAX ? null : month;
      resultHtml = `
        <div class="debt-calc-results">
          ${sorted.map(d => {
            const r = payoffMonths[d.name];
            return `<div class="debt-calc-row">
              <span class="debt-calc-name">${d.name}</span>
              <span class="debt-calc-date" style="color:var(--success)">${r ? r.label : '50+ yrs'}</span>
            </div>`;
          }).join('')}
          ${totalMonths ? `<div class="debt-calc-total">🏁 Debt-free by <strong>${(() => { const dt = new Date(); dt.setMonth(dt.getMonth() + totalMonths); return dt.toLocaleDateString('en-US',{month:'long',year:'numeric'}); })()}</strong> (${totalMonths} mo)</div>` : '<div class="debt-calc-total" style="color:var(--warn)">Increase budget to pay off in under 50 years</div>'}
        </div>`;
    }

    return `
      <div class="debt-calc-card">
        <h2 class="section-title" style="margin:0 0 10px">Payoff Calculator</h2>
        <div class="debt-calc-strategy">
          <button class="debt-pill${debtCalcMode === 'snowball' ? ' active' : ''}" id="debt-calc-snowball">❄️ Snowball</button>
          <button class="debt-pill${debtCalcMode === 'avalanche' ? ' active' : ''}" id="debt-calc-avalanche">🏔️ Avalanche</button>
        </div>
        <div class="debt-calc-hint">${debtCalcMode === 'snowball' ? 'Smallest balance first — quick wins' : 'Largest balance first — total focus'}</div>
        <div class="form-row" style="margin:10px 0 0">
          <label class="form-label">Monthly payment budget ($)</label>
          <input type="number" id="debt-monthly-pay" class="form-input" placeholder="e.g. 500.00" value="${debtMonthlyPay}" step="0.01" inputmode="decimal">
        </div>
        ${resultHtml}
      </div>`;
  })();

  return `
    <div class="page">
      <h1 class="page-title">Debt</h1>
      <p class="page-sub">credit cards &amp; loans</p>
      <div class="debt-summary-card">
        <div class="debt-summary-label">TOTAL OWED</div>
        <div class="debt-summary-value" style="color:${totalOwed > 0 ? 'var(--danger)' : 'var(--success)'}">${fmt(totalOwed)}</div>
        <div class="debt-summary-sub">${allDebt.length} account${allDebt.length !== 1 ? 's' : ''}${totalMinPmt > 0 ? ` · ${fmt(totalMinPmt)}/mo minimum` : ''}</div>
      </div>
      ${payoffCalcHtml}
      ${subNavHtml}
      <div class="debt-acct-list">${acctCards}</div>
    </div>`;
}

function attachDebt() {
  // Sub-tab pills (credit/loan)
  document.querySelectorAll('.debt-pill[data-sub]').forEach(btn => {
    btn.addEventListener('click', () => { debtSubTab = btn.dataset.sub; render(); });
  });

  // Payoff calculator strategy buttons
  document.getElementById('debt-calc-snowball')?.addEventListener('click', () => { debtCalcMode = 'snowball'; render(); });
  document.getElementById('debt-calc-avalanche')?.addEventListener('click', () => { debtCalcMode = 'avalanche'; render(); });

  // Monthly payment input — re-calc on change
  document.getElementById('debt-monthly-pay')?.addEventListener('input', e => {
    debtMonthlyPay = e.target.value;
    // Debounce: wait 600ms then re-render
    clearTimeout(attachDebt._payTimer);
    attachDebt._payTimer = setTimeout(() => render(), 600);
  });

  // Edit starting balance (pencil icon on OWED row)
  document.querySelectorAll('.debt-bal-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id          = btn.dataset.id;
      const acct        = state.accounts.find(a => a.id === id);
      const currentStart = parseFloat(btn.dataset.starting) || 0;
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
      overlay.innerHTML = `
        <div style="background:var(--card);border-radius:20px;padding:24px 20px;max-width:320px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.6)">
          <div style="font-size:.95rem;font-weight:800;color:var(--text);margin-bottom:4px">${acct?.name || 'Account'}</div>
          <div style="font-size:.76rem;color:var(--muted);margin-bottom:18px;line-height:1.5">Update the original loan or credit balance. This sets the starting point — existing transactions are not changed.</div>
          <label style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);display:block;margin-bottom:5px">Starting Balance ($)</label>
          <div style="position:relative;margin-bottom:18px">
            <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none">$</span>
            <input type="number" id="debt-bal-inp" value="${currentStart.toFixed(2)}" inputmode="decimal" step="0.01" min="0"
              style="width:100%;background:var(--bg);border:2px solid var(--accent);border-radius:10px;padding:10px 10px 10px 26px;font-size:1.05rem;color:var(--text);font-family:var(--font-body);box-sizing:border-box">
          </div>
          <div style="display:flex;gap:10px">
            <button id="debt-bal-cancel" style="flex:1;background:var(--border);color:var(--text);border:none;border-radius:10px;padding:12px;font-size:.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body)">Cancel</button>
            <button id="debt-bal-save" style="flex:2;background:var(--accent);color:var(--btn-text,#000);border:none;border-radius:10px;padding:12px;font-size:.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body)">Save</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const inp = document.getElementById('debt-bal-inp');
      inp?.focus(); inp?.select();
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      document.getElementById('debt-bal-cancel')?.addEventListener('click', () => overlay.remove());
      document.getElementById('debt-bal-save')?.addEventListener('click', () => {
        const newBal = Math.max(0, parseFloat(inp?.value) || 0);
        const key = accountDataKey(id);
        const d   = JSON.parse(localStorage.getItem(key) || '{}');
        d.startingBalance = newBal;
        localStorage.setItem(key, JSON.stringify(d));
        overlay.remove();
        render();
      });
    });
  });

  // Expand/collapse payment and charge lists
  document.querySelectorAll('.debt-section-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const id      = toggle.dataset.id;
      const section = toggle.dataset.section;
      const list    = document.getElementById(`debt-${section}-${id}`);
      const arrow   = toggle.querySelector('.debt-toggle-arrow');
      if (!list) return;
      const open = list.classList.toggle('hidden');
      if (arrow) arrow.textContent = open ? '▼' : '▲';
    });
  });
}

// ── account picker ─────────────────────────────────────────────────────────
function renderAccountPicker() {
  // Deeper, lower-glare tones than the raw status palette — neon green/yellow washed out
  // in light mode and glared in dark mode. These keep the per-type coding but stay readable
  // as both the icon stroke and its tinted chip on either background.
  const TYPE_COLORS = { checking:'#4a82d6', savings:'#28a048', credit:'#e23b30', loan:'#b8910a', cash:'#2faf72', roth_ira:'#7568e8', traditional_ira:'#4a82d6', '401k':'#28a048', hsa:'#1aa99a' };
  let _assets = 0, _debts = 0;
  const acctInfo = state.accounts.map(acct => {
    const d        = JSON.parse(localStorage.getItem(accountDataKey(acct.id)) || '{}');
    const txns     = d.transactions || [];
    const startBal = parseFloat(d.startingBalance) || 0;
    let inc = 0, exp = 0;
    for (const t of txns) { if (t.type === 'income') inc += t.amount; else exp += t.amount; }
    const isDebt   = acct.type === 'credit' || acct.type === 'loan';
    const balance  = isDebt ? Math.max(0, startBal + exp - inc) : startBal + inc - exp;
    if (isDebt) _debts += balance; else _assets += balance;
    return { acct, isDebt, balance };
  });
  const rowHtml = ({ acct, isDebt, balance }) => {
    const balColor = isDebt ? 'var(--danger)' : (balance >= 0 ? 'var(--success)' : 'var(--danger)');
    const balLabel = isDebt ? `Owes ${fmt(balance)}` : fmt(balance);
    const typeLbl  = acct.type.charAt(0).toUpperCase() + acct.type.slice(1).replace('_', ' ');
    const stripe   = TYPE_COLORS[acct.type] || 'var(--accent)';
    const icon     = _ACCT_SVG[acct.type] || _ACCT_SVG.checking;
    return `
      <div class="acct-row" data-id="${acct.id}">
        <div class="acct-row-stripe" style="background:${stripe}"></div>
        <div class="acct-row-icon" style="color:${stripe}">${icon}</div>
        <div class="acct-row-info">
          <div class="acct-row-name">${_escHtml(acct.name)}</div>
          <div class="acct-row-type">${typeLbl}</div>
        </div>
        <div class="acct-row-right">
          <div class="acct-row-bal" style="color:${balColor}">${balLabel}</div>
        </div>
        <div class="acct-row-chevron">›</div>
      </div>`;
  };
  const GROUPS = [
    { label: 'Cash',      types: ['checking','savings','cash'] },
    { label: 'Investing', types: ['roth_ira','traditional_ira','401k','hsa'] },
    { label: 'Debt',      types: ['credit','loan'] },
  ];
  const _knownTypes = new Set(GROUPS.flatMap(g => g.types));
  const groupBlock = (label, items, isDebtGroup) => {
    if (!items.length) return '';
    const sub = items.reduce((s, x) => s + x.balance, 0);
    return `<div class="acct-grp"><span>${label}</span><span style="color:${isDebtGroup ? 'var(--danger)' : 'var(--muted)'}">${isDebtGroup ? '−' : ''}${fmt(sub)}</span></div>${items.map(rowHtml).join('')}`;
  };
  const rows = GROUPS.map(g => groupBlock(g.label, acctInfo.filter(x => g.types.includes(x.acct.type)), g.label === 'Debt')).join('')
    + groupBlock('Other', acctInfo.filter(x => !_knownTypes.has(x.acct.type)), false);

  const count = state.accounts.length;
  return `
    <div class="dawg-page acct-picker-page">
      <div class="dawg-hero acct-picker-hero">
        <div class="dawg-hero-glow"></div>
        <div class="acct-hero-inner">
          <div class="acct-hero-row">
            <div class="dawg-hero-dob acct-hero-dob">
              <img src="${mascotSrc()}" class="dawg-dob-idle" alt="">
              <img src="./maddawg.png"  class="dawg-dob-bark" alt="">
            </div>
            <div class="acct-hero-text">
              <div class="acct-picker-title">My Accounts</div>
              <div class="acct-picker-sub">${count} account${count !== 1 ? 's' : ''} · tap to open</div>
            </div>
          </div>
          <div class="acct-hero-foot">
            <div class="acct-picker-ver">
              <span class="acct-ver-dot${_latestVersion && _latestVersion !== VERSION ? ' stale' : ''}"></span>v${VERSION}${
                _latestVersion && _latestVersion !== VERSION
                  ? ` · <span style="color:var(--danger)">out of date</span>`
                  : _upToDate ? ` · <span style="color:var(--success)">up to date</span>` : ''
              }
            </div>
            ${_latestVersion && _latestVersion !== VERSION
              ? `<button id="acct-force-update-btn" class="acct-update-pill">↑ v${_latestVersion} — update</button>`
              : `<button id="acct-force-update-btn" class="acct-update-pill acct-update-pill--subtle">⟳ Check for update</button>`
            }
          </div>
        </div>
      </div>
      ${count ? (() => {
        const nw = _assets - _debts;
        const assetPct = (_assets + _debts) > 0 ? (_assets / (_assets + _debts) * 100) : 100;
        return `<div class="acct-nw2">
          <div class="acct-nw2-head">
            <span class="acct-nw2-label">NET WORTH</span>
            <span class="acct-nw2-value" style="color:${nw >= 0 ? 'var(--success)' : 'var(--danger)'}" data-countup="${nw}" data-countup-key="networth">${fmt(nw)}</span>
          </div>
          <div class="acct-nw2-meter">
            <i class="seg-a" style="width:${assetPct.toFixed(1)}%"></i>
            <i class="seg-d" style="width:${(100 - assetPct).toFixed(1)}%"></i>
          </div>
          <div class="acct-nw2-legend">
            <span style="color:var(--success)">${fmt(_assets)} assets</span>
            ${_debts > 0 ? `<span style="color:var(--danger)">${fmt(_debts)} debt</span>` : ''}
          </div>
        </div>`;
      })() : ''}
      <div class="acct-list acct-list-scroll">${rows}</div>
      <div class="acct-qa-bar">
        <button class="acct-qa-btn" id="acct-qa-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
          Track a Transaction
        </button>
      </div>
    </div>`;
}

// ── Color utility functions ────────────────────────────────────────────────
function _hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
function _rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
function _hexToHsl(hex) {
  if (!hex || hex.length < 7) return [160, 55, 55];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return _rgbToHsl(r, g, b);
}
function _hslToHex(h, s, l) {
  const [r, g, b] = _hslToRgb(h, s, l);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
function _drawColorWheel(canvas, lightness) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 1;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) { img.data[(y * w + x) * 4 + 3] = 0; continue; }
      const hue = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
      const sat = (dist / r) * 100;
      const [rv, gv, bv] = _hslToRgb(hue, sat, lightness);
      const i = (y * w + x) * 4;
      img.data[i] = rv; img.data[i + 1] = gv; img.data[i + 2] = bv; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
function _openColorPicker(currentHex, onApply) {
  document.getElementById('_cw')?.remove();
  const [initH, initS, initL] = _hexToHsl(currentHex || '#62b898');
  let pickH = initH, pickS = initS, pickL = Math.max(18, Math.min(82, initL));
  const WS = 220;

  const overlay = document.createElement('div');
  overlay.id = '_cw';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:11000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(6px)';

  const panel = document.createElement('div');
  panel.style.cssText = 'background:var(--card);border-radius:22px;padding:22px;width:264px;box-shadow:0 24px 80px rgba(0,0,0,.85);display:flex;flex-direction:column;align-items:center;gap:14px';

  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-size:.7rem;font-weight:700;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;align-self:flex-start';
  titleEl.textContent = 'Custom Accent Color';

  const wheelWrap = document.createElement('div');
  wheelWrap.style.cssText = 'position:relative;width:220px;height:220px;flex-shrink:0';

  const wheelCanvas = document.createElement('canvas');
  wheelCanvas.width = wheelCanvas.height = WS;
  wheelCanvas.style.cssText = 'width:220px;height:220px;display:block;border-radius:50%;cursor:crosshair;touch-action:none';
  wheelWrap.appendChild(wheelCanvas);

  const dot = document.createElement('div');
  dot.style.cssText = 'position:absolute;width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.7);pointer-events:none;transform:translate(-50%,-50%);transition:none';
  wheelWrap.appendChild(dot);

  const brightRow = document.createElement('div');
  brightRow.style.cssText = 'display:flex;align-items:center;gap:10px;width:100%';
  const brightLbl = document.createElement('span');
  brightLbl.style.cssText = 'font-size:.66rem;color:var(--muted);white-space:nowrap;min-width:64px';
  brightLbl.textContent = 'Brightness';
  const brightInput = document.createElement('input');
  brightInput.type = 'range'; brightInput.min = '18'; brightInput.max = '82';
  brightInput.value = String(pickL); brightInput.className = 'slider'; brightInput.style.flex = '1';
  brightRow.appendChild(brightLbl); brightRow.appendChild(brightInput);

  const previewRow = document.createElement('div');
  previewRow.style.cssText = 'display:flex;align-items:center;gap:14px;width:100%';
  const preview = document.createElement('div');
  preview.style.cssText = `width:52px;height:52px;border-radius:50%;background:${currentHex || '#62b898'};box-shadow:0 4px 20px rgba(0,0,0,.4);flex-shrink:0`;
  const hexLbl = document.createElement('div');
  hexLbl.style.cssText = 'font-size:.88rem;font-weight:700;color:var(--text);letter-spacing:.06em';
  hexLbl.textContent = (currentHex || '#62b898').toUpperCase();
  previewRow.appendChild(preview); previewRow.appendChild(hexLbl);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px;width:100%';
  const cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = 'flex:1;padding:12px;border-radius:12px;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);font-size:.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body)';
  cancelBtn.textContent = 'Cancel';
  const applyBtn = document.createElement('button');
  applyBtn.style.cssText = `flex:2;padding:12px;border-radius:12px;border:none;background:${currentHex || '#62b898'};color:#fff;font-size:.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body)`;
  applyBtn.textContent = 'Apply';
  btnRow.appendChild(cancelBtn); btnRow.appendChild(applyBtn);

  panel.append(titleEl, wheelWrap, brightRow, previewRow, btnRow);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  let curHex = currentHex || '#62b898';

  const updatePreview = () => {
    curHex = _hslToHex(pickH, pickS, pickL);
    preview.style.background = curHex;
    hexLbl.textContent = curHex.toUpperCase();
    applyBtn.style.background = curHex;
  };

  const positionDot = () => {
    const r2 = (WS / 2) - 1;
    const scale = 220 / WS;
    const dx = Math.cos(pickH * Math.PI / 180) * (pickS / 100) * r2;
    const dy = Math.sin(pickH * Math.PI / 180) * (pickS / 100) * r2;
    dot.style.left = ((WS / 2 + dx) * scale) + 'px';
    dot.style.top  = ((WS / 2 + dy) * scale) + 'px';
  };

  const pickFromPoint = (clientX, clientY) => {
    const rect = wheelCanvas.getBoundingClientRect();
    const scale = WS / rect.width;
    const cx = WS / 2, cy = WS / 2, r2 = cx - 1;
    let px = (clientX - rect.left) * scale;
    let py = (clientY - rect.top)  * scale;
    const ddx = px - cx, ddy = py - cy;
    const dist = Math.sqrt(ddx * ddx + ddy * ddy);
    if (dist > r2) { px = cx + (ddx / dist) * r2; py = cy + (ddy / dist) * r2; }
    pickH = ((Math.atan2(py - cy, px - cx) * 180 / Math.PI) + 360) % 360;
    pickS = Math.min((Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) / r2) * 100, 100);
    positionDot();
    updatePreview();
  };

  let dragging = false;
  const onMouseDown = e => { dragging = true; pickFromPoint(e.clientX, e.clientY); };
  const onMouseMove = e => { if (dragging) pickFromPoint(e.clientX, e.clientY); };
  const onMouseUp   = () => { dragging = false; };
  const onTouch = e => { e.preventDefault(); const t = e.touches[0] || e.changedTouches[0]; if (t) pickFromPoint(t.clientX, t.clientY); };
  wheelCanvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  wheelCanvas.addEventListener('touchstart', onTouch, { passive: false });
  wheelCanvas.addEventListener('touchmove',  onTouch, { passive: false });

  brightInput.addEventListener('input', () => {
    pickL = parseInt(brightInput.value);
    _drawColorWheel(wheelCanvas, pickL);
    updatePreview();
  });

  cancelBtn.addEventListener('click', () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); overlay.remove(); });
  applyBtn.addEventListener('click',  () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); overlay.remove(); onApply(curHex); });
  overlay.addEventListener('click', e => { if (e.target === overlay) { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); overlay.remove(); } });

  _drawColorWheel(wheelCanvas, pickL);
  positionDot();
  updatePreview();
}

// ── splash screen ──────────────────────────────────────────────────────────
function runSplash() {
  return new Promise(resolve => {
    const el        = document.getElementById('splash-screen');
    if (!el) return resolve();

    let done = false;

    const toggleBtn = document.getElementById('splash-anim-toggle');

    const startAnim = () => el.classList.add('splash-glitch-on');
    const stopAnim  = () => el.classList.remove('splash-glitch-on');

    const animPref = localStorage.getItem('splashAnim');
    const animOn   = animPref !== 'false';
    if (animOn) startAnim();

    if (toggleBtn) {
      toggleBtn.textContent = animOn ? '✦ hide effects' : '✦ show effects';
      toggleBtn.addEventListener('click', e => {
        e.stopPropagation();
        const currently = el.classList.contains('splash-glitch-on');
        if (currently) {
          stopAnim();
          localStorage.setItem('splashAnim', 'false');
          toggleBtn.textContent = '✦ show effects';
        } else {
          localStorage.setItem('splashAnim', 'true');
          toggleBtn.textContent = '✦ hide effects';
          startAnim();
        }
      });
    }

    const finish = () => {
      if (done) return;
      done = true;
      stopAnim();
      el.classList.add('dismiss');
      setTimeout(() => { el.remove(); resolve(); }, 450);
    };
    setTimeout(finish, 4200);
    el.addEventListener('click', finish, { once: true });
    setTimeout(() => { if (!done) { done = true; el.remove(); resolve(); } }, 6000);
  });
}

// ── render ─────────────────────────────────────────────────────────────────
const ANIM_CLASSES = ['anim-slide-right','anim-slide-left','anim-fade-up','anim-zoom-in','anim-zoom-out'];

// Selectors for every "card / row" element that should stagger in on page load.
// Delays are injected as inline animation styles so a single @keyframes (acctRowIn)
// covers all pages consistently.
const STAGGER_SEL = [
  '.dawg-section-card',
  '.dawg-balance-card',
  '.dawg-overview-card',
  '.dawg-breakdown-card',
  '.dawg-due-tile',
  '.dawg-txn-row',
  '.dawg-goal-row',
  '.ledger-row',
  '.bill-card',
  '.goal-card',
  '.debt-acct-card',
  '.budget-row',
  '.ret-acct-card',
  '.ret-dash-card',
  '.ret-proj-card',
  '.pw-txn-row',
  '.acct-row',
  '.challenge-card',
  '.form-card',
  '.acct-settings-card',
  '.week-tracker',
  '.ibp-card',
  '.budget-suggest-banner',
].join(',');

// Same cascade as the accounts page: fade + slide-in from left, staggered 50ms per item
function _applyStagger(container) {
  const root = container || document.getElementById('main-content');
  if (!root) return;
  root.querySelectorAll(STAGGER_SEL).forEach((el, i) => {
    const delay = (Math.min(i, 8) * 0.05).toFixed(2);
    el.style.animation = `acctRowIn .3s cubic-bezier(.22,1,.36,1) ${delay}s both`;
  });
}

function _applyPageTransition(main, oldHTML, transType) {
  // In-place re-render (e.g. editing/deleting a ledger row): no scroll reset, no animation.
  // The caller restores scrollTop after render() so the user stays where they were.
  if (transType === 'none') { _pageTransition = 'fade'; return; }
  // Always reset scroll to top on every navigation
  main.scrollTop = 0;
  // Reset global flag immediately so re-entrant calls default to fade
  _pageTransition = 'fade';

  // Cancel any still-running slide cleanup from a previous transition.
  // Restore real content so _oldHTML isn't the track wrapper on rapid re-nav.
  if (_slideCleanupTimer) {
    clearTimeout(_slideCleanupTimer);
    _slideCleanupTimer = null;
    if (_slidePendingHTML !== null) {
      const _m = document.getElementById('main-content');
      if (_m) { _m.style.overflow = ''; _m.innerHTML = _slidePendingHTML; }
      _slidePendingHTML = null;
    }
  }

  const isSlide = (transType === 'slide-right' || transType === 'slide-left') && oldHTML && oldHTML.trim();

  if (!isSlide) {
    // Non-slide: use existing CSS animation class approach
    main.classList.remove(...ANIM_CLASSES);
    void main.offsetWidth;
    if      (transType === 'zoom-in')  main.classList.add('anim-zoom-in');
    else if (transType === 'zoom-out') main.classList.add('anim-zoom-out');
    else                               main.classList.add('anim-fade-up');
    // *** Critical: strip the class once the animation ends so overflow:hidden
    // from anim-zoom-in/out never persists and blocks scrolling ***
    main.addEventListener('animationend', () => main.classList.remove(...ANIM_CLASSES), { once: true });
    // Stagger cards/rows in — runs in same JS task so browser paints initial
    // opacity:0 state before the animation begins (no flash)
    _applyStagger();
    return;
  }

  // ── True dual-panel slide ──────────────────────────────────────────────────
  // Two root problems with naive approaches:
  //   1. Setting main.innerHTML = newHTML fires a paint of the new page before
  //      the track is built → user sees a flash of the new content.
  //   2. void offsetWidth doesn't guarantee the browser commits a frame with the
  //      initial transform before the transition starts → abrupt snap.
  //
  // Fix:
  //   • Move the already-rendered new-content nodes (don't copy via innerHTML)
  //     into the incoming panel so the browser never paints new content solo.
  //   • Use double-rAF so frame 1 commits old-content-visible initial state,
  //     frame 2 kicks off the CSS transition → guaranteed smooth start.

  const isRight = transType === 'slide-right';
  const dur     = 340;
  const ease    = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const newHTML = main.innerHTML;           // capture for cleanup restore
  _slidePendingHTML = newHTML;
  // Use clientHeight without forcing a reflow via offsetHeight;
  // fall back to window.innerHeight if main hasn't painted yet
  const trackH  = main.clientHeight || window.innerHeight;

  // ── Build the incoming (new) panel by MOVING live nodes out of main ────────
  // This means the browser never gets a chance to paint main.innerHTML = newHTML
  // directly — those nodes go straight into the panel without an intermediate paint.
  const newPanel = document.createElement('div');
  newPanel.style.cssText = 'width:50%;flex-shrink:0;height:100%;overflow:hidden;';
  while (main.firstChild) newPanel.appendChild(main.firstChild);

  // ── Build the outgoing (old) panel from the captured HTML string ───────────
  const oldPanel = document.createElement('div');
  oldPanel.style.cssText = 'width:50%;flex-shrink:0;height:100%;overflow:hidden;';
  oldPanel.innerHTML = oldHTML;

  // ── Assemble 200%-wide flex track ─────────────────────────────────────────
  // isRight: [old | new], initial translateX(0)   → final translateX(-50%)
  // isLeft:  [new | old], initial translateX(-50%) → final translateX(0)
  const track = document.createElement('div');
  track.style.cssText = `display:flex;width:200%;height:${trackH}px;will-change:transform;transform:${isRight ? 'translateX(0)' : 'translateX(-50%)'};`;
  track.appendChild(isRight ? oldPanel : newPanel);
  track.appendChild(isRight ? newPanel : oldPanel);

  main.style.overflow = 'hidden';
  main.appendChild(track);

  // Stagger items in as the panel slides in — same cascade as accounts page.
  // This fires once here. Cleanup will freeze (not restart) the animations.
  _applyStagger(newPanel);

  // ── Double-rAF: commit initial transform before CSS transition fires ────────
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      track.style.transition = `transform ${dur}ms ${ease}`;
      track.style.transform  = isRight ? 'translateX(-50%)' : 'translateX(0)';
    });
  });

  // ── After animation: freeze stagger styles then move nodes (no innerHTML flash) ─
  _slideCleanupTimer = setTimeout(() => {
    _slideCleanupTimer = null;
    _slidePendingHTML  = null;
    // Clear inline animation so items stay at their final rendered state
    // (animation:none removes fill-mode, leaving element at natural opacity:1)
    newPanel.querySelectorAll(STAGGER_SEL).forEach(el => { el.style.animation = ''; });
    const frag = document.createDocumentFragment();
    while (newPanel.firstChild) frag.appendChild(newPanel.firstChild);
    main.innerHTML = '';
    main.style.overflow = '';
    main.appendChild(frag);
    attachHandlers();
    updateBillBadge();
    updateNotesBadge();
    updateDawgTopbar();
  }, dur + 84);
}

// Re-render the current tab without scrolling back to the top or replaying the page
// animation — used for in-place mutations (ledger edit/delete) so the user keeps position.
function rerenderKeepScroll() {
  const main = document.getElementById('main-content');
  const y = main ? main.scrollTop : 0;
  _pageTransition = 'none';
  render();
  const m2 = document.getElementById('main-content');
  if (m2) m2.scrollTop = y;
}

function render() {
  if (spendingChart) { spendingChart.destroy(); spendingChart = null; }
  if (_insightsChart) { _insightsChart.destroy(); _insightsChart = null; }
  const main = document.getElementById('main-content');
  const appEl = document.getElementById('app');

  // Capture old content + transition type BEFORE overwriting innerHTML
  const _oldHTML   = main ? main.innerHTML : '';
  const _transType = _pageTransition;

  if (showingAccountPicker) {
    appEl?.classList.add('picker-mode');
    main.innerHTML = renderAccountPicker();
    _applyPageTransition(main, _oldHTML, _transType);
    document.querySelectorAll('.acct-row').forEach(tile => {
      tile.addEventListener('click', async () => {
        // Glitch + press glow on tap, then transition
        tile.classList.remove('acct-row-glitch-tap');
        void tile.offsetWidth; // force reflow so animation restarts cleanly
        tile.classList.add('acct-row-tapped', 'acct-row-glitch-tap');
        await new Promise(r => setTimeout(r, 260)); // match acct-tap-glitch duration
        _navPush();
        _pageTransition = 'zoom-in';
        showingAccountPicker = false;        // set BEFORE switchAccount so its render() sees correct state
        await api.switchAccount(tile.dataset.id); // internally calls render() — no extra call needed
      });
    });
    document.getElementById('acct-force-update-btn')?.addEventListener('click', () => _showUpdateTerminal());
    document.getElementById('acct-qa-btn')?.addEventListener('click', _showFastAdd);
    document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="color"]):not([type="range"]):not([type="date"])').forEach(el => el.setAttribute('enterkeyhint', 'done'));
    _runCountUps(main);  // roll the Net Worth total
    updateDawgTopbar();
    return;
  }

  appEl?.classList.remove('picker-mode');

  // For slide transitions _applyPageTransition will move the live nodes out of
  // main into the sliding track — so main.innerHTML must already contain the
  // new content when it's called, but the browser must NOT have painted it yet.
  // All of this is synchronous JS, so no intermediate paint occurs.
  switch (currentTab) {
    case 'dashboard': main.innerHTML = renderDashboardDawg(); break;
    case 'add':       main.innerHTML = renderAdd();       break;
    case 'ledger':    main.innerHTML = renderLedger();    break;
    case 'weekly':    main.innerHTML = renderWeekly();    break;
    case 'bills':     main.innerHTML = renderBills();     break;
    case 'insights':  main.innerHTML = renderInsights();  break;
    case 'breakdown': main.innerHTML = renderBreakdown(); break;
    case 'report':    main.innerHTML = renderReport();    break;
    case 'debt':      main.innerHTML = renderDebt();      break;
    case 'goals':     main.innerHTML = renderGoals();     break;
    case 'import':    main.innerHTML = renderImport();    break;
    case 'budgets':     main.innerHTML = renderBudgets();     break;
    case 'challenges':  main.innerHTML = renderChallenges();  break;
    case 'retirement':  main.innerHTML = renderRetirement();  break;
    case 'accounts':    main.innerHTML = renderAccounts();    break;
    case 'notes':     main.innerHTML = renderNotes();     break;
    case 'wrapped':   main.innerHTML = renderWrapped();   break;
    case 'settings':  main.innerHTML = renderSettings();  break;
    case 'about':     main.innerHTML = renderAbout();     break;
  }
  _applyPageTransition(main, _oldHTML, _transType);
  if (!_slidePendingHTML) attachHandlers(); // slide transition calls attachHandlers() in its own cleanup; skip here to avoid attaching twice
  updateBillBadge();
  updateNotesBadge();
  updateDawgTopbar();
  // Negative balance warning — show once per session when dashboard is visible
  if (currentTab === 'dashboard' && !_shownNegativePopup) {
    const _curD  = state.accounts?.find(a => a.id === currentAccountId);
    const _isDbt = _curD?.type === 'credit' || _curD?.type === 'loan';
    if (!_isDbt) {
      const { income: _i, expense: _e } = totals();
      if ((state.startingBalance || 0) + _i - _e < 0) {
        _shownNegativePopup = true;
        setTimeout(showNegativeBalancePopup, 350); // slight delay so page renders first
      }
    }
  }
  // Show "Done" checkmark on mobile keyboard for all text/number inputs
  document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="color"]):not([type="range"]):not([type="date"])').forEach(el => el.setAttribute('enterkeyhint', 'done'));
}

// ── DAWG sparkline data ────────────────────────────────────────────────────
function getDawgSparklineData(range, maxDateStr = null) {
  // When browsing a past month, cap the graph at the end of that month
  const now = maxDateStr ? new Date(maxDateStr + 'T00:00:00') : new Date();
  now.setHours(0,0,0,0);
  let cutoff = null;
  if      (range === '1w') { cutoff = new Date(now); cutoff.setDate(now.getDate() - 7); }
  else if (range === '1m') { cutoff = new Date(now); cutoff.setMonth(now.getMonth() - 1); }
  else if (range === '3m') { cutoff = new Date(now); cutoff.setMonth(now.getMonth() - 3); }
  else if (range === '6m') { cutoff = new Date(now); cutoff.setMonth(now.getMonth() - 6); }
  else if (range === '1y') { cutoff = new Date(now); cutoff.setFullYear(now.getFullYear() - 1); }
  const allTxns = [...state.transactions].sort((a,b) => a.date.localeCompare(b.date));
  if (!allTxns.length && !state.startingBalance) return { labels:[], data:[] };
  const startDate = cutoff || (allTxns.length ? new Date(allTxns[0].date + 'T00:00:00') : new Date(now));
  const cutoffStr = startDate.toISOString().split('T')[0];
  let runBal = state.startingBalance || 0;
  allTxns.filter(t => t.date < cutoffStr).forEach(t => {
    runBal += t.type === 'income' ? t.amount : -t.amount;
  });
  const deltaMap = {};
  allTxns.filter(t => t.date >= cutoffStr).forEach(t => {
    deltaMap[t.date] = (deltaMap[t.date] || 0) + (t.type === 'income' ? t.amount : -t.amount);
  });
  const labels = [], data = [];
  const d = new Date(startDate);
  while (d <= now) {
    const ds = d.toISOString().split('T')[0];
    runBal += deltaMap[ds] || 0;
    labels.push(ds.slice(5));
    data.push(+runBal.toFixed(2));
    d.setDate(d.getDate() + 1);
  }
  return { labels, data };
}

// ── balance as of date ─────────────────────────────────────────────────────
function balanceAsOf(dateStr) {
  if (_balAsOfCache.ver !== _calcVer) _balAsOfCache = { ver: _calcVer, m: {} };
  if (dateStr in _balAsOfCache.m) return _balAsOfCache.m[dateStr];
  // Sum all transactions on or before dateStr
  let bal = state.startingBalance || 0;
  for (const t of state.transactions) {
    if (t.date <= dateStr) bal += t.type === 'income' ? t.amount : -t.amount;
  }
  _balAsOfCache.m[dateStr] = bal;
  return bal;
}

// ── Retirement account dashboard ───────────────────────────────────────────
function renderRetirementDashboard(acct) {
  const bal      = _retireBalance(acct.id);
  const ytd      = _ytdContributions(acct.id);
  const lim      = RETIRE_LIMITS[acct.type] || { base: 6000, label: acct.type };
  const curYear  = new Date().getFullYear();
  const age      = acct.birthYear ? curYear - parseInt(acct.birthYear) : null;
  const annualLimit = (age && age >= (lim.catchupAge || 50) && lim.catchup) ? lim.catchup : lim.base;
  const pct      = annualLimit > 0 ? Math.min(ytd / annualLimit * 100, 100) : 0;
  const bar      = _boostBar(pct);
  const isOver   = ytd > annualLimit;
  const remaining = Math.max(0, annualLimit - ytd);
  const RETIRE_COLORS = { roth_ira:'#7c6fff', traditional_ira:'#5b8de8', '401k':'#32d74b', hsa:'#2dd4bf' };
  const color    = RETIRE_COLORS[acct.type] || 'var(--accent)';
  const typeName = lim.label;

  // All-time contributions (all income transactions ever)
  const d = JSON.parse(localStorage.getItem(accountDataKey(acct.id)) || '{}');
  const allTxns  = d.transactions || [];
  const startBal = parseFloat(d.startingBalance) || 0;
  const allTimeContribs = allTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalInvested   = startBal + allTimeContribs;
  const growth          = Math.max(0, bal - totalInvested);

  // Projection using FV formula: compounds existing balance + ongoing contributions
  const rate    = (acct.expectedReturn != null ? acct.expectedReturn : 7) / 100 / 12;
  const retAge  = 65;
  const curAge  = age || 35;
  const months  = Math.max(0, (retAge - curAge) * 12);
  // Estimate monthly contribution from paycheck settings, falling back to annualised YTD
  let monthlyContrib = 0;
  const linkedAcct = state.accounts.find(a => a.id === acct.linkedPaycheckAcctId);
  if (linkedAcct?.paySchedule?.enabled) {
    const ps = linkedAcct.paySchedule;
    const gross = ps.grossAmount || 0;
    const periodsPerYear = { weekly:52, biweekly:26, semimonthly:24, monthly:12 }[ps.frequency] || 26;
    const empPerCheck   = (gross * (acct.myContribPct    || 0) / 100) + (acct.myContribAmt    || 0);
    const matchPerCheck = (gross * (acct.employerMatchPct || 0) / 100) + (acct.employerMatchAmt || 0);
    monthlyContrib = (empPerCheck + matchPerCheck) * periodsPerYear / 12;
  } else if (acct.contribSchedule?.enabled && acct.contribSchedule.amount) {
    const cs = acct.contribSchedule;
    const periodsPerYear = { weekly:52, biweekly:26, semimonthly:24, monthly:12 }[cs.frequency] || 12;
    monthlyContrib = cs.amount * periodsPerYear / 12;
  } else if (ytd > 0) {
    // Annualise YTD: divide by months elapsed so far this year
    const monthsElapsed = new Date().getMonth() + 1;
    monthlyContrib = (ytd / monthsElapsed);
  }
  let projected = bal;
  if (months > 0) {
    if (rate > 0) {
      const growth = Math.pow(1 + rate, months);
      projected = bal * growth + monthlyContrib * (growth - 1) / rate;
    } else {
      projected = bal + monthlyContrib * months;
    }
  }

  // Recent contributions (last 5 income txns)
  const recentContribs = allTxns
    .filter(t => t.type === 'income')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const recentRows = recentContribs.map(t => `
    <div class="ret-dash-contrib-row">
      <span class="ret-dash-contrib-date">${t.date}</span>
      <span class="ret-dash-contrib-desc">${_escHtml(t.description || 'Contribution')}</span>
      <span class="ret-dash-contrib-amt" style="color:var(--success)">+${fmt(t.amount)}</span>
    </div>`).join('');

  // Employer match card
  const hasMatch = acct.myContribPct != null || acct.employerMatchPct != null;
  const myPct    = parseFloat(acct.myContribPct)     || 0;
  const empPct   = parseFloat(acct.employerMatchPct) || 0;
  const matchHtml = hasMatch ? `
    <div class="ret-dash-card">
      <div class="ret-dash-card-title">Contribution Split</div>
      <div class="ret-dash-match-rows">
        ${acct.myContribPct != null ? `<div class="ret-dash-match-row">
          <span class="ret-dash-match-lbl">My Contribution</span>
          <span class="ret-dash-match-val">${myPct}%</span>
        </div>` : ''}
        ${acct.employerMatchPct != null ? `<div class="ret-dash-match-row">
          <span class="ret-dash-match-lbl">Employer Match</span>
          <span class="ret-dash-match-val" style="color:var(--success)">${empPct}%</span>
        </div>` : ''}
        ${(acct.myContribPct != null && acct.employerMatchPct != null) ? `<div class="ret-dash-match-row ret-dash-match-total">
          <span class="ret-dash-match-lbl">Total Effective Rate</span>
          <span class="ret-dash-match-val">${(myPct + empPct).toFixed(1)}%</span>
        </div>` : ''}
      </div>
    </div>` : '';

  return `<div class="dawg-page ret-dash-page">
    <div class="ret-dash-hero" style="--ret-color:${color};position:relative">
      <button class="dash-acct-edit-btn" id="dash-acct-edit" title="Edit account settings">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <div class="ret-dash-hero-glow"></div>
      <div class="ret-dash-acct-type" style="color:${color}">${typeName}</div>
      <div class="ret-dash-balance">${fmt(bal)}</div>
      <div class="ret-dash-bal-lbl">Portfolio Value</div>
      ${growth > 0 ? `<div class="ret-dash-growth-chip">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        +${fmt(growth)} growth
      </div>` : ''}
      <div class="dawg-sparkline-wrap ret-spark-wrap"><canvas id="dawg-sparkline"></canvas></div>
      <div class="dawg-time-btns ret-time-btns">
        <span class="dawg-tbtn-pill"></span>
        <button class="dawg-tbtn" data-range="1w">1W</button>
        <button class="dawg-tbtn dawg-tbtn-active" data-range="1m">1M</button>
        <button class="dawg-tbtn" data-range="3m">3M</button>
        <button class="dawg-tbtn" data-range="6m">6M</button>
        <button class="dawg-tbtn" data-range="1y">1Y</button>
        <button class="dawg-tbtn" data-range="all">ALL</button>
      </div>
    </div>

    <div class="ret-dash-grid">
      <div class="ret-dash-stat">
        <div class="ret-dash-stat-val">${fmt(totalInvested)}</div>
        <div class="ret-dash-stat-lbl">Total Invested</div>
      </div>
      <div class="ret-dash-stat">
        <div class="ret-dash-stat-val" style="color:${color}">${fmt(ytd)}</div>
        <div class="ret-dash-stat-lbl">${curYear} Contributions</div>
      </div>
      <div class="ret-dash-stat">
        <div class="ret-dash-stat-val">${fmt(remaining)}</div>
        <div class="ret-dash-stat-lbl">Limit Remaining</div>
      </div>
      <div class="ret-dash-stat">
        <div class="ret-dash-stat-val" style="color:var(--success)">${fmt(projected)}</div>
        <div class="ret-dash-stat-lbl">Projected @ ${retAge}</div>
      </div>
    </div>

    ${matchHtml}

    <div class="ret-dash-card">
      <div class="ret-dash-card-title">${curYear} IRS Limit</div>
      <div class="ret-dash-limit-row">
        <span class="ret-dash-limit-pct">${pct.toFixed(0)}%</span>
        <span class="ret-dash-limit-frac${isOver ? ' ret-over' : ''}">${fmt(ytd)} / ${fmt(annualLimit)}</span>
      </div>
      <div class="ret-bar-wrap"><div class="ret-bar" style="width:${bar}%;background:${isOver ? 'var(--danger)' : color}"></div></div>
      <div class="ret-contrib-remain" style="margin-top:5px">${isOver
        ? '<span style="color:var(--danger);font-weight:700">Over limit — consult a tax advisor</span>'
        : fmt(remaining) + ' remaining this year'}</div>
    </div>

    <div class="ret-dash-card">
      <div class="ret-dash-card-title">Recent Contributions</div>
      ${recentRows || '<p style="font-size:.82rem;color:var(--muted);text-align:center;padding:16px 0">No contributions recorded yet.</p>'}
    </div>

    <button class="ret-add-btn" id="ret-dash-add-contrib" style="margin-top:4px">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>Add Contribution
    </button>
  </div>`;
}

// ── Dashboard tile layout ──────────────────────────────────────────────────
const DASH_TILE_META = {
  'budget-week':    { label: 'Per Week Budget',      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="3"/></svg>` },
  'budget-day':     { label: 'Per Day Budget',       icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>` },
  'breakdown':      { label: 'Spending Breakdown',   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="18" x2="9" y2="18"/></svg>` },
  'goals':          { label: 'Savings Goals',        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>` },
  'transactions':   { label: 'Recent Transactions',  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>` },
  'networth':       { label: 'Net Worth',            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>` },
  'bills-upcoming': { label: 'Upcoming Bills',       icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>` },
  'debt-summary':   { label: 'Debt Summary',         icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>` },
  'weekly-plan':    { label: 'Weekly Plan Snapshot', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>` },
  'budgets-cats':   { label: 'Category Budgets',     icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>` },
  'monthly-stats':  { label: 'Monthly Stats',        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
  'quick-add':      { label: 'Quick Add',            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>` },
};
const DEFAULT_DASH_LAYOUT = [
  { id: 'budget-week',    size: 'half', visible: true  },
  { id: 'budget-day',     size: 'half', visible: true  },
  { id: 'breakdown',      size: 'full', visible: true  },
  { id: 'goals',          size: 'full', visible: true  },
  { id: 'transactions',   size: 'full', visible: true  },
  { id: 'networth',       size: 'full', visible: false },
  { id: 'bills-upcoming', size: 'full', visible: false },
  { id: 'debt-summary',   size: 'full', visible: false },
  { id: 'weekly-plan',    size: 'half', visible: false },
  { id: 'budgets-cats',   size: 'full', visible: false },
  { id: 'monthly-stats',  size: 'half', visible: false },
  { id: 'quick-add',      size: 'half', visible: false },
];
const DASH_PRESETS = {
  default:  [
    { id:'budget-week',    size:'half', visible:true  }, { id:'budget-day',     size:'half', visible:true  },
    { id:'breakdown',      size:'full', visible:true  }, { id:'goals',          size:'full', visible:true  },
    { id:'transactions',   size:'full', visible:true  },
    { id:'networth',       size:'full', visible:false }, { id:'bills-upcoming', size:'full', visible:false },
    { id:'debt-summary',   size:'full', visible:false }, { id:'weekly-plan',    size:'half', visible:false },
    { id:'budgets-cats',   size:'full', visible:false }, { id:'monthly-stats',  size:'half', visible:false },
    { id:'quick-add',      size:'half', visible:false },
  ],
  budget: [
    { id:'budget-week',    size:'full', visible:true  }, { id:'budget-day',     size:'full', visible:true  },
    { id:'breakdown',      size:'full', visible:true  }, { id:'budgets-cats',   size:'full', visible:true  },
    { id:'weekly-plan',    size:'half', visible:true  },
    { id:'monthly-stats',  size:'half', visible:true  }, { id:'transactions',   size:'half', visible:true  },
    { id:'goals',          size:'half', visible:true  }, { id:'bills-upcoming', size:'full', visible:false },
    { id:'networth',       size:'full', visible:false }, { id:'debt-summary',   size:'full', visible:false },
    { id:'quick-add',      size:'half', visible:false },
  ],
  compact: [
    { id:'budget-week',    size:'half', visible:true  }, { id:'budget-day',     size:'half', visible:true  },
    { id:'weekly-plan',    size:'half', visible:true  }, { id:'monthly-stats',  size:'half', visible:true  },
    { id:'quick-add',      size:'half', visible:true  }, { id:'bills-upcoming', size:'half', visible:true  },
    { id:'transactions',   size:'full', visible:true  }, { id:'breakdown',      size:'full', visible:false },
    { id:'goals',          size:'full', visible:false },
    { id:'networth',       size:'full', visible:false }, { id:'budgets-cats',   size:'full', visible:false },
    { id:'debt-summary',   size:'full', visible:false },
  ],
  spending: [
    { id:'breakdown',      size:'full', visible:true  }, { id:'budgets-cats',   size:'full', visible:true  },
    { id:'transactions',   size:'full', visible:true  }, { id:'budget-week',    size:'half', visible:true  },
    { id:'budget-day',     size:'half', visible:true  }, { id:'monthly-stats',  size:'half', visible:true  },
    { id:'goals',          size:'half', visible:false },
    { id:'networth',       size:'full', visible:false }, { id:'bills-upcoming', size:'full', visible:false },
    { id:'debt-summary',   size:'full', visible:false }, { id:'weekly-plan',    size:'half', visible:false },
    { id:'quick-add',      size:'half', visible:false },
  ],
};
// Curated dashboard for Simple (Tracker) mode: balance card + sparkline stay (baked in),
// plus a lean monthly summary, recent transactions, and quick-add. No budgeting tiles.
const SIMPLE_DASH_LAYOUT = [
  { id: 'monthly-stats',  size: 'full', visible: true  },
  { id: 'transactions',   size: 'full', visible: true  },
  { id: 'quick-add',      size: 'half', visible: true  },
];
function loadDashLayout() {
  if (isSimpleMode()) return SIMPLE_DASH_LAYOUT.map(t => ({...t}));
  const saved = loadSettings().dashLayout;
  if (!saved || !Array.isArray(saved)) return DEFAULT_DASH_LAYOUT.map(t => ({...t}));
  const out = saved.filter(t => DASH_TILE_META[t.id]);
  Object.keys(DASH_TILE_META).forEach(id => {
    if (!out.find(t => t.id === id)) out.push({...(DEFAULT_DASH_LAYOUT.find(d => d.id === id) || { id, size:'full', visible:false })});
  });
  return out;
}
function saveDashLayout(layout) {
  const s = loadSettings(); s.dashLayout = layout; saveSettings(s);
}
function enterDashEditMode() {
  if (document.getElementById('dash-edit-ov')) return;

  // Working copy of layout — includes ALL tiles (visible + hidden)
  let layout = loadDashLayout();
  Object.keys(DASH_TILE_META).forEach(id => {
    if (!layout.find(t => t.id === id))
      layout.push({ id, size: 'full', visible: false });
  });

  // ── SVG helpers ───────────────────────────────────────────────────────────
  const SVG_EXPAND   = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
  const SVG_COMPRESS = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
  const SVG_EYE      = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const SVG_EYE_OFF  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  const SVG_DRAG     = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>`;

  // ── Overlay shell ─────────────────────────────────────────────────────────
  const ov = document.createElement('div');
  ov.id = 'dash-edit-ov';
  ov.className = 'dash-edit-ov';
  document.body.appendChild(ov);

  // ── Build / rebuild the sheet contents ───────────────────────────────────
  function rebuild() {
    const tilesHtml = layout.map(t => {
      const meta   = DASH_TILE_META[t.id] || { label: t.id, icon: '' };
      const isFull = t.size === 'full';
      return `
        <div class="dem-tile${t.visible ? '' : ' dem-hidden'}" data-id="${t.id}" data-size="${t.size}">
          <div class="dem-drag-handle" title="Drag to reorder">${SVG_DRAG}</div>
          <div class="dem-tile-body">
            <span class="dem-tile-icon">${meta.icon || ''}</span>
            <span class="dem-tile-name">${meta.label}</span>
            ${!t.visible ? '<span class="dem-hidden-badge">Hidden</span>' : ''}
          </div>
          <div class="dem-tile-ctrls">
            <button class="dem-btn dem-size-btn" data-id="${t.id}" title="${isFull ? 'Make half-width' : 'Make full-width'}">
              ${isFull ? SVG_COMPRESS : SVG_EXPAND}
              <span>${isFull ? 'Full' : 'Half'}</span>
            </button>
            <button class="dem-btn dem-vis-btn${t.visible ? '' : ' dem-vis-off'}" data-id="${t.id}" title="${t.visible ? 'Hide' : 'Show'}">
              ${t.visible ? SVG_EYE : SVG_EYE_OFF}
            </button>
          </div>
        </div>`;
    }).join('');

    ov.innerHTML = `
      <div class="dash-edit-sheet" id="dash-edit-sheet">
        <div class="dem-grabber"></div>
        <div class="dem-hdr">
          <span class="dem-title">Customize Layout</span>
          <button class="dem-close" id="dem-close">✕</button>
        </div>
        <div class="dem-presets-row">
          <button class="dem-preset" data-preset="default">Default</button>
          <button class="dem-preset" data-preset="budget">Budget</button>
          <button class="dem-preset" data-preset="compact">Compact</button>
          <button class="dem-preset" data-preset="spending">Spending</button>
        </div>
        <p class="dem-hint">Drag to reorder · tap icons to resize or show/hide</p>
        <div class="dem-mockup-grid" id="dem-mockup-grid">${tilesHtml}</div>
        <div class="dem-footer">
          <button class="dem-done" id="dem-done">Done</button>
        </div>
      </div>`;

    attachHandlers();
  }

  // ── Sync layout array from current DOM order ──────────────────────────────
  function syncFromDOM() {
    const grid = ov.querySelector('#dem-mockup-grid');
    if (!grid) return;
    const dom = [...grid.querySelectorAll('.dem-tile')].map(el => {
      const id  = el.dataset.id;
      const old = layout.find(t => t.id === id) || {};
      return { id, size: el.dataset.size, visible: old.visible ?? true };
    });
    // Keep any tiles not rendered (safety net)
    layout.forEach(t => { if (!dom.find(d => d.id === t.id)) dom.push({...t}); });
    layout = dom;
  }

  // ── Event handlers ────────────────────────────────────────────────────────
  function attachHandlers() {
    // Backdrop close
    ov.addEventListener('click', e => { if (e.target === ov) exitEdit(false); }, { once: true });

    // X close
    ov.querySelector('#dem-close')?.addEventListener('click', () => exitEdit(false));

    // Preset pills
    ov.querySelectorAll('.dem-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        layout = (DASH_PRESETS[btn.dataset.preset] || DEFAULT_DASH_LAYOUT).map(t => ({...t}));
        rebuild();
      });
    });

    // Size toggle — update data attribute + layout, then refresh just that tile block
    ov.querySelectorAll('.dem-size-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const t  = layout.find(x => x.id === id);
        if (!t) return;
        t.size = t.size === 'full' ? 'half' : 'full';
        const tile = ov.querySelector(`.dem-tile[data-id="${id}"]`);
        if (tile) {
          tile.dataset.size = t.size;
          // Refresh just the controls label without full rebuild
          const isFull = t.size === 'full';
          btn.innerHTML = `${isFull ? SVG_COMPRESS : SVG_EXPAND}<span>${isFull ? 'Full' : 'Half'}</span>`;
          btn.title = isFull ? 'Make half-width' : 'Make full-width';
        }
      });
    });

    // Visibility toggle
    ov.querySelectorAll('.dem-vis-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const t  = layout.find(x => x.id === id);
        if (!t) return;
        t.visible = !t.visible;
        const tile = ov.querySelector(`.dem-tile[data-id="${id}"]`);
        if (tile) {
          tile.classList.toggle('dem-hidden', !t.visible);
          // Update badge
          tile.querySelector('.dem-hidden-badge')?.remove();
          if (!t.visible) {
            const body = tile.querySelector('.dem-tile-body');
            const badge = document.createElement('span');
            badge.className = 'dem-hidden-badge';
            badge.textContent = 'Hidden';
            body.appendChild(badge);
          }
          btn.classList.toggle('dem-vis-off', !t.visible);
          btn.innerHTML = t.visible ? SVG_EYE : SVG_EYE_OFF;
          btn.title = t.visible ? 'Hide' : 'Show';
        }
      });
    });

    // Done
    ov.querySelector('#dem-done')?.addEventListener('click', () => exitEdit(true));

    // Drag to reorder
    attachDrag(ov.querySelector('#dem-mockup-grid'));
  }

  // ── Drag-to-reorder within the mockup grid ───────────────────────────────
  function attachDrag(grid) {
    if (!grid) return;
    let dragging = null, ghost = null, pholder = null, offX = 0, offY = 0;
    let rafId = null, lastInsertKey = null;

    grid.addEventListener('pointerdown', e => {
      // Only initiate drag from the handle (makes accidental drags on buttons impossible)
      const handle = e.target.closest('.dem-drag-handle');
      const tile   = handle?.closest('.dem-tile');
      if (!tile) return;
      e.preventDefault();

      dragging = tile;
      const r = tile.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;

      // Ghost — scaled clone that follows the pointer
      ghost = tile.cloneNode(true);
      ghost.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:10002;pointer-events:none;opacity:.9;box-shadow:0 16px 48px rgba(0,0,0,.55);border-radius:14px;transform:scale(1.04);transition:transform .12s ease;`;
      document.body.appendChild(ghost);

      // Placeholder replaces the tile — only ONE slot used (no double-space)
      pholder = document.createElement('div');
      pholder.className = 'dem-pholder';
      pholder.dataset.size = tile.dataset.size;
      tile.replaceWith(pholder);  // tile is detached from grid

      lastInsertKey = null;
      grid.setPointerCapture(e.pointerId);
    });

    grid.addEventListener('pointermove', e => {
      if (!dragging || !ghost) return;
      const cx = e.clientX, cy = e.clientY;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!ghost) return;
        ghost.style.left = (cx - offX) + 'px';
        ghost.style.top  = (cy - offY) + 'px';

        // Find closest sibling tile and insert placeholder before/after it
        let best = null, bestDist = Infinity;
        grid.querySelectorAll('.dem-tile').forEach(w => {
          const r  = w.getBoundingClientRect();
          const my = (r.top + r.bottom) / 2;
          const d  = Math.abs(cy - my);
          if (d < bestDist) { bestDist = d; best = w; }
        });
        if (best) {
          const r   = best.getBoundingClientRect();
          const mcx = (r.left + r.right) / 2;
          const mcy = (r.top + r.bottom) / 2;
          let side;
          if (Math.abs(cy - mcy) < r.height * 0.45) {
            side = cx < mcx ? 'B' : 'A'; // same row — use X
          } else {
            side = cy < mcy ? 'B' : 'A';
          }
          const key = side + (best.dataset.key || best.dataset.tile || '');
          if (key !== lastInsertKey) {
            lastInsertKey = key;
            if (side === 'B') best.before(pholder); else best.after(pholder);
          }
        }
      });
    });

    function drop(commit) {
      if (!dragging) return;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      ghost?.remove(); ghost = null;
      if (pholder) {
        pholder.replaceWith(dragging); // always restore tile to grid
        if (commit) syncFromDOM();
      }
      pholder = null; dragging = null; lastInsertKey = null;
    }
    grid.addEventListener('pointerup',     () => drop(true));
    grid.addEventListener('pointercancel', () => drop(false));
  }

  // ── Exit ──────────────────────────────────────────────────────────────────
  function exitEdit(save) {
    ov.remove();
    if (save) { syncFromDOM(); saveDashLayout(layout); render(); }
  }

  rebuild();
}

// ── DAWG dashboard layout ──────────────────────────────────────────────────
// Shimmer placeholder shown briefly while switching accounts — mirrors the dashboard shape
function _dawgSkeleton() {
  return `<div class="dawg-skel">
    <div class="skbar" style="height:158px;margin-bottom:10px"></div>
    <div class="skbar-grid">
      <div class="skbar" style="height:92px"></div>
      <div class="skbar" style="height:92px"></div>
      <div class="skbar skbar-full" style="height:132px"></div>
      <div class="skbar skbar-full" style="height:120px"></div>
    </div>
  </div>`;
}


function renderDashboardDawg() {
  const _curAcctD = state.accounts.find(a => a.id === currentAccountId);
  const _isDebt   = _curAcctD?.type === 'credit' || _curAcctD?.type === 'loan';

  // Retirement accounts get their own focused dashboard — no budget/spending data
  if (_curAcctD && RETIRE_TYPES.includes(_curAcctD.type)) {
    return renderRetirementDashboard(_curAcctD);
  }

  const now      = new Date();
  const currentM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const isPastDash = dashMonth < currentM;
  const [dashYr, dashMo] = dashMonth.split('-').map(Number);
  // Last day of the browsed month (used for past-month balance and sparkline clipping)
  const dashMonthEndStr = new Date(dashYr, dashMo, 0).toISOString().split('T')[0];
  const balAsOfStr = isPastDash ? dashMonthEndStr : today();

  // Balance as of the end of the browsed month (not all-time live balance)
  let balance;
  if (_isDebt) {
    let _incUpTo = 0, _expUpTo = 0;
    for (const t of state.transactions) {
      if (t.date <= balAsOfStr) { if (t.type==='income') _incUpTo+=t.amount; else _expUpTo+=t.amount; }
    }
    balance = Math.max(0, (state.startingBalance||0) + _expUpTo - _incUpTo);
  } else {
    balance = balanceAsOf(balAsOfStr);
  }

  // Balance color: red if negative (non-debt), or debt color scale
  let balColor = 'var(--text)';
  if (!_isDebt && balance < 0) {
    balColor = 'var(--danger)';
  } else if (_isDebt) {
    const _limit = parseFloat(_curAcctD.credit_limit || 0);
    const _pct   = _limit > 0 ? Math.min(balance / _limit, 1) : (balance > 0 ? 1 : 0);
    const _hue   = Math.round(120 * (1 - _pct));
    balColor     = `hsl(${_hue},70%,${document.body.classList.contains('light')?'35%':'55%'})`;
  }
  // Payment due date for debt accounts (always based on today, not browsed month)
  let paymentDueStr = '';
  if (_isDebt && _curAcctD.payment_due_day) {
    const _day = parseInt(_curAcctD.payment_due_day);
    const _now = new Date(); _now.setHours(0,0,0,0);
    let _due = new Date(_now.getFullYear(), _now.getMonth(), _day);
    if (_due <= _now) _due = new Date(_now.getFullYear(), _now.getMonth()+1, _day);
    const _daysUntil = Math.round((_due - _now) / 86400000);
    paymentDueStr = _daysUntil === 0
      ? '⚠️ Payment due today!'
      : _daysUntil <= 3
        ? `⚠️ Payment due in ${_daysUntil} day${_daysUntil===1?'':'s'}`
        : `Payment due ${_due.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
  }
  const dashMonthLabel = new Date(dashYr, dashMo - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  // Monthly totals reflect the browsed month
  const { income: mInc, expense: mExp, bycat } = monthTotals(dashMonth);
  const monthDelta = mInc - mExp; // net for the browsed month (works for both debt and checking)
  const deltaColor = _isDebt
    ? (monthDelta > 0 ? 'var(--success)' : 'var(--muted)')
    : (monthDelta >= 0 ? 'var(--success)' : 'var(--danger)');
  const deltaArrow = monthDelta > 0 ? '▲' : '▼';
  // balLast = balance at end of month prior to dashMonth (for % delta calc)
  const prevMonthEndStr = new Date(dashYr, dashMo - 1, 0).toISOString().split('T')[0];
  const balLast = balanceAsOf(prevMonthEndStr);
  const deltaPct = balLast !== 0 ? Math.abs(monthDelta / Math.abs(balLast) * 100) : 0;
  const deltaStr = _isDebt
    ? (monthDelta > 0 ? `▼ ${fmt(monthDelta)} paid this month` : 'No payments this month')
    : `${deltaArrow} ${fmt(Math.abs(monthDelta))} (${deltaPct.toFixed(1)}%) this month`;

  // ── Budget overview ────────────────────────────────────────────────────────
  const _wp      = state.weekly_plan;
  const _wkNow   = new Date(); _wkNow.setHours(0,0,0,0);
  const _wkMon   = new Date(_wkNow);
  _wkMon.setDate(_wkNow.getDate() - (_wkNow.getDay() === 0 ? 6 : _wkNow.getDay() - 1));
  const _monStr  = _wkMon.toISOString().split('T')[0];
  const _todayStr2 = today();
  let _wkExp = 0, _wkInc = 0, _dayExp = 0, _dayInc = 0;
  for (const t of state.transactions) {
    if (t.date >= _monStr) {
      // Bills + user-flagged items are excluded from discretionary spend (matches planner).
      if (t.type === 'expense') { if (!isExcludedFromSpend(t)) { _wkExp += t.amount; if (t.date === _todayStr2) _dayExp += t.amount; } }
      else if (t.type === 'income') { _wkInc += t.amount; if (t.date === _todayStr2) _dayInc += t.amount; }
    }
  }
  // Spent stands on its own — what you spent this week/today stays put. Income does NOT
  // erase it; income only lifts the spendable balance (via _dashLiveBal below), i.e. how
  // much you're *able* to spend, never how much you've already spent.
  const weekSpent = _wkExp;
  const daySpent  = _dayExp;

  // Plan settings
  const { income: _dashTotalInc, expense: _dashTotalExp } = totals();
  const _dashLiveBal = (state.startingBalance || 0) + _dashTotalInc - _dashTotalExp;
  const _dashBills   = parseFloat(_wp?.bills   || 0) || 0;
  const _dashStopAt  = parseFloat(_wp?.stop_at || 0) || 0;
  // Month-based window — same math as the Weekly Planner so the per-week / per-day tiles match.
  const { daysLeft: _dashDays, weeksLeft: _dashWeeks } = monthWindow(_wkNow, _wkMon);
  const _dashAvail = Math.max(0, _dashLiveBal - _dashStopAt - _dashBills);

  // The committed per-week/day limit.
  // Priority: fresh live computation → budget_per_week → per_week → saved_date reconstruction
  // → start-of-week balance reconstruction (last resort when user dipped into buffer)
  const _getLimit = (weeks, days) => {
    if (_dashAvail > 0) return { week: _dashAvail / weeks, day: _dashAvail / days };
    const bpw = parseFloat(_wp?.budget_per_week) || parseFloat(_wp?.per_week) || 0;
    const bpd = parseFloat(_wp?.budget_per_day)  || parseFloat(_wp?.per_day)  || 0;
    // Derive per-day from per-week when budget_per_day was never seeded
    if (bpw > 0) return { week: bpw, day: bpd > 0 ? bpd : bpw / 7 };
    if (_wp?.saved_date) {
      const a = Math.max(0, balanceAsOf(_wp.saved_date) - _dashStopAt - _dashBills);
      if (a > 0) return { week: weeks > 0 ? a / weeks : 0, day: days > 0 ? a / days : 0 };
    }
    // Last resort: reconstruct from balance at the start of this week (before any spending this week).
    // This recovers the limit for users whose stored per_week was zeroed before budget_per_week was added.
    const _prevSun    = new Date(_wkMon); _prevSun.setDate(_wkMon.getDate() - 1);
    const _prevSunStr = _prevSun.toISOString().split('T')[0];
    const _wkStartAvail = Math.max(0, balanceAsOf(_prevSunStr) - _dashStopAt - _dashBills);
    if (_wkStartAvail > 0) return { week: weeks > 0 ? _wkStartAvail / weeks : 0, day: days > 0 ? _wkStartAvail / days : 0 };
    return { week: 0, day: 0 };
  };
  const { week: _livePerWeek, day: _livePerDay } = _getLimit(_dashWeeks, _dashDays);

  // Is the live balance already below the buffer floor?
  // When true, both budget tiles should show FAILED regardless of this week's spending.
  const _belowBuffer   = _dashLiveBal < (_dashStopAt + _dashBills);
  const _bufferDeficit = _belowBuffer ? Math.max(0, (_dashStopAt + _dashBills) - _dashLiveBal) : 0;

  const weekBudget = _livePerWeek;
  const totalBudget = weekBudget || Object.values(state.budgets||{}).reduce((s,v)=>s+(parseFloat(v)||0), 0);
  const budgetSpent = weekBudget && !isPastDash ? weekSpent : mExp;
  const budgetPct   = totalBudget > 0 ? Math.min(budgetSpent / totalBudget * 100, 100) : 0;
  const budgetColor = budgetPct >= 90 ? 'var(--danger)' : budgetPct >= 75 ? 'var(--warn)' : 'var(--accent)';
  const budgetLbl   = weekBudget ? 'weekly' : 'monthly';

  // Per-day budget (remaining weekly budget spread across days left this week) —
  // used by the budget-day tile color. The daily-history view now lives on the
  // Weekly Planner page (see buildDailyHistoryHTML / calcWeekly).
  const _todayDayIdx = Math.round((_wkNow - _wkMon) / 86400000);
  const _daysLeft    = Math.max(1, 7 - _todayDayIdx);
  const dayBudget    = _livePerWeek > 0 && !isPastDash
    ? Math.max(0, _livePerWeek - weekSpent) / _daysLeft
    : 0;
  const _ds           = loadSettings();
  const _showInsights = _ds.dawgInsights === true;

  const totalMExp     = Object.values(bycat).reduce((s,v)=>s+v, 0);
  const allCatEntries = Object.entries(bycat).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  // Dashboard preview: top 8 of the categories not hidden on the Breakdown page
  const catEntries    = allCatEntries.filter(([cat]) => !isCatHidden(cat)).slice(0, 8);
  const _si = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const catIcons = {
    'Food':          _si('<path d="M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6h5"/><path d="M21 22v-7"/>'),
    'Snacks':        _si('<circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.5" fill="currentColor" stroke="none"/><circle cx="10" cy="15.5" r="1.5" fill="currentColor" stroke="none"/>'),
    'Gas':           _si('<line x1="3" y1="22" x2="15" y2="22"/><line x1="4" y1="9" x2="14" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a1 1 0 0 0 2 0V9l-3-3"/>'),
    'Car':           _si('<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6A2 2 0 0 0 11.7 6H5a2 2 0 0 0-1.8 1.1L2.2 9.85A2 2 0 0 0 2 10.8V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>'),
    'Boat':          _si('<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>'),
    'Tools':         _si('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
    'Home':          _si('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
    'Transport':     _si('<rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'),
    'Housing':       _si('<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M2 22h20"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1"/>'),
    'Entertainment': _si('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M7 12v-2m0 4v-2m2-2h2"/>'),
    'Health':        _si('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
    'Shopping':      _si('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
    'Income':        _si('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'),
    'Other':         _si('<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'),
  };
  const _iconFallback = _si('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>');
  const _iconIncome   = catIcons['Income'];

  const spendHtml = catEntries.length ? catEntries.map(([cat,amt]) => {
    const pct      = totalMExp > 0 ? (amt/totalMExp*100).toFixed(0) : 0;
    const rawPct   = totalMExp > 0 ? amt/totalMExp*100 : 0;
    const barW     = _boostBar(rawPct);
    const catColor = CAT_COLORS[cat] || 'var(--accent)';
    return `<div class="dawg-cat-row">
      <span class="dawg-cat-icon">${catIcons[cat]||_iconFallback}</span>
      <span class="dawg-cat-name">${cat}</span>
      <div class="dawg-cat-bar-wrap"><div class="dawg-cat-bar" style="--cat-c:${catColor};width:${barW}%;background:${catColor}"></div></div>
      <span class="dawg-cat-amt">${fmt(amt)}</span>
      <span class="dawg-cat-pct">${pct}%</span>
    </div>`;
  }).join('') : (allCatEntries.length ? '<p class="dawg-empty">All categories hidden from preview — manage on the full breakdown page.</p>' : '<p class="dawg-empty">No spending this month</p>');

  const goals = state.goals || [];
  const goalsHtml = goals.slice(0,3).map(g => {
    const pct = g.target > 0 ? Math.min(g.current/g.target*100,100) : 0;
    return `<div class="dawg-goal-row">
      <div class="dawg-goal-icon">🎯</div>
      <div class="dawg-goal-info">
        <div class="dawg-goal-name">${_escHtml(g.name)}</div>
        <div class="dawg-goal-sub">${fmt(g.current)} / ${fmt(g.target)}</div>
      </div>
      <div class="dawg-goal-right">
        <div class="dawg-goal-bar-wrap"><div class="dawg-goal-bar" style="width:${pct.toFixed(1)}%"></div></div>
        <span class="dawg-goal-pct">${pct.toFixed(0)}%</span>
      </div>
    </div>`;
  }).join('');

  const todayStr = today();
  const yesterdayStr = new Date(Date.now()-86400000).toISOString().split('T')[0];
  const recentTxns = [...state.transactions]
    .filter(t => (_isDebt ? t.type === 'income' : true) && t.date.startsWith(dashMonth))
    .sort((a,b) => b.date.localeCompare(a.date) || (b.ts||0) - (a.ts||0))
    .slice(0, 10);
  const txnHtml = recentTxns.length ? recentTxns.map(t => {
    const isInc  = t.type === 'income';
    const color  = isInc ? 'var(--success)' : 'var(--danger)';
    const sign   = isInc ? '+' : '−';
    const icon   = isInc ? _iconIncome : (catIcons[t.category] || _iconFallback);
    const dlbl   = t.date === todayStr ? 'Today' : t.date === yesterdayStr ? 'Yesterday' : t.date.slice(5);
    return `<div class="dawg-txn-row">
      <div class="dawg-txn-icon">${icon}</div>
      <div class="dawg-txn-info">
        <div class="dawg-txn-desc">${_escHtml(t.description || t.category || '—')}</div>
        <div class="dawg-txn-date">${dlbl}</div>
      </div>
      <div class="dawg-txn-amt" style="color:${color}">${sign}${fmt(t.amount)}</div>
    </div>`;
  }).join('') : '<p class="dawg-empty">No transactions yet</p>';

  const multiAcct = state.accounts && state.accounts.length > 1;
  const _curAcct  = state.accounts.find(a => a.id === currentAccountId);
  const _acctName = _curAcct?.name || 'Account';
  return `<div class="dawg-page">
    ${backupBannerHtml()}
    <div class="dawg-hero">
      <div class="dawg-hero-glow"></div>
      <div class="dawg-hero-inner">
        ${heroTaglineHTML()}
        ${heroMascotHTML()}
      </div>
    </div>

    <div class="dawg-balance-card" style="position:relative">
      <button class="dash-privacy-btn${_amountsHidden() ? ' is-hidden' : ''}" id="dash-privacy-btn" title="${_amountsHidden() ? 'Show amounts' : 'Hide amounts'}" aria-label="Toggle balance privacy" aria-pressed="${_amountsHidden() ? 'true' : 'false'}">${_eyeIconSvg(_amountsHidden())}</button>
      <button class="dash-acct-edit-btn" id="dash-acct-edit" title="Edit account settings">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <div class="dawg-balance-label">${_isDebt ? (_curAcctD?.type==='loan' ? 'LOAN BALANCE' : 'BALANCE OWED') : 'TOTAL BALANCE'}</div>
      <div class="dawg-balance-amt" style="color:${balColor}" data-countup="${balance}" data-countup-key="balance-${currentAccountId}">${fmt(balance)}</div>
      ${paymentDueStr ? `<div class="dawg-balance-due" style="color:${parseInt(_curAcctD?.payment_due_day)>0&&Math.round((new Date(new Date().getFullYear(),new Date().getMonth(),parseInt(_curAcctD.payment_due_day))-new Date())/86400000)<=3?'var(--warn)':'var(--muted)'}">${paymentDueStr}</div>` : ''}
      ${_isDebt ? `<div class="dawg-balance-delta" style="color:${deltaColor}">${deltaStr}</div>` : ''}
      ${isPastDash ? '' : '<button id="dash-reconcile" class="dash-reconcile-btn"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>Reconcile to bank</button>'}
      <div class="dawg-sparkline-wrap"><canvas id="dawg-sparkline"></canvas></div>
      <div class="dawg-time-btns">
        <span class="dawg-tbtn-pill"></span>
        <button class="dawg-tbtn" data-range="1w">1W</button>
        <button class="dawg-tbtn dawg-tbtn-active" data-range="1m">1M</button>
        <button class="dawg-tbtn" data-range="3m">3M</button>
        <button class="dawg-tbtn" data-range="6m">6M</button>
        <button class="dawg-tbtn" data-range="1y">1Y</button>
        <button class="dawg-tbtn" data-range="all">ALL</button>
      </div>
    </div>

    <div class="dawg-month-nav">
      <button class="dawg-mnav-btn" id="dash-month-prev">‹</button>
      <span class="dawg-mnav-label">${dashMonthLabel}${isPastDash ? '' : ' · Now'}</span>
      <button class="dawg-mnav-btn dawg-mnav-next${!isPastDash ? ' dawg-mnav-disabled' : ''}" id="dash-month-next">›</button>
    </div>

    ${(() => {
      // Build tile HTML map — only tiles that have content get included
      const _tileHtml = {};

      // Budget tiles (only if weekly plan exists and not debt account)
      if (!_isDebt) {
        const C = 175.93;
        // ── Per-week tile: mirrors the planner's THIS WEEK tracker exactly ─────
        if (_livePerWeek > 0 || weekSpent > 0 || _belowBuffer) {
          const wkFailed = _belowBuffer || (_livePerWeek > 0 && weekSpent > _livePerWeek);
          const wkPct    = wkFailed ? 100 : (_livePerWeek > 0 ? Math.min(weekSpent / _livePerWeek * 100, 100) : (weekSpent > 0 ? 100 : 0));
          const wkColor  = wkFailed || wkPct >= 90 ? 'var(--danger)' : wkPct >= 80 ? 'var(--warn)' : 'var(--accent)';
          const wkDash   = (C * (1 - wkPct / 100)).toFixed(1);
          _tileHtml['budget-week'] = `
            <div class="dawg-card-title">BUDGET OVERVIEW</div>
            <div class="dawg-meter-head">
              <span class="dawg-tile-period">PER WEEK</span>
              <span class="dawg-meter-pct" style="color:${wkColor}">${wkFailed ? '⚠ OVER' : wkPct.toFixed(0) + '%'}</span>
            </div>
            <div class="dawg-meter"><i style="width:${Math.min(wkPct, 100).toFixed(1)}%;background:${wkColor}"></i></div>
            <div class="dawg-meter-amt">${fmt(weekSpent)} <span>/ ${fmt(_livePerWeek)}</span></div>
            ${wkFailed ? `<div class="dawg-tile-sub" style="color:var(--danger)">${_belowBuffer ? `−${fmt(_bufferDeficit)} below buffer` : `+${fmt(weekSpent - _livePerWeek)} over`}</div>` : ''}`;
        }
        // ── Per-day tile: adjusted daily allowance ───────────────────────────
        // = (current balance − buffer − bills) ÷ days left in the month. Uses the
        // live balance and remaining days, so it self-corrects daily: underspend
        // and tomorrow rises, overspend and it falls — landing on your buffer at
        // month end. ($0 while below the buffer floor.)
        const _perDayLimit = _dashAvail > 0 ? _dashAvail / _dashDays : 0;
        if (_perDayLimit > 0 || daySpent > 0 || _belowBuffer) {
          const dayFailed = _belowBuffer || (_perDayLimit > 0 && daySpent > _perDayLimit);
          const dayPct    = dayFailed ? 100 : (_perDayLimit > 0 ? Math.min(daySpent / _perDayLimit * 100, 100) : (daySpent > 0 ? 100 : 0));
          const dayColor  = dayFailed || dayPct >= 90 ? 'var(--danger)' : dayPct >= 75 ? 'var(--warn)' : 'var(--accent)';
          const dayDash   = (C * (1 - dayPct / 100)).toFixed(1);
          _tileHtml['budget-day'] = `
            <div class="dawg-card-title">BUDGET OVERVIEW</div>
            <div class="dawg-meter-head">
              <span class="dawg-tile-period">PER DAY</span>
              <span class="dawg-meter-pct" style="color:${dayColor}">${dayFailed ? '⚠ OVER' : dayPct.toFixed(0) + '%'}</span>
            </div>
            <div class="dawg-meter"><i style="width:${Math.min(dayPct, 100).toFixed(1)}%;background:${dayColor}"></i></div>
            <div class="dawg-meter-amt">${fmt(daySpent)} <span>/ ${fmt(_perDayLimit)}</span></div>
            ${dayFailed ? `<div class="dawg-tile-sub" style="color:var(--danger)">${_belowBuffer ? `−${fmt(_bufferDeficit)} below buffer` : `+${fmt(daySpent - _perDayLimit)} over`}</div>` : ''}`;
        }

      }

      // Spending breakdown
      if (_isDebt ? _curAcctD?.type !== 'loan' : true) {
        _tileHtml['breakdown'] = `
          <div class="dawg-card-title">SPENDING BREAKDOWN</div>
          <div class="dawg-cat-list dawg-cat-list--wide">${spendHtml}</div>
          <button class="dawg-view-btn" id="dawg-goto-breakdown">VIEW FULL BREAKDOWN ›</button>`;
      }

      // Debt details (always shown for debt accounts, not in layout grid — rendered separately below)
      const debtHtml = _isDebt ? (() => {
        const _payoff = calcDebtPayoff(balance, _curAcctD?.interest_rate, _curAcctD?.monthly_payment);
        const _noPayoff = _curAcctD?.monthly_payment && balance > 0 && !_payoff;
        return `<div class="dawg-section-card dawg-due-tile">
          <div class="dawg-section-hdr"><span class="dawg-card-title">DEBT DETAILS</span></div>
          <div class="dawg-due-body">
            ${paymentDueStr ? `<span class="dawg-due-date" style="color:${paymentDueStr.startsWith('⚠️')?'var(--warn)':'var(--text)'}">${paymentDueStr}</span>` : ''}
            ${_curAcctD?.interest_rate ? `<span class="dawg-due-apr">${_curAcctD.interest_rate}% APR</span>` : ''}
            ${_curAcctD?.monthly_payment ? `<span class="dawg-due-apr">${fmt(_curAcctD.monthly_payment)}/mo payment</span>` : ''}
          </div>
          ${_payoff ? `<div class="dawg-payoff-est">
            <span class="dawg-payoff-label">EST. PAYOFF</span>
            <span class="dawg-payoff-date">${_payoff.label}</span>
            <span class="dawg-payoff-sub">${_payoff.months} mo · ${fmt(_payoff.totalInterest)} in interest</span>
          </div>` : ''}
          ${_noPayoff ? `<div class="dawg-payoff-est" style="color:var(--warn)">⚠️ Payment doesn't cover interest — increase monthly payment</div>` : ''}
          ${!_curAcctD?.monthly_payment ? `<div style="font-size:.75rem;color:var(--muted);margin-top:6px">Set a monthly payment in Settings → Accounts to see payoff estimate</div>` : ''}
        </div>`;
      })() : '';

      // Goals
      if (goals.length) {
        _tileHtml['goals'] = `
          <div class="dawg-section-hdr">
            <span class="dawg-card-title">SAVINGS GOALS</span>
            <button class="dawg-view-all" id="dawg-goto-goals">VIEW ALL</button>
          </div>
          ${goalsHtml}`;
      }

      // Transactions
      {
        _tileHtml['transactions'] = `
          <div class="dawg-section-hdr">
            <span class="dawg-card-title">${isPastDash ? dashMonthLabel.toUpperCase() + ' TRANSACTIONS' : 'RECENT TRANSACTIONS'}</span>
            <button class="dawg-view-all" id="dawg-goto-txns">VIEW ALL</button>
          </div>
          ${recentTxns.length ? txnHtml : `<p class="dawg-empty">No transactions in ${dashMonthLabel}</p>`}`;
      }

      // Net worth
      if (!_isDebt) {
        const nw = getNetWorth();
        if (state.accounts.length >= 1) {
          _tileHtml['networth'] = `
            <div class="dawg-section-hdr"><span class="dawg-card-title">NET WORTH</span></div>
            <div style="font-size:1.4rem;font-weight:700;color:${nw.total >= 0 ? 'var(--success)' : 'var(--danger)'};margin-bottom:10px">${fmt(nw.total)}</div>
            ${nw.accounts.map(a => {
              const isDebtA = a.type === 'credit' || a.type === 'loan';
              return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">
                <span style="font-size:.82rem;color:var(--text)">${_escHtml(a.name)}${isDebtA ? `<span style="font-size:.7rem;color:var(--muted);margin-left:4px">(${a.type})</span>` : ''}</span>
                <span style="font-size:.82rem;font-weight:600;color:${a.balance >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(a.balance)}</span>
              </div>`;
            }).join('')}`;
        }
      }

      // Insights
      const insHtml = (() => {
        if (!_showInsights || _isDebt) return '';
        const ins = getSpendingInsights(dashMonth);
        if (!ins.length) return '';
        return `<div class="dawg-section-card" style="margin-bottom:14px">
          <div class="dawg-section-hdr"><span class="dawg-card-title">SPENDING INSIGHTS</span></div>
          ${ins.map(i => `<div style="font-size:.82rem;color:var(--text);padding:5px 0;border-bottom:1px solid var(--border);line-height:1.45">${i}</div>`).join('')}
        </div>`;
      })();

      // ── NEW TILES ──────────────────────────────────────────────────────────

      // Upcoming Bills
      {
        const _curMonth = localMonthKey();
        const _unpaid   = [...state.bills]
          .filter(b => !isBillPaidFor(b, _curMonth))
          .sort((a,b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay))
          .slice(0, 5);
        if (_unpaid.length) {
          const _billTotal = _unpaid.reduce((s,b) => s + b.amount, 0);
          const _billRows  = _unpaid.map(b => {
            const _d    = getDaysUntilDue(b.dueDay);
            const _col  = _d === 0 ? 'var(--danger)' : _d <= 3 ? 'var(--warn)' : 'var(--muted)';
            const _dlbl = _d === 0 ? 'TODAY' : _d === 1 ? 'TOMORROW' : `${_d}d`;
            return `<div class="dawg-bill-row">
              <span class="dawg-bill-name">${_escHtml(b.name)}</span>
              <span class="dawg-bill-due" style="color:${_col}">${_dlbl}</span>
              <span class="dawg-bill-amt">${fmt(b.amount)}</span>
            </div>`;
          }).join('');
          _tileHtml['bills-upcoming'] = `
            <div class="dawg-section-hdr">
              <span class="dawg-card-title">UPCOMING BILLS</span>
              <button class="dawg-view-all" id="dawg-goto-bills">VIEW ALL</button>
            </div>
            ${_billRows}
            <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0 0;border-top:1px solid var(--border);margin-top:4px">
              <span style="font-size:.72rem;color:var(--muted);letter-spacing:.04em">TOTAL UPCOMING</span>
              <span style="font-size:.88rem;font-weight:700;color:var(--text)">${fmt(_billTotal)}</span>
            </div>`;
        }
      }

      // Debt Summary
      {
        const _nwAll    = getNetWorth();
        const _debtAcct = _nwAll.accounts.filter(a => a.type === 'credit' || a.type === 'loan');
        if (_debtAcct.length) {
          const _totalOwed = _debtAcct.reduce((s,a) => s + Math.abs(a.balance), 0);
          const _debtRows  = _debtAcct.map(a => {
            const _owed = Math.abs(a.balance);
            const _col  = _owed > 0 ? 'var(--danger)' : 'var(--success)';
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">
              <div style="min-width:0;flex:1">
                <span style="font-size:.82rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_escHtml(a.name)}</span>
                <span style="font-size:.68rem;color:var(--muted);margin-left:4px;text-transform:capitalize">${a.type}</span>
              </div>
              <span style="font-size:.82rem;font-weight:700;color:${_col};flex-shrink:0;margin-left:8px">${_owed > 0 ? fmt(_owed) : '✓ Paid off'}</span>
            </div>`;
          }).join('');
          _tileHtml['debt-summary'] = `
            <div class="dawg-section-hdr">
              <span class="dawg-card-title">DEBT SUMMARY</span>
              <button class="dawg-view-all" id="dawg-goto-debt">VIEW ALL</button>
            </div>
            ${_debtRows}
            <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0 0;border-top:1px solid var(--border);margin-top:2px">
              <span style="font-size:.72rem;color:var(--muted);letter-spacing:.04em">TOTAL OWED</span>
              <span style="font-size:.88rem;font-weight:700;color:${_totalOwed>0?'var(--danger)':'var(--success)'}">${_totalOwed > 0 ? fmt(_totalOwed) : '✓ Debt free!'}</span>
            </div>`;
        }
      }

      // Weekly Plan Snapshot — month-based, mirrors the Weekly Planner page
      {
        const _perDay   = _livePerDay;                 // available ÷ days left this month
        const _billAmt  = parseFloat(_wp?.bills || 0);
        if (!isPastDash && (_perDay > 0 || _dashAvail > 0 || _billAmt > 0)) {
          const _monName = _wkNow.toLocaleDateString('en-US', { month: 'long' });
          const _overDay = _perDay > 0 && daySpent > _perDay;
          const _pdColor = _overDay ? 'var(--danger)'
            : dayBudget > 0
              ? (daySpent / dayBudget >= 0.75 ? 'var(--warn)' : 'var(--accent)')
              : 'var(--accent)';
          const _perDayDisplay = _overDay
            ? `<span class="dash-glitch-failed" style="font-size:1rem;font-weight:700;color:var(--danger);letter-spacing:.06em">FAILED</span>`
            : `<span style="font-size:1rem;font-weight:700;color:${_pdColor}">${_perDay > 0 ? fmt(_perDay) : '—'}</span>`;
          _tileHtml['weekly-plan'] = `
            <div class="dawg-card-title">WEEKLY PLAN</div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:.72rem;color:var(--muted)">THIS MONTH</span>
                <span style="font-size:.88rem;font-weight:700;color:var(--accent)">${fmt(_dashAvail)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:.72rem;color:var(--muted)">PER DAY</span>
                ${_perDayDisplay}
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:.72rem;color:var(--muted)">SPENT TODAY</span>
                <span style="font-size:.88rem;font-weight:600;color:var(--text)">${fmt(daySpent)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:.72rem;color:var(--muted)">DAYS LEFT IN ${_monName.toUpperCase()}</span>
                <span style="font-size:.88rem;font-weight:600;color:var(--text)">${_dashDays}</span>
              </div>
              ${_billAmt > 0 ? `<div style="display:flex;justify-content:space-between;align-items:center;padding-top:4px;border-top:1px solid var(--border)">
                <span style="font-size:.72rem;color:var(--muted)">BILLS RESERVED</span>
                <span style="font-size:.78rem;color:var(--warn)">${fmt(_billAmt)}</span>
              </div>` : ''}
            </div>
            <button class="dawg-view-btn" id="dawg-goto-weekly">UPDATE PLAN ›</button>`;
        }
      }

      // Category Budgets
      {
        const _budgets = state.budgets || {};
        const _budgetCats = Object.entries(_budgets).filter(([,v]) => parseFloat(v) > 0);
        if (_budgetCats.length) {
          const _catSpend = {};
          state.transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(dashMonth))
            .forEach(t => { _catSpend[t.category] = (_catSpend[t.category] || 0) + t.amount; });
          const _bcRows = _budgetCats.map(([cat, cap]) => {
            const _spent  = _catSpend[cat] || 0;
            const _limit  = parseFloat(cap);
            const _pct    = _limit > 0 ? Math.min(_spent / _limit * 100, 100) : 0;
            const _color  = _pct >= 100 ? 'var(--danger)' : _pct >= 75 ? 'var(--warn)' : 'var(--accent)';
            const _barW   = _boostBar(_pct);
            return `<div class="dawg-bcat-row">
              <span class="dawg-bcat-name"><span class="dawg-bcat-icon">${catIcons[cat]||_iconFallback}</span>${cat}</span>
              <div class="dawg-bcat-bar-wrap"><div class="dawg-bcat-bar" style="width:${_barW}%;background:${_color}"></div></div>
              <span class="dawg-bcat-amt" style="color:${_color}">${fmt(_spent)}<span style="color:var(--muted);font-weight:400"> /${fmt(_limit)}</span></span>
            </div>`;
          }).join('');
          _tileHtml['budgets-cats'] = `
            <div class="dawg-section-hdr">
              <span class="dawg-card-title">CATEGORY BUDGETS</span>
              <button class="dawg-view-all" id="dawg-goto-budgets-page">MANAGE</button>
            </div>
            ${_bcRows}`;
        }
      }

      // Monthly Stats
      {
        const _mNet = mInc - mExp;
        _tileHtml['monthly-stats'] = `
          <div class="dawg-card-title">MONTHLY STATS</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:.72rem;color:var(--muted)">INCOME</span>
              <span style="font-size:.9rem;font-weight:700;color:var(--success)">+${fmt(mInc)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:.72rem;color:var(--muted)">EXPENSES</span>
              <span style="font-size:.9rem;font-weight:700;color:var(--danger)">-${fmt(mExp)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:5px;border-top:1px solid var(--border)">
              <span style="font-size:.72rem;color:var(--muted)">NET</span>
              <span style="font-size:1rem;font-weight:700;color:${_mNet >= 0 ? 'var(--success)' : 'var(--danger)'}">${_mNet >= 0 ? '+' : ''}${fmt(_mNet)}</span>
            </div>
          </div>`;
      }

      // Quick Add
      {
        _tileHtml['quick-add'] = `
          <div class="dawg-card-title">QUICK ADD</div>
          <div class="dawg-qa-wrap">
            <button class="dawg-qa-btn dawg-qa-expense" id="dawg-qa-expense">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              EXPENSE
            </button>
            <button class="dawg-qa-btn dawg-qa-income" id="dawg-qa-income">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 17 12 12 17 17"/><polyline points="7 11 12 6 17 11"/></svg>
              INCOME
            </button>
          </div>`;
      }

      // Build the tile grid from layout
      const layout = loadDashLayout();
      const gridHtml = layout.filter(t => t.visible && _tileHtml[t.id]).map(t => {
        const isTile = (t.id === 'budget-week' || t.id === 'budget-day');
        const cls = isTile ? 'dawg-budget-tile' : 'dawg-section-card';
        return `<div class="dawg-tile-wrap ${cls}" data-id="${t.id}" data-size="${t.size}">${_tileHtml[t.id]}</div>`;
      }).join('');

      return `
        ${debtHtml}
        <div class="dawg-tile-grid" id="dawg-tile-grid">${gridHtml}</div>
        <button class="dash-layout-btn" id="dash-layout-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Customize Layout
        </button>
        ${insHtml}`;
    })()}
  </div>`;
}

// ── dashboard ──────────────────────────────────────────────────────────────
// ── income budget planner ──────────────────────────────────────────────────
function getIncomeBudgetPlan() {
  const acct = state.accounts.find(a => a.id === currentAccountId);
  const ps   = acct?.paySchedule;
  if (!ps?.enabled || !ps.amount) return null;

  const monthlyIncome = ps.amount * _payMonthlyMultiplier(ps.frequency);
  const totalBills    = state.bills.reduce((s, b) => s + b.amount, 0);
  const savings       = Math.round(monthlyIncome * 0.20 / 5) * 5;
  const disposable    = Math.max(0, monthlyIncome - totalBills - savings);

  // Spending split of disposable income
  const splits = {
    Food:           0.26,
    Gas:            0.12,
    Car:            0.13,
    Home:           0.14,
    Entertainment:  0.10,
    Health:         0.09,
    Tools:          0.06,
    Boat:           0.04,
    Other:          0.06,
  };
  const suggestions = {};
  for (const [cat, pct] of Object.entries(splits)) {
    const v = Math.round(disposable * pct / 5) * 5;
    if (v > 0) suggestions[cat] = v;
  }

  return {
    monthlyIncome,
    perPaycheck: ps.amount,
    frequency:   ps.frequency,
    totalBills,
    savings,
    disposable,
    suggestions,
  };
}

// ── budgets ────────────────────────────────────────────────────────────────
const _BUDGET_PRESETS = {
  Food:          400,
  Gas:           150,
  Car:           200,
  Boat:          100,
  Tools:         75,
  Home:          300,
  Entertainment: 100,
  Health:        100,
  Other:         150,
};

function getSmartBudgetSuggestions() {
  const now = new Date();
  // Build a Set of the 3 prior month prefixes for fast membership test
  const monthSet = new Set();
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthSet.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  // Single pass: accumulate per-category totals keyed by "cat|month"
  const byKey = {};
  for (const t of state.transactions) {
    if (t.type !== 'expense') continue;
    const m = t.date.slice(0, 7);
    if (!monthSet.has(m)) continue;
    const k = `${t.category}|${m}`;
    byKey[k] = (byKey[k] || 0) + t.amount;
  }
  const calculated = {};
  for (const cat of getCategories()) {
    const monthlySums = [...monthSet].map(m => byKey[`${cat}|${m}`] || 0).filter(v => v > 0);
    if (monthlySums.length >= 1) {
      const avg = monthlySums.reduce((s,v) => s+v, 0) / monthlySums.length;
      calculated[cat] = Math.ceil(avg / 5) * 5;
    }
  }

  if (Object.keys(calculated).length > 0) {
    return { suggestions: calculated, isPreset: false };
  }

  // No history yet — return sensible starter defaults for built-in categories only
  const presets = {};
  for (const cat of getCategories()) {
    if (_BUDGET_PRESETS[cat]) presets[cat] = _BUDGET_PRESETS[cat];
  }
  return { suggestions: presets, isPreset: true };
}

function renderBudgets() {
  const m = localMonthKey();
  const { bycat } = monthTotals(m);

  // ── Income Budget Planner card ───────────────────────────────────────────
  const plan = getIncomeBudgetPlan();
  const freqLabel = { weekly:'week', biweekly:'2 weeks', semimonthly:'semi-month', monthly:'month' };
  const planHtml = plan ? (() => {
    const rows = Object.entries(plan.suggestions).map(([cat, amt]) => {
      const pct      = plan.disposable > 0 ? Math.round(amt / plan.disposable * 100) : 0;
      const catColor = CAT_COLORS[cat] || '#9896a4';
      return `<div class="ibp-row">
        <span class="cat-dot" style="background:${catColor}"></span>
        <span class="ibp-cat">${cat}</span>
        <div class="ibp-bar-wrap"><div class="ibp-bar" style="width:${_boostBar(pct)}%;background:${catColor}"></div></div>
        <span class="ibp-pct">${pct}%</span>
        <span class="ibp-amt">${fmt(amt)}</span>
        <button class="budget-suggest-apply ibp-apply" data-cat="${cat}" data-amt="${amt}" style="padding:3px 8px;font-size:.68rem">Apply</button>
      </div>`;
    }).join('');
    return `
    <div class="ibp-card">
      <div class="ibp-hdr">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Income Budget Planner
      </div>
      <div class="ibp-income-row">
        <div class="ibp-income-block">
          <span class="ibp-income-lbl">Per paycheck</span>
          <span class="ibp-income-val">${fmt(plan.perPaycheck)}</span>
          <span class="ibp-income-sub">every ${freqLabel[plan.frequency]||plan.frequency}</span>
        </div>
        <div class="ibp-income-block">
          <span class="ibp-income-lbl">Monthly est.</span>
          <span class="ibp-income-val">${fmt(plan.monthlyIncome)}</span>
          <span class="ibp-income-sub">gross</span>
        </div>
        <div class="ibp-income-block">
          <span class="ibp-income-lbl">After bills</span>
          <span class="ibp-income-val" style="color:var(--accent)">${fmt(plan.disposable + plan.savings)}</span>
          <span class="ibp-income-sub">−${fmt(plan.totalBills)} bills</span>
        </div>
      </div>
      <div class="ibp-savings-row">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0H5m14 0h2M5 21H3m2 0v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/></svg>
        Suggested savings: <strong>${fmt(plan.savings)}/mo</strong>
        <span style="color:var(--muted);font-size:.7rem"> (20% of income)</span>
      </div>
      <p style="font-size:.72rem;color:var(--muted);margin-bottom:8px">Remaining ${fmt(plan.disposable)} split across spending categories:</p>
      <div class="ibp-rows">${rows}</div>
      <button id="ibp-apply-all" class="btn-primary" style="width:100%;margin-top:10px;font-size:.82rem">Apply All to Budget Limits</button>
    </div>`;
  })() : '';

  const { suggestions, isPreset } = getSmartBudgetSuggestions();
  const hasSuggestions = Object.keys(suggestions).length > 0;
  const suggestionsHtml = hasSuggestions ? `
    <div class="budget-suggest-banner${isPreset ? ' budget-suggest-preset' : ''}">
      <div class="budget-suggest-hdr">
        ${isPreset
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Starter Budget Pack`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
            Smart Suggestions`
        }
        <span style="font-size:.75rem;font-weight:500;color:var(--muted)">
          ${isPreset ? 'common starting points — adjust to your life' : 'based on your last 3 months'}
        </span>
      </div>
      ${isPreset ? `<p style="font-size:.75rem;color:var(--muted);margin-bottom:10px;line-height:1.4">No spending history yet. Here are reasonable defaults to get you started — apply any and edit the numbers to fit your situation.</p>` : ''}
      <div class="budget-suggest-chips">
        ${Object.entries(suggestions).map(([cat, amt]) => {
          const catColor = CAT_COLORS[cat] || '#9896a4';
          return `<div class="budget-suggest-chip">
            <span class="cat-dot" style="background:${catColor}"></span>
            <span class="budget-suggest-cat">${cat}</span>
            <span class="budget-suggest-amt">${fmt(amt)}</span>
            <button class="budget-suggest-apply" data-cat="${cat}" data-amt="${amt}">Apply</button>
          </div>`;
        }).join('')}
      </div>
      <button id="budget-apply-all" class="btn-secondary" style="margin-top:10px;width:100%">${isPreset ? 'Apply All Defaults' : 'Apply All Suggestions'}</button>
    </div>` : '';
  const rows = getCategories().map(cat => {
    const spent    = bycat[cat] || 0;
    const limit    = parseFloat(state.budgets[cat] || 0);
    const pct      = limit > 0 ? Math.min(spent / limit * 100, 100) : 0;
    const catColor = CAT_COLORS[cat] || '#9896a4';
    const barColor = pct >= 90 ? 'var(--danger)' : pct >= 75 ? 'var(--warn)' : catColor;
    const progressHtml = limit > 0 ? `
      <div class="budget-progress-wrap">
        <div class="breakdown-bar-bg small"><div class="breakdown-bar-fill" style="width:${_boostBar(pct)}%;background:${barColor}"></div></div>
        <span class="budget-spent-lbl" style="color:${barColor}">${fmt(spent)} / ${fmt(limit)}</span>
      </div>` : '';
    return `
      <div class="form-row budget-row">
        <label class="form-label"><span class="cat-dot" style="background:${catColor}"></span>${cat}</label>
        <input type="number" class="form-input" id="budget-${cat}" placeholder="no limit" value="${state.budgets[cat] || ''}" inputmode="decimal">
        ${progressHtml}
      </div>`;
  }).join('');
  return `
    <div class="page">
      <h1 class="page-title">Budget Limits</h1>
      <p class="page-sub">monthly cap per category</p>
      ${planHtml}
      ${suggestionsHtml}
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
  // Apply single chip (smart suggestion OR planner row)
  document.querySelectorAll('.budget-suggest-apply').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById('budget-' + btn.dataset.cat);
      if (inp) { inp.value = btn.dataset.amt; btn.textContent = '✓'; btn.disabled = true; }
    });
  });
  // Apply all smart suggestions
  document.getElementById('budget-apply-all')?.addEventListener('click', () => {
    const { suggestions } = getSmartBudgetSuggestions();
    Object.entries(suggestions).forEach(([cat, amt]) => {
      const inp = document.getElementById('budget-' + cat);
      if (inp) inp.value = amt;
    });
    document.querySelectorAll('.budget-suggest-apply').forEach(btn => { btn.textContent = '✓'; btn.disabled = true; });
  });
  // Apply all planner suggestions
  document.getElementById('ibp-apply-all')?.addEventListener('click', () => {
    const plan = getIncomeBudgetPlan();
    if (!plan) return;
    Object.entries(plan.suggestions).forEach(([cat, amt]) => {
      const inp = document.getElementById('budget-' + cat);
      if (inp) inp.value = amt;
    });
    document.querySelectorAll('.ibp-apply').forEach(btn => { btn.textContent = '✓'; btn.disabled = true; });
  });
  document.getElementById('save-budgets')?.addEventListener('click', async () => {
    const dict = {};
    getCategories().forEach(cat => {
      const val = document.getElementById('budget-' + cat)?.value;
      if (val) dict[cat] = parseFloat(val);
    });
    await api.saveBudgets(dict);
    const status = document.getElementById('budgets-status');
    if (status) { status.textContent = '✓ Saved'; setTimeout(() => { status.textContent = ''; }, 3000); }
  });
}

// ── challenges ─────────────────────────────────────────────────────────────
const CHALLENGE_TYPES = {
  no_spend_weekend: {
    name: 'No-Spend Weekend',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
    desc: 'No non-essential spending Sat & Sun. Auto-tracked each weekend.',
  },
  '52_week': {
    name: '52-Week Challenge',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    desc: 'Check off each week of the year as you hit your weekly goal.',
  },
  spending_freeze: {
    name: 'Spending Freeze',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    desc: 'Zero spending in a chosen category for a set number of days.',
  },
  beat_last_month: {
    name: 'Beat Last Month',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    desc: 'Spend less this month than last month in a chosen category.',
  },
};

function _challengeAutoStatus(ch) {
  // Returns 'pass'|'fail'|'pending' for auto-tracked challenges based on transactions
  const today = new Date(); today.setHours(0,0,0,0);
  if (ch.type === 'no_spend_weekend') {
    // Check the most recently passed weekend (last Sat-Sun pair)
    const day = today.getDay(); // 0=Sun … 6=Sat
    const lastSun = new Date(today); lastSun.setDate(today.getDate() - (day === 0 ? 0 : day));
    const lastSat = new Date(lastSun); lastSat.setDate(lastSun.getDate() - 1);
    const fmt2 = d => d.toISOString().slice(0, 10);
    const spent = state.transactions.filter(t =>
      t.type === 'expense' && (t.date === fmt2(lastSat) || t.date === fmt2(lastSun))
    ).reduce((s, t) => s + t.amount, 0);
    return spent > 0 ? 'fail' : 'pass';
  }
  if (ch.type === 'spending_freeze') {
    const cat     = ch.data.category;
    const endDate = ch.data.endDate;
    const start   = ch.started;
    const spent   = state.transactions.filter(t =>
      t.type === 'expense' && t.category === cat && t.date >= start && t.date <= endDate
    ).reduce((s, t) => s + t.amount, 0);
    if (ch.data.endDate < today.toISOString().slice(0,10)) return spent === 0 ? 'pass' : 'fail';
    return spent > 0 ? 'fail' : 'pending';
  }
  if (ch.type === 'beat_last_month') {
    const cat    = ch.data.category;
    const target = ch.data.target;
    const month  = ch.data.month;
    const spent  = state.transactions.filter(t =>
      t.type === 'expense' && t.category === cat && t.date.startsWith(month)
    ).reduce((s, t) => s + t.amount, 0);
    const curMonth = localMonthKey(today);
    if (curMonth > month) return spent < target ? 'pass' : 'fail';
    return spent < target ? 'pending' : 'fail';
  }
  return 'pending';
}

function renderChallenges() {
  const today    = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().slice(0, 10);
  const active   = state.challenges.filter(c => c.status === 'active');
  const done     = state.challenges.filter(c => c.status !== 'active');

  const catOptions = getCategories().map(c => `<option>${_escHtml(c)}</option>`).join('');

  const cardHtml = ch => {
    const def      = CHALLENGE_TYPES[ch.type] || {};
    const statusCls = ch.status === 'completed' ? 'completed' : ch.status === 'abandoned' ? 'abandoned' : 'active';
    const badgeTxt  = ch.status === 'completed' ? 'Done' : ch.status === 'abandoned' ? 'Abandoned' : 'Active';

    let progressHtml = '';
    let extraHtml    = '';
    let autoStatus   = '';

    if (ch.type === '52_week') {
      const checked  = ch.data.checkedWeeks || [];
      const cells    = Array.from({ length: 52 }, (_, i) => {
        const wk = i + 1;
        const isDone = checked.includes(wk);
        // Rough current week of year
        const start  = new Date(ch.started + 'T00:00:00');
        const elapsed = Math.floor((today - start) / 604800000) + 1;
        const isCur  = wk === elapsed;
        return `<div class="challenge-week-cell${isDone ? ' done' : isCur ? ' current' : ''}" data-id="${ch.id}" data-wk="${wk}" title="Week ${wk}">${wk}</div>`;
      }).join('');
      const pct = Math.round((checked.length / 52) * 100);
      progressHtml = `
        <div class="challenge-progress-bar"><div class="challenge-progress-fill" style="width:${pct}%"></div></div>`;
      extraHtml = `<div class="challenge-week-grid">${cells}</div>`;
    } else if (ch.type === 'no_spend_weekend') {
      const weekends = ch.data.completedWeekends || [];
      const total    = weekends.length;
      const pct      = Math.min(Math.round((total / 8) * 100), 100); // show out of ~8 weekends
      autoStatus     = _challengeAutoStatus(ch);
      progressHtml   = `
        <div style="font-size:.75rem;color:var(--muted);margin-bottom:6px">
          ${total} weekend${total !== 1 ? 's' : ''} completed
          ${autoStatus === 'pass' ? '<span style="color:var(--success);font-weight:700;margin-left:6px">✓ This weekend</span>' : autoStatus === 'fail' ? '<span style="color:var(--danger);font-weight:700;margin-left:6px">✗ Spending detected</span>' : ''}
        </div>
        <div class="challenge-progress-bar"><div class="challenge-progress-fill" style="width:${pct}%"></div></div>`;
    } else if (ch.type === 'spending_freeze') {
      autoStatus   = _challengeAutoStatus(ch);
      const days   = Math.max(0, Math.ceil((new Date(ch.data.endDate + 'T00:00:00') - today) / 86400000));
      progressHtml = `
        <div style="font-size:.75rem;color:var(--muted);margin-bottom:6px">
          ${_escHtml(ch.data.category)} · ${days} day${days !== 1 ? 's' : ''} left
          ${autoStatus === 'pass' ? '<span style="color:var(--success);font-weight:700;margin-left:6px">✓ On track</span>' : autoStatus === 'fail' ? '<span style="color:var(--danger);font-weight:700;margin-left:6px">✗ Spending detected</span>' : ''}
        </div>`;
    } else if (ch.type === 'beat_last_month') {
      autoStatus   = _challengeAutoStatus(ch);
      const spent  = state.transactions.filter(t =>
        t.type === 'expense' && t.category === ch.data.category && t.date.startsWith(ch.data.month)
      ).reduce((s, t) => s + t.amount, 0);
      const pct    = ch.data.target > 0 ? Math.min(Math.round((spent / ch.data.target) * 100), 100) : 0;
      const barCol = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warn)' : 'var(--accent)';
      progressHtml = `
        <div style="font-size:.75rem;color:var(--muted);margin-bottom:6px">
          ${_escHtml(ch.data.category)} · ${fmt(spent)} of ${fmt(ch.data.target)} target
          ${autoStatus === 'pass' ? '<span style="color:var(--success);font-weight:700;margin-left:6px">✓ Winning</span>' : autoStatus === 'fail' ? '<span style="color:var(--danger);font-weight:700;margin-left:6px">✗ Over target</span>' : ''}
        </div>
        <div class="challenge-progress-bar"><div class="challenge-progress-fill" style="width:${pct}%;background:${barCol}"></div></div>`;
    }

    const streakHtml = ch.streak > 0 ? `<div class="challenge-streak">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      ${ch.streak} streak
    </div>` : '';

    const actionBtns = ch.status === 'active' ? `
      <button class="btn-xs challenge-abandon-btn" data-id="${ch.id}" style="background:rgba(255,69,58,.12);color:var(--danger);border-color:rgba(255,69,58,.3)">Abandon</button>
    ` : '';

    return `
      <div class="challenge-card challenge-${statusCls}" data-id="${ch.id}">
        <div class="challenge-card-hdr">
          <div class="challenge-icon">${def.icon || ''}</div>
          <div class="challenge-name">${ch.name || def.name}</div>
          <span class="challenge-status-badge ${statusCls}">${badgeTxt}</span>
        </div>
        <div class="challenge-desc">${def.desc || ''}</div>
        ${streakHtml}
        ${progressHtml}
        ${extraHtml}
        <div class="challenge-actions">${actionBtns}</div>
      </div>`;
  };

  const activeHtml = active.length
    ? active.map(cardHtml).join('')
    : emptyState('No active challenges', 'Start one below to build the habit');

  const doneHtml = done.length
    ? `<h2 class="section-title" style="margin-top:18px">Past Challenges</h2>${done.map(cardHtml).join('')}`
    : '';

  return `
    <div class="page">
      <h1 class="page-title">Challenges</h1>
      <p class="page-sub">push yourself, build better habits</p>

      <div class="challenge-grid">
        ${activeHtml}
        ${doneHtml}
      </div>

      <div class="challenge-add-form">
        <h2 class="section-title" style="margin:0 0 12px">Start a Challenge</h2>
        <div class="challenge-type-grid">
          ${Object.entries(CHALLENGE_TYPES).map(([key, def]) => `
            <button class="challenge-type-btn" data-type="${key}">
              <span class="challenge-type-icon">${def.icon}</span>
              <span class="challenge-type-name">${def.name}</span>
              <span class="challenge-type-desc">${def.desc}</span>
            </button>
          `).join('')}
        </div>

        <div id="challenge-form-fields" style="display:none">
          <div class="form-row" id="challenge-cat-row" style="display:none">
            <label class="form-label">Category</label>
            <select id="challenge-cat" class="form-input">${catOptions}</select>
          </div>
          <div class="form-row" id="challenge-days-row" style="display:none">
            <label class="form-label">Duration (days)</label>
            <input type="number" id="challenge-days" class="form-input" placeholder="30" min="1" max="365" inputmode="numeric">
          </div>
          <div id="challenge-status" class="form-status"></div>
          <button id="challenge-start-btn" class="btn-primary" style="width:100%">Start Challenge</button>
        </div>
      </div>
    </div>`;
}

function attachChallenges() {
  let selectedType = null;

  const fieldsEl = document.getElementById('challenge-form-fields');
  const catRow   = document.getElementById('challenge-cat-row');
  const daysRow  = document.getElementById('challenge-days-row');

  document.querySelectorAll('.challenge-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.challenge-type-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedType = btn.dataset.type;
      fieldsEl.style.display = 'block';
      catRow.style.display  = (selectedType === 'spending_freeze' || selectedType === 'beat_last_month') ? '' : 'none';
      daysRow.style.display = (selectedType === 'spending_freeze') ? '' : 'none';
    });
  });

  document.getElementById('challenge-start-btn')?.addEventListener('click', async () => {
    if (!selectedType) { showStatus('challenge-status', 'Pick a challenge type.', 'error'); return; }
    const today   = new Date(); today.setHours(0,0,0,0);
    const todayStr = today.toISOString().slice(0,10);
    const def      = CHALLENGE_TYPES[selectedType];
    let data       = {};

    if (selectedType === 'spending_freeze') {
      const cat  = document.getElementById('challenge-cat')?.value;
      const days = parseInt(document.getElementById('challenge-days')?.value);
      if (!cat)              { showStatus('challenge-status', 'Pick a category.', 'error'); return; }
      if (!days || days < 1) { showStatus('challenge-status', 'Enter a valid duration.', 'error'); return; }
      const end = new Date(today); end.setDate(end.getDate() + days - 1);
      data = { category: cat, endDate: end.toISOString().slice(0,10) };
    } else if (selectedType === 'beat_last_month') {
      const cat = document.getElementById('challenge-cat')?.value;
      if (!cat) { showStatus('challenge-status', 'Pick a category.', 'error'); return; }
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      const prevM = new Date(now.getFullYear(), now.getMonth()-1, 1);
      const prevKey = `${prevM.getFullYear()}-${String(prevM.getMonth()+1).padStart(2,'0')}`;
      const lastSpent = state.transactions
        .filter(t => t.type==='expense' && t.category===cat && t.date.startsWith(prevKey))
        .reduce((s,t) => s+t.amount, 0);
      const target = lastSpent > 0 ? lastSpent : 100;
      data = { category: cat, month, target };
    } else if (selectedType === 'no_spend_weekend') {
      data = { completedWeekends: [] };
    } else if (selectedType === '52_week') {
      data = { checkedWeeks: [] };
    }

    // Prevent duplicate active same-type challenges
    if (state.challenges.some(c => c.type === selectedType && c.status === 'active')) {
      showStatus('challenge-status', 'You already have an active challenge of this type.', 'error');
      return;
    }

    state.challenges.push({
      id: Date.now(),
      type: selectedType,
      name: def.name,
      started: todayStr,
      status: 'active',
      streak: 0,
      data,
    });
    await api.saveChallenges(state.challenges);
    render();
  });

  // 52-week check-off
  document.querySelectorAll('.challenge-week-cell').forEach(cell => {
    cell.addEventListener('click', async () => {
      const id = parseInt(cell.dataset.id);
      const wk = parseInt(cell.dataset.wk);
      const ch = state.challenges.find(c => c.id === id);
      if (!ch || ch.status !== 'active') return;
      ch.data.checkedWeeks = ch.data.checkedWeeks || [];
      if (ch.data.checkedWeeks.includes(wk)) {
        ch.data.checkedWeeks = ch.data.checkedWeeks.filter(w => w !== wk);
      } else {
        ch.data.checkedWeeks.push(wk);
        // Streak = consecutive weeks from week 1
        let streak = 0;
        for (let i = 1; i <= 52; i++) {
          if (ch.data.checkedWeeks.includes(i)) streak++;
          else break;
        }
        ch.streak = streak;
        // Complete at 52
        if (ch.data.checkedWeeks.length >= 52) {
          ch.status = 'completed';
          await api.saveChallenges(state.challenges);
          _showChallengeComplete(ch);
          return;
        }
      }
      await api.saveChallenges(state.challenges);
      render();
    });
  });

  // No-spend weekend: auto-check last weekend on page load
  const noSpendActive = state.challenges.filter(c => c.type === 'no_spend_weekend' && c.status === 'active');
  noSpendActive.forEach(async ch => {
    const status = _challengeAutoStatus(ch);
    if (status === 'pass') {
      const today  = new Date(); today.setHours(0,0,0,0);
      const day    = today.getDay();
      const lastSun = new Date(today); lastSun.setDate(today.getDate() - (day === 0 ? 0 : day));
      const weekKey = lastSun.toISOString().slice(0,10);
      ch.data.completedWeekends = ch.data.completedWeekends || [];
      if (!ch.data.completedWeekends.includes(weekKey)) {
        ch.data.completedWeekends.push(weekKey);
        ch.streak = ch.data.completedWeekends.length;
        await api.saveChallenges(state.challenges);
      }
    }
  });

  // Spending freeze / beat last month: auto-complete if passed
  const autoCheck = state.challenges.filter(c =>
    (c.type === 'spending_freeze' || c.type === 'beat_last_month') && c.status === 'active'
  );
  autoCheck.forEach(async ch => {
    const status = _challengeAutoStatus(ch);
    if (status === 'pass') {
      const todayStr = today();
      const endPast = ch.type === 'spending_freeze'
        ? ch.data.endDate < todayStr
        : ch.data.month < todayStr.slice(0,7);
      if (endPast && ch.status !== 'completed') {
        ch.status = 'completed';
        await api.saveChallenges(state.challenges);
        _showChallengeComplete(ch);
        return;
      }
    }
  });

  // Abandon button
  document.querySelectorAll('.challenge-abandon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const ch = state.challenges.find(c => c.id === id);
      if (!ch) return;
      showConfirmModal({
        title: 'Abandon Challenge',
        message: `Give up on "${ch.name}"? You can always start a new one.`,
        confirmText: 'Abandon',
        danger: true,
        onConfirm: async () => {
          ch.status = 'abandoned';
          await api.saveChallenges(state.challenges);
          render();
        },
      });
    });
  });
}

function _showChallengeComplete(ch) {
  const ov = document.createElement('div');
  ov.className = 'challenge-celebrate';
  ov.innerHTML = `
    <div class="challenge-celebrate-inner">
      <div class="challenge-celebrate-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
      </div>
      <div class="challenge-celebrate-title">Challenge Complete!</div>
      <div class="challenge-celebrate-sub">${ch.name} — well done, you crushed it!</div>
      <button class="btn-primary" style="width:100%" id="challenge-celebrate-close">Nice!</button>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelector('#challenge-celebrate-close')?.addEventListener('click', () => { ov.remove(); render(); });
}

// ── add ────────────────────────────────────────────────────────────────────
function renderAdd() {
  const _adv = isSimpleMode() ? ' style="display:none"' : '';   // hide advanced rows in Simple mode
  // Autocomplete suggestions from past transaction descriptions (most recent first)
  const _descSeen = new Set();
  const _descSugg = [...state.transactions].reverse()
    .map(t => t.description).filter(d => d && d !== '—')
    .filter(d => { const k = d.trim().toLowerCase(); if (_descSeen.has(k)) return false; _descSeen.add(k); return true; })
    .slice(0, 60)
    .map(d => `<option value="${String(d).replace(/"/g, '&quot;')}"></option>`).join('');
  const catOptions  = getCategories().map(c => `<option>${_escHtml(c)}</option>`).join('');
  const acctOptions = state.accounts.map(a => `<option value="${a.id}">${_escHtml(a.name)}</option>`).join('');
  const toAcctOptions = state.accounts.map(a => `<option value="${a.id}">${_escHtml(a.name)}</option>`).join('');
  return `
    <div class="page">
      <h1 class="page-title">Add Entry</h1>
      <p class="page-sub">record income or expense</p>
      <div class="form-card">
        ${(() => {
          const tmpls = getCommonTemplates();
          if (!tmpls.length) return '';
          return `<div class="form-row tmpl-row" id="add-tmpl-row">
          <label class="form-label">Frequent</label>
          <div class="tmpl-chips" id="add-tmpl-chips">
            ${tmpls.map((t, i) => `<button type="button" class="tmpl-chip" data-tmpl="${i}" title="Tap to fill — logged ~daily">
              <span class="cat-dot" style="background:${CAT_COLORS[t.category] || '#9896a4'}"></span>
              <span class="tmpl-chip-lbl">${_escHtml(t.description || t.category)}</span>
              <span class="tmpl-chip-amt">${fmt(t.amount)}</span>
            </button>`).join('')}
          </div>
        </div>`;
        })()}
        <div class="form-row">
          <label class="form-label">Type</label>
          <div class="radio-group">
            <label class="radio-label"><input type="radio" name="etype" value="expense" checked> Expense</label>
            <label class="radio-label"><input type="radio" name="etype" value="income"> Income</label>
            <label class="radio-label"><input type="radio" name="etype" value="transfer"> Transfer</label>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">Amount ($)</label>
          <div class="amount-wrap">
            <input type="number" id="add-amount" class="form-input" placeholder="0.00" step="0.01" min="0" inputmode="decimal">
            <button type="button" id="add-calc-btn" class="calc-trigger" aria-label="Open calculator" title="Calculator">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="12" y1="11" x2="12" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="12" y1="15" x2="12" y2="15"/><line x1="16" y1="15" x2="16" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="form-row" id="add-desc-row">
          <label class="form-label">Description</label>
          <input type="text" id="add-desc" class="form-input" placeholder="What was this for?" list="desc-suggestions" autocomplete="off">
          <datalist id="desc-suggestions">${_descSugg}</datalist>
        </div>
        <div class="form-row" id="add-cat-row">
          <label class="form-label">Category</label>
          <div style="flex:1">
            <select id="add-cat" class="form-input">${getCategories().map(c=>`<option value="${_escHtml(c)}">${_escHtml(c)}</option>`).join('')}<option value="__custom__">Custom…</option></select>
            <input type="text" id="add-cat-custom" class="form-input" placeholder="Type custom category" style="display:none;margin-top:6px">
          </div>
        </div>
        <div class="form-row" id="add-split-row"${_adv}>
          <label class="form-label" style="align-self:flex-start;padding-top:2px">Split</label>
          <div style="flex:1">
            <label class="radio-label" style="margin-bottom:4px">
              <input type="checkbox" id="split-toggle"> Split between categories
            </label>
            <div id="split-section" style="display:none;margin-top:8px">
              <div id="split-rows-container"></div>
              <button type="button" id="split-add-row-btn" class="btn-xs" style="margin-top:4px">+ Add split</button>
              <div id="split-summary" style="font-size:.8rem;margin-top:6px;font-weight:600"></div>
            </div>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">From Account</label>
          <select id="add-acct" class="form-input form-select">${acctOptions}</select>
        </div>
        <div class="form-row" id="add-to-acct-row" style="display:none">
          <label class="form-label">To / Pay</label>
          <select id="add-to-acct" class="form-input form-select">${toAcctOptions}</select>
        </div>
        <div class="form-row">
          <label class="form-label">Date</label>
          <input type="date" id="add-date" class="form-input" value="${today()}">
        </div>
        <div class="form-row" id="add-recurring-row"${_adv}>
          <label class="form-label">Recurring</label>
          <label class="radio-label"><input type="checkbox" id="add-recurring"> Auto-add monthly</label>
        </div>
        <div class="form-row" id="add-exclude-row"${_adv}>
          <label class="form-label">Weekly budget</label>
          <label class="radio-label"><input type="checkbox" id="add-exclude-budget"> Don't count toward weekly spending</label>
        </div>
        <div id="add-status" class="form-status"></div>
        <button id="add-btn" class="btn-primary">Add Transaction</button>
      </div>
    </div>`;
}

// ── ledger ─────────────────────────────────────────────────────────────────
function renderLedger() {
  const cats = getCategories();
  const density = loadSettings().ledgerDensity === 'compact' ? 'compact' : 'comfortable';
  const catOptFilter = cats.map(c =>
    `<option value="${_escHtml(c)}"${c === ledgerCatFilter ? ' selected' : ''}>${_escHtml(c)}</option>`).join('');

  let rows = state.transactions.map((t, i) => ({ ...t, _i: i }));
  // Split into Bills (logged from the Bills tab) vs normal Transactions before any other filter.
  const _allBillRows = rows.filter(isBillTxn);
  const _allTxnRows  = rows.filter(t => !isBillTxn(t));
  rows = ledgerView === 'bills' ? _allBillRows : _allTxnRows;
  // Cross-account search (read-only): pull non-bill transactions from every
  // account, each tagged with its source. Running balances / inline edit don't
  // apply across accounts, so these rows are view-only.
  const _crossAcct = ledgerAllAccounts && ledgerView !== 'bills' && state.accounts.length > 1;
  if (_crossAcct) {
    rows = [];
    state.accounts.forEach(a => {
      let d; try { d = JSON.parse(localStorage.getItem(accountDataKey(a.id)) || '{}'); } catch { d = {}; }
      (d.transactions || []).forEach((t, i) => {
        if (isBillTxn(t)) return;
        rows.push({ ...t, _i: i, _acctName: a.name });
      });
    });
  }
  if (ledgerTypeFilter !== 'all') rows = rows.filter(t => t.type === ledgerTypeFilter);
  if (ledgerCatFilter)  rows = rows.filter(t => t.category === ledgerCatFilter);
  if (ledgerDateFrom)   rows = rows.filter(t => t.date >= ledgerDateFrom);
  if (ledgerDateTo)     rows = rows.filter(t => t.date <= ledgerDateTo);
  if (ledgerFilter)     rows = rows.filter(t =>
    t.description.toLowerCase().includes(ledgerFilter) ||
    t.category.toLowerCase().includes(ledgerFilter) ||
    String(t.amount).includes(ledgerFilter));

  rows.sort((a, b) => {
    if (ledgerSort === 'date-desc')   return b.date.localeCompare(a.date) || b._i - a._i;
    if (ledgerSort === 'date-asc')    return a.date.localeCompare(b.date) || a._i - b._i;
    if (ledgerSort === 'amount-desc') return b.amount - a.amount;
    if (ledgerSort === 'amount-asc')  return a.amount - b.amount;
    return 0;
  });

  const runBal = calcRunningBalances();
  // Hoist work that doesn't vary per row: account lookup map + a Set for the
  // "is this category already in the list" check (was rebuilt for every row).
  const acctById = new Map(state.accounts.map(a => [a.id, a]));
  const catSet   = new Set(cats);
  // Cap how many rows hit the DOM at once — long ledgers otherwise build
  // thousands of nodes on every render/search keystroke.
  const totalRows = rows.length;
  const capped    = !_ledgerShowAll && totalRows > LEDGER_CAP;
  const visRows   = capped ? rows.slice(0, LEDGER_CAP) : rows;
  const rowsHtml = visRows.map(t => {
    const sign      = t.type === 'income' ? '+' : '-';
    const cls       = t.type === 'income' ? 'income' : 'expense';
    const prefix    = t.recurring ? '↻ ' : '';
    const exTag     = (t.excludeFromBudget && !isBillTxn(t)) ? ' <span class="ledger-extag">not in weekly</span>' : '';
    const catColor  = CAT_COLORS[t.category] || '#9896a4';
    const acct      = acctById.get(t.account || 'main');
    const acctBadge = acct && acct.id !== 'main' ? `<span class="acct-badge">${_escHtml(acct.name)}</span>` : '';
    const allCats   = catSet.has(t.category) ? cats : [...cats, t.category];
    const catOptions = allCats.map(c =>
      `<option value="${_escHtml(c)}"${c === t.category ? ' selected' : ''}>${_escHtml(c)}</option>`).join('');
    // Cross-account rows are read-only: account badge, no running balance / edit / delete.
    if (_crossAcct) {
      return `
      <div class="ledger-row ledger-row-ro">
        <div class="ledger-row-inner">
          <div class="ledger-main">
            <div class="ledger-desc"><span class="cat-dot" style="background:${catColor}"></span>${prefix}${_escHtml(t.description)}</div>
            <div class="ledger-meta">${t.date} · ${_escHtml(t.category)} <span class="acct-badge">${_escHtml(t._acctName)}</span>${exTag}</div>
          </div>
          <div class="ledger-right">
            <div class="ledger-amt ${cls}">${sign}${fmt(t.amount)}</div>
          </div>
        </div>
      </div>`;
    }
    return `
      <div class="ledger-row" data-idx="${t._i}">
        <div class="ledger-row-inner">
          <div class="ledger-main">
            <div class="ledger-desc"><span class="cat-dot" style="background:${catColor}"></span>${prefix}${_escHtml(t.description)}</div>
            <div class="ledger-meta">${t.date} · ${_escHtml(t.category)}${acctBadge}${exTag}</div>
          </div>
          <div class="ledger-right">
            <div class="ledger-amt ${cls}">${sign}${fmt(t.amount)}</div>
            <div class="ledger-running-bal">bal: ${fmt(runBal[t._i])}</div>
            <button class="ledger-edit-btn" data-idx="${t._i}" title="Edit" aria-label="Edit ${_escHtml(t.description||'transaction')}">✏️</button>
            <button class="ledger-delete" data-idx="${t._i}" aria-label="Delete ${_escHtml(t.description||'transaction')}">✕</button>
          </div>
        </div>
        <div class="ledger-inline-edit">
          <div class="ie-grid">
            <select class="form-input ie-type">
              <option value="expense"${t.type === 'expense' ? ' selected' : ''}>Expense</option>
              <option value="income"${t.type === 'income' ? ' selected' : ''}>Income</option>
            </select>
            <input type="date" class="form-input ie-date" value="${t.date}">
            <select class="form-input ie-cat">${catOptions}</select>
            <input type="text" class="form-input ie-desc" value="${_escHtml(t.description)}" placeholder="Description">
            <input type="number" class="form-input ie-amount" value="${t.amount}" step="0.01" min="0" placeholder="Amount" inputmode="decimal">
          </div>
          <label class="ie-exclude-label"><input type="checkbox" class="ie-exclude"${t.excludeFromBudget ? ' checked' : ''}> Don't count toward weekly spending</label>
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
      <p class="page-sub">${rows.length} ${ledgerView === 'bills' ? 'bill' : 'transaction'}${rows.length !== 1 ? 's' : ''}${_crossAcct ? ' · all accounts (read-only)' : ''}</p>
      <div class="ledger-view-tabs">
        <button class="lv-tab${ledgerView === 'transactions' ? ' active' : ''}" data-view="transactions">Transactions${_allTxnRows.length ? ` <span class="lv-count">${_allTxnRows.length}</span>` : ''}</button>
        <button class="lv-tab${ledgerView === 'bills' ? ' active' : ''}" data-view="bills">Bills${_allBillRows.length ? ` <span class="lv-count">${_allBillRows.length}</span>` : ''}</button>
      </div>
      <div class="ledger-filter-bar">
        <div class="lf-row1">
          <input type="search" id="ledger-search" class="form-input lf-search" placeholder="Search…" value="${ledgerFilter}">
          <select id="ledger-sort" class="form-input lf-sort">
            <option value="date-desc"${ledgerSort === 'date-desc' ? ' selected' : ''}>Newest</option>
            <option value="date-asc"${ledgerSort === 'date-asc' ? ' selected' : ''}>Oldest</option>
            <option value="amount-desc"${ledgerSort === 'amount-desc' ? ' selected' : ''}>$ High</option>
            <option value="amount-asc"${ledgerSort === 'amount-asc' ? ' selected' : ''}>$ Low</option>
          </select>
          <button id="ledger-density" class="lf-density-btn" title="Row density" aria-label="Toggle row density (currently ${density})">${density === 'compact' ? '≣' : '≡'}</button>
          ${state.accounts.length > 1 && ledgerView !== 'bills' ? `<button id="ledger-all-accts" class="lf-density-btn${ledgerAllAccounts ? ' lf-allacct-on' : ''}" title="Search across all accounts" aria-label="Toggle search across all accounts" aria-pressed="${ledgerAllAccounts}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></button>` : ''}
        </div>
        <div class="lf-row2">
          <div class="type-pills">
            <button class="type-pill${ledgerTypeFilter === 'all' ? ' active' : ''}" data-type="all">All</button>
            <button class="type-pill${ledgerTypeFilter === 'income' ? ' active' : ''}" data-type="income">Income</button>
            <button class="type-pill${ledgerTypeFilter === 'expense' ? ' active' : ''}" data-type="expense">Expense</button>
          </div>
          <select id="ledger-cat-filter" class="form-input lf-cat">
            <option value="">All Cats</option>
            ${catOptFilter}
          </select>
        </div>
        <div class="lf-row3">
          <input type="date" id="ledger-date-from" class="form-input lf-date" value="${ledgerDateFrom}" title="From date">
          <span class="lf-dash">—</span>
          <input type="date" id="ledger-date-to" class="form-input lf-date" value="${ledgerDateTo}" title="To date">
          <button id="ledger-export-csv" class="btn-xs"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:3px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>CSV</button>
          <button id="ledger-find-dupes" class="btn-xs" title="Scan for duplicate transactions"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:3px"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>Duplicates</button>
          <button id="ledger-find-amount" class="btn-xs" title="Find transactions that add up to an amount"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:3px"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Find $</button>
        </div>
        ${(ledgerFilter || ledgerTypeFilter !== 'all' || ledgerCatFilter || ledgerDateFrom || ledgerDateTo)
          ? `<button id="ledger-clear-filters" class="lf-clear-btn">✕ Clear filters</button>` : ''}
      </div>
      <div class="ledger-list${density === 'compact' ? ' compact' : ''}">
        ${rowsHtml || (state.transactions.length === 0
          ? emptyState('No transactions yet', 'Tap Add to log your first one')
          : ledgerView === 'bills'
            ? '<p style="padding:24px 0;text-align:center;color:var(--muted);font-size:.85rem">No bills logged yet — tap "Mark Paid" on a bill in the Bills tab</p>'
            : '<p style="padding:24px 0;text-align:center;color:var(--muted);font-size:.85rem">No matching transactions</p>')}
        ${capped ? `<button id="ledger-show-all" class="lf-clear-btn" style="margin:12px auto 0;display:block">Show all ${totalRows} ${ledgerView === 'bills' ? 'bills' : 'transactions'} (showing ${LEDGER_CAP})</button>` : ''}
      </div>
    </div>`;
}

// Group this account's transactions by type + amount + normalized description.
// Any group with more than one member is a likely accidental double-entry
// (e.g. a bill or charge logged twice). Skips internal transfers.
function _findDuplicateGroups() {
  const norm = s => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const groups = new Map();
  for (const t of (state.transactions || [])) {
    if (t._xfer) continue;
    const k = `${t.type}|${(Number(t.amount) || 0).toFixed(2)}|${norm(t.description)}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }
  return [...groups.values()]
    .filter(g => g.length > 1)
    .sort((a, b) => b.length - a.length || (Number(b[0].amount) || 0) - (Number(a[0].amount) || 0));
}

// Modal that lists suspected duplicate transactions with a one-tap delete on
// each copy. Rebuilds after every delete so the list stays accurate.
function showDuplicatesModal() {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) close(); });

  function build() {
    const groups = _findDuplicateGroups();
    const extraValue = groups.reduce((s, g) =>
      s + g.slice(1).reduce((x, t) => x + (t.type === 'expense' ? (Number(t.amount) || 0) : 0), 0), 0);
    const listHtml = groups.length ? groups.map((g, gi) => {
      const rows = g.map((t, ri) => {
        const bill = isBillTxn(t) ? ' <span class="dupe-bill-tag">bill</span>' : '';
        const sign = t.type === 'income' ? '+' : '−';
        return `<div class="dupe-row">
          <div class="dupe-row-info">
            <span class="dupe-row-desc">${_escHtml(t.description || t.category || '(no description)')}${bill}</span>
            <span class="dupe-row-date">${t.date || '—'}${t.category ? ` · ${_escHtml(t.category)}` : ''}</span>
          </div>
          <span class="dupe-row-amt ${t.type}">${sign}${fmt(Math.abs(Number(t.amount) || 0))}</span>
          <button class="btn-xs dupe-del" data-gi="${gi}" data-ri="${ri}" style="background:var(--danger);color:#fff;border-color:var(--danger)">Delete</button>
        </div>`;
      }).join('');
      return `<div class="dupe-group">
        <div class="dupe-group-hdr">${g.length}× ${fmt(Math.abs(Number(g[0].amount) || 0))} — ${_escHtml(g[0].description || g[0].category || '(no description)')}</div>
        ${rows}
      </div>`;
    }).join('') : '<p class="code-hint" style="text-align:center;padding:24px 0">No duplicate transactions found in this account. 🎉</p>';

    ov.innerHTML = `<div class="dupe-modal">
      <div class="dupe-modal-hdr"><span>Find duplicates</span><button class="dupe-close" aria-label="Close">✕</button></div>
      ${groups.length ? `<p class="code-hint" style="margin:0 0 10px">${groups.length} group${groups.length === 1 ? '' : 's'} of repeated transactions (same amount, type &amp; description).${extraValue > 0 ? ` Extra expense copies total <strong>${fmt(extraValue)}</strong>.` : ''} Delete the accidental copy in each — this is permanent.</p>` : ''}
      <div class="dupe-list">${listHtml}</div>
      <button class="btn-secondary dupe-done" style="width:100%;margin-top:12px">Done</button>
    </div>`;

    ov.querySelector('.dupe-close').addEventListener('click', close);
    ov.querySelector('.dupe-done').addEventListener('click', close);
    ov.querySelectorAll('.dupe-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = groups[+btn.dataset.gi]?.[+btn.dataset.ri];
        if (!t) return;
        showConfirmModal({
          title: 'Delete transaction',
          message: `Delete ${fmt(Math.abs(Number(t.amount) || 0))} "${_escHtml(t.description || t.category || '')}" on ${t.date || '—'}? This cannot be undone.`,
          confirmText: 'Delete', danger: true,
          onConfirm: async () => {
            const idx = state.transactions.indexOf(t);
            if (idx >= 0) await api.deleteTransaction(idx);
            build();      // refresh the modal list
            render();     // refresh the ledger behind it
          },
        });
      });
    });
  }
  build();
}

// Subset-sum finder: which expenses in [start,end] add up to `amountCents`,
// as single items, pairs, or triples. Uses integer cents (no float drift) and
// a sorted list with early breaks. Caps results per size so a common amount
// can't flood the UI. Triples are skipped past a candidate cap for speed.
function _findAmountCombos(amountCents, start, end, maxResults = 30) {
  const T = amountCents;
  const cand = [];
  for (const t of (state.transactions || [])) {
    if (t._xfer || t.type !== 'expense') continue;
    if (t.category === 'Transfer' || t.category === 'Payment') continue;
    if (!t.date || (start && t.date < start) || (end && t.date > end)) continue;
    cand.push({ t, c: Math.round((Number(t.amount) || 0) * 100) });
  }
  cand.sort((a, b) => a.c - b.c);
  const n = cand.length;
  const singles = [], pairs = [], triples = [];

  for (let i = 0; i < n; i++) if (cand[i].c === T) singles.push([cand[i].t]);

  for (let i = 0; i < n && pairs.length < maxResults; i++) {
    if (cand[i].c * 2 > T) break;                 // smallest partner ≥ cand[i], so no pair possible past here
    for (let j = i + 1; j < n; j++) {
      const s = cand[i].c + cand[j].c;
      if (s === T) { pairs.push([cand[i].t, cand[j].t]); if (pairs.length >= maxResults) break; }
      else if (s > T) break;                      // sorted asc → larger j only grows the sum
    }
  }

  const tripleCap = n <= 500;                      // O(n²·early-break); skip on huge ranges
  if (tripleCap) {
    for (let i = 0; i < n && triples.length < maxResults; i++) {
      if (cand[i].c * 3 > T) break;
      for (let j = i + 1; j < n && triples.length < maxResults; j++) {
        if (cand[i].c + cand[j].c * 2 > T) break;  // remaining third ≥ cand[j]
        for (let k = j + 1; k < n; k++) {
          const s = cand[i].c + cand[j].c + cand[k].c;
          if (s === T) { triples.push([cand[i].t, cand[j].t, cand[k].t]); if (triples.length >= maxResults) break; }
          else if (s > T) break;
        }
      }
    }
  }
  return { singles, pairs, triples, n, maxResults, triplesSkipped: !tripleCap };
}

// Modal: enter an amount + date range, list single / pair / triple expense
// combinations that sum to it. Investigative (no edits) — handy for tracking
// down which charges make up a bank-vs-app difference.
function showAmountFinderModal() {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
  ov.innerHTML = `<div class="dupe-modal">
    <div class="dupe-modal-hdr"><span>Find matching amount</span><button class="dupe-close" aria-label="Close">✕</button></div>
    <p class="code-hint" style="margin:0 0 10px">Enter an amount and a date range — see which expenses add up to it (alone, or in twos and threes).</p>
    <div class="amtf-controls">
      <div class="amtf-amt-wrap"><span class="amtf-dollar">$</span><input type="number" id="amtf-amount" class="form-input" placeholder="0.00" step="0.01" min="0" inputmode="decimal" style="padding-left:22px"></div>
      <div class="amtf-dates">
        <input type="date" id="amtf-start" class="form-input" value="${localMonthKey()}-01" max="${today()}" title="From">
        <span class="lf-dash">—</span>
        <input type="date" id="amtf-end" class="form-input" value="${today()}" max="${today()}" title="To">
      </div>
      <button id="amtf-run" class="btn-primary" style="width:100%">Find combinations</button>
    </div>
    <div id="amtf-results" class="dupe-list"></div>
    <button class="btn-secondary dupe-done" style="width:100%;margin-top:12px">Done</button>
  </div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  ov.querySelector('.dupe-close').addEventListener('click', close);
  ov.querySelector('.dupe-done').addEventListener('click', close);

  const comboBlock = (items, targetCents) => {
    const lines = items.map(t => `<div class="combo-item"><span class="combo-item-desc">${t.date || '—'} · ${_escHtml(t.description || t.category || '(no description)')}</span><span class="combo-item-amt">${fmt(Math.abs(Number(t.amount) || 0))}</span></div>`).join('');
    const sum = items.length > 1 ? `<div class="combo-sum">= ${fmt(targetCents / 100)}</div>` : '';
    return `<div class="combo">${lines}${sum}</div>`;
  };
  const section = (title, combos, targetCents, note) => {
    if (!combos.length) return '';
    return `<div class="amtf-section"><div class="amtf-section-hdr">${title} <span class="lv-count">${combos.length}${note || ''}</span></div>${combos.map(c => comboBlock(c, targetCents)).join('')}</div>`;
  };

  const run = () => {
    const amount = parseFloat(ov.querySelector('#amtf-amount').value);
    const start  = ov.querySelector('#amtf-start').value;
    const end    = ov.querySelector('#amtf-end').value;
    const out    = ov.querySelector('#amtf-results');
    if (isNaN(amount) || amount <= 0) { out.innerHTML = '<p class="code-hint" style="text-align:center;padding:16px 0">Enter an amount to search for.</p>'; return; }
    const cents = Math.round(amount * 100);
    const { singles, pairs, triples, maxResults, triplesSkipped } = _findAmountCombos(cents, start, end);
    const total = singles.length + pairs.length + triples.length;
    if (!total) { out.innerHTML = `<p class="code-hint" style="text-align:center;padding:16px 0">No expenses add up to ${fmt(amount)} in this range${triplesSkipped ? ' (too many transactions to check triples — narrow the range)' : ''}.</p>`; return; }
    const cap = (arr) => arr.length >= maxResults ? `+` : '';
    out.innerHTML =
      section('Single expense', singles, cents, cap(singles)) +
      section('Pairs', pairs, cents, cap(pairs)) +
      section('Triples', triples, cents, cap(triples)) +
      (triplesSkipped ? '<p class="code-hint" style="margin:8px 0 0">Triples skipped — too many transactions in range. Narrow the dates to check them.</p>' : '');
  };
  ov.querySelector('#amtf-run').addEventListener('click', run);
  ov.querySelector('#amtf-amount').addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  setTimeout(() => ov.querySelector('#amtf-amount')?.focus(), 60);
}

// ── weekly ─────────────────────────────────────────────────────────────────
function renderWeekly() {
  // Debt accounts (credit cards, loans) aren't budgeted weekly — they're paid down.
  if (_isDebtAcct(_currentAcct())) {
    return `
      <div class="page">
        <h1 class="page-title">Weekly Planner</h1>
        <div class="form-card" style="text-align:center;padding:28px 20px">
          <div style="font-size:2rem;margin-bottom:8px">💳</div>
          <p style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:6px">Not for debt accounts</p>
          <p class="page-sub" style="margin-bottom:18px">Credit cards and loans aren't budgeted week-to-week — the goal is to pay them off. Use the Debt view to track payoff progress.</p>
          <button class="btn-primary" onclick="showTab('debt')">Go to Debt</button>
        </div>
      </div>`;
  }
  const { income, expense } = totals();
  const wp = state.weekly_plan;
  const defStopAt  = wp.stop_at  ?? '0';
  const defBills   = wp.bills    ?? '0';
  const balance  = (state.startingBalance || 0) + income - expense;
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
          <label class="form-label">Fixed bills still due ($)</label>
          <input type="number" id="wk-bills" class="form-input" value="${defBills}" step="0.01" inputmode="decimal">
        </div>
        <div class="form-row">
          <label class="form-label">Stop at — minimum balance ($)</label>
          <input type="number" id="wk-stop-at" class="form-input" value="${defStopAt}" step="0.01" inputmode="decimal" placeholder="0">
        </div>
        <div class="btn-row">
          <button id="wk-save" class="btn-primary">Save</button>
          <span id="wk-save-status" class="status-inline"></span>
        </div>
      </div>
      <div id="wk-live"></div>
      <div id="wk-hist-card" class="form-card" style="display:none">
        <div class="wk-hist-head">
          <h2 class="section-title" style="margin:0">Spending History</h2>
          <div class="wk-seg" id="wk-hist-seg" role="tablist">
            <button class="wk-seg-btn" data-view="day"  role="tab">Per Day</button>
            <button class="wk-seg-btn" data-view="week" role="tab">Per Week</button>
          </div>
        </div>
        <div id="wk-dh-body"></div>
      </div>
    </div>`;
}

// Count the Mondays from `startMon` through `end` (inclusive) — i.e. how many weekly
// budget rows remain between this week and the end of the month. Always at least 1.
function weeksFromMonday(startMon, end) {
  let c = 0; const d = new Date(startMon);
  while (d <= end) { c++; d.setDate(d.getDate() + 7); }
  return Math.max(1, c);
}

// Days and weekly rows remaining in the calendar month containing `refDate`. Shared by the
// Weekly Planner and the dashboard budget tiles so the two always show the same numbers.
function monthWindow(refDate, monday) {
  const d = new Date(refDate); d.setHours(0, 0, 0, 0);
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    monthEnd,
    daysLeft:  Math.max(1, Math.round((monthEnd - d) / 86400000) + 1),
    weeksLeft: weeksFromMonday(monday, monthEnd),
  };
}

// A "bill" transaction is one logged from the Bills tab's "Mark Paid" action.
function isBillTxn(t) { return !!(t && t._billTxnId); }

// A transaction is left out of discretionary weekly/daily spending if it's a bill payment
// or the user flagged it "don't count toward weekly spending" when adding/editing it.
function isExcludedFromSpend(t) { return isBillTxn(t) || (t && t.excludeFromBudget === true); }

// ── bill paid-month model ────────────────────────────────────────────────────
// A bill can be paid for several months at once (e.g. paying next month early), so we
// track a set of YYYY-MM keys plus the logged expense txn id per month. These helpers
// lazily migrate the older single `paidMonth` / `loggedTxnId` shape.
function billPaidMonths(b) {
  if (!Array.isArray(b.paidMonths)) b.paidMonths = b.paidMonth ? [b.paidMonth] : [];
  return b.paidMonths;
}
function billLoggedTxns(b) {
  if (!b.loggedTxns || typeof b.loggedTxns !== 'object') {
    b.loggedTxns = {};
    if (b.loggedTxnId && b.paidMonth) b.loggedTxns[b.paidMonth] = b.loggedTxnId;
  }
  return b.loggedTxns;
}
function isBillPaidFor(b, mKey) { return billPaidMonths(b).includes(mKey); }
function markBillPaid(b, mKey, txnId) {
  const arr = billPaidMonths(b);
  if (!arr.includes(mKey)) arr.push(mKey);
  if (txnId) billLoggedTxns(b)[mKey] = txnId;
}
function markBillUnpaid(b, mKey) {
  const arr = billPaidMonths(b);
  const idx = arr.indexOf(mKey);
  if (idx !== -1) arr.splice(idx, 1);
  const logged = billLoggedTxns(b);
  const txnId  = logged[mKey] || null;
  delete logged[mKey];
  return txnId;
}
function curMonthKey() { return localMonthKey(); }
function shiftMonthKey(mKey, delta) {
  const [y, mo] = mKey.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthKeyLabel(mKey) {
  const [y, mo] = mKey.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
// Badge for a bill card. Urgency (TODAY / in Nd) only shown for the current month.
function billBadgeHtml(b, mKey, isCurrentMonth) {
  if (isBillPaidFor(b, mKey)) return '<span class="bill-badge paid">PAID</span>';
  if (!isCurrentMonth)        return `<span class="bill-badge upcoming">day ${b.dueDay}</span>`;
  const d = getDaysUntilDue(b.dueDay);
  if (d === 0) return '<span class="bill-badge due-today">TODAY</span>';
  if (d <= 3)  return `<span class="bill-badge due-soon">in ${d}d</span>`;
  if (d <= 7)  return `<span class="bill-badge upcoming-soon">in ${d}d</span>`;
  return `<span class="bill-badge upcoming">day ${b.dueDay}</span>`;
}

// ── bill → loan link ─────────────────────────────────────────────────────────
// Per-bill record of the payment txn posted to its linked loan account, keyed by month.
function billLinkedTxns(b) {
  if (!b.linkedTxns || typeof b.linkedTxns !== 'object') b.linkedTxns = {};
  return b.linkedTxns;
}
// Post `txn` to another account's stored data WITHOUT switching the active account, so the
// in-memory state (and any object references we're mid-mutation on) stay intact.
function _postTxnToAccount(acctId, txn) {
  if (acctId === currentAccountId) { state.transactions.push(txn); _save(); return; }
  const key = accountDataKey(acctId);
  const d = JSON.parse(localStorage.getItem(key) || '{}');
  d.transactions = d.transactions || [];
  d.transactions.push(txn);
  localStorage.setItem(key, JSON.stringify(d));
}
function _removeTxnFromAccount(acctId, payId) {
  if (acctId === currentAccountId) {
    const i = state.transactions.findIndex(t => t._billPayId === payId);
    if (i !== -1) { state.transactions.splice(i, 1); _save(); }
    return;
  }
  const key = accountDataKey(acctId);
  const d = JSON.parse(localStorage.getItem(key) || '{}');
  if (!Array.isArray(d.transactions)) return;
  const i = d.transactions.findIndex(t => t._billPayId === payId);
  if (i !== -1) { d.transactions.splice(i, 1); localStorage.setItem(key, JSON.stringify(d)); }
}
// Date a loan payment within the month it pays for (the bill's due day), or today if it's
// the current month — so it lands in the right month on the loan's history.
function _billPayDate(bill, mKey) {
  if (mKey === localMonthKey()) return today();
  const [y, mo] = mKey.split('-').map(Number);
  const dim = new Date(y, mo, 0).getDate();
  const day = Math.min(Math.max(1, parseInt(bill.dueDay) || 1), dim);
  return `${mKey}-${String(day).padStart(2, '0')}`;
}
// A loan/credit payment is an INCOME txn on that account (reduces "owed").
function postLoanPayment(bill, mKey) {
  const acctId = bill.linkedAccountId;
  if (!acctId || !state.accounts.find(a => a.id === acctId)) return;
  if (billLinkedTxns(bill)[mKey]) return;   // already posted for this month
  const payId = 'billpay-' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  _postTxnToAccount(acctId, {
    type: 'income', amount: bill.amount, description: bill.name + ' payment',
    category: 'Payment', date: _billPayDate(bill, mKey), account: acctId, _billPayId: payId,
  });
  billLinkedTxns(bill)[mKey] = payId;
}
function removeLoanPayment(bill, mKey) {
  const acctId = bill.linkedAccountId;
  const payId  = billLinkedTxns(bill)[mKey];
  delete billLinkedTxns(bill)[mKey];
  if (acctId && payId) _removeTxnFromAccount(acctId, payId);
}

// Which Spending-History view is showing on the Weekly Planner ('day' | 'week').
let _plannerHistView = 'day';

// Attach collapse/expand handlers for the week-by-week breakdown (year → month →
// week → transactions). Used by the Per Week view; safe to call on any scope.
function _attachWkbToggles(scope) {
  if (!scope) return;
  const wire = (sel, bodyFromHdr, chevronSel, openChar, closeChar) => {
    scope.querySelectorAll(sel).forEach(hdr => {
      const toggle = () => {
        const body = bodyFromHdr(hdr);
        if (!body) return;
        const chevron = chevronSel ? hdr.querySelector(chevronSel) : null;
        const open = body.style.display === 'none' || (chevronSel ? false : body.style.display !== 'block');
        body.style.display = open ? '' : 'none';
        hdr.dataset.open = String(open);
        hdr.setAttribute('aria-expanded', String(open));
        if (chevron) chevron.textContent = open ? openChar : closeChar;
      };
      hdr.addEventListener('click', toggle);
      hdr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  };
  wire('.wkb-year-toggle',  h => h.nextElementSibling, '.wkb-month-chevron', '▲', '▶');
  wire('.wkb-month-toggle', h => h.nextElementSibling, '.wkb-month-chevron', '▲', '▶');
  // Week rows show/hide their transactions (display:block toggled)
  scope.querySelectorAll('.wkb-header').forEach(hdr => {
    const toggle = () => {
      const txns = hdr.nextElementSibling;
      const tog  = hdr.querySelector('.pw-week-toggle');
      const open = txns.style.display !== 'block';
      txns.style.display = open ? 'block' : 'none';
      hdr.setAttribute('aria-expanded', String(open));
      if (tog) tog.textContent = open ? '▲' : '▼';
    };
    hdr.addEventListener('click', toggle);
    hdr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
}

// The per-day budget that was in effect on a given date: (balance entering that
// day − buffer − bills) ÷ days remaining in that day's month (including the day).
// "Entering that day" = balance through the prior day, so the day's own spending
// doesn't shrink its own budget. Uses the current buffer/bills settings.
function dailyBudgetFor(dateStr, buffer, bills) {
  const d = new Date(dateStr + 'T00:00:00');
  const prev = new Date(d); prev.setDate(d.getDate() - 1);
  const startBal = balanceAsOf(localDateStr(prev));
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const daysRem  = Math.max(1, Math.round((monthEnd - d) / 86400000) + 1);
  return Math.max(0, startBal - (buffer || 0) - (bills || 0)) / daysRem;
}

// Daily history — ~2 months of per-day spend grouped by week. Current week is
// expanded; previous weeks collapse into native <details>. Each day is measured
// against the budget that applied THAT day (today uses the live figure; past
// days reconstruct from that day's starting balance via dailyBudgetFor).
// Returns inner HTML, or '' when there's no data to show.
function buildDailyHistoryHTML(todayPerDay, buffer, bills) {
  const _today = today();
  const _now = new Date(); _now.setHours(0, 0, 0, 0);
  const _mon = new Date(_now); _mon.setDate(_now.getDate() - (_now.getDay() === 0 ? 6 : _now.getDay() - 1));
  const _fmtMD = dt => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  // ~2 months of daily history (the full ledger lives in the Per Week breakdown).
  const _cutoff = new Date(_now); _cutoff.setDate(_now.getDate() - 62);
  const groups = [];
  for (let w = 0; w < 14; w++) {
    const wMon = new Date(_mon); wMon.setDate(_mon.getDate() - w * 7);
    const wSunChk = new Date(wMon); wSunChk.setDate(wMon.getDate() + 6);
    if (w > 0 && wSunChk < _cutoff) break;   // past the 2-month window
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(wMon); d.setDate(wMon.getDate() + i);
      const dStr = localDateStr(d);
      if (dStr > _today) break;   // no future days in the current week
      const spent = state.transactions
        .filter(t => t.type === 'expense' && t.date === dStr && !isExcludedFromSpend(t))
        .reduce((s, t) => s + t.amount, 0);
      const budget = dStr === _today ? todayPerDay : dailyBudgetFor(dStr, buffer, bills);
      days.push({ dStr, spent, budget, isToday: dStr === _today, label: d.toLocaleDateString('en-US', { weekday: 'short' }), dayNum: d.getDate() });
    }
    if (!days.length) continue;
    const total = days.reduce((s, d) => s + d.spent, 0);
    if (w > 0 && total === 0) continue;   // skip empty past weeks (no noise)
    const wSun = new Date(wMon); wSun.setDate(wMon.getDate() + 6);
    const endDt = new Date(days[days.length - 1].dStr + 'T00:00:00');
    groups.push({
      relLabel: w === 0 ? 'This week' : w === 1 ? 'Last week' : `${_fmtMD(wMon)} – ${_fmtMD(wSun)}`,
      rangeLabel: `${_fmtMD(wMon)} – ${_fmtMD(w === 0 ? endDt : wSun)}`,
      total, days,
    });
  }
  if (!groups.length) return '';
  const row = d => {
    const _b    = d.budget;
    const _pct  = _b > 0 ? d.spent / _b : (d.spent > 0 ? 1 : 0);
    const _over = _b > 0 && d.spent > _b;
    const _color = _over ? 'var(--danger)' : _pct >= 0.75 ? 'var(--warn)' : 'var(--accent)';
    const _barW = Math.min(_pct * 100, 100).toFixed(1);
    return `<div class="dh-row${d.isToday ? ' dh-row--today' : ''}">
      <span class="dh-day">${d.label} ${d.dayNum}</span>
      <div class="dh-bar-wrap">
        <div class="dh-bar" style="width:${_barW}%;background:${_color}"></div>
        ${_over ? `<div class="dh-bar-mark"></div>` : ''}
      </div>
      <span class="dh-amt" style="color:${d.spent > 0 ? _color : 'var(--muted)'}">${fmt(d.spent)}<span class="dh-amt-of"> / ${fmt(_b)}</span></span>
    </div>`;
  };
  const cur = groups[0], prev = groups.slice(1);
  const curHtml = `
    <div class="dh-week-hdr dh-week-hdr--current">
      <span class="dh-week-name">${cur.relLabel}</span>
      <span class="dh-week-total">${fmt(cur.total)}</span>
    </div>
    <div class="dh-list">${cur.days.map(row).join('')}</div>`;
  const prevHtml = prev.map(g => `
    <details class="dh-week">
      <summary class="dh-week-hdr">
        <span class="dh-week-caret">›</span>
        <span class="dh-week-name">${g.relLabel}</span>
        ${g.relLabel !== g.rangeLabel ? `<span class="dh-week-sub">${g.rangeLabel}</span>` : ''}
        <span class="dh-week-total">${fmt(g.total)}</span>
      </summary>
      <div class="dh-list">${g.days.map(row).join('')}</div>
    </details>`).join('');
  return `${curHtml}${prevHtml}`;
}

function calcWeekly() {
  const { income: _wkInc, expense: _wkExp } = totals();
  const liveBalance = (state.startingBalance || 0) + _wkInc - _wkExp;
  const bills      = parseFloat(document.getElementById('wk-bills')?.value)   || 0;
  const stopAt     = parseFloat(document.getElementById('wk-stop-at')?.value) || 0;
  const now    = new Date(); now.setHours(0,0,0,0);
  const monday = new Date(now);
  monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  const mondayStr = monday.toISOString().split('T')[0];

  // ── Month-based budgeting ────────────────────────────────────────────────
  // Spend the current spendable balance across THIS calendar month. The weekly and
  // daily limits spread that balance over the time still remaining in the month.
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const { monthEnd, daysLeft: days, weeksLeft: weeks } = monthWindow(now, monday);
  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const available  = Math.max(0, liveBalance - stopAt - bills);
  const perWeek    = weeks > 0 ? available / weeks : 0;
  lastCalcPerWeek  = perWeek;
  lastCalcPerDay   = days > 0 ? available / days : 0;
  const perDay     = lastCalcPerDay;
  // Bills (logged from the Bills tab) are reserved separately via the "Fixed bills" field,
  // so they must NOT count toward discretionary weekly/daily spending.
  let weekExpenses = 0;
  for (const t of state.transactions) {
    if (t.date >= mondayStr) {
      if (t.type==='expense') { if (!isExcludedFromSpend(t)) weekExpenses+=t.amount; }
    }
  }
  // What you've spent this week stands on its own — income does NOT cancel it out.
  // Income only lifts the spendable balance (liveBalance → available → perWeek), i.e.
  // how much you're *able* to spend, never how much you've already spent.
  const weekNet  = weekExpenses;
  // Effective weekly limit. Prefer the live monthly figure; only fall back to a saved or
  // reconstructed value when the spendable balance has hit 0 (user dipped into the buffer).
  let _effectivePerWeek;
  if (perWeek > 0) {
    _effectivePerWeek = perWeek;
  } else {
    const savedPerWeek = parseFloat(state.weekly_plan?.budget_per_week || 0)
                      || parseFloat(state.weekly_plan?.per_week || 0) || 0;
    if (savedPerWeek > 0) {
      _effectivePerWeek = savedPerWeek;
    } else {
      const _prevSun      = new Date(monday); _prevSun.setDate(monday.getDate() - 1);
      const _prevSunStr   = _prevSun.toISOString().split('T')[0];
      const _wkStartAvail = Math.max(0, balanceAsOf(_prevSunStr) - stopAt - bills);
      _effectivePerWeek   = weeks > 0 ? _wkStartAvail / weeks : 0;
    }
  }
  // weekBudget = the fixed limit for display (denominator)
  const weekBudget  = _effectivePerWeek > 0 ? _effectivePerWeek : (weekNet > 0 ? weekNet : 0);
  const _wkFailed   = _effectivePerWeek > 0 && weekNet > _effectivePerWeek;
  // Bar goes past 100% when over limit (capped at 150% visually), turns red
  const weekPct     = weekBudget > 0 ? Math.min(weekNet / weekBudget, 1.5) : 0;
  const barColor    = _wkFailed ? 'var(--danger)' : weekPct >= 0.8 ? 'var(--warn)' : 'var(--success)';

  // Adjusted per day: remaining weekly budget spread across days left in this week (including today)
  const _todayWkIdx   = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon … 6=Sun
  const _daysLeftWk   = Math.max(1, 7 - _todayWkIdx);
  const adjustedPerDay = _effectivePerWeek > 0 ? Math.max(0, _effectivePerWeek - weekNet) / _daysLeftWk : 0;
  // Pace = how you're tracking against spreading the weekly budget evenly across the 7 days.
  // By end of day N you "should" have spent (weeklyBudget/7 × N). The gap is the dollar amount
  // you're over (spent faster → behind) or under (spent slower → ahead) that even pace.
  const _wkDailyTarget = _effectivePerWeek > 0 ? _effectivePerWeek / 7 : 0;
  const _daysElapsedWk = _todayWkIdx + 1;                       // Mon=1 … today
  const _expectedByNow = _wkDailyTarget * _daysElapsedWk;
  const _paceGap       = weekNet - _expectedByNow;              // + = behind (overspent), − = ahead
  const _paceThresh    = Math.max(1, _wkDailyTarget * 0.05);    // ignore rounding noise
  const _adjSub        = _effectivePerWeek <= 0      ? 'set a weekly budget'
                       : _paceGap >  _paceThresh     ? `↓ ${fmt(_paceGap)} behind pace`
                       : _paceGap < -_paceThresh     ? `↑ ${fmt(-_paceGap)} ahead of pace`
                       : 'on track';
  const _adjColor      = _effectivePerWeek <= 0  ? 'var(--muted)'
                       : _paceGap >  _paceThresh ? 'var(--danger)'
                       : _paceGap < -_paceThresh ? 'var(--success)'
                       : 'var(--accent)';

  const _reservedLabel  = [stopAt > 0 ? `${fmt(stopAt)} stop-at` : '', bills > 0 ? `${fmt(bills)} bills` : ''].filter(Boolean).join(' + ');
  const _perWeekCardVal = _effectivePerWeek;
  const _perWeekCardSub = _wkFailed ? `+${fmt(weekNet - _effectivePerWeek)} over limit` : `across ${weeks} week${weeks!==1?'s':''} left`;
  const _perWeekColor   = _wkFailed ? 'var(--danger)' : 'var(--warn)';
  const _monthName      = now.toLocaleDateString('en-US', { month: 'long' });
  const summaryCards = [
    ['THIS MONTH',   fmt(available),           'var(--accent)',  _reservedLabel ? `after ${_reservedLabel}` : `spendable in ${_monthName}`],
    ['BALANCE',      fmt(liveBalance),         'var(--text)',    `live — auto-updates`],
    ['PER WEEK',     fmt(_perWeekCardVal),     _perWeekColor,    _perWeekCardSub],
    ['PER DAY',      fmt(perDay),              'var(--accent)',  `${days} day${days!==1?'s':''} left · adjusts daily`],
  ].map(([t,v,c,s]) => `<div class="card"><div class="card-title">${t}</div><div class="card-value" style="color:${c}">${v}</div><div class="card-sub">${s}</div></div>`).join('');

  const thisWeekTxns = state.transactions.filter(t=>t.date>=mondayStr).sort((a,b)=>b.date.localeCompare(a.date));
  const thisWeekTxnHtml = thisWeekTxns.length
    ? thisWeekTxns.map(t=>`<div class="pw-txn-row"><span class="pw-txn-date">${t.date}</span><span class="pw-txn-amt" style="color:${t.type==='income'?'var(--success)':'var(--danger)'}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</span><span class="pw-txn-cat">${_escHtml(t.category||'')}</span><span class="pw-txn-desc">${_escHtml(t.description||'')}</span></div>`).join('')
    : '<p class="pw-empty">No transactions yet this week.</p>';

  const monLabel = monday.toLocaleDateString('en-US',{month:'short',day:'numeric'});

  // The breakdown spans the current calendar month end-to-end — every week of the month
  // renders regardless of the paycheck date. listEnd = the last day of the month.
  const listEnd    = monthEnd;
  const listEndStr = listEnd.toISOString().split('T')[0];

  // Start from the Monday of the week containing the 1st of the month, so the whole month
  // shows; reach further back only if there is older transaction data worth displaying.
  const monthFirstMonday = new Date(monthStart);
  monthFirstMonday.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
  // Per-week breakdown spans ALL history: start at the Monday of the week containing the
  // earliest transaction, through the end of the current month.
  let startMonday = new Date(monthFirstMonday);
  let _earliestTx = null;
  for (const t of state.transactions) { if (_earliestTx === null || t.date < _earliestTx) _earliestTx = t.date; }
  if (_earliestTx) {
    const _e = new Date(_earliestTx + 'T00:00:00');
    const _eMon = new Date(_e); _eMon.setDate(_e.getDate() - ((_e.getDay() + 6) % 7));
    if (_eMon < startMonday) startMonday = _eMon;
  }

  const totalDaysSpan = Math.round((listEnd - startMonday) / 86400000) + 1;
  const totalWeeks    = Math.max(1, Math.ceil(totalDaysSpan / 7));

  const txnRow = t => `<div class="pw-txn-row"><span class="pw-txn-date">${t.date}</span><span class="pw-txn-amt" style="color:${t.type==='income'?'var(--success)':'var(--danger)'}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</span><span class="pw-txn-cat">${_escHtml(t.category||'')}</span><span class="pw-txn-desc">${_escHtml(t.description||'')}</span></div>`;

  // 1) Build each week's row, tagged with its month/year.
  const _weekItems = [];
  Array.from({length: totalWeeks}, (_, w) => {
    const sd = new Date(startMonday); sd.setDate(startMonday.getDate() + w*7);
    const ed = new Date(startMonday); ed.setDate(startMonday.getDate() + (w+1)*7 - 1);
    if (ed > listEnd) ed.setTime(listEnd.getTime());
    const sdS = sd.toISOString().split('T')[0];
    const edS = ed.toISOString().split('T')[0];
    const isCurrent  = sdS <= mondayStr && mondayStr <= edS;
    const isPast     = edS < mondayStr;
    if (!isPast && !isCurrent && sdS >= listEndStr) return;
    const monthLabel = sd.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const monthName  = sd.toLocaleDateString('en-US', { month: 'long' });
    const year       = sd.getFullYear();
    const lbl = `${sd.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${ed.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
    const wkTxns = state.transactions.filter(t=>t.date>=sdS&&t.date<=edS);
    const wkExp  = wkTxns.filter(t=>t.type==='expense' && !isExcludedFromSpend(t)).reduce((s,t)=>s+t.amount,0);
    const wkNet  = wkExp;
    const txnHtml = wkTxns.length
      ? wkTxns.sort((a,b)=>b.date.localeCompare(a.date)).map(txnRow).join('')
      : '<p class="pw-empty">No transactions.</p>';
    const isCurrentMonth = monthLabel === currentMonthLabel;
    let rowHtml;
    if (isPast) {
      let _hInc = 0, _hExp = 0;
      for (const t of state.transactions) {
        if (t.date < sdS) { if (t.type==='income') _hInc+=t.amount; else _hExp+=t.amount; }
      }
      const _histBal = (state.startingBalance || 0) + _hInc - _hExp;
      const _histAvail = Math.max(0, _histBal - stopAt - bills);
      const _histMonthEnd = new Date(sd.getFullYear(), sd.getMonth() + 1, 0);
      const _histWeeks    = weeksFromMonday(sd, _histMonthEnd);
      const _histPerWk    = _histWeeks > 0 ? _histAvail / _histWeeks : 0;
      const pastPct      = _histPerWk > 0 ? Math.min(wkExp / _histPerWk * 100, 100) : 0;
      const pastBarColor = wkExp > _histPerWk && _histPerWk > 0 ? 'var(--danger)' : wkExp >= _histPerWk * 0.8 && _histPerWk > 0 ? 'var(--warn)' : 'var(--muted)';
      const spentColor   = _histPerWk > 0 && wkExp > _histPerWk ? 'var(--danger)' : wkExp > 0 ? 'var(--text)' : 'var(--muted)';
      const spentLabel   = wkExp > 0 ? `${fmt(wkExp)} / ${fmt(_histPerWk)}` : 'No spending';
      const miniBar      = _histPerWk > 0 ? `<div class="breakdown-bar-bg small" style="flex:1;margin:0 8px"><div class="breakdown-bar-fill" style="width:${pastPct.toFixed(1)}%;background:${pastBarColor}"></div></div>` : `<span style="flex:1"></span>`;
      const displayLabel = `<span class="wkb-amounts" style="color:${spentColor}">${spentLabel}</span>`;
      rowHtml = `<div class="wkb-row wkb-past"><div class="wkb-header" role="button" tabindex="0" aria-expanded="false"><span class="week-dates">${lbl}</span>${miniBar}${displayLabel}<span class="pw-week-toggle">▼</span></div><div class="pw-week-txns">${txnHtml}</div></div>`;
    } else {
      const _rowDenominator = _effectivePerWeek > 0 ? _effectivePerWeek : (wkNet > 0 ? wkNet : perWeek);
      const wkPct   = _rowDenominator > 0 ? Math.min(wkNet/_rowDenominator*100,100) : 0;
      const wkColor = isCurrent && _wkFailed ? 'var(--danger)' : wkPct>=80?'var(--warn)':wkNet>0?'var(--success)':'var(--muted)';
      const badge   = isCurrent ? '<span class="wkb-current-badge">THIS WEEK</span>' : '';
      rowHtml = `<div class="wkb-row${isCurrent?' wkb-current':''}"><div class="wkb-header" role="button" tabindex="0" aria-expanded="false">${badge}<span class="week-dates">${lbl}</span><div class="breakdown-bar-bg small"><div class="breakdown-bar-fill" style="width:${wkPct.toFixed(1)}%;background:${wkColor}"></div></div><span class="wkb-amounts" style="color:${wkColor}">${fmt(wkNet)} / ${fmt(_rowDenominator)}</span><span class="pw-week-toggle">▼</span></div><div class="pw-week-txns">${txnHtml}</div></div>`;
    }
    _weekItems.push({ monthLabel, monthName, year, isCurrentMonth, exp: wkExp, rowHtml });
  });

  // 2) Group: months normally; once history spans ≥ 12 months, wrap months in
  //    collapsible year sections (year → month → week → transactions).
  const _distinctMonths = new Set(_weekItems.map(i => i.monthLabel)).size;
  const _yearMode = _distinctMonths >= 12;
  const _curYearNum = now.getFullYear();
  const _yearTotals = {};
  if (_yearMode) _weekItems.forEach(i => { _yearTotals[i.year] = (_yearTotals[i.year] || 0) + i.exp; });
  const allRowsHtml = [];
  let lastYear = null, lastMonth = null;
  for (const it of _weekItems) {
    if (_yearMode && it.year !== lastYear) {
      if (lastMonth !== null) allRowsHtml.push(`</div>`);   // close month body
      if (lastYear !== null)  allRowsHtml.push(`</div>`);   // close year body
      lastMonth = null; lastYear = it.year;
      const yOpen = it.year === _curYearNum;
      allRowsHtml.push(`<div class="wkb-year-header wkb-year-toggle" data-open="${yOpen}" role="button" tabindex="0" aria-expanded="${yOpen}">${it.year}<span class="wkb-year-total">${fmt(_yearTotals[it.year])} spent</span><span class="wkb-month-chevron">${yOpen ? '▲' : '▶'}</span></div>`);
      allRowsHtml.push(`<div class="wkb-year-body"${yOpen ? '' : ' style="display:none"'}>`);
    }
    if (it.monthLabel !== lastMonth) {
      if (lastMonth !== null) allRowsHtml.push(`</div>`);   // close previous month body
      lastMonth = it.monthLabel;
      const _mhBudget = it.isCurrentMonth ? ` <span style="font-weight:600;color:var(--accent);font-size:.82em">· ${fmt(available)} to spend</span>` : '';
      const _mLabel = _yearMode ? it.monthName : it.monthLabel;
      allRowsHtml.push(`<div class="wkb-month-header wkb-month-toggle" data-open="${it.isCurrentMonth}" role="button" tabindex="0" aria-expanded="${it.isCurrentMonth}">${_mLabel}${_mhBudget}<span class="wkb-month-chevron">${it.isCurrentMonth ? '▲' : '▶'}</span></div>`);
      allRowsHtml.push(`<div class="wkb-month-body"${it.isCurrentMonth ? '' : ' style="display:none"'}>`);
    }
    allRowsHtml.push(it.rowHtml);
  }
  if (lastMonth !== null) allRowsHtml.push(`</div>`);       // close last month body
  if (_yearMode && lastYear !== null) allRowsHtml.push(`</div>`); // close last year body
  const breakdownHtml = allRowsHtml.join('');

  // ── Write summary + this-week tracker to #wk-live (always updated) ─────
  const liveEl = document.getElementById('wk-live');
  if (!liveEl) return;
  liveEl.innerHTML = `
    <div class="cards-grid">${summaryCards}</div>
    <div class="week-tracker">
      <div class="wt-header">
        <span class="wt-label">THIS WEEK</span>
        <span class="wt-dates">(Mon ${monLabel} – today)</span>
        <span class="wt-pct" style="color:${barColor}">${_wkFailed ? 'OVER LIMIT' : (weekPct*100).toFixed(0)+'% used'}</span>
      </div>
      <div class="wt-amounts">
        <span class="wt-spent" style="color:${barColor}">${fmt(weekNet)}</span>
        <span class="wt-of" style="color:${barColor}"> / ${fmt(weekBudget)}</span>
      </div>
      ${_wkFailed ? `<div class="wt-offset" style="color:var(--danger);font-weight:700">+${fmt(weekNet - _effectivePerWeek)} over limit</div>` : ''}
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${Math.min(weekPct*100, 100).toFixed(1)}%;background:${barColor}"></div>
      </div>
      <div class="wt-txns-section">
        <button class="wt-txns-toggle">▼  show transactions</button>
        <div class="pw-week-txns wt-txns-body">${thisWeekTxnHtml}</div>
      </div>
    </div>`;
  liveEl.querySelector('.wt-txns-toggle')?.addEventListener('click', function() {
    const body = this.nextElementSibling;
    const open = body.style.display !== 'block';
    body.style.display = open ? 'block' : 'none';
    this.textContent = open ? '▲  hide transactions' : '▼  show transactions';
  });

  // ── Spending history — switchable Per Day / Per Week views on one card ─────
  const dhBody = document.getElementById('wk-dh-body');
  if (dhBody) {
    // Prominent "spent / limit" stat per view (e.g. $10 / $100).
    const _todayStr = today();
    let _todaySpent = 0;
    for (const t of state.transactions) {
      if (t.type === 'expense' && t.date === _todayStr && !isExcludedFromSpend(t)) _todaySpent += t.amount;
    }
    const _statColor = (spent, lim) => spent > lim && lim > 0 ? 'var(--danger)' : (lim > 0 && spent >= lim * 0.8 ? 'var(--warn)' : 'var(--accent)');
    const _statHtml = (spent, lim, cap) => lim > 0
      ? `<div class="wk-hist-stat"><span class="wk-hist-stat-val" style="color:${_statColor(spent, lim)}">${fmt(spent)} <span class="wk-hist-stat-of">/ ${fmt(lim)}</span></span><span class="wk-hist-stat-cap">${cap}</span></div>`
      : '';

    const _dailyRows = buildDailyHistoryHTML(perDay, stopAt, bills);
    const _dailyHtml  = _dailyRows  ? _statHtml(_todaySpent, perDay, 'spent today · per-day limit') + _dailyRows : '';
    const _weeklyHtml = breakdownHtml ? _statHtml(weekNet, _effectivePerWeek, 'this week · per-week limit') + breakdownHtml : '';

    const card = document.getElementById('wk-hist-card');
    const seg  = document.getElementById('wk-hist-seg');
    if (!_dailyHtml && !_weeklyHtml) {
      if (card) card.style.display = 'none';
    } else {
      if (card) card.style.display = '';
      let _view = _plannerHistView;
      if (_view === 'day'  && !_dailyHtml)  _view = 'week';
      if (_view === 'week' && !_weeklyHtml) _view = 'day';
      // Render both views once and toggle visibility, so the Per Week breakdown's
      // collapse handlers survive view switches (no re-attach needed).
      dhBody.innerHTML =
        `<div id="wk-dh-day"${_view === 'day' ? '' : ' style="display:none"'}>${_dailyHtml}</div>` +
        `<div id="wk-dh-week"${_view === 'week' ? '' : ' style="display:none"'}>${_weeklyHtml}</div>`;
      _attachWkbToggles(document.getElementById('wk-dh-week'));
      const _dayDiv  = document.getElementById('wk-dh-day');
      const _weekDiv = document.getElementById('wk-dh-week');
      if (seg) {
        seg.querySelectorAll('.wk-seg-btn').forEach(b => {
          const _has = b.dataset.view === 'week' ? !!_weeklyHtml : !!_dailyHtml;
          b.classList.toggle('active', b.dataset.view === _view);
          b.disabled = !_has;
          b.onclick = () => {
            if (b.disabled) return;
            _plannerHistView = b.dataset.view;
            if (_dayDiv)  _dayDiv.style.display  = b.dataset.view === 'day'  ? '' : 'none';
            if (_weekDiv) _weekDiv.style.display = b.dataset.view === 'week' ? '' : 'none';
            seg.querySelectorAll('.wk-seg-btn').forEach(x => x.classList.toggle('active', x === b));
          };
        });
      }
    }
  }
}

// ── bills ──────────────────────────────────────────────────────────────────
function renderBills() {
  const m = billsMonth;
  const isCurMonth = m === curMonthKey();
  const [mY, mM] = m.split('-').map(Number);
  const catOptions = getCategories().map(c => `<option>${_escHtml(c)}</option>`).join('');
  const debtAccts = state.accounts.filter(a => a.type === 'credit' || a.type === 'loan');
  const linkOpts = sel => `<option value="">— not linked —</option>` +
    debtAccts.map(a => `<option value="${a.id}"${a.id === sel ? ' selected' : ''}>${_escHtml(a.name)}</option>`).join('');
  const billsHtml = state.bills.length ? state.bills.map((b, i) => {
    const paid  = isBillPaidFor(b, m);
    const badge = billBadgeHtml(b, m, isCurMonth);
    const linkName = b.linkedAccountId ? (state.accounts.find(a => a.id === b.linkedAccountId)?.name) : null;
    const deducted = paid && !!billLoggedTxns(b)[m];   // was the cash expense logged this month?
    return `
      <div class="bill-card${paid ? ' bill-card-paid' : ''}">
        <div class="bill-card-main">
          <span class="cat-dot" style="background:${CAT_COLORS[b.category]||'#9896a4'}"></span>
          <div class="bill-card-info">
            <div class="bill-card-name">${_escHtml(b.name)}</div>
            <div class="bill-card-meta">${_escHtml(b.category)} · due day ${b.dueDay}${linkName ? ` · ${ICONS.link} ${_escHtml(linkName)}` : ''}</div>
          </div>
          <div class="bill-card-right">
            <div class="bill-card-amt">${fmt(b.amount)}</div>
            ${badge}
          </div>
        </div>
        <div class="bill-card-actions">
          <button class="btn-xs bill-paid-btn${paid ? ' bill-unpaid-btn' : ''}" data-idx="${i}" data-paid="${paid}">${paid ? '↩ Mark Unpaid' : '✓ Mark Paid'}</button>
          ${paid && !deducted ? `<button class="btn-xs bill-deduct-btn" data-idx="${i}">${ICONS.dollar} Deduct cash</button>` : ''}
          <button class="btn-xs bill-edit-btn" data-idx="${i}">Edit</button>
          <button class="btn-xs bill-delete-btn" style="background:var(--danger);color:white;border-color:var(--danger)" data-idx="${i}">Delete</button>
        </div>
        ${paid ? `<div class="bill-deduct-note ${deducted ? 'is-deducted' : 'not-deducted'}">${deducted ? `✓ ${fmt(b.amount)} deducted from cash` : 'Not deducted from your cash balance'}</div>` : ''}
        ${debtAccts.length ? `<div class="bill-link-row"><span class="bill-link-lbl">Pays loan</span><select class="bill-link-select form-input" data-idx="${i}">${linkOpts(b.linkedAccountId)}</select></div>` : ''}
        <div class="bill-edit-form" id="bill-edit-${i}" style="display:none">
          <div class="form-row">
            <label class="form-label">Bill name</label>
            <input type="text" class="form-input bill-edit-name" value="${_escHtml(b.name)}">
          </div>
          <div class="form-row">
            <label class="form-label">Amount ($)</label>
            <input type="number" class="form-input bill-edit-amount" value="${b.amount}" step="0.01" min="0" inputmode="decimal">
          </div>
          <div class="form-row">
            <label class="form-label">Due day of month (1–31)</label>
            <input type="number" class="form-input bill-edit-dueday" value="${b.dueDay}" min="1" max="31" inputmode="numeric">
          </div>
          <div class="form-row">
            <label class="form-label">Category</label>
            <select class="form-input form-select bill-edit-cat">${getCategories().map(c => `<option${c === b.category ? ' selected' : ''}>${_escHtml(c)}</option>`).join('')}</select>
          </div>
          <div class="bill-edit-actions">
            <button class="btn-xs bill-edit-save" data-idx="${i}">Save changes</button>
            <button class="btn-xs bill-edit-cancel" data-idx="${i}">Cancel</button>
          </div>
        </div>
      </div>`;
  }).join('') : emptyState('No bills yet', 'Add a recurring bill below to start tracking');

  const totalMonthly = state.bills.reduce((s, b) => s + b.amount, 0);
  const totalUnpaid  = state.bills.filter(b => !isBillPaidFor(b, m)).reduce((s, b) => s + b.amount, 0);

  // Month navigator — lets you pay ahead (e.g. mark next month's bills paid early).
  const monthNavHtml = `
    <div class="bills-month-nav">
      <button class="bills-month-arrow" id="bills-month-prev" aria-label="Previous month">‹</button>
      <div class="bills-month-label">${monthKeyLabel(m)}${isCurMonth ? '' : ' <button class="bills-month-today" id="bills-month-today">Today</button>'}</div>
      <button class="bills-month-arrow" id="bills-month-next" aria-label="Next month">›</button>
    </div>`;

  // ── bill calendar (for the selected month) ─────────────────────────────────
  const billCalHtml = (() => {
    if (!state.bills.length) return '';
    const firstDay = new Date(mY, mM - 1, 1).getDay();   // 0=Sun
    const daysInM  = new Date(mY, mM, 0).getDate();
    const todayD   = isCurMonth ? new Date().getDate() : -1;
    // Map dueDay -> bills
    const billsByDay = {};
    state.bills.forEach(b => { (billsByDay[b.dueDay] = billsByDay[b.dueDay] || []).push(b); });
    const dayHdrs = ['S','M','T','W','T','F','S'].map(d => `<div class="bcal-hdr">${d}</div>`).join('');
    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<div class="bcal-cell"></div>';
    for (let d = 1; d <= daysInM; d++) {
      const bs      = billsByDay[d] || [];
      const hasBill = bs.length > 0;
      // Three-state dot: all paid → green; unpaid & past its day this month (or a past month)
      // → red overdue; otherwise amber due.
      let statusCls = '';
      if (hasBill) {
        const allPaid = bs.every(b => isBillPaidFor(b, m));
        const overdue = (isCurMonth && d < todayD) || (m < curMonthKey());
        statusCls = allPaid ? 'bill-paid' : overdue ? 'bill-overdue' : 'bill-soon';
      }
      const cls     = ['bcal-cell', d === todayD ? 'today' : '', statusCls].filter(Boolean).join(' ');
      cells += `<div class="${cls}" data-day="${d}"${hasBill ? ' role="button" tabindex="0"' : ''}><span class="bcal-num">${d}</span>${hasBill ? '<span class="bcal-dot"></span>' : ''}</div>`;
    }
    return `
      <div class="bill-cal">
        <div class="bcal-grid" id="bcal-grid">${dayHdrs}${cells}</div>
        <div id="bcal-day-detail" class="bcal-day-detail" style="display:none"></div>
        <div class="bcal-legend3">
          <span><i class="lg-paid"></i>Paid</span>
          <span><i class="lg-soon"></i>Due</span>
          <span><i class="lg-over"></i>Overdue</span>
        </div>
      </div>`;
  })();

  const totalPaid = Math.max(0, totalMonthly - totalUnpaid);
  const summary3Html = `
    <div class="bills-sum3">
      <div class="bsum-blk">
        <div class="bsum-k">Total</div>
        <div class="bsum-v">${fmt(totalMonthly)}</div>
      </div>
      <div class="bsum-div"></div>
      <div class="bsum-blk">
        <div class="bsum-k">Remaining</div>
        <div id="bills-still-due" class="bsum-v" style="color:${totalUnpaid>0?'var(--warn)':'var(--success)'}">${fmt(totalUnpaid)}</div>
      </div>
      <div class="bsum-div"></div>
      <div class="bsum-blk">
        <div class="bsum-k">Paid</div>
        <div class="bsum-v" style="color:var(--success)">${fmt(totalPaid)}</div>
      </div>
    </div>`;

  const addFormHtml = `
      <div class="form-card">
        <h2 class="section-title" style="margin:0 0 8px">Add Bill</h2>
        <div class="form-row">
          <label class="form-label">Bill name</label>
          <input type="text" id="bill-name" class="form-input" placeholder="e.g. Netflix">
        </div>
        <div class="form-row">
          <label class="form-label">Amount ($)</label>
          <input type="number" id="bill-amount" class="form-input" placeholder="0.00" step="0.01" min="0" inputmode="decimal">
        </div>
        <div class="form-row">
          <label class="form-label">Due day of month (1–31)</label>
          <input type="number" id="bill-dueday" class="form-input" placeholder="e.g. 15" min="1" max="31" inputmode="numeric">
        </div>
        <div class="form-row">
          <label class="form-label">Category</label>
          <select id="bill-cat" class="form-input form-select">${catOptions}</select>
        </div>
        ${debtAccts.length ? `<div class="form-row">
          <label class="form-label">Pays loan</label>
          <select id="bill-link" class="form-input form-select">${linkOpts('')}</select>
        </div>` : ''}
        <div id="bill-status" class="form-status"></div>
        <button id="bill-add-btn" class="btn-primary">Add Bill</button>
      </div>`;

  // Calendar-forward layout: month nav → quick Total/Remaining/Paid summary → the
  // calendar as hero → the month's bill list → add form at the bottom.
  return `
    <div class="page">
      <h1 class="page-title">Bills</h1>
      <p class="page-sub">track recurring monthly bills</p>
      ${state.bills.length ? `
        ${monthNavHtml}
        ${summary3Html}
        ${billCalHtml}
        <h2 class="section-title">This month</h2>
        <div class="bills-list">${billsHtml}</div>
      ` : ''}
      ${addFormHtml}
    </div>`;
}

function attachBills() {
  // Reconcile: make sure every linked + already-paid bill has its loan payment posted.
  // Covers bills linked (or paid) before this feature existed. The postLoanPayment guard
  // (skip if linkedTxns[month] already set) prevents duplicates and respects manual deletes.
  (async () => {
    let changed = false;
    for (const b of state.bills) {
      if (!b.linkedAccountId) continue;
      for (const mKey of billPaidMonths(b)) {
        if (!billLinkedTxns(b)[mKey]) { postLoanPayment(b, mKey); changed = true; }
      }
    }
    if (changed) await api.saveBills(state.bills);
  })();

  document.getElementById('bill-add-btn')?.addEventListener('click', async () => {
    const name    = document.getElementById('bill-name').value.trim();
    const amount  = parseFloat(document.getElementById('bill-amount').value);
    const dueDay  = parseInt(document.getElementById('bill-dueday').value);
    const category = document.getElementById('bill-cat').value;
    if (!name) { showStatus('bill-status', 'Enter a bill name.', 'error'); return; }
    if (isNaN(amount) || amount <= 0) { showStatus('bill-status', 'Enter a valid amount.', 'error'); return; }
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) { showStatus('bill-status', 'Enter a day 1–31.', 'error'); return; }
    const linkedAccountId = document.getElementById('bill-link')?.value || null;
    state.bills.push({ id: Date.now(), name, amount, dueDay, category, paidMonths: [], loggedTxns: {}, linkedTxns: {}, linkedAccountId });
    await api.saveBills(state.bills);
    render();
  });

  // Month navigator
  document.getElementById('bills-month-prev')?.addEventListener('click', () => { billsMonth = shiftMonthKey(billsMonth, -1); render(); });
  document.getElementById('bills-month-next')?.addEventListener('click', () => { billsMonth = shiftMonthKey(billsMonth, +1); render(); });
  document.getElementById('bills-month-today')?.addEventListener('click', () => { billsMonth = curMonthKey(); render(); });

  // Link a bill to a loan/credit account — backfill payments for months already paid,
  // and clean up payments on the previously-linked account.
  document.querySelectorAll('.bill-link-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const i = parseInt(sel.dataset.idx);
      const b = state.bills[i];
      const newLink = sel.value || null;
      // Remove any existing payments from the OLD account (while linkedAccountId still points there)
      for (const mKey of Object.keys(billLinkedTxns(b))) removeLoanPayment(b, mKey);
      b.linkedAccountId = newLink;
      // Post a payment for every month this bill is currently marked paid
      if (newLink) for (const mKey of billPaidMonths(b)) postLoanPayment(b, mKey);
      await api.saveBills(state.bills);
      const acctName = newLink ? (state.accounts.find(a => a.id === newLink)?.name) : null;
      const n = newLink ? billPaidMonths(b).length : 0;
      if (acctName) showAlert(n ? `🔗 Linked to ${acctName} — posted ${n} payment${n !== 1 ? 's' : ''}` : `🔗 Linked to ${acctName}`);
      render();
    });
  });

  // Deduct cash for a bill that's marked paid but never logged the expense (recovers a
  // missed deduction without unmarking/re-marking).
  document.querySelectorAll('.bill-deduct-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.idx);
      const m = billsMonth;
      const b = state.bills[i];
      if (billLoggedTxns(b)[m]) { render(); return; }   // already deducted
      const billTxnId = 'billtxn-' + Date.now().toString(36);
      await api.addTransaction({
        type: 'expense', amount: b.amount, description: b.name,
        category: b.category, date: today(),
        account: currentAccountId, _billTxnId: billTxnId,
      });
      markBillPaid(b, m, billTxnId);
      await api.saveBills(state.bills);
      showAlert(`✓ ${fmt(b.amount)} deducted for ${b.name}`);
      render();
    });
  });

  document.querySelectorAll('.bill-paid-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i    = parseInt(btn.dataset.idx);
      const paid = btn.dataset.paid === 'true';
      const m    = billsMonth;
      const isCurMonth = m === curMonthKey();

      // Update just the card DOM — no render(), no scroll jump
      const refreshCard = () => {
        const b2     = state.bills[i];
        const isPaid = isBillPaidFor(b2, m);
        const card   = btn.closest('.bill-card');
        if (!card) return;
        card.classList.toggle('bill-card-paid', isPaid);
        const badgeEl = card.querySelector('.bill-badge');
        if (badgeEl) badgeEl.outerHTML = billBadgeHtml(b2, m, isCurMonth);
        btn.innerHTML = isPaid ? '↩ Mark Unpaid' : '✓ Mark Paid';
        btn.dataset.paid = String(isPaid);
        btn.classList.toggle('bill-unpaid-btn', isPaid);
        const stillDue   = state.bills.filter(b => !isBillPaidFor(b, m)).reduce((s, b) => s + b.amount, 0);
        const stillDueEl = document.getElementById('bills-still-due');
        if (stillDueEl) {
          stillDueEl.textContent   = fmt(stillDue);
          stillDueEl.style.color   = stillDue > 0 ? 'var(--warn)' : 'var(--success)';
        }
        const calCell = document.querySelector(`#bcal-grid .bcal-cell[data-day="${b2.dueDay}"]`);
        if (calCell) {
          const dayBills = state.bills.filter(b => b.dueDay === b2.dueDay);
          const allPaid  = dayBills.length > 0 && dayBills.every(b => isBillPaidFor(b, m));
          calCell.classList.toggle('bill-paid', allPaid);
          calCell.classList.toggle('bill-due',  !allPaid);
        }
        updateBillBadge();
      };

      if (paid) {
        // Marking unpaid — remove this month's logged expense (if one was logged)
        const b2          = state.bills[i];
        const storedTxnId = markBillUnpaid(b2, m);
        if (b2.linkedAccountId) await removeLoanPayment(b2, m);   // reverse the loan payment
        let txnIdx        = -1;
        if (storedTxnId) txnIdx = state.transactions.findIndex(t => t._billTxnId === storedTxnId);
        if (txnIdx === -1) {
          // Fallback: an expense in that month matching this bill's name + amount
          const bName = (b2.name || '').trim().toLowerCase();
          const bAmt  = +b2.amount;
          for (let j = state.transactions.length - 1; j >= 0; j--) {
            const t = state.transactions[j];
            if (t.type === 'expense' && isBillTxn(t) && +t.amount === bAmt &&
                (t.description || '').trim().toLowerCase() === bName &&
                (t.date || '').startsWith(m)) { txnIdx = j; break; }
          }
        }
        await api.saveBills(state.bills);
        if (txnIdx !== -1) {
          await api.deleteTransaction(txnIdx);
          showAlert(`↩ ${b2.name} marked unpaid — expense removed from ledger`);
        } else {
          showAlert(`↩ ${b2.name} marked unpaid`);
        }
        refreshCard();
      } else {
        // Marking paid — mark, pay down the linked loan (if any), then ask about cash.
        const b = state.bills[i];
        markBillPaid(b, m, null);
        if (b.linkedAccountId) await postLoanPayment(b, m);   // always pay down the loan
        await api.saveBills(state.bills);
        haptic([20, 40, 20]);
        const linkName    = b.linkedAccountId ? (state.accounts.find(a => a.id === b.linkedAccountId)?.name) : null;
        const curAcctName = state.accounts.find(a => a.id === currentAccountId)?.name || 'this account';
        showConfirmModal({
          title: 'Mark Paid',
          message: linkName
            ? `Paid ${fmt(b.amount)} toward ${_escHtml(linkName)} — its balance is updated. Also deduct this from your ${_escHtml(curAcctName)} balance as an expense?`
            : `"${_escHtml(b.name)}" is now marked paid for ${monthKeyLabel(m)}. Also log a ${fmt(b.amount)} expense and deduct it from your balance? Skip this if you've already recorded the payment.`,
          confirmText: 'Log & Deduct',
          cancelText: 'Just Mark Paid',
          onConfirm: async () => {
            const billTxnId = 'billtxn-' + Date.now().toString(36);
            await api.addTransaction({
              type: 'expense', amount: b.amount, description: b.name,
              category: b.category, date: today(),
              account: currentAccountId, _billTxnId: billTxnId,
            });
            markBillPaid(b, m, billTxnId);
            await api.saveBills(state.bills);
            refreshCard();
          },
          onCancel: refreshCard,
        });
      }
    });
  });

  // Edit an existing bill — reveal the inline form, then save its fields back to the bill.
  document.querySelectorAll('.bill-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      const form = document.getElementById(`bill-edit-${i}`);
      if (!form) return;
      const open = form.style.display !== 'none';
      form.style.display = open ? 'none' : '';
      if (!open) form.querySelector('.bill-edit-name')?.focus();
    });
  });
  document.querySelectorAll('.bill-edit-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      const form = document.getElementById(`bill-edit-${i}`);
      if (form) form.style.display = 'none';
    });
  });
  document.querySelectorAll('.bill-edit-save').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.idx);
      const b = state.bills[i];
      if (!b) return;
      const form   = document.getElementById(`bill-edit-${i}`);
      const name   = form.querySelector('.bill-edit-name').value.trim();
      const amount = parseFloat(form.querySelector('.bill-edit-amount').value);
      const dueDay = parseInt(form.querySelector('.bill-edit-dueday').value);
      const category = form.querySelector('.bill-edit-cat').value;
      if (!name) { showAlert('Enter a bill name.'); return; }
      if (isNaN(amount) || amount <= 0) { showAlert('Enter a valid amount.'); return; }
      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) { showAlert('Enter a day 1–31.'); return; }
      b.name = name; b.amount = amount; b.dueDay = dueDay; b.category = category;
      await api.saveBills(state.bills);
      render();
    });
  });

  document.querySelectorAll('.bill-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      const b = state.bills[i];
      const loggedIds = Object.values(billLoggedTxns(b)).filter(Boolean);
      const extra = loggedIds.length ? ' Any logged expenses for this bill will also be removed from your ledger.' : '';
      showConfirmModal({
        title: 'Delete Bill',
        message: `Delete "${_escHtml(b.name)}"? This cannot be undone.${extra}`,
        confirmText: 'Delete', danger: true,
        onConfirm: async () => {
          // Remove every logged expense for this bill (re-find each time — indices shift on delete)
          for (const id of loggedIds) {
            const ti = state.transactions.findIndex(t => t._billTxnId === id);
            if (ti !== -1) await api.deleteTransaction(ti);
          }
          // Reverse every linked loan payment this bill made
          for (const mKey of Object.keys(billLinkedTxns(b))) await removeLoanPayment(b, mKey);
          state.bills.splice(i, 1);
          await api.saveBills(state.bills);
          render();
        },
      });
    });
  });

  // ── calendar day click ────────────────────────────────────────────────────
  const curM2   = billsMonth;
  const detailEl = document.getElementById('bcal-day-detail');
  let activeDay  = null;

  document.querySelectorAll('#bcal-grid .bcal-cell[data-day]').forEach(cell => {
    cell.addEventListener('click', () => {
      const day = parseInt(cell.dataset.day);
      const bills = state.bills.filter(b => b.dueDay === day);
      if (!bills.length) return;

      // Toggle off if clicking the same day
      if (activeDay === day) {
        activeDay = null;
        detailEl.style.display = 'none';
        document.querySelectorAll('#bcal-grid .bcal-cell').forEach(c => c.classList.remove('bcal-selected'));
        return;
      }
      activeDay = day;
      document.querySelectorAll('#bcal-grid .bcal-cell').forEach(c => c.classList.remove('bcal-selected'));
      cell.classList.add('bcal-selected');

      const mo   = monthKeyLabel(curM2).split(' ')[0];
      const rows = bills.map((b, idx) => {
        const paid    = isBillPaidFor(b, curM2);
        const color   = CAT_COLORS[b.category] || '#9896a4';
        const billIdx = state.bills.indexOf(b);
        return `
          <div class="bcal-detail-row">
            <span class="cat-dot" style="background:${color}"></span>
            <div class="bcal-detail-info">
              <div class="bcal-detail-name">${_escHtml(b.name)}</div>
              <div class="bcal-detail-meta">${_escHtml(b.category)} · ${fmt(b.amount)}</div>
            </div>
            <button class="btn-xs bcal-quick-paid" data-bidx="${billIdx}" data-paid="${paid}"
              style="${paid ? 'background:rgba(50,215,75,.15);color:var(--success);border-color:rgba(50,215,75,.3)' : ''}">
              ${paid ? '✓ Paid' : 'Mark Paid'}
            </button>
          </div>`;
      }).join('');

      detailEl.innerHTML = `
        <div class="bcal-detail-hdr">${mo} ${day}</div>
        ${rows}`;
      detailEl.style.display = '';

      // Quick-pay from detail panel (marks paid only — never logs/deducts)
      detailEl.querySelectorAll('.bcal-quick-paid').forEach(btn => {
        btn.addEventListener('click', async () => {
          const bi   = parseInt(btn.dataset.bidx);
          const wasPaid = btn.dataset.paid === 'true';
          if (wasPaid) {
            const txnId = markBillUnpaid(state.bills[bi], curM2);
            if (txnId) { const ti = state.transactions.findIndex(t => t._billTxnId === txnId); if (ti !== -1) await api.deleteTransaction(ti); }
            if (state.bills[bi].linkedAccountId) await removeLoanPayment(state.bills[bi], curM2);
          } else {
            markBillPaid(state.bills[bi], curM2, null);
            if (state.bills[bi].linkedAccountId) await postLoanPayment(state.bills[bi], curM2);
          }
          await api.saveBills(state.bills);
          // Re-render detail without full page render
          btn.dataset.paid = String(!wasPaid);
          if (!wasPaid) {
            btn.textContent = '✓ Paid';
            btn.style.cssText = 'background:rgba(50,215,75,.15);color:var(--success);border-color:rgba(50,215,75,.3)';
            cell.classList.remove('bill-due');
            cell.classList.add('bill-paid');
          } else {
            btn.textContent = 'Mark Paid';
            btn.style.cssText = '';
            cell.classList.remove('bill-paid');
            cell.classList.add('bill-due');
          }
        });
      });
    });
  });
}

// ── insights & trends ───────────────────────────────────────────────────────
// Read any account's stored transactions + starting balance (current account uses live state).
function _acctData(acctId) {
  return (acctId === currentAccountId)
    ? { transactions: state.transactions, startingBalance: state.startingBalance }
    : JSON.parse(localStorage.getItem(accountDataKey(acctId)) || '{}');
}
// Asset-direction balance (startingBalance + income − expense).
function _acctAssetBalance(acctId) {
  const d = _acctData(acctId);
  let inc = 0, exp = 0;
  (d.transactions || []).forEach(t => { if (t.type === 'income') inc += t.amount; else exp += t.amount; });
  return (parseFloat(d.startingBalance) || 0) + inc - exp;
}
// Debt-direction "owed" (startingBalance + charges − payments), floored at 0.
function _acctOwed(acctId) {
  const d = _acctData(acctId);
  let inc = 0, exp = 0;
  (d.transactions || []).forEach(t => { if (t.type === 'income') inc += t.amount; else exp += t.amount; });
  const startingBal = parseFloat(d.startingBalance) || 0;
  return { owed: Math.max(0, startingBal + exp - inc), startingBal };
}

function renderInsights() {
  const curM    = localMonthKey();
  const prevM   = shiftMonthKey(curM, -1);
  const cur     = monthTotals(curM);
  const prev    = monthTotals(prevM);
  const net     = cur.income - cur.expense;
  const rate    = cur.income > 0 ? (net / cur.income * 100) : 0;
  const expDelta = prev.expense > 0 ? ((cur.expense - prev.expense) / prev.expense * 100) : null;

  // 6-month expense trend
  const labels = [], data = [];
  for (let i = 5; i >= 0; i--) {
    const d  = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const mk = localMonthKey(d);
    labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
    data.push(+monthTotals(mk).expense.toFixed(2));
  }
  _insTrend = { labels, data };
  const maxExp = Math.max(...data, 1);

  // Top categories this month, with month-over-month change
  const cd = getMonthCatData(curM);
  const prevByCat = prev.bycat || {};
  const topCats = cd.labels.map((lbl, idx) => ({
    name: lbl, amt: cd.data[idx], color: cd.colors[idx] || '#9896a4', prev: prevByCat[lbl] || 0,
  })).slice(0, 6);
  const topMax = Math.max(...topCats.map(c => c.amt), 1);

  // Net worth across all accounts
  let assets = 0, debts = 0;
  state.accounts.forEach(a => {
    if (a.type === 'credit' || a.type === 'loan') debts += _acctOwed(a.id).owed;
    else assets += _acctAssetBalance(a.id);
  });
  const netWorth = assets - debts;

  // Debt payoff progress
  const debtAccts = state.accounts.filter(a => a.type === 'credit' || a.type === 'loan');
  const debtRows = debtAccts.map(a => {
    const o = _acctOwed(a.id);
    const pct = o.startingBal > 0 ? Math.min(100, Math.max(0, (o.startingBal - o.owed) / o.startingBal * 100)) : 0;
    return { name: a.name, owed: o.owed, start: o.startingBal, pct };
  });

  const rateColor = rate >= 20 ? 'var(--success)' : rate >= 0 ? 'var(--warn)' : 'var(--danger)';
  const deltaStr  = expDelta == null ? '' :
    `<span style="color:${expDelta > 0 ? 'var(--danger)' : 'var(--success)'};font-weight:600">${expDelta > 0 ? '▲' : '▼'} ${Math.abs(expDelta).toFixed(0)}%</span> vs ${monthKeyLabel(prevM).split(' ')[0]}`;

  return `
    <div class="page">
      <h1 class="page-title">Insights</h1>
      <p class="page-sub">${monthKeyLabel(curM)}</p>

      <div class="cards-grid" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">NET WORTH</div>
          <div class="card-value" style="color:${netWorth >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(netWorth)}</div>
          <div class="card-sub">${fmt(assets)} assets − ${fmt(debts)} debt</div>
        </div>
        <div class="card">
          <div class="card-title">SAVINGS RATE</div>
          <div class="card-value" style="color:${rateColor}">${rate.toFixed(0)}%</div>
          <div class="card-sub">${fmt(net)} kept this month</div>
        </div>
      </div>

      <button class="btn-primary" id="insights-goto-report" style="width:100%;margin-bottom:16px">📊 Monthly savings report ›</button>

      <div class="form-card">
        <h2 class="section-title" style="margin:0 0 4px">Spending — last 6 months</h2>
        <p class="code-hint" style="margin:0 0 10px">${fmt(cur.expense)} this month · ${deltaStr}</p>
        <div style="height:170px"><canvas id="insights-trend"></canvas></div>
      </div>

      <div class="ins-section">
        <div class="ins-section-hdr">This month</div>
        <div class="ins-row"><span>Income</span><span style="color:var(--success);font-weight:700">${fmt(cur.income)}</span></div>
        <div class="ins-row"><span>Expenses</span><span style="color:var(--danger);font-weight:700">${fmt(cur.expense)}</span></div>
        <div class="ins-row ins-row-net"><span>Net</span><span style="color:${net >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:700">${fmt(net)}</span></div>
      </div>

      ${(() => {
        if (!_hasAnyExpense()) return '';
        const avg = _spendingAverages();
        const body = avg ? `
        <div class="ins-row"><span>Per day</span><span style="font-weight:700">${fmt(avg.daily)}</span></div>
        <div class="ins-row"><span>Per week</span><span style="font-weight:700">${fmt(avg.weekly)}</span></div>
        <div class="ins-row"><span>Per month</span><span style="font-weight:700">${fmt(avg.monthly)}</span></div>
        <p class="code-hint" style="margin:8px 0 0">Based on the last ${avg.windowDays} day${avg.windowDays === 1 ? '' : 's'} of expenses.</p>`
        : `<p class="code-hint" style="margin:6px 0 0">Everything's excluded right now — tap a chip below to add it back.</p>`;
        return `<div class="ins-section">
        <div class="ins-section-hdr">Average spending</div>
        ${body}
        ${_avgExclusionChipsHTML()}
      </div>`;
      })()}

      <div class="ins-section">
        <div class="ins-section-hdr">Top categories</div>
        ${topCats.length ? topCats.map(c => {
          const chg = c.amt - c.prev;
          const chgStr = c.prev > 0 ? `<span style="color:${chg > 0 ? 'var(--danger)' : 'var(--success)'};font-size:.7rem">${chg > 0 ? '▲' : '▼'} ${fmt(Math.abs(chg))}</span>` : '<span style="color:var(--muted);font-size:.7rem">new</span>';
          return `<div class="ins-cat">
            <div class="ins-cat-top"><span><span class="cat-dot" style="background:${c.color}"></span>${c.name}</span><span>${fmt(c.amt)} ${chgStr}</span></div>
            <div class="ins-bar-bg"><div class="ins-bar-fill" style="width:${(c.amt / topMax * 100).toFixed(1)}%;background:${c.color}"></div></div>
          </div>`;
        }).join('') : '<p class="code-hint" style="margin:0">No spending recorded this month yet.</p>'}
      </div>

      ${debtRows.length ? `<div class="ins-section">
        <div class="ins-section-hdr">Debt payoff</div>
        ${debtRows.map(d => `<div class="ins-cat">
          <div class="ins-cat-top"><span>${d.name}</span><span>${fmt(d.owed)} left${d.start > 0 ? ` · ${d.pct.toFixed(0)}% paid` : ''}</span></div>
          <div class="ins-bar-bg"><div class="ins-bar-fill" style="width:${d.pct.toFixed(1)}%;background:var(--success)"></div></div>
        </div>`).join('')}
      </div>` : ''}

      <div class="form-card" id="range-summary-card">
        <h2 class="section-title" style="margin:0 0 4px">Custom range summary</h2>
        <p class="code-hint" style="margin:0 0 10px">Pick a start and end date to total your spending by category.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
          <div>
            <label class="form-label" style="font-size:.7rem">From</label>
            <input type="date" id="range-start" class="form-input" value="${curM}-01" max="${today()}">
          </div>
          <div>
            <label class="form-label" style="font-size:.7rem">To</label>
            <input type="date" id="range-end" class="form-input" value="${today()}" max="${today()}">
          </div>
        </div>
        <button class="btn-primary" id="range-run-btn" style="width:100%">Run summary</button>
        <div id="range-summary-results">${_rangeSummaryHTML(curM + '-01', today())}</div>
      </div>

      <button class="btn-secondary" id="insights-goto-ledger" style="width:100%">View full ledger ›</button>
    </div>`;
}

function attachInsights() {
  if (_insightsChart) { _insightsChart.destroy(); _insightsChart = null; }
  const el = document.getElementById('insights-trend');
  if (el) _withChart(() => {
    if (!document.body.contains(el)) return;
    if (!el.getContext || !el.getContext('2d')) return;  // canvas can't yield a 2D context yet
    Chart.getChart(el)?.destroy();   // clear any chart left on this canvas before reusing it
    const cs     = getComputedStyle(document.documentElement);
    const accent = (cs.getPropertyValue('--accent') || '#4ecb8d').trim();
    const muted  = (cs.getPropertyValue('--muted')  || '#999').trim();
    _insightsChart = new Chart(el, {
      type: 'bar',
      data: { labels: _insTrend.labels, datasets: [{ data: _insTrend.data, backgroundColor: accent, borderRadius: 6, maxBarThickness: 38 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.parsed.y) } } },
        scales: {
          x: { ticks: { color: muted }, grid: { display: false } },
          y: { ticks: { color: muted, callback: v => '$' + v }, grid: { color: 'rgba(128,128,128,.12)' }, beginAtZero: true },
        },
      },
    });
  });
  document.getElementById('insights-goto-ledger')?.addEventListener('click', () => showTab('ledger'));
  document.getElementById('insights-goto-report')?.addEventListener('click', () => showTab('report'));

  // Average-spending exclusion chips (Bills + per-category)
  document.querySelectorAll('.avg-cat-toggle').forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.dataset.avgbills) toggleAvgExcludeBills();
      else toggleAvgExcludedCat(chip.dataset.cat);
      haptic([6]);
      render();
    });
  });

  // Custom date-range category summary
  const runRange = () => {
    const start = document.getElementById('range-start')?.value;
    const end   = document.getElementById('range-end')?.value;
    const out   = document.getElementById('range-summary-results');
    if (!out) return;
    if (!start || !end) { out.innerHTML = '<p class="code-hint" style="margin:6px 0 0">Pick both a start and end date.</p>'; return; }
    out.innerHTML = _rangeSummaryHTML(start, end);
    haptic([6]);
  };
  document.getElementById('range-run-btn')?.addEventListener('click', runRange);
}

// ── full spending breakdown page ─────────────────────────────────────────────
// The dashboard only previews the top 8 categories; this page lists every
// category for the current month and lets the user pick which ones to hide
// from that dashboard preview (tap a chip to toggle). Hidden categories still
// appear here (dimmed, tagged) — they're only suppressed on the dashboard.
function renderBreakdown() {
  const mk = localMonthKey();
  const { bycat } = monthTotals(mk);
  const all = Object.entries(bycat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    .map(([name, amt]) => ({ name, amt, color: CAT_COLORS[name] || '#9896a4' }));
  const total = all.reduce((s, c) => s + c.amt, 0);
  const max   = Math.max(...all.map(c => c.amt), 1);
  const hiddenCount = all.filter(c => isCatHidden(c.name)).length;
  const toggles = _catToggleChipsHTML(all);
  const rows = all.length ? all.map(c => {
    const hidden = isCatHidden(c.name);
    return `<div class="ins-cat${hidden ? ' brk-hidden' : ''}">
      <div class="ins-cat-top">
        <span><span class="cat-dot" style="background:${c.color}"></span>${_escHtml(c.name)}${hidden ? ' <span class="brk-hidden-tag">hidden</span>' : ''}</span>
        <span>${fmt(c.amt)} <span style="color:var(--muted);font-size:.7rem">${(c.amt / total * 100).toFixed(0)}%</span></span>
      </div>
      <div class="ins-bar-bg"><div class="ins-bar-fill" style="width:${(c.amt / max * 100).toFixed(1)}%;background:${c.color}"></div></div>
    </div>`;
  }).join('') : '<p class="code-hint" style="margin:6px 0 0">No spending recorded this month yet.</p>';
  return `
    <div class="page">
      <h1 class="page-title">Spending Breakdown</h1>
      <p class="page-sub">${monthKeyLabel(mk)}</p>
      <div class="form-card">
        <div class="ins-row ins-row-net" style="margin:0 0 4px"><span>Total spent</span><span style="color:var(--danger);font-weight:700">${fmt(total)}</span></div>
        ${all.length ? `<p class="code-hint" style="margin:0 0 10px">Tap a category to hide it from the dashboard preview (top 8 shown there).${hiddenCount ? ` <strong>${hiddenCount} hidden.</strong>` : ''}</p>
        ${toggles}` : ''}
        ${rows}
      </div>
      <button class="btn-secondary" id="breakdown-back" style="width:100%">‹ Back to dashboard</button>
    </div>`;
}

function attachBreakdown() {
  document.getElementById('breakdown-back')?.addEventListener('click', () => showTab('dashboard'));
  document.querySelectorAll('.cat-toggle').forEach(chip => {
    chip.addEventListener('click', () => { toggleHiddenCat(chip.dataset.cat); haptic([6]); render(); });
  });
}

// ── monthly summary report ───────────────────────────────────────────────────
// A generate-and-tweak spending report for one month: income, spending, net
// (what you keep / could save), and a per-category list where you can
// include/exclude categories to see the effect on the total and savings.
let _reportMonth = null;          // YYYY-MM being reported (defaults to last month)
let _reportExcluded = new Set();  // category names excluded from this report's totals

function renderReport() {
  if (!_reportMonth) _reportMonth = shiftMonthKey(curMonthKey(), -1);   // default: last month
  const m = _reportMonth;
  const isCur  = m === curMonthKey();
  const isLast = m === shiftMonthKey(curMonthKey(), -1);
  const { cats, income } = rangeCategoryTotals(m + '-01', _monthEndDate(m));
  const included = cats.filter(c => !_reportExcluded.has(c.name));
  const excluded = cats.filter(c => _reportExcluded.has(c.name));
  const spent = included.reduce((s, c) => s + c.amt, 0);
  const excludedTotal = excluded.reduce((s, c) => s + c.amt, 0);
  const txns = included.reduce((s, c) => s + c.count, 0);
  const net  = income - spent;
  const rate = income > 0 ? (net / income * 100) : 0;
  const max  = Math.max(...cats.map(c => c.amt), 1);
  const rateColor = rate >= 20 ? 'var(--success)' : rate >= 0 ? 'var(--warn)' : 'var(--danger)';

  const catRows = cats.length ? cats.map(c => {
    const off = _reportExcluded.has(c.name);
    const pct = (!off && spent > 0) ? `<span class="report-cat-pct">${(c.amt / spent * 100).toFixed(0)}%</span>` : '';
    return `<label class="report-cat${off ? ' report-cat-off' : ''}">
      <input type="checkbox" class="report-cat-cb" data-cat="${_escHtml(c.name)}"${off ? '' : ' checked'}>
      <span class="cat-dot" style="background:${c.color}"></span>
      <span class="report-cat-name">${_escHtml(c.name)}</span>
      <span class="report-cat-meta">${c.count}×</span>
      <span class="report-cat-amt">${fmt(c.amt)} ${pct}</span>
    </label>
    <div class="ins-bar-bg report-cat-bar"><div class="ins-bar-fill" style="width:${(c.amt / max * 100).toFixed(1)}%;background:${c.color};${off ? 'opacity:.35' : ''}"></div></div>`;
  }).join('') : `<p class="code-hint" style="margin:6px 0 0">No spending recorded in ${monthKeyLabel(m)}.</p>`;

  return `
    <div class="page">
      <h1 class="page-title">Monthly Report</h1>
      <p class="page-sub">spending summary &amp; savings</p>

      <div class="bills-month-nav">
        <button class="bills-month-arrow" id="report-prev" aria-label="Previous month">‹</button>
        <div class="bills-month-label">${monthKeyLabel(m)}${!isLast ? ' <button class="bills-month-today" id="report-lastmonth">Last month</button>' : ''}</div>
        <button class="bills-month-arrow" id="report-next" aria-label="Next month"${isCur ? ' disabled style="opacity:.35"' : ''}>›</button>
      </div>

      <div class="cards-grid" style="margin-bottom:14px">
        <div class="card">
          <div class="card-title">SPENT</div>
          <div class="card-value" style="color:var(--danger)">${fmt(spent)}</div>
          <div class="card-sub">${txns} transaction${txns === 1 ? '' : 's'} · ${included.length} categor${included.length === 1 ? 'y' : 'ies'}</div>
        </div>
        <div class="card">
          <div class="card-title">${net >= 0 ? 'COULD SAVE' : 'OVERSPENT'}</div>
          <div class="card-value" style="color:${net >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(Math.abs(net))}</div>
          <div class="card-sub">${income > 0 ? `${rate.toFixed(0)}% of ${fmt(income)} income` : 'no income logged'}</div>
        </div>
      </div>

      <div class="form-card">
        <div class="ins-row"><span>Income</span><span style="color:var(--success);font-weight:700">${fmt(income)}</span></div>
        <div class="ins-row"><span>Spending${excluded.length ? ' (included)' : ''}</span><span style="color:var(--danger);font-weight:700">${fmt(spent)}</span></div>
        <div class="ins-row ins-row-net"><span>${net >= 0 ? 'Left to save' : 'Shortfall'}</span><span style="color:${net >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:800">${fmt(net)}</span></div>
        ${excluded.length ? `<p class="code-hint" style="margin:8px 0 0">Excluding ${excluded.length} categor${excluded.length === 1 ? 'y' : 'ies'} (${fmt(excludedTotal)}). ${net >= 0 ? `Cutting them is worth ${fmt(excludedTotal)}/mo.` : ''} <button class="report-reset-btn" id="report-reset">Include all</button></p>` : ''}
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin:0 0 4px">Categories</h2>
        <p class="code-hint" style="margin:0 0 10px">Untick a category to exclude it from the totals above — see what you'd save without it.</p>
        ${catRows}
      </div>

      <button class="btn-secondary" id="report-back" style="width:100%">‹ Back to Insights</button>
    </div>`;
}

function attachReport() {
  document.getElementById('report-back')?.addEventListener('click', () => showTab('insights'));
  document.getElementById('report-prev')?.addEventListener('click', () => { _reportMonth = shiftMonthKey(_reportMonth, -1); render(); });
  document.getElementById('report-next')?.addEventListener('click', () => {
    if (_reportMonth >= curMonthKey()) return;   // don't go into the future
    _reportMonth = shiftMonthKey(_reportMonth, +1); render();
  });
  document.getElementById('report-lastmonth')?.addEventListener('click', () => { _reportMonth = shiftMonthKey(curMonthKey(), -1); render(); });
  document.getElementById('report-reset')?.addEventListener('click', () => { _reportExcluded.clear(); render(); });
  document.querySelectorAll('.report-cat-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const cat = cb.dataset.cat;
      if (cb.checked) _reportExcluded.delete(cat); else _reportExcluded.add(cat);
      haptic([6]);
      render();
    });
  });
}

// ── goals ──────────────────────────────────────────────────────────────────
function renderGoals() {
  const health = calcHealthScore();
  const hBar = (score, max, label, desc) => {
    const pct = Math.round((score / max) * 100);
    const barColor = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warn)' : 'var(--danger)';
    return `
      <div class="health-bar-row">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
          <span class="health-bar-label">${label}</span>
          <span class="health-bar-score">${score}/${max}</span>
        </div>
        <div class="breakdown-bar-bg"><div class="breakdown-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
        ${desc ? `<span style="font-size:11px;color:var(--muted);display:block;margin-top:3px">${desc}</span>` : ''}
      </div>`;
  };

  const goalsHtml = state.goals.length ? state.goals.map((g, i) => {
    const pct      = g.target > 0 ? Math.min(g.current / g.target * 100, 100) : 0;
    const barColor = pct >= 100 ? 'var(--success)' : pct >= 60 ? 'var(--accent)' : 'var(--accent2)';
    return `
      <div class="goal-card">
        <div class="goal-header">
          <span class="goal-name">${_escHtml(g.name)}</span>
          <button class="btn-xs goal-delete-btn" style="background:var(--danger);color:white;border-color:var(--danger)" data-idx="${i}">✕</button>
        </div>
        <div class="goal-amounts">${fmt(g.current)} <span class="goal-of">of</span> ${fmt(g.target)}</div>
        <div class="breakdown-bar-bg" style="margin:8px 0">
          <div class="breakdown-bar-fill" style="width:${pct.toFixed(1)}%;background:${barColor}"></div>
        </div>
        <div class="goal-pct">${pct.toFixed(0)}% complete${pct >= 100 ? ' 🎉' : ''}</div>
        <div class="goal-add-row">
          <input type="number" class="form-input goal-add-input" placeholder="Add $" step="0.01" min="0" inputmode="decimal" style="flex:1;padding:8px 10px;font-size:13px">
          <button class="btn-sm goal-add-btn" data-idx="${i}">Add</button>
        </div>
      </div>`;
  }).join('') : emptyState('No savings goals yet', 'Add a goal below to start tracking');

  return `
    <div class="page">
      <h1 class="page-title">Goals</h1>
      <p class="page-sub">health score &amp; savings targets</p>
      <div class="health-card" style="border-color:${health.color}">
        <div class="health-header">
          <div>
            <div class="health-title">FINANCIAL HEALTH</div>
            <div class="health-sub">this month's snapshot</div>
          </div>
          <div class="health-score-block">
            <div class="health-score" style="color:${health.color}">${health.total}</div>
            <div class="health-grade" style="color:${health.color}">${health.grade}</div>
          </div>
        </div>
        <div class="health-bars">
          ${hBar(health.savingsScore, 50, 'Savings Rate',    health.savingsLabel)}
          ${hBar(health.balanceScore, 25, 'Balance Buffer',  health.balanceLabel)}
          ${hBar(health.billScore,    25, 'Bills',           health.billLabel)}
        </div>
      </div>
      <div class="form-card" style="margin-top:16px">
        <h2 class="section-title" style="margin:0 0 8px">Add Savings Goal</h2>
        <div class="form-row">
          <label class="form-label">Goal name</label>
          <input type="text" id="goal-name" class="form-input" placeholder="e.g. Emergency Fund">
        </div>
        <div class="form-row">
          <label class="form-label">Target amount ($)</label>
          <input type="number" id="goal-target" class="form-input" placeholder="5000.00" step="0.01" min="0" inputmode="decimal">
        </div>
        <div id="goal-status" class="form-status"></div>
        <button id="goal-add-btn" class="btn-primary">Add Goal</button>
      </div>
      <h2 class="section-title">Savings Goals</h2>
      ${state.goals.length ? (() => {
        const saved  = state.goals.reduce((s, g) => s + (g.current || 0), 0);
        const target = state.goals.reduce((s, g) => s + (g.target  || 0), 0);
        const pct    = target > 0 ? Math.min(saved / target * 100, 100) : 0;
        return `<div class="goals-total-card">
          <div class="goals-total-row"><span>Total saved</span><span style="color:var(--success);font-weight:700">${fmt(saved)}</span></div>
          <div class="goals-total-row"><span>Total target</span><span style="font-weight:700">${fmt(target)}</span></div>
          <div class="breakdown-bar-bg" style="margin-top:6px"><div class="breakdown-bar-fill" style="width:${pct.toFixed(1)}%;background:var(--accent)"></div></div>
          <div style="font-size:.72rem;color:var(--muted);margin-top:4px">${pct.toFixed(0)}% of all goals · ${fmt(Math.max(0, target - saved))} to go</div>
        </div>`;
      })() : ''}
      <div class="goals-list">${goalsHtml}</div>
    </div>`;
}

function attachGoals() {
  document.getElementById('goal-add-btn')?.addEventListener('click', async () => {
    const name   = document.getElementById('goal-name').value.trim();
    const target = parseFloat(document.getElementById('goal-target').value);
    if (!name) { showStatus('goal-status', 'Enter a goal name.', 'error'); return; }
    if (isNaN(target) || target <= 0) { showStatus('goal-status', 'Enter a valid target.', 'error'); return; }
    state.goals.push({ id: Date.now(), name, target, current: 0 });
    await api.saveGoals(state.goals);
    render();
  });

  document.querySelectorAll('.goal-add-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i      = parseInt(btn.dataset.idx);
      const input  = btn.closest('.goal-add-row').querySelector('.goal-add-input');
      const amount = parseFloat(input.value);
      if (isNaN(amount) || amount <= 0) return;
      state.goals[i].current = (state.goals[i].current || 0) + amount;
      await api.saveGoals(state.goals);
      render();
    });
  });

  document.querySelectorAll('.goal-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      showConfirmModal({
        title: 'Delete Goal', danger: true,
        message: `Delete "${state.goals[i].name}"? This cannot be undone.`,
        confirmText: 'Delete',
        onConfirm: async () => { state.goals.splice(i, 1); await api.saveGoals(state.goals); render(); },
      });
    });
  });
}

// ── import ─────────────────────────────────────────────────────────────────
function renderImport() {
  return `
    <div class="page">
      <h1 class="page-title">Import / Export</h1>
      <p class="page-sub">Excel &amp; spreadsheet friendly</p>

      <div class="form-card" id="backup-section">
        <h2 class="section-title" style="margin-bottom:6px">${ICONS.download} Export to Excel / CSV</h2>
        <p class="code-hint" style="margin-bottom:12px">Opens directly in Excel. Includes Date, Type, Category, Description, Amount, Signed Amount, Running Balance, Account, and Recurring columns.</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button id="export-csv-btn" class="btn-primary">${ICONS.download} Export This Account (CSV)</button>
          <button id="export-csv-all-btn" class="btn-primary" style="background:var(--surface2);border:1px solid var(--border);color:var(--text)">${ICONS.download} Export All Accounts (CSV)</button>
          <button id="export-json-btn" class="btn-primary" style="background:var(--surface2);border:1px solid var(--border);color:var(--text)">${ICONS.download} Download Budget DAWGs Backup (JSON)</button>
        </div>
        ${backupStatusHtml()}
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:6px">${ICONS.upload} Import from Excel / CSV</h2>
        <p class="code-hint">Accepts files saved from Excel as CSV. Required columns: <strong>Date</strong> and <strong>Amount</strong>. Optional: Type, Category, Description, Account.</p>
        <p class="code-hint" style="margin-top:6px">Date formats accepted: <code>2026-05-20</code>, <code>5/20/2026</code>, <code>05/20/26</code></p>
        <p class="code-hint" style="margin-top:4px">Also works with most bank export formats (Debit/Credit columns, accounting negatives, etc.)</p>
        <button id="export-template-btn" class="btn-xs" style="margin-top:8px;margin-bottom:2px">${ICONS.download} Download blank template</button>
        <div style="display:flex;gap:8px;margin-top:12px;margin-bottom:4px">
          <button id="import-mode-append" class="import-mode-btn import-mode-active" data-mode="append" style="flex:1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Append
          </button>
          <button id="import-mode-overwrite" class="import-mode-btn" data-mode="overwrite" style="flex:1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
            Overwrite
          </button>
        </div>
        <p id="import-mode-hint" class="code-hint" style="margin-top:4px;margin-bottom:0">Adds new transactions on top of existing ones.</p>
        <div id="import-status" class="form-status" style="margin-top:8px"></div>
        <label class="btn-primary" style="display:inline-block;margin-top:8px;cursor:pointer;text-align:center;width:100%;box-sizing:border-box">
          Choose CSV or Excel File…
          <input type="file" id="import-file" accept=".csv,.xlsx,.xls,.txt" style="display:none">
        </label>
        <div id="import-preview" style="display:none;margin-top:12px;padding:12px;background:var(--surface2);border-radius:14px;border:1px solid var(--border)"></div>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:6px">${ICONS.upload} Restore from Backup</h2>
        <p class="code-hint">Restores everything from a Budget DAWGs JSON backup file.</p>
        <div id="json-import-status" class="form-status" style="margin-top:6px"></div>
        <label class="btn-primary" style="display:inline-block;margin-top:8px;cursor:pointer;text-align:center;width:100%;box-sizing:border-box">
          ${ICONS.upload} Load Backup File
          <input type="file" id="import-json-file" accept=".json" style="display:none">
        </label>
      </div>
    </div>`;
}

// ── notes & reminders ─────────────────────────────────────────────────────
function _notesSort(notes) {
  const todayStr = today();
  return [...notes].sort((a, b) => {
    // done items always last
    if (a.done !== b.done) return a.done ? 1 : -1;
    // among undone: overdue first, then due today, then upcoming, then no date
    const aOver = a.dueDate && a.dueDate < todayStr;
    const bOver = b.dueDate && b.dueDate < todayStr;
    const aToday = a.dueDate === todayStr;
    const bToday = b.dueDate === todayStr;
    const aRank = a.done ? 4 : aOver ? 0 : aToday ? 1 : a.dueDate ? 2 : 3;
    const bRank = b.done ? 4 : bOver ? 0 : bToday ? 1 : b.dueDate ? 2 : 3;
    if (aRank !== bRank) return aRank - bRank;
    // within same rank sort by date ascending then by createdAt
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });
}

function renderNotes() {
  const notes = loadNotes();
  const sorted = _notesSort(notes);
  const todayStr = today();

  const noteHtml = n => {
    const isOverdue  = !n.done && n.dueDate && n.dueDate < todayStr;
    const isDueToday = !n.done && n.dueDate === todayStr;
    const statusCls  = isOverdue ? 'note-card-overdue' : isDueToday ? 'note-card-today' : '';
    let dateLine = '';
    if (n.dueDate) {
      const d = new Date(n.dueDate + 'T00:00:00');
      const label = d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
      const tag = isOverdue ? '⚠ Overdue' : isDueToday ? '📅 Today' : '📅';
      dateLine = `<span class="note-date-tag ${isOverdue ? 'note-tag-overdue' : isDueToday ? 'note-tag-today' : 'note-tag-upcoming'}">${tag} ${label}</span>`;
    }
    return `<div class="note-card ${statusCls} ${n.done ? 'note-card-done' : ''}" data-id="${n.id}">
      <label class="note-check-wrap">
        <input type="checkbox" class="note-done-cb" data-id="${n.id}" ${n.done ? 'checked' : ''}>
        <span class="note-check-box"></span>
      </label>
      <div class="note-body">
        <span class="note-text">${n.text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
        ${dateLine}
      </div>
      <button class="note-del-btn" data-id="${n.id}" aria-label="Delete note">✕</button>
    </div>`;
  };

  const listHtml = sorted.length
    ? sorted.map(noteHtml).join('')
    : emptyState('No notes yet', 'Add a reminder below');

  return `<div class="page">
    <h1 class="page-title">Notes &amp; Reminders</h1>
    <p class="page-sub">jot it down, set a date, get reminded</p>
    <div class="form-card">
      <h2 class="section-title" style="margin:0 0 10px">Add Note</h2>
      <div class="form-row">
        <label class="form-label">Note</label>
        <input type="text" id="note-text-input" class="form-input" placeholder="e.g. Owe Cole $40 for dinner" maxlength="200" autocomplete="off">
      </div>
      <div class="form-row">
        <label class="form-label">Reminder date <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <input type="date" id="note-date-input" class="form-input">
      </div>
      <div id="note-status" class="form-status"></div>
      <button id="note-add-btn" class="btn-primary">Add Note</button>
    </div>
    <h2 class="section-title" style="margin-top:20px">Your Notes</h2>
    <div class="notes-list" id="notes-list">${listHtml}</div>
  </div>`;
}

function attachNotes() {
  document.getElementById('note-add-btn')?.addEventListener('click', () => {
    const textEl = document.getElementById('note-text-input');
    const dateEl = document.getElementById('note-date-input');
    const status = document.getElementById('note-status');
    const text = textEl?.value.trim();
    if (!text) { if (status) { status.textContent = 'Note text is required.'; status.style.color = 'var(--danger)'; } return; }
    const notes = loadNotes();
    notes.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), text, dueDate: dateEl?.value || null, done: false, createdAt: new Date().toISOString() });
    saveNotes(notes);
    if (textEl) textEl.value = '';
    if (dateEl) dateEl.value = '';
    if (status) { status.textContent = 'Note added!'; status.style.color = 'var(--success)'; setTimeout(() => { if (status) status.textContent = ''; }, 2000); }
    document.getElementById('notes-list').innerHTML = _notesSort(notes).map(n => {
      const todayStr = today();
      const isOverdue  = !n.done && n.dueDate && n.dueDate < todayStr;
      const isDueToday = !n.done && n.dueDate === todayStr;
      const statusCls  = isOverdue ? 'note-card-overdue' : isDueToday ? 'note-card-today' : '';
      let dateLine = '';
      if (n.dueDate) {
        const d = new Date(n.dueDate + 'T00:00:00');
        const label = d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
        const tag = isOverdue ? '⚠ Overdue' : isDueToday ? '📅 Today' : '📅';
        dateLine = `<span class="note-date-tag ${isOverdue ? 'note-tag-overdue' : isDueToday ? 'note-tag-today' : 'note-tag-upcoming'}">${tag} ${label}</span>`;
      }
      return `<div class="note-card ${statusCls} ${n.done ? 'note-card-done' : ''}" data-id="${n.id}">
        <label class="note-check-wrap">
          <input type="checkbox" class="note-done-cb" data-id="${n.id}" ${n.done ? 'checked' : ''}>
          <span class="note-check-box"></span>
        </label>
        <div class="note-body">
          <span class="note-text">${n.text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
          ${dateLine}
        </div>
        <button class="note-del-btn" data-id="${n.id}" aria-label="Delete note">✕</button>
      </div>`;
    }).join('') || emptyState('No notes yet', 'Add a reminder below');
    updateNotesBadge();
    playSound('success');
  });

  document.getElementById('notes-list')?.addEventListener('change', e => {
    if (!e.target.classList.contains('note-done-cb')) return;
    const id = e.target.dataset.id;
    const notes = loadNotes();
    const n = notes.find(x => x.id === id);
    if (n) { n.done = e.target.checked; saveNotes(notes); }
    const card = e.target.closest('.note-card');
    if (card) {
      card.classList.toggle('note-card-done', e.target.checked);
      if (e.target.checked) { card.classList.remove('note-card-overdue','note-card-today'); }
    }
    updateNotesBadge();
  });

  document.getElementById('notes-list')?.addEventListener('click', e => {
    const btn = e.target.closest('.note-del-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    const notes = loadNotes().filter(x => x.id !== id);
    saveNotes(notes);
    btn.closest('.note-card')?.remove();
    if (!document.querySelector('.note-card')) {
      document.getElementById('notes-list').innerHTML = emptyState('No notes yet', 'Add a reminder below');
    }
    updateNotesBadge();
  });
}

// ── notifications ──────────────────────────────────────────────────────────
async function requestNotifPermission() {
  if (!('Notification' in window)) return false;
  const p = await Notification.requestPermission();
  return p === 'granted';
}

async function checkBillNotifications() {
  if (!('Notification' in window)) return;
  const s = loadSettings();
  if (!s.notifications) return;
  if (Notification.permission !== 'granted') return;
  const todayStr = today();
  if (s.lastNotifDate === todayStr) return;
  const due = getUpcomingBills(3);
  if (!due.length) return;
  const reg = await navigator.serviceWorker?.ready.catch(() => null);
  due.forEach(b => {
    const d = getDaysUntilDue(b.dueDay);
    const when = d === 0 ? 'due TODAY' : `due in ${d} day${d===1?'':'s'}`;
    const opts = { body: `${fmt(b.amount)} — ${when}`, icon: 'icon-192.png', badge: 'icon-192.png', tag: `bill-${b.id||b.name}` };
    if (reg) reg.showNotification(`📑 ${b.name}`, opts);
    else new Notification(`📑 ${b.name}`, opts);
  });
  s.lastNotifDate = todayStr;
  saveSettings(s);
}

// ── retirement hub ─────────────────────────────────────────────────────────
function renderRetirement() {
  const accts  = state.accounts.filter(a => RETIRE_TYPES.includes(a.type));
  const curYear = new Date().getFullYear();

  if (!accts.length) {
    return `<div class="dawg-page" style="display:flex;align-items:center;justify-content:center;min-height:70vh">
      <div class="ret-empty">
        <div class="ret-empty-icon">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div class="ret-empty-title">No Retirement Accounts</div>
        <div class="ret-empty-sub">Add a Roth IRA, Traditional IRA, 401(k), or HSA in Manage Accounts to start tracking your future.</div>
        <button class="ret-empty-btn" id="ret-go-accounts">Manage Accounts</button>
      </div>
    </div>`;
  }

  const totalBalance = accts.reduce((s, a) => s + _retireBalance(a.id), 0);
  const RETIRE_COLORS = { roth_ira:'#7c6fff', traditional_ira:'#5b8de8', '401k':'#32d74b', hsa:'#2dd4bf' };

  const accountCards = accts.map(a => {
    const bal   = _retireBalance(a.id);
    const ytd   = _ytdContributions(a.id);
    const lim   = RETIRE_LIMITS[a.type] || { base: 6000, label: a.type };
    const age   = a.birthYear ? curYear - parseInt(a.birthYear) : null;
    const annualLimit = (age && age >= (lim.catchupAge || 50) && lim.catchup) ? lim.catchup : lim.base;
    const pct   = annualLimit > 0 ? Math.min(ytd / annualLimit * 100, 100) : 0;
    const bar   = _boostBar(pct);
    const isOver   = ytd > annualLimit;
    const remaining = Math.max(0, annualLimit - ytd);
    const color     = RETIRE_COLORS[a.type] || 'var(--accent)';
    const typeName  = lim.label;
    return `
      <div class="ret-acct-card">
        <div class="ret-acct-header">
          <div>
            <div class="ret-acct-name">${_escHtml(a.name)}</div>
            <div class="ret-acct-badge" style="background:${color}22;color:${color}">${typeName}</div>
          </div>
          <div class="ret-acct-bal">${fmt(bal)}</div>
        </div>
        <div class="ret-contrib-wrap">
          <div class="ret-contrib-row">
            <span class="ret-contrib-lbl">${curYear} Contributions</span>
            <span class="ret-contrib-val${isOver ? ' ret-over' : ''}">${fmt(ytd)} / ${fmt(annualLimit)}</span>
          </div>
          <div class="ret-bar-wrap"><div class="ret-bar" style="width:${bar}%;background:${isOver ? 'var(--danger)' : color}"></div></div>
          <div class="ret-contrib-remain">${isOver
            ? '<span style="color:var(--danger);font-weight:700">Over limit — consult a tax advisor</span>'
            : fmt(remaining) + ' remaining this year'}</div>
        </div>
        <button class="ret-add-btn" data-id="${a.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>Add Contribution
        </button>
      </div>`;
  }).join('');

  // Default projector values: prefer first acct's stored settings
  const firstAcct    = accts[0];
  const bYear        = firstAcct?.birthYear ? parseInt(firstAcct.birthYear) : null;
  const defaultAge   = bYear ? Math.max(18, Math.min(79, curYear - bYear)) : 35;
  const defaultReturn = firstAcct?.expectedReturn != null ? firstAcct.expectedReturn : 7;

  const projOptions = accts.map(a =>
    `<option value="${a.id}" data-bal="${_retireBalance(a.id)}">${_escHtml(a.name)} (${RETIRE_LIMITS[a.type]?.label || a.type})</option>`
  ).join('');

  return `<div class="dawg-page ret-page">
    <div class="ret-hero">
      <div class="ret-hero-glow"></div>
      <div class="ret-hero-lbl">Total Retirement</div>
      <div class="ret-hero-total">${fmt(totalBalance)}</div>
      <div class="ret-hero-sub">${accts.length} account${accts.length !== 1 ? 's' : ''} · ${curYear}</div>
    </div>

    <div class="ret-section-hdr">Accounts</div>
    ${accountCards}

    <div class="ret-proj-card">
      <div class="ret-proj-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        Growth Projector
      </div>
      <div class="ret-proj-form">
        <div class="ret-proj-field">
          <label class="ret-proj-lbl">Account</label>
          <select id="ret-proj-acct" class="ret-proj-select">${projOptions}</select>
        </div>
        <div class="ret-proj-row2">
          <div class="ret-proj-field">
            <label class="ret-proj-lbl">Monthly Contribution</label>
            <div class="ret-proj-input-wrap"><span class="ret-proj-prefix">$</span><input type="number" id="ret-proj-contrib" class="ret-proj-input ret-proj-pfx" value="500" min="0" step="10" inputmode="decimal"></div>
          </div>
          <div class="ret-proj-field">
            <label class="ret-proj-lbl">Annual Return</label>
            <div class="ret-proj-input-wrap"><input type="number" id="ret-proj-return" class="ret-proj-input ret-proj-sfx" value="${defaultReturn}" min="0" max="20" step="0.5" inputmode="decimal"><span class="ret-proj-suffix">%</span></div>
          </div>
        </div>
        <div class="ret-proj-row2">
          <div class="ret-proj-field">
            <label class="ret-proj-lbl">Current Age</label>
            <input type="number" id="ret-proj-age" class="ret-proj-input" value="${defaultAge}" min="18" max="80" step="1" inputmode="numeric">
          </div>
          <div class="ret-proj-field">
            <label class="ret-proj-lbl">Retire At Age</label>
            <input type="number" id="ret-proj-retire-age" class="ret-proj-input" value="65" min="40" max="90" step="1" inputmode="numeric">
          </div>
        </div>
      </div>
      <div id="ret-proj-result" class="ret-proj-result"></div>
    </div>
  </div>`;
}

function attachRetirement() {
  // Empty state — go to Manage Accounts
  document.getElementById('ret-go-accounts')?.addEventListener('click', () => {
    currentTab = 'accounts';
    render();
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'accounts'));
  });

  // Add Contribution buttons — open dedicated contribution modal
  document.querySelectorAll('.ret-add-btn').forEach(btn => {
    btn.addEventListener('click', () => showAddContribModal(btn.dataset.id));
  });

  // Growth Projector
  const elAcct    = document.getElementById('ret-proj-acct');
  const elContrib = document.getElementById('ret-proj-contrib');
  const elReturn  = document.getElementById('ret-proj-return');
  const elAge     = document.getElementById('ret-proj-age');
  const elRetAge  = document.getElementById('ret-proj-retire-age');
  if (!elAcct) return;

  function _calcFV(pv, pmt, annualRatePct, years) {
    const r = annualRatePct / 100 / 12;
    const n = Math.max(0, Math.round(years * 12));
    if (n === 0) return pv;
    if (r === 0) return pv + pmt * n;
    return pv * Math.pow(1 + r, n) + pmt * ((Math.pow(1 + r, n) - 1) / r);
  }

  function recalcProjector() {
    const opt  = elAcct.options[elAcct.selectedIndex];
    const pv   = opt ? parseFloat(opt.dataset.bal) || 0 : 0;
    const pmt  = Math.max(0, parseFloat(elContrib?.value) || 0);
    const rate = Math.max(0, parseFloat(elReturn?.value)  || 7);
    const curAge = parseInt(elAge?.value)    || 35;
    const retAge = parseInt(elRetAge?.value) || 65;
    const years  = Math.max(0, retAge - curAge);
    const fv     = _calcFV(pv, pmt, rate, years);
    const totalContribs = pmt * years * 12;
    const growth = Math.max(0, fv - pv - totalContribs);

    // 5-year milestones (skip final year — already shown as total)
    const milestones = [];
    for (let y = 5; y < years; y += 5) {
      milestones.push({ age: curAge + y, bal: _calcFV(pv, pmt, rate, y) });
    }

    const resultEl = document.getElementById('ret-proj-result');
    if (!resultEl) return;
    resultEl.innerHTML = `
      <div class="ret-proj-total">${fmt(fv)}</div>
      <div class="ret-proj-sub">Projected at age ${retAge} · ${years} year${years !== 1 ? 's' : ''}</div>
      <div class="ret-proj-bk">
        <div class="ret-proj-bk-item">
          <div class="ret-proj-bk-val">${fmt(pv)}</div>
          <div class="ret-proj-bk-lbl">Starting</div>
        </div>
        <div class="ret-proj-bk-item">
          <div class="ret-proj-bk-val">${fmt(totalContribs)}</div>
          <div class="ret-proj-bk-lbl">Contributions</div>
        </div>
        <div class="ret-proj-bk-item">
          <div class="ret-proj-bk-val" style="color:var(--success)">${fmt(growth)}</div>
          <div class="ret-proj-bk-lbl">Growth</div>
        </div>
      </div>
      ${milestones.length ? `<div class="ret-proj-milestones">
        ${milestones.map(m => `<div class="ret-proj-ms"><span class="ret-proj-ms-age">Age ${m.age}</span><span class="ret-proj-ms-bal">${fmt(m.bal)}</span></div>`).join('')}
      </div>` : ''}`;
  }

  [elAcct, elContrib, elReturn, elAge, elRetAge].forEach(el => {
    el?.addEventListener('input',  recalcProjector);
    el?.addEventListener('change', recalcProjector);
  });
  recalcProjector();
}

// ── DAWG Wrapped — a Spotify-Wrapped-style recap of the year ─────────────────
function renderWrapped() {
  const year = String(new Date().getFullYear());
  const _real = t => t.category !== 'Transfer' && t.category !== 'Payment' && !t._xfer;
  let txns = state.transactions.filter(t => (t.date || '').startsWith(year) && _real(t));
  let periodLabel = year;
  if (txns.length < 1) { txns = state.transactions.filter(_real); periodLabel = 'All Time'; }

  if (!txns.length) {
    return `<div class="page wrapped-page">
      <div class="wrap-hero"><div class="wrap-hero-title">WRAPPED</div></div>
      ${emptyState('Nothing to wrap yet', 'Log some transactions and come back')}
    </div>`;
  }

  let income = 0, expense = 0, expenseCount = 0, biggest = null;
  const byCat = {}, byMonth = {};
  for (const t of txns) {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') {
      expense += t.amount; expenseCount++;
      byCat[t.category] = (byCat[t.category] || 0) + t.amount;
      const mk = (t.date || '').slice(0, 7);
      byMonth[mk] = (byMonth[mk] || 0) + t.amount;
      if (!biggest || t.amount > biggest.amount) biggest = t;
    }
  }
  const net         = income - expense;
  const savingsRate = income > 0 ? Math.round((income - expense) / income * 100) : 0;
  const topCat      = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const topMonth    = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0];
  const monthName   = topMonth ? new Date(topMonth[0] + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long' }) : '—';
  const catColor    = topCat ? (CAT_COLORS[topCat[0]] || 'var(--accent)') : 'var(--accent)';

  const stat = (label, value, sub, color) => `
    <div class="wrap-stat">
      <div class="wrap-stat-label">${label}</div>
      <div class="wrap-stat-value"${color ? ` style="color:${color}"` : ''}>${value}</div>
      ${sub ? `<div class="wrap-stat-sub">${sub}</div>` : ''}
    </div>`;

  return `<div class="page wrapped-page">
    <div class="wrap-hero">
      <div class="wrap-hero-kicker">${periodLabel} · DAWG</div>
      <div class="wrap-hero-title">WRAPPED</div>
      <div class="wrap-hero-sub">Your money, unleashed.</div>
    </div>
    <div class="wrap-grid">
      ${stat('You spent', fmt(expense), `across ${expenseCount} transaction${expenseCount !== 1 ? 's' : ''}`, 'var(--danger)')}
      ${stat('You brought in', fmt(income), 'total income', 'var(--success)')}
      ${stat(net >= 0 ? 'You saved' : 'You overspent', fmt(Math.abs(net)), net >= 0 ? `${savingsRate}% savings rate` : 'spent more than you earned', net >= 0 ? 'var(--success)' : 'var(--danger)')}
      ${topCat ? stat('Top category', topCat[0], `${fmt(topCat[1])} — your biggest habit`, catColor) : ''}
      ${biggest ? stat('Biggest splurge', fmt(biggest.amount), `${_escHtml(biggest.description || biggest.category)} · ${biggest.date}`, 'var(--warn)') : ''}
      ${topMonth ? stat('Spendiest month', monthName, `${fmt(topMonth[1])} flew out the door`, 'var(--accent)') : ''}
    </div>
    <p class="wrap-foot">Based on ${txns.length} transactions${periodLabel === year ? ` in ${year}` : ''}. Keep your DAWG fed. 🐾</p>
  </div>`;
}

// ── settings ───────────────────────────────────────────────────────────────
function renderSettings() {
  const s            = loadSettings();
  const theme        = s.theme || 'dark';
  const customCats   = s.customCategories || [];
  const fontStyle    = s.fontStyle || 'default';
  const customAccent = s.customAccent || '';
  const bioEnabled   = !!localStorage.getItem('slawminyaw_biometric_cred');

  const fontBtns = [
    { key:'default',  label:'Default',  sub:'Plus Jakarta Sans' },
    { key:'system',   label:'System',   sub:'iOS / Segoe UI' },
    { key:'terminal', label:'Terminal', sub:'Consolas / Menlo' },
  ].map(f => `<button class="nav-pos-btn${fontStyle === f.key ? ' active' : ''}" data-font-style="${f.key}" style="line-height:1.3"><span style="display:block">${f.label}</span><span style="font-size:.65rem;opacity:.55;font-weight:400;font-family:'Plus Jakarta Sans',sans-serif">${f.sub}</span></button>`).join('');

  const customCatRows = customCats.length ? customCats.map((c, i) => `
    <div class="custom-cat-row">
      <span class="custom-cat-name">${_escHtml(c)}</span>
      <button class="btn-xs custom-cat-del" data-idx="${i}" style="background:var(--danger);color:#fff;border-color:var(--danger)">✕</button>
    </div>`).join('') : '<p style="font-size:.8rem;color:var(--muted);margin-bottom:6px">No custom categories yet.</p>';

  const TERMINAL_KEYS = ['vscode','powershell','cmd','kali','mintlinux','ubuntu'];
  const POKEMON_KEYS  = ['gengar','charizard','squirtle'];
  const TEAM_KEYS     = ['bears','dodgers','knights','celtics'];
  const isTerminal = TERMINAL_KEYS.includes(theme);
  const isPokemon  = POKEMON_KEYS.includes(theme);
  const isTeam     = TEAM_KEYS.includes(theme);
  const isLight    = !isTerminal && !isPokemon && !isTeam && !!THEMES[theme]?.light;
  const activeMode = isPokemon ? 'pokemon' : isTeam ? 'team' : isTerminal ? 'terminal' : isLight ? 'light' : 'dark';

  const DARK_ACCENTS  = ['dark','lux','oled','denim','ember','jurassicpark','darkslate','auto','custom'];
  const LIGHT_ACCENTS = ['light','lightsky','lightrose','lightsand','lightsilver','customlight'];

  const accentChip = (key, active) => {
    const t = THEMES[key];
    if (!t) return '';
    const lbl = t.shortLabel || t.label;
    let dot;
    if (key === 'custom' || key === 'customlight') {
      dot = customAccent
        ? `background:${customAccent}`
        : `background:conic-gradient(#e05858,#d4a030,#62b898,#5492bc,#8868c0,#e05858)`;
    } else if (key === 'lux') {
      // Distinctive emerald→gold dot so the premium theme reads as special
      dot = `background:linear-gradient(135deg, ${t.accent} 40%, ${t.accent2})`;
    } else {
      dot = t.light ? `border:2px solid ${t.accent};background:var(--surface)` : `background:${t.accent}`;
    }
    const chipId = key === 'custom' ? ' id="custom-theme-chip"' : key === 'customlight' ? ' id="customlight-theme-chip"' : '';
    return `<button class="theme-accent-chip${active ? ' active' : ''}" data-theme="${key}" title="${t.label}"${chipId}>
      <span class="theme-accent-dot" style="${dot}"></span>
      <span class="theme-accent-lbl">${lbl}</span>
    </button>`;
  };

  const terminalChip = key => {
    const t = THEMES[key];
    return `<button class="theme-terminal-chip${theme === key ? ' active' : ''}" data-theme="${key}">
      <span class="theme-accent-dot" style="background:${t.accent}"></span>
      ${t.label}
    </button>`;
  };

  const pokeChip = key => {
    const t = THEMES[key];
    return `<button class="theme-poke-chip${theme === key ? ' active' : ''}" data-theme="${key}">
      <span class="theme-poke-spr"><img src="${t.mascot}" alt=""></span>
      <span class="theme-poke-lbl">${t.label}</span>
    </button>`;
  };

  const teamChip = key => {
    const t = THEMES[key];
    return `<button class="theme-poke-chip theme-team-chip${theme === key ? ' active' : ''}" data-theme="${key}">
      <span class="theme-poke-spr theme-team-spr"><img src="${t.mascot}" alt=""></span>
      <span class="theme-poke-lbl">${t.shortLabel || t.label}</span>
    </button>`;
  };

  const _mode = s.appMode === 'simple' ? 'simple' : 'full';
  return `
    <div class="page">
      <h1 class="page-title">Settings</h1>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:6px">App Mode</h2>
        <p class="code-hint" style="margin-bottom:10px">Simple mode hides budgeting features for a clean balance + transactions tracker. Nothing is deleted — switch back anytime.</p>
        <div class="mode-toggle">
          <button class="mode-opt${_mode === 'full' ? ' active' : ''}" data-mode="full">
            <span class="mode-opt-title">Full Budgeting</span>
            <span class="mode-opt-sub">Planner, bills, goals, debt, breakdowns</span>
          </button>
          <button class="mode-opt${_mode === 'simple' ? ' active' : ''}" data-mode="simple">
            <span class="mode-opt-title">Simple Tracking</span>
            <span class="mode-opt-sub">Just balance &amp; transactions</span>
          </button>
        </div>
      </div>



      <div class="form-card" style="cursor:pointer" id="goto-accounts-card">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <h2 class="section-title" style="margin-bottom:2px">Accounts</h2>
            <p class="code-hint" style="margin:0">${state.accounts.length} account${state.accounts.length !== 1 ? 's' : ''} · tap to manage</p>
          </div>
          <span style="font-size:1.4rem;color:var(--muted)">›</span>
        </div>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:12px">Theme</h2>

        <div class="theme-mode-row">
          <button class="theme-mode-btn${activeMode === 'dark'     ? ' active' : ''}" data-mode="dark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            Dark
          </button>
          <button class="theme-mode-btn${activeMode === 'light'    ? ' active' : ''}" data-mode="light">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            Light
          </button>
          <button class="theme-mode-btn${activeMode === 'terminal' ? ' active' : ''}" data-mode="terminal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            Terminal
          </button>
          <button class="theme-mode-btn${activeMode === 'pokemon' ? ' active' : ''}" data-mode="pokemon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><circle cx="12" cy="12" r="3"/></svg>
            Pokémon
          </button>
          <button class="theme-mode-btn${activeMode === 'team' ? ' active' : ''}" data-mode="team">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5z"/></svg>
            Teams
          </button>
        </div>

        <div id="theme-accent-section" style="${(activeMode === 'terminal' || activeMode === 'pokemon' || activeMode === 'team') ? 'display:none' : ''}">
          <p class="code-hint" style="margin-bottom:8px">Accent color</p>
          <div class="theme-accent-grid" id="theme-accent-grid">
            ${activeMode === 'light'
              ? LIGHT_ACCENTS.map(k => accentChip(k, k === theme)).join('')
              : DARK_ACCENTS.map(k => accentChip(k, k === theme)).join('')
            }
          </div>
        </div>

        <div id="theme-terminal-section" style="${activeMode !== 'terminal' ? 'display:none' : ''}">
          <p class="code-hint" style="margin-bottom:6px">IDE &amp; Shell</p>
          <div class="theme-terminal-chips">
            ${['vscode','powershell','cmd'].map(terminalChip).join('')}
          </div>
          <p class="code-hint" style="margin:10px 0 6px">Linux</p>
          <div class="theme-terminal-chips">
            ${['kali','mintlinux','ubuntu'].map(terminalChip).join('')}
          </div>
        </div>

        <div id="theme-pokemon-section" style="${activeMode !== 'pokemon' ? 'display:none' : ''}">
          <p class="code-hint" style="margin-bottom:8px">Pick your starter — swaps the mascot, palette, splash &amp; tagline, with an eerie ambient effect. (Gengar keeps the glitch.)</p>
          <div class="theme-poke-chips">
            ${POKEMON_KEYS.map(pokeChip).join('')}
          </div>
        </div>

        <div id="theme-team-section" style="${activeMode !== 'team' ? 'display:none' : ''}">
          <p class="code-hint" style="margin-bottom:8px">Rep your team — swaps the mascot to the team logo with its colors &amp; slogan. (Logos are team trademarks — personal use.)</p>
          <div class="theme-poke-chips">
            ${TEAM_KEYS.map(teamChip).join('')}
          </div>
        </div>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Font</h2>
        <p class="code-hint" style="margin-bottom:12px">Changes text style throughout the entire app.</p>
        <div class="nav-pos-grid">${fontBtns}</div>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Custom Categories</h2>
        <p class="code-hint" style="margin-bottom:12px">Add categories beyond the built-in ones.</p>
        <div class="custom-cat-list">${customCatRows}</div>
        <div style="display:flex;gap:8px">
          <input type="text" id="new-cat-input" class="form-input" placeholder="Category name" style="flex:1">
          <button id="add-cat-btn" class="btn-sm">Add</button>
        </div>
        <span id="cat-status" class="form-status" style="font-size:11px"></span>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Notifications</h2>
        <div class="form-row">
          <label class="form-label" style="display:flex;align-items:center;gap:10px;cursor:pointer">
            <input type="checkbox" id="notif-toggle" ${s.notifications ? 'checked' : ''} style="accent-color:var(--accent);width:16px;height:16px">
            Bill reminders
          </label>
          <p class="code-hint" style="margin-top:6px">You'll be notified about bills due within 3 days each time you open the app. Requires notification permission.</p>
        </div>
        ${typeof Notification !== 'undefined' && Notification.permission !== 'granted' ? `<button id="notif-enable-btn" class="btn-sm" style="margin-top:4px">Enable Notifications</button>` : ''}
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Privacy</h2>
        <p class="code-hint" style="margin-bottom:12px">Require a 4-digit PIN to open the app.</p>
        ${localStorage.getItem('slawminyaw_pin') ? `
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:.9rem;color:var(--success)">PIN Enabled ✓</span>
          <button id="pin-remove-btn" class="btn-xs" style="background:var(--danger);color:#fff;border-color:var(--danger)">Remove PIN</button>
        </div>` : `
        <button id="pin-set-btn" class="btn-sm">Set PIN</button>`}
        <span id="pin-status" class="form-status" style="font-size:11px;margin-top:8px"></span>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
          <p class="code-hint" style="margin-bottom:10px">Use your phone's built-in lock (Face ID, fingerprint, or pattern) to unlock the app.</p>
          ${bioEnabled ? `
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:.9rem;color:var(--success)">Phone Lock Enabled ✓</span>
            <button id="bio-remove-btn" class="btn-xs" style="background:var(--danger);color:#fff;border-color:var(--danger)">Remove</button>
          </div>` : `
          <button id="bio-set-btn" class="btn-sm"${!window.PublicKeyCredential ? ' disabled title="Not supported on this device/browser"' : ''}>Enable Phone Lock</button>`}
          <span id="bio-status" class="form-status" style="font-size:11px;margin-top:8px"></span>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
          <label class="form-label" style="display:flex;align-items:center;gap:10px;cursor:pointer">
            <input type="checkbox" id="hide-amounts-settings" ${s.hideAmounts ? 'checked' : ''} style="accent-color:var(--accent);width:16px;height:16px">
            Hide balances (blur amounts)
          </label>
          <p class="code-hint" style="margin-top:6px">Blurs every dollar amount across the app so you can open it in public. Tap the eye icon on the balance card to toggle it any time.</p>
        </div>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Animations</h2>
        <p class="code-hint" style="margin-bottom:12px">Control visual effects throughout the app.</p>
        <div class="form-row">
          <label class="form-label" style="display:flex;align-items:center;gap:10px;cursor:pointer">
            <input type="checkbox" id="splash-anim-settings" ${localStorage.getItem('splashAnim') !== 'false' ? 'checked' : ''} style="accent-color:var(--accent);width:16px;height:16px">
            Splash screen glitch effects
          </label>
        </div>
        <div class="form-row" style="margin-top:10px">
          <label class="form-label" style="display:flex;align-items:center;gap:10px;cursor:pointer">
            <input type="checkbox" id="reduce-fx-settings" ${s.reduceFx ? 'checked' : ''} style="accent-color:var(--accent);width:16px;height:16px">
            Reduce motion &amp; effects
          </label>
          <p class="code-hint" style="margin-top:6px">Freezes the looping glitch animations across the app — calmer UI and better battery life. Page transitions stay snappy.</p>
        </div>
      </div>

    </div>`;
}

function attachSettings() {
  // App mode (Full vs Simple/Tracker)
  document.querySelectorAll('.mode-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (isSimpleMode() === (mode === 'simple')) return;  // no change
      const s = loadSettings(); s.appMode = mode; saveSettings(s);
      showTab('dashboard');  // land somewhere valid for the new mode
    });
  });

  // Font style switcher
  document.querySelectorAll('[data-font-style]').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = loadSettings();
      s.fontStyle = btn.dataset.fontStyle;
      saveSettings(s);
      applyFontStyle(s.fontStyle);
      render();
    });
  });

  // Theme mode toggle (Dark / Light / Terminal)
  const _applyThemeKey = key => {
    const s = loadSettings();
    s.theme = key;
    saveSettings(s);
    applyTheme(key);
    render();
  };

  document.querySelectorAll('.theme-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      const cur  = loadSettings().theme || 'dark';
      // If already in this mode, do nothing
      const isTerminal = ['vscode','powershell','cmd','kali','mintlinux','ubuntu'].includes(cur);
      const isPokemon  = ['gengar','charizard','squirtle'].includes(cur);
      const isTeam     = ['bears','dodgers','knights','celtics'].includes(cur);
      const curMode    = isPokemon ? 'pokemon' : isTeam ? 'team' : isTerminal ? 'terminal' : THEMES[cur]?.light ? 'light' : 'dark';
      if (mode === curMode) return;
      // Switch to default theme for new mode
      const defaults = { dark:'dark', light:'light', terminal:'vscode', pokemon:'gengar', team:'bears' };
      _applyThemeKey(defaults[mode] || 'dark');
    });
  });

  // Accent swatches
  document.querySelectorAll('.theme-accent-chip').forEach(chip => {
    chip.addEventListener('click', () => _applyThemeKey(chip.dataset.theme));
  });

  // Terminal chips
  document.querySelectorAll('.theme-terminal-chip').forEach(chip => {
    chip.addEventListener('click', () => _applyThemeKey(chip.dataset.theme));
  });

  // Pokémon chips
  document.querySelectorAll('.theme-poke-chip').forEach(chip => {
    chip.addEventListener('click', () => _applyThemeKey(chip.dataset.theme));
  });

  // Custom accent color wheel — dark variant
  document.getElementById('custom-theme-chip')?.addEventListener('click', e => {
    e.stopPropagation();
    const _s = loadSettings();
    const initial = _s.customAccent || THEMES[_s.theme === 'custom' ? 'dark' : (_s.theme || 'dark')]?.accent || '#62b898';
    _openColorPicker(initial, hex => {
      const _s2 = loadSettings();
      _s2.customAccent = hex;
      _s2.theme = 'custom';
      saveSettings(_s2);
      applyTheme('custom');
      render();
    });
  });
  // Custom accent color wheel — light variant
  document.getElementById('customlight-theme-chip')?.addEventListener('click', e => {
    e.stopPropagation();
    const _s = loadSettings();
    const initial = _s.customAccent || THEMES.light?.accent || '#5ab592';
    _openColorPicker(initial, hex => {
      const _s2 = loadSettings();
      _s2.customAccent = hex;
      _s2.theme = 'customlight';
      saveSettings(_s2);
      applyTheme('customlight');
      render();
    });
  });

  // Go to accounts page
  document.getElementById('goto-accounts-card')?.addEventListener('click', () => {
    showTab('accounts');
  });

  // Custom categories (Settings page)
  document.getElementById('add-cat-btn')?.addEventListener('click', () => {
    const input = document.getElementById('new-cat-input');
    const name = input.value.trim();
    if (!name) { showStatus('cat-status', 'Enter a category name.', 'error'); return; }
    const s = loadSettings();
    const custom = s.customCategories || [];
    if (DEFAULT_CATEGORIES.includes(name) || custom.includes(name)) {
      showStatus('cat-status', 'Category already exists.', 'error'); return;
    }
    custom.push(name);
    s.customCategories = custom;
    saveSettings(s);
    input.value = '';
    showStatus('cat-status', `✓ "${name}" added.`, 'success');
    render();
  });

  document.querySelectorAll('.custom-cat-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const s = loadSettings();
      const custom = s.customCategories || [];
      custom.splice(idx, 1);
      s.customCategories = custom;
      saveSettings(s);
      render();
    });
  });

  document.getElementById('notif-toggle')?.addEventListener('change', async e => {
    const s = loadSettings();
    s.notifications = e.target.checked;
    saveSettings(s);
    if (e.target.checked) await requestNotifPermission();
  });

  document.getElementById('notif-enable-btn')?.addEventListener('click', async () => {
    await requestNotifPermission();
    render();
  });

  // PIN lock
  document.getElementById('pin-set-btn')?.addEventListener('click', () => {
    showPinSetupModal(() => { showStatus('pin-status', '✓ PIN set.', 'success'); render(); });
  });

  document.getElementById('pin-remove-btn')?.addEventListener('click', () => {
    showConfirmModal({
      title: 'Remove PIN', danger: true,
      message: 'Remove your PIN lock? Anyone will be able to open the app.',
      confirmText: 'Remove',
      onConfirm: () => { localStorage.removeItem('slawminyaw_pin'); render(); },
    });
  });

  // Biometric / phone lock
  document.getElementById('bio-set-btn')?.addEventListener('click', async () => {
    showStatus('bio-status', 'Setting up…', 'info');
    const ok = await setupBiometric();
    if (ok) {
      showStatus('bio-status', '✓ Phone lock enabled.', 'success');
      render();
    } else {
      showStatus('bio-status', 'Setup failed — biometric may not be supported on this device/browser.', 'error');
    }
  });

  document.getElementById('bio-remove-btn')?.addEventListener('click', () => {
    showConfirmModal({
      title: 'Remove Phone Lock', danger: true,
      message: 'Remove biometric lock? Anyone will be able to open the app.',
      confirmText: 'Remove',
      onConfirm: () => { localStorage.removeItem('slawminyaw_biometric_cred'); render(); },
    });
  });

  // Splash animation toggle (also accessible from splash screen button)
  document.getElementById('splash-anim-settings')?.addEventListener('change', e => {
    localStorage.setItem('splashAnim', e.target.checked ? 'true' : 'false');
  });

  document.getElementById('reduce-fx-settings')?.addEventListener('change', e => {
    const s = loadSettings();
    s.reduceFx = e.target.checked;
    saveSettings(s);
    document.body.classList.toggle('fx-reduced', e.target.checked);
  });

  document.getElementById('hide-amounts-settings')?.addEventListener('change', e => {
    const s = loadSettings();
    s.hideAmounts = e.target.checked;
    saveSettings(s);
    _applyAmountsHidden();
  });


}

// ── accounts management page ──────────────────────────────────────────────
function _ordinal(n) {
  const v = n % 100;
  return n + (['th','st','nd','rd'][(v - 20) % 10] || ['th','st','nd','rd'][v] || 'th');
}
function _fmtCurrency(n) {
  if (n == null || isNaN(n)) return '';
  return n < 0 ? '-$' + Math.abs(n).toFixed(2) : '$' + n.toFixed(2);
}
let _shownNegativePopup = false;
function showNegativeBalancePopup() {
  if (document.getElementById('neg-balance-popup')) return;
  const el = document.createElement('div');
  el.id = 'neg-balance-popup';
  el.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  el.innerHTML = `
    <div style="background:var(--card);border:2px solid var(--danger);border-radius:20px;padding:28px 24px;max-width:320px;width:100%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.6)">
      <div style="font-size:1rem;font-weight:900;color:var(--danger);margin-bottom:10px;text-transform:uppercase;letter-spacing:.06em">Get your shit together, man</div>
      <p style="font-size:.83rem;color:var(--muted);margin:0 0 20px;line-height:1.55">Your balance just went negative. Time to lock tf in and get those finances right.</p>
      <button id="neg-bal-dismiss" style="background:var(--danger);color:white;border:none;border-radius:10px;padding:10px 28px;font-size:.9rem;font-weight:800;cursor:pointer;font-family:var(--font-body);text-transform:uppercase;letter-spacing:.04em">I got it</button>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
  document.getElementById('neg-bal-dismiss')?.addEventListener('click', () => el.remove());
}
const _ACCT_SVG = {
  checking: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 22 7 2 7"/></svg>`,
  savings:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M15 9a3 3 0 0 0-6 0c0 3 6 3 6 6a3 3 0 0 1-6 0"/></svg>`,
  credit:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="5" y1="15" x2="8" y2="15"/></svg>`,
  loan:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>`,
  cash:            `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  roth_ira:        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  traditional_ira: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  '401k':          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  hsa:             `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
};
const ACCT_TYPE_META = [
  { key:'checking',        icon:_ACCT_SVG.checking,        label:'Checking'       },
  { key:'savings',         icon:_ACCT_SVG.savings,         label:'Savings'        },
  { key:'credit',          icon:_ACCT_SVG.credit,          label:'Credit'         },
  { key:'loan',            icon:_ACCT_SVG.loan,            label:'Loan'           },
  { key:'cash',            icon:_ACCT_SVG.cash,            label:'Cash'           },
  { key:'roth_ira',        icon:_ACCT_SVG.roth_ira,        label:'Roth IRA'       },
  { key:'traditional_ira', icon:_ACCT_SVG.traditional_ira, label:'Traditional IRA'},
  { key:'401k',            icon:_ACCT_SVG['401k'],         label:'401(k)'         },
  { key:'hsa',             icon:_ACCT_SVG.hsa,             label:'HSA'            },
];

const RETIRE_TYPES = ['roth_ira', 'traditional_ira', '401k', 'hsa'];
const RETIRE_LIMITS = {
  roth_ira:        { base: 7000,  catchup: 8000,  catchupAge: 50, label: 'Roth IRA'        },
  traditional_ira: { base: 7000,  catchup: 8000,  catchupAge: 50, label: 'Traditional IRA' },
  '401k':          { base: 23500, catchup: 31000, catchupAge: 50, label: '401(k)'          },
  hsa:             { base: 4300,  family:  8550,                   label: 'HSA'             },
};
function _retireBalance(acctId) {
  const d = JSON.parse(localStorage.getItem(accountDataKey(acctId)) || '{}');
  const txns = d.transactions || [];
  const startBal = parseFloat(d.startingBalance) || 0;
  let inc = 0, exp = 0;
  for (const t of txns) { if (t.type === 'income') inc += t.amount; else exp += t.amount; }
  return startBal + inc - exp;
}
function _ytdContributions(acctId) {
  const year = String(new Date().getFullYear());
  const d = JSON.parse(localStorage.getItem(accountDataKey(acctId)) || '{}');
  return (d.transactions || [])
    .filter(t => t.type === 'income' && (t.date || '').startsWith(year))
    .reduce((s, t) => s + t.amount, 0);
}

function _buildAccountCards() {
  const _calSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  return state.accounts.map((a) => {
    const isDebtAcct   = a.type === 'credit' || a.type === 'loan';
    const isRetireAcct = RETIRE_TYPES.includes(a.type);
    const dueDay = a.payment_due_day || '';
    const typeChips = ACCT_TYPE_META.map(t => `
      <button type="button" class="acct-type-chip${a.type === t.key ? ' active' : ''}" data-type="${t.key}" data-id="${a.id}">
        ${t.icon} ${t.label}
      </button>`).join('');
    // Use != null so 0 is treated as a valid value (not falsy)
    const fmtApr = (a.interest_rate != null) ? parseFloat(a.interest_rate).toFixed(2) + '%' : '';
    const fmtPmt = a.monthly_payment ? '$' + parseFloat(a.monthly_payment).toFixed(2) : '';
    const dueDateDisplay = dueDay ? _ordinal(dueDay) : 'Choose due date';
    const typeMeta = ACCT_TYPE_META.find(t => t.key === a.type) || ACCT_TYPE_META[0];
    // Paycheck schedule (checking / savings / cash only — not debt, not retirement)
    const ps = a.paySchedule || {};
    const freqOpts = ['weekly','biweekly','semimonthly','monthly']
      .map(f => `<option value="${f}"${ps.frequency===f?' selected':''}>${{weekly:'Weekly',biweekly:'Bi-weekly',semimonthly:'Semi-monthly (1st & 15th)',monthly:'Monthly'}[f]}</option>`)
      .join('');
    // Standalone retirement contribution schedule
    const cs = a.contribSchedule || {};
    const csFreqOpts = ['weekly','biweekly','semimonthly','monthly']
      .map(f => `<option value="${f}"${cs.frequency===f?' selected':''}>${{weekly:'Weekly',biweekly:'Bi-weekly',semimonthly:'Semi-monthly (1st & 15th)',monthly:'Monthly'}[f]}</option>`)
      .join('');
    // Paycheck accounts available to link to a retirement account
    const paycheckAcctOpts = state.accounts
      .filter(ac => ac.type !== 'credit' && ac.type !== 'loan' && !RETIRE_TYPES.includes(ac.type) && ac.paySchedule?.enabled)
      .map(ac => `<option value="${ac.id}"${ac.id === a.linkedPaycheckAcctId ? ' selected' : ''}>${_escHtml(ac.name)}</option>`)
      .join('');
    const retireFields = isRetireAcct ? `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <span style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);display:block;margin-bottom:8px">Retirement Settings</span>
        <div class="form-row" style="margin-bottom:8px">
          <label class="form-label" style="font-size:.72rem">Birth Year (for catch-up limits)</label>
          <input type="number" class="form-input acct-birth-year" data-id="${a.id}" value="${a.birthYear || ''}" placeholder="e.g. 1985" inputmode="numeric" min="1930" max="2006" step="1">
        </div>
        <div class="form-row" style="margin-bottom:8px">
          <label class="form-label" style="font-size:.72rem">Expected Annual Return (%)</label>
          <input type="number" class="form-input acct-exp-return" data-id="${a.id}" value="${a.expectedReturn != null ? a.expectedReturn : 7}" placeholder="7" inputmode="decimal" min="0" max="30" step="0.5">
        </div>
        <div class="form-row" style="margin-bottom:8px">
          <label class="form-label" style="font-size:.72rem">My Contribution <span style="font-weight:400;color:var(--muted)">(fill one or both)</span></label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="position:relative">
              <input type="number" class="form-input acct-contrib-pct" data-id="${a.id}" value="${a.myContribPct != null ? a.myContribPct : ''}" placeholder="% of gross" inputmode="decimal" min="0" max="100" step="0.5" style="padding-right:28px">
              <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:.72rem;color:var(--muted);pointer-events:none">%</span>
            </div>
            <div style="position:relative">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:.72rem;color:var(--muted);pointer-events:none">$</span>
              <input type="number" class="form-input acct-contrib-amt" data-id="${a.id}" value="${a.myContribAmt != null ? a.myContribAmt : ''}" placeholder="flat / check" inputmode="decimal" min="0" step="0.01" style="padding-left:22px">
            </div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:8px">
          <label class="form-label" style="font-size:.72rem">Employer Match <span style="font-weight:400;color:var(--muted)">(fill one or both)</span></label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="position:relative">
              <input type="number" class="form-input acct-employer-match" data-id="${a.id}" value="${a.employerMatchPct != null ? a.employerMatchPct : ''}" placeholder="% of gross" inputmode="decimal" min="0" max="100" step="0.5" style="padding-right:28px">
              <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:.72rem;color:var(--muted);pointer-events:none">%</span>
            </div>
            <div style="position:relative">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:.72rem;color:var(--muted);pointer-events:none">$</span>
              <input type="number" class="form-input acct-employer-match-amt" data-id="${a.id}" value="${a.employerMatchAmt != null ? a.employerMatchAmt : ''}" placeholder="flat / check" inputmode="decimal" min="0" step="0.01" style="padding-left:22px">
            </div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:4px">
          <label class="form-label" style="font-size:.72rem">Auto-contribute from paycheck</label>
          ${paycheckAcctOpts
            ? `<select class="form-input form-select acct-paycheck-link" data-id="${a.id}">
                <option value="">— none —</option>
                ${paycheckAcctOpts}
              </select>
              <p style="font-size:.69rem;color:var(--muted);margin:4px 0 0">When a paycheck fires on the linked account, contributions are automatically posted here using the gross pay amount above.</p>`
            : `<p style="font-size:.72rem;color:var(--muted);margin:4px 0 0">No paycheck schedule active. Enable a paycheck schedule on a checking/savings account first, then come back here to link it.</p>`
          }
        </div>
        <div class="form-row" style="margin-bottom:4px;padding-top:10px;border-top:1px solid var(--border)">
          <label class="acct-pay-toggle-wrap" style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:6px">
            <input type="checkbox" class="acct-contrib-enabled" data-id="${a.id}"${cs.enabled ? ' checked' : ''}>
            <span style="font-size:.72rem;font-weight:600;color:var(--text)">Scheduled contribution</span>
          </label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="position:relative">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:.72rem;color:var(--muted);pointer-events:none">$</span>
              <input type="number" class="form-input acct-contrib-sched-amt" data-id="${a.id}" value="${cs.amount != null ? cs.amount : ''}" placeholder="amount" inputmode="decimal" min="0" step="0.01" style="padding-left:22px">
            </div>
            <select class="form-input form-select acct-contrib-freq" data-id="${a.id}">${csFreqOpts}</select>
          </div>
          <input type="date" class="form-input acct-contrib-nextdate" data-id="${a.id}" value="${cs.nextDate || ''}" style="margin-top:8px">
          <p style="font-size:.69rem;color:var(--muted);margin:4px 0 0">Auto-adds this contribution on each scheduled date — even dates missed while the app was closed.</p>
        </div>
      </div>` : '';
    const paycheckSection = (!isDebtAcct && !isRetireAcct) ? `
      <div class="acct-pay-section" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Paycheck Schedule</span>
          <label class="acct-pay-toggle-wrap" style="display:flex;align-items:center;gap:6px;cursor:pointer">
            <span style="font-size:.72rem;color:var(--muted)">${ps.enabled ? 'On' : 'Off'}</span>
            <div class="toggle-pill${ps.enabled?' toggle-pill-on':''}">
              <input type="checkbox" class="acct-pay-enabled" data-id="${a.id}" ${ps.enabled?'checked':''} style="display:none">
              <span class="toggle-knob"></span>
            </div>
          </label>
        </div>
        <div class="acct-pay-fields" style="${ps.enabled?'':'display:none'}">
          <div class="form-row" style="margin-bottom:6px">
            <label class="form-label" style="font-size:.72rem">Amount per paycheck (net/take-home)</label>
            <input type="number" class="form-input acct-pay-amount" data-id="${a.id}" placeholder="e.g. 2500" value="${ps.amount||''}" inputmode="decimal" step="0.01" min="0">
          </div>
          <div class="form-row" style="margin-bottom:6px">
            <label class="form-label" style="font-size:.72rem">Gross pay per check <span style="font-weight:400;color:var(--muted)">(for retirement auto-contributions)</span></label>
            <input type="number" class="form-input acct-pay-gross" data-id="${a.id}" placeholder="e.g. 3000" value="${ps.grossAmount||''}" inputmode="decimal" step="0.01" min="0">
          </div>
          <button type="button" class="est-toggle-btn" data-id="${a.id}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Don't know your net pay? Estimate it
          </button>
          <div class="est-panel" id="est-panel-${a.id}" style="display:none">
            <div class="est-panel-inner">
              <div class="est-row2">
                <div class="est-field">
                  <label class="est-lbl">Gross pay / check</label>
                  <div class="est-input-wrap"><span class="est-prefix">$</span><input type="number" class="form-input est-gross est-pfx" data-id="${a.id}" placeholder="3000" inputmode="decimal" step="0.01" min="0"></div>
                </div>
                <div class="est-field">
                  <label class="est-lbl">Filing status</label>
                  <select class="form-input form-select est-filing" data-id="${a.id}">
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                  </select>
                </div>
              </div>
              <div class="est-row2">
                <div class="est-field">
                  <label class="est-lbl">State income tax %</label>
                  <div class="est-input-wrap"><input type="number" class="form-input est-state-tax est-sfx" data-id="${a.id}" placeholder="5.0" inputmode="decimal" step="0.1" min="0" max="20"><span class="est-suffix">%</span></div>
                </div>
                <div class="est-field">
                  <label class="est-lbl">Pre-tax deductions / check</label>
                  <div class="est-input-wrap"><span class="est-prefix">$</span><input type="number" class="form-input est-pretax est-pfx" data-id="${a.id}" placeholder="0" inputmode="decimal" step="0.01" min="0"></div>
                </div>
              </div>
              <div class="est-hint">Pre-tax deductions = 401(k), HSA, health insurance taken out before taxes</div>
              <div class="est-result" id="est-result-${a.id}" style="display:none">
                <div class="est-result-rows" id="est-result-rows-${a.id}"></div>
                <button type="button" class="est-use-btn" id="est-use-${a.id}">Use estimated net as my paycheck amount</button>
              </div>
            </div>
          </div>
          <div class="form-row" style="margin-bottom:8px;margin-top:10px">
            <label class="form-label" style="font-size:.72rem">Pay frequency</label>
            <select class="form-input form-select acct-pay-freq" data-id="${a.id}">${freqOpts}</select>
          </div>
          <div class="form-row" style="margin-bottom:8px">
            <label class="form-label" style="font-size:.72rem">Next pay date</label>
            <input type="date" class="form-input acct-pay-nextdate" data-id="${a.id}" value="${ps.nextPayDate||''}">
          </div>
          <div class="form-row" style="margin-bottom:4px">
            <label class="form-label" style="font-size:.72rem">Label (optional)</label>
            <input type="text" class="form-input acct-pay-desc" data-id="${a.id}" placeholder="Paycheck" value="${_escHtml(ps.description||'')}">
          </div>
          ${ps.nextPayDate ? `<p style="font-size:.7rem;color:var(--accent);margin-top:4px">Next auto-entry: ${ps.nextPayDate}</p>` : ''}
        </div>
      </div>` : '';

    const billFillOpts = state.bills.length
      ? state.bills.map(b => `<option value="${b.id}" data-amount="${b.amount}" data-day="${b.dueDay}">${_escHtml(b.name)} · ${fmt(b.amount)} · due day ${b.dueDay}</option>`).join('')
      : '';
    const debtFields = isDebtAcct ? `
      <div class="acct-settings-debt" style="margin-top:10px">
        ${billFillOpts ? `<div style="margin-bottom:10px">
          <label class="form-label" style="font-size:.72rem">Fill from a bill</label>
          <select class="form-input form-select acct-bill-fill" data-id="${a.id}" style="font-size:.82rem">
            <option value="">— pick a bill to auto-fill amount &amp; due day —</option>
            ${billFillOpts}
          </select>
        </div>` : ''}
        <input type="text" class="form-input acct-interest-input acct-fmt-pct" data-id="${a.id}"
          value="${fmtApr}" placeholder="APR %"
          inputmode="decimal" title="Annual interest rate %">
        <div>
          <input type="hidden" class="acct-due-day-input" data-id="${a.id}" value="${dueDay}">
          <button type="button" class="acct-day-picker-btn" data-id="${a.id}">
            ${_calSvg}${dueDateDisplay}
          </button>
        </div>
        <input type="text" class="form-input acct-payment-input acct-fmt-cur" data-id="${a.id}"
          value="${fmtPmt}" placeholder="Mo. payment $"
          inputmode="decimal" style="grid-column:1/-1" title="Fixed monthly payment amount">
        <div class="acct-day-grid-wrap" id="day-grid-${a.id}" style="display:none">
          ${Array.from({length:28},(_,i)=>i+1).map(d =>
            `<button type="button" class="acct-day-opt${dueDay===d?' acct-day-opt-active':''}" data-day="${d}" data-id="${a.id}">${d}</button>`
          ).join('')}
        </div>
      </div>` : '';
    return `
    <div class="acct-settings-card acct-card-collapsed">
      <div class="acct-card-header" data-id="${a.id}">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden">
          <span class="acct-card-name">${_escHtml(a.name)}</span>
          <span class="acct-card-type-lbl" style="font-size:11px;color:var(--muted);white-space:nowrap">${typeMeta.icon} ${typeMeta.label}</span>
          ${a.id === currentAccountId ? '<span class="acct-badge" style="font-size:9px">active</span>' : ''}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${a.id !== currentAccountId ? `<button class="btn-xs acct-switch-btn" data-id="${a.id}">Switch</button>` : ''}
          <button type="button" class="acct-card-toggle" data-id="${a.id}" aria-label="Expand">›</button>
        </div>
      </div>
      <div class="acct-card-body" style="display:none">
        <input type="text" class="form-input acct-name-input" value="${_escHtml(a.name)}" data-id="${a.id}"
          style="width:100%;margin-bottom:10px;font-size:16px;font-weight:600;box-sizing:border-box${a.id === currentAccountId ? ';border-color:var(--accent)' : ''}"
          placeholder="Account name">
        <p style="font-size:11px;color:var(--muted);margin:0 0 6px;text-transform:uppercase;letter-spacing:.06em">Account Type</p>
        <input type="hidden" class="acct-type-select" data-id="${a.id}" value="${a.type}">
        <div class="acct-type-chips" data-id="${a.id}" style="margin-bottom:10px">${typeChips}</div>
        ${debtFields}
        ${paycheckSection}
        ${retireFields}
        <div class="acct-settings-actions" style="margin-top:10px">
          <button class="btn-xs acct-edit-save-btn" data-id="${a.id}" style="background:var(--accent);color:var(--bg);border-color:var(--accent)">Save</button>
          ${a.id !== 'main' ? `<button class="btn-xs acct-delete-btn" style="background:var(--danger);color:white;border-color:var(--danger)" data-id="${a.id}">Delete</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderAccounts() {
  const accountCards = _buildAccountCards();
  return `
    <div class="page">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <button id="accounts-back-btn" style="background:none;border:none;color:var(--accent);font-size:.85rem;font-weight:700;cursor:pointer;padding:4px 0;font-family:var(--font-body);display:flex;align-items:center;gap:4px;letter-spacing:.04em">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="15 18 9 12 15 6"/></svg>Settings
        </button>
      </div>
      <h1 class="page-title" style="margin-top:0">Accounts</h1>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:4px">Starting Balance</h2>
        <p class="code-hint" style="margin-bottom:10px">Added to your running total but not counted as income.</p>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="text" id="starting-bal-settings" class="form-input acct-fmt-cur" value="${_fmtCurrency(state.startingBalance)}" placeholder="$0.00" inputmode="decimal" style="flex:1;min-width:120px;border-color:var(--accent);border-width:2px;font-weight:600">
          <button id="starting-bal-settings-save" class="btn-sm">Save</button>
          <span id="starting-bal-settings-status" class="status-inline"></span>
        </div>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:4px">Your Accounts</h2>
        <p class="code-hint" style="margin-bottom:12px">Edit name or type, then tap Save. Delete removes all data for that account permanently.</p>
        <div class="accounts-list">${accountCards}</div>
        <span id="acct-status" class="form-status" style="font-size:11px"></span>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Add Account</h2>
        <input type="text" id="new-acct-name" class="form-input" placeholder="Account name" style="width:100%;box-sizing:border-box;margin-bottom:8px">
        <p style="font-size:11px;color:var(--muted);margin:0 0 6px;text-transform:uppercase;letter-spacing:.06em">Account Type</p>
        <div class="acct-type-chips new-acct-type-chips" style="margin-bottom:12px">
          ${ACCT_TYPE_META.map((t, i) => `
            <button type="button" class="acct-type-chip new-acct-type-chip${i === 0 ? ' active' : ''}" data-type="${t.key}">
              ${t.icon} ${t.label}
            </button>`).join('')}
        </div>
        <input type="hidden" id="new-acct-type" value="checking">
        <button id="add-acct-btn" class="btn-sm">Add Account</button>
        <span id="new-acct-status" class="form-status" style="font-size:11px"></span>
      </div>
    </div>`;
}

function attachAccounts() {
  // Auto-expand a specific account card (e.g. when navigating from dashboard edit button)
  if (_pendingAccountExpand) {
    const targetCard = document.querySelector(`.acct-settings-card .acct-card-header[data-id="${_pendingAccountExpand}"]`)?.closest('.acct-settings-card');
    if (targetCard) {
      targetCard.classList.remove('acct-card-collapsed');
      const body   = targetCard.querySelector('.acct-card-body');
      const toggle = targetCard.querySelector('.acct-card-toggle');
      if (body)   body.style.display = '';
      if (toggle) toggle.textContent = '∨';
      setTimeout(() => targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
    _pendingAccountExpand = null;
  }

  document.getElementById('accounts-back-btn')?.addEventListener('click', () => {
    _pageTransition = 'slide-right';
    currentTab = 'settings';
    render();
  });

  // Starting balance blur/focus formatting
  const _startBalInp = document.getElementById('starting-bal-settings');
  if (_startBalInp) {
    _startBalInp.addEventListener('focus', () => {
      _startBalInp.value = _startBalInp.value.replace(/[$,]/g, '');
    });
    _startBalInp.addEventListener('blur', () => {
      const n = parseFloat(_startBalInp.value.replace(/[$,]/g, ''));
      _startBalInp.value = _fmtCurrency(n);
    });
  }

  document.getElementById('starting-bal-settings-save')?.addEventListener('click', () => {
    const raw = document.getElementById('starting-bal-settings')?.value.replace(/[$,]/g, '');
    const val = parseFloat(raw);
    state.startingBalance = isNaN(val) ? 0 : val;
    _save();
    showStatus('starting-bal-settings-status', '✓ Saved', 'success', 2000);
    if (val < 0) { _shownNegativePopup = true; showNegativeBalancePopup(); }
  });

  // Currency/percent input auto-formatting
  document.querySelectorAll('.acct-fmt-cur').forEach(inp => {
    inp.addEventListener('focus', () => {
      inp.value = inp.value.replace(/[$,]/g, '');
    });
    inp.addEventListener('blur', () => {
      const n = parseFloat(inp.value.replace(/[$,]/g, ''));
      inp.value = _fmtCurrency(n);
    });
  });
  document.querySelectorAll('.acct-fmt-pct').forEach(inp => {
    inp.addEventListener('focus', () => {
      inp.value = inp.value.replace(/%/g, '');
    });
    inp.addEventListener('blur', () => {
      const n = parseFloat(inp.value.replace(/%/g, ''));
      inp.value = isNaN(n) ? '' : n.toFixed(2) + '%';
    });
  });

  // Account type chips (existing accounts)
  document.querySelectorAll('.acct-type-chip:not(.new-acct-type-chip)').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      const hidden = document.querySelector(`.acct-type-select[data-id="${id}"]`);
      if (hidden) hidden.value = type;
      document.querySelectorAll(`.acct-type-chip[data-id="${id}"]`).forEach(b =>
        b.classList.toggle('active', b.dataset.type === type)
      );
    });
  });

  // Account type chips (new account)
  document.querySelectorAll('.new-acct-type-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.new-acct-type-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const hidden = document.getElementById('new-acct-type');
      if (hidden) hidden.value = btn.dataset.type;
    });
  });

  // Collapsible card headers
  document.querySelectorAll('.acct-card-header').forEach(hdr => {
    hdr.addEventListener('click', e => {
      if (e.target.closest('.acct-switch-btn')) return;
      triggerIconGlitch(hdr);
      const card   = hdr.closest('.acct-settings-card');
      const body   = card.querySelector('.acct-card-body');
      const toggle = card.querySelector('.acct-card-toggle');
      const opening = card.classList.contains('acct-card-collapsed');
      card.classList.toggle('acct-card-collapsed', !opening);
      body.style.display = opening ? '' : 'none';
      if (toggle) toggle.textContent = opening ? '∨' : '›';
    });
  });

  // Paycheck estimator — toggle panel
  document.querySelectorAll('.est-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.id;
      const panel = document.getElementById(`est-panel-${id}`);
      if (!panel) return;
      const open = panel.style.display === 'none';
      panel.style.display = open ? '' : 'none';
      btn.classList.toggle('est-toggle-open', open);
    });
  });

  // Paycheck estimator — live calculation
  function _runEstimator(id) {
    const card       = document.querySelector(`.acct-settings-card .acct-card-header[data-id="${id}"]`)?.closest('.acct-settings-card');
    if (!card) return;
    const grossEl    = card.querySelector(`.est-gross[data-id="${id}"]`);
    const filingEl   = card.querySelector(`.est-filing[data-id="${id}"]`);
    const stateEl    = card.querySelector(`.est-state-tax[data-id="${id}"]`);
    const pretaxEl   = card.querySelector(`.est-pretax[data-id="${id}"]`);
    const freqEl     = card.querySelector(`.acct-pay-freq[data-id="${id}"]`);
    const resultEl   = document.getElementById(`est-result-${id}`);
    const rowsEl     = document.getElementById(`est-result-rows-${id}`);
    if (!grossEl || !resultEl || !rowsEl) return;
    const gross = parseFloat(grossEl.value) || 0;
    if (gross <= 0) { resultEl.style.display = 'none'; return; }
    const result = _estimateNetPay({
      gross,
      frequency:      freqEl?.value || 'biweekly',
      filingStatus:   filingEl?.value || 'single',
      stateTaxPct:    parseFloat(stateEl?.value) || 0,
      pretaxDeductions: parseFloat(pretaxEl?.value) || 0,
    });
    rowsEl.innerHTML = `
      <div class="est-row"><span>Gross pay</span><span>${fmt(result.gross)}</span></div>
      <div class="est-row"><span>Federal income tax (est.)</span><span class="est-deduct">−${fmt(result.perCheckFed)}</span></div>
      <div class="est-row"><span>Social Security + Medicare</span><span class="est-deduct">−${fmt(result.fica)}</span></div>
      ${result.stateTax > 0 ? `<div class="est-row"><span>State income tax</span><span class="est-deduct">−${fmt(result.stateTax)}</span></div>` : ''}
      ${result.pretaxDeductions > 0 ? `<div class="est-row"><span>Pre-tax deductions</span><span class="est-deduct">−${fmt(result.pretaxDeductions)}</span></div>` : ''}
      <div class="est-row est-row-net"><span>Estimated take-home</span><span style="color:var(--success)">${fmt(result.net)}</span></div>`;
    resultEl.style.display = '';
    const useBtn = document.getElementById(`est-use-${id}`);
    if (useBtn) useBtn.dataset.net = result.net.toFixed(2);
  }

  document.querySelectorAll('.est-gross, .est-filing, .est-state-tax, .est-pretax').forEach(el => {
    el.addEventListener('input', () => {
      const id = el.dataset.id;
      if (id) _runEstimator(id);
    });
    el.addEventListener('change', () => {
      const id = el.dataset.id;
      if (id) _runEstimator(id);
    });
  });
  // Also re-run when frequency changes since it affects federal tax
  document.querySelectorAll('.acct-pay-freq').forEach(sel => {
    sel.addEventListener('change', () => {
      const id = sel.dataset.id;
      if (id) _runEstimator(id);
    });
  });

  // "Use this amount" button
  document.querySelectorAll('[id^="est-use-"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = btn.id.replace('est-use-', '');
      const net    = parseFloat(btn.dataset.net) || 0;
      const card   = document.querySelector(`.acct-settings-card .acct-card-header[data-id="${id}"]`)?.closest('.acct-settings-card');
      const amtInp = card?.querySelector(`.acct-pay-amount[data-id="${id}"]`);
      if (amtInp && net > 0) {
        amtInp.value = net.toFixed(2);
        // Flash the input green briefly
        amtInp.style.borderColor = 'var(--success)';
        setTimeout(() => amtInp.style.borderColor = '', 1500);
        // Collapse the estimator
        const panel = document.getElementById(`est-panel-${id}`);
        const toggleBtn = card?.querySelector(`.est-toggle-btn[data-id="${id}"]`);
        if (panel) panel.style.display = 'none';
        if (toggleBtn) toggleBtn.classList.remove('est-toggle-open');
      }
    });
  });

  // Paycheck toggle — show/hide fields live
  document.querySelectorAll('.acct-pay-enabled').forEach(chk => {
    const card   = chk.closest('.acct-settings-card');
    const fields = card?.querySelector('.acct-pay-fields');
    const pill   = chk.closest('.toggle-pill');
    const lbl    = chk.closest('.acct-pay-toggle-wrap')?.querySelector('span');
    chk.addEventListener('change', () => {
      if (fields) fields.style.display = chk.checked ? '' : 'none';
      if (pill)   pill.classList.toggle('toggle-pill-on', chk.checked);
      if (lbl)    lbl.textContent = chk.checked ? 'On' : 'Off';
    });
  });

  // Account edit save — handles name, type, debt fields, and paycheck schedule
  document.querySelectorAll('.acct-edit-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id   = btn.dataset.id;
      const acct = state.accounts.find(a => a.id === id);
      if (!acct) return;
      const card    = btn.closest('.acct-settings-card');
      const newName = card.querySelector(`.acct-name-input[data-id="${id}"]`)?.value.trim();
      const newType = card.querySelector(`.acct-type-select[data-id="${id}"]`)?.value;
      if (!newName) { showStatus('acct-status', 'Account name cannot be empty.', 'error'); return; }
      acct.name = newName;
      if (newType) acct.type = newType;
      // Debt fields (only present for credit/loan)
      const rateRaw = card.querySelector(`.acct-interest-input[data-id="${id}"]`)?.value.replace(/%/g,'').trim();
      const day     = card.querySelector(`.acct-due-day-input[data-id="${id}"]`)?.value.trim();
      const pmtRaw  = card.querySelector(`.acct-payment-input[data-id="${id}"]`)?.value.replace(/[$,]/g,'').trim();
      if (rateRaw !== undefined) acct.interest_rate   = rateRaw !== '' ? parseFloat(rateRaw) : undefined;
      if (day     !== undefined) acct.payment_due_day = day     ? parseInt(day)              : undefined;
      if (pmtRaw  !== undefined) acct.monthly_payment = pmtRaw  ? parseFloat(pmtRaw)         : undefined;
      // Retirement fields
      const birthYearEl  = card.querySelector(`.acct-birth-year[data-id="${id}"]`);
      const expReturnEl  = card.querySelector(`.acct-exp-return[data-id="${id}"]`);
      if (birthYearEl)  acct.birthYear      = birthYearEl.value.trim();
      if (expReturnEl)  acct.expectedReturn  = parseFloat(expReturnEl.value) || 7;
      const contribPctEl  = card.querySelector(`.acct-contrib-pct[data-id="${id}"]`);
      const contribAmtEl  = card.querySelector(`.acct-contrib-amt[data-id="${id}"]`);
      const matchPctEl    = card.querySelector(`.acct-employer-match[data-id="${id}"]`);
      const matchAmtEl    = card.querySelector(`.acct-employer-match-amt[data-id="${id}"]`);
      if (contribPctEl) acct.myContribPct      = contribPctEl.value.trim()  !== '' ? parseFloat(contribPctEl.value)  : undefined;
      if (contribAmtEl) acct.myContribAmt       = contribAmtEl.value.trim()  !== '' ? parseFloat(contribAmtEl.value)  : undefined;
      if (matchPctEl)   acct.employerMatchPct   = matchPctEl.value.trim()    !== '' ? parseFloat(matchPctEl.value)    : undefined;
      if (matchAmtEl)   acct.employerMatchAmt   = matchAmtEl.value.trim()    !== '' ? parseFloat(matchAmtEl.value)    : undefined;
      const paycheckLinkEl = card.querySelector(`.acct-paycheck-link[data-id="${id}"]`);
      if (paycheckLinkEl) acct.linkedPaycheckAcctId = paycheckLinkEl.value || undefined;
      // Standalone contribution schedule (retirement accounts)
      const csEnabledEl = card.querySelector(`.acct-contrib-enabled[data-id="${id}"]`);
      if (csEnabledEl) {
        const csAmt  = parseFloat(card.querySelector(`.acct-contrib-sched-amt[data-id="${id}"]`)?.value || '0') || 0;
        const csFreq = card.querySelector(`.acct-contrib-freq[data-id="${id}"]`)?.value || 'monthly';
        const csDate = card.querySelector(`.acct-contrib-nextdate[data-id="${id}"]`)?.value || '';
        acct.contribSchedule = {
          ...(acct.contribSchedule || {}),
          enabled:   csEnabledEl.checked,
          amount:    csAmt,
          frequency: csFreq,
          nextDate:  csDate,
        };
      }
      // Paycheck schedule (non-debt, non-retirement accounts)
      const payEnabledEl  = card.querySelector(`.acct-pay-enabled[data-id="${id}"]`);
      if (payEnabledEl) {
        const payAmt   = parseFloat(card.querySelector(`.acct-pay-amount[data-id="${id}"]`)?.value || '0') || 0;
        const payGross = parseFloat(card.querySelector(`.acct-pay-gross[data-id="${id}"]`)?.value  || '0') || 0;
        const payFreq  = card.querySelector(`.acct-pay-freq[data-id="${id}"]`)?.value || 'biweekly';
        const payDate  = card.querySelector(`.acct-pay-nextdate[data-id="${id}"]`)?.value || '';
        const payDesc  = card.querySelector(`.acct-pay-desc[data-id="${id}"]`)?.value.trim() || 'Paycheck';
        acct.paySchedule = {
          ...(acct.paySchedule || {}),
          enabled:     payEnabledEl.checked,
          amount:      payAmt,
          grossAmount: payGross || undefined,
          frequency:   payFreq,
          nextPayDate: payDate,
          description: payDesc,
        };
      }
      await api.saveAccounts(state.accounts);
      updateAccountSwitcher();
      // Update card header in-place so the card stays expanded
      const nameDisp = card.querySelector('.acct-card-name');
      if (nameDisp) nameDisp.textContent = newName;
      const typeDisp = card.querySelector('.acct-card-type-lbl');
      if (typeDisp && newType) {
        const tm = ACCT_TYPE_META.find(t => t.key === newType);
        if (tm) typeDisp.innerHTML = `${tm.icon} ${tm.label}`;
      }
      // Flash the button green
      const origHtml = btn.innerHTML;
      btn.textContent = '✓ Saved';
      btn.style.cssText += ';background:var(--success,#2ea84e);border-color:var(--success,#2ea84e)';
      setTimeout(() => {
        btn.textContent = 'Save';
        btn.style.background = 'var(--accent)';
        btn.style.borderColor = 'var(--accent)';
      }, 2000);
    });
  });

  // Switch account — stays on accounts page
  document.querySelectorAll('.acct-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentAccountId = btn.dataset.id;
      _shownNegativePopup = false; // reset so popup can fire for the new account
      _loadAccountData(btn.dataset.id);
      updateAccountSwitcher();
      render();
    });
  });

  // Fill debt fields from an existing bill
  const _billFillCalSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  document.querySelectorAll('.acct-bill-fill').forEach(sel => {
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      const id   = sel.dataset.id;
      const opt  = sel.options[sel.selectedIndex];
      const amt  = parseFloat(opt.dataset.amount) || 0;
      const day  = parseInt(opt.dataset.day) || 0;
      const card = sel.closest('.acct-settings-card');
      // Fill monthly payment
      const pmtInput = card.querySelector(`.acct-payment-input[data-id="${id}"]`);
      if (pmtInput) pmtInput.value = '$' + amt.toFixed(2);
      // Fill due day
      if (day) {
        const hidden = card.querySelector(`.acct-due-day-input[data-id="${id}"]`);
        if (hidden) hidden.value = day;
        const pickerBtn = card.querySelector(`.acct-day-picker-btn[data-id="${id}"]`);
        if (pickerBtn) pickerBtn.innerHTML = `${_billFillCalSvg}${_ordinal(day)}`;
        card.querySelectorAll(`.acct-day-opt[data-id="${id}"]`).forEach(b =>
          b.classList.toggle('acct-day-opt-active', parseInt(b.dataset.day) === day)
        );
      }
      sel.value = ''; // reset picker
    });
  });

  // Due day picker
  document.querySelectorAll('.acct-day-picker-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id   = btn.dataset.id;
      const grid = document.getElementById(`day-grid-${id}`);
      if (!grid) return;
      const isOpen = grid.style.display !== 'none';
      document.querySelectorAll('.acct-day-grid-wrap').forEach(g => { g.style.display = 'none'; });
      if (!isOpen) grid.style.display = 'grid';
    });
  });

  const _calSvgInline = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  document.querySelectorAll('.acct-day-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.dataset.id;
      const day = parseInt(btn.dataset.day);
      const hidden = document.querySelector(`.acct-due-day-input[data-id="${id}"]`);
      if (hidden) hidden.value = day;
      const pickerBtn = document.querySelector(`.acct-day-picker-btn[data-id="${id}"]`);
      if (pickerBtn) {
        pickerBtn.innerHTML = `${_calSvgInline}${_ordinal(day)}`;
      }
      document.querySelectorAll(`.acct-day-opt[data-id="${id}"]`).forEach(b =>
        b.classList.toggle('acct-day-opt-active', parseInt(b.dataset.day) === day)
      );
      const grid = document.getElementById(`day-grid-${id}`);
      if (grid) grid.style.display = 'none';
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.acct-day-grid-wrap').forEach(g => { g.style.display = 'none'; });
  }, { once: true });


  document.getElementById('add-acct-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('new-acct-name').value.trim();
    const type = document.getElementById('new-acct-type').value;
    if (!name) { showStatus('new-acct-status', 'Enter an account name.', 'error'); return; }
    await api.addAccount(name, type);
    showStatus('new-acct-status', `✓ "${name}" added.`, 'success');
    document.getElementById('new-acct-name').value = '';
    render();
  });

  document.querySelectorAll('.acct-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id   = btn.dataset.id;
      const acct = state.accounts.find(a => a.id === id);
      if (!acct) return;
      showConfirmModal({
        title: `Delete "${_escHtml(acct.name)}"?`, danger: true,
        message: 'All transactions, budgets, and bills for this account will be permanently removed.',
        confirmText: 'Delete Account',
        onConfirm: async () => { await api.deleteAccount(id); render(); },
      });
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
  const quote    = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const built    = new Date().getFullYear();
  const s        = loadSettings();
  const userName = s.name || null;
  // Only show the changelog entry for the current exact version
  const changelogHtml = CHANGELOG.filter(e => e.version === VERSION).map(entry => `
    <div style="margin-bottom:18px">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px">
        <span style="font-size:.95rem;font-weight:700;color:var(--accent)">v${entry.version}</span>
        <span style="font-size:.72rem;color:var(--muted)">${entry.date}</span>
      </div>
      <ul style="margin:0;padding-left:16px;list-style:disc">
        ${entry.changes.map(c => `<li style="font-size:.82rem;color:var(--text);line-height:1.55;margin-bottom:3px">${c}</li>`).join('')}
      </ul>
    </div>
  `).join('');
  return `
    <div class="page">
      <h1 class="page-title">About</h1>
      <div class="form-card" style="text-align:center;padding:24px 20px">
        <img src="${mascotSrc()}" alt="Budget DAWGs"
             style="width:100%;height:auto;display:block;margin:0 auto 16px;filter:drop-shadow(0 4px 24px rgba(0,0,0,0.7))">
        <div style="font-size:.75rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Version</div>
        <div style="font-size:1.1rem;font-weight:600;color:var(--text);margin-bottom:20px">v${VERSION}</div>
        <hr style="border:none;border-top:1px solid var(--border);margin:0 0 20px">
        <div style="font-size:.75rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">Quote of the Day</div>
        <p style="font-size:.9rem;color:var(--text);line-height:1.6;font-style:italic;margin:0">"${quote}"</p>
      </div>
      <div class="form-card" style="margin-top:20px">
        <div style="font-size:.75rem;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px">What's New</div>
        ${changelogHtml}
      </div>
      <div class="form-card" style="text-align:center;margin-top:20px">
        <p class="code-hint" style="margin-bottom:12px">New here? Get a quick walkthrough of everything the app can do.</p>
        <p class="code-hint" style="margin-bottom:12px">If the app feels out of date, tap below to clear the cache and reload the latest version.</p>
        <button id="force-update-btn" class="btn-primary" style="width:100%">${ICONS.refresh} Force Update</button>
        <div id="force-update-status" class="form-status" style="margin-top:8px"></div>
      </div>
      <p style="text-align:center;font-size:.75rem;color:var(--muted);margin-top:8px">© ${built} SlawMinYaw's Budget DAWGs. All rights reserved.</p>
    </div>`;
}

// ── walkthrough tour ──────────────────────────────────────────────────────
const WALKTHROUGH_STEPS = [
  // ── 1. Welcome ────────────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Welcome to Budget DAWGs',
    body: 'Your all-in-one personal finance companion. This tour shows you every key feature with a quick animation. Tap Next to begin — use ← Back to revisit any step.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4l3.1 6.3 7 1.1-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-4.9 7-1.1z"/><line x1="12" y1="28" x2="24" y2="28" stroke-width="1.5"/><line x1="15" y1="32" x2="21" y2="32" stroke-width="1.5"/></svg>`,
    anim: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:18px 0;">
  <svg viewBox="0 0 36 36" fill="none" stroke="#4ecb8d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="52" height="52" style="animation:wt-pulse 2s ease-in-out infinite;filter:drop-shadow(0 0 8px #4ecb8d55);">
    <path d="M18 4l3.1 6.3 7 1.1-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-4.9 7-1.1z"/>
    <line x1="12" y1="28" x2="24" y2="28" stroke-width="1.5"/>
    <line x1="15" y1="32" x2="21" y2="32" stroke-width="1.5"/>
  </svg>
  <span style="color:#4ecb8d;font-size:.85rem;font-weight:700;letter-spacing:.06em;animation:wt-count 2.4s ease-in-out infinite;">Budget DAWGs</span>
</div>`,
  },
  // ── 2. Dashboard ──────────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Dashboard',
    body: 'Your home screen shows your balance and a sparkline of recent spending. Tap the ‹ › arrows to browse past months. Scroll down to see all your tiles.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="12" height="13" rx="2"/><rect x="20" y="4" width="12" height="7" rx="2"/><rect x="20" y="15" width="12" height="13" rx="2"/><rect x="4" y="21" width="12" height="11" rx="2"/></svg>`,
    anim: `<div style="padding:12px 16px;width:100%;box-sizing:border-box;">
  <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:10px 14px;">
    <div style="font-size:.68rem;color:rgba(255,255,255,.42);margin-bottom:2px;">BALANCE</div>
    <div style="font-size:1.35rem;font-weight:700;color:rgba(255,255,255,.88);animation:wt-count 2.8s ease-in-out infinite;">$2,418.50</div>
    <div style="display:flex;gap:16px;margin-top:6px;">
      <div><span style="font-size:.65rem;color:#32d74b;">▲ Income</span><br><span style="font-size:.8rem;color:rgba(255,255,255,.88);">$3,200</span></div>
      <div><span style="font-size:.65rem;color:#ff453a;">▼ Expenses</span><br><span style="font-size:.8rem;color:rgba(255,255,255,.88);">$781</span></div>
    </div>
    <div style="margin-top:8px;height:30px;width:100%;">
      <svg viewBox="0 0 120 28" width="100%" height="28" fill="none" style="overflow:visible">
        <defs>
          <linearGradient id="wt-spark-grad" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#4ecb8d" stop-opacity=".35"/>
            <stop offset="100%" stop-color="#4ecb8d"/>
          </linearGradient>
        </defs>
        <path d="M0 22 L15 20 L30 24 L45 17 L60 21 L75 13 L90 15 L105 9 L120 7 L120 28 L0 28 Z" fill="rgba(78,203,141,.08)"/>
        <polyline points="0,22 15,20 30,24 45,17 60,21 75,13 90,15 105,9 120,7"
          stroke="url(#wt-spark-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          fill="none" stroke-dasharray="210" stroke-dashoffset="210"
          style="animation:wt-spark-draw 2.8s ease-in-out infinite;"/>
      </svg>
    </div>
  </div>
</div>`,
  },
  // ── 3. Budget Tiles ───────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Budget Tiles',
    body: 'Ring tiles show your weekly and daily spend vs budget at a glance. Scroll the dashboard to see all your tiles — each section of the app has one.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="12"/><circle cx="18" cy="18" r="6"/><line x1="18" y1="6" x2="18" y2="10"/><line x1="18" y1="26" x2="18" y2="30"/><line x1="6" y1="18" x2="10" y2="18"/><line x1="26" y1="18" x2="30" y2="18"/></svg>`,
    anim: `<div style="display:flex;justify-content:center;gap:24px;padding:10px 0;">
  <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
    <svg viewBox="0 0 64 64" width="60" height="60">
      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="5"/>
      <circle cx="32" cy="32" r="28" fill="none" stroke="#4ecb8d" stroke-width="5" stroke-linecap="round" stroke-dasharray="176" stroke-dashoffset="176" transform="rotate(-90 32 32)" style="animation:wt-ring-75 2.8s ease-in-out infinite;"/>
      <text x="32" y="37" text-anchor="middle" fill="rgba(255,255,255,.88)" font-size="13" font-weight="700">75%</text>
    </svg>
    <span style="font-size:.65rem;color:rgba(255,255,255,.42);">Per Week</span>
  </div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
    <svg viewBox="0 0 64 64" width="60" height="60">
      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="5"/>
      <circle cx="32" cy="32" r="28" fill="none" stroke="#ffa040" stroke-width="5" stroke-linecap="round" stroke-dasharray="176" stroke-dashoffset="176" transform="rotate(-90 32 32)" style="animation:wt-ring-83 2.8s ease-in-out infinite;"/>
      <text x="32" y="37" text-anchor="middle" fill="rgba(255,255,255,.88)" font-size="13" font-weight="700">83%</text>
    </svg>
    <span style="font-size:.65rem;color:rgba(255,255,255,.42);">Per Day</span>
  </div>
</div>`,
  },
  // ── 4. Customize Layout ───────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Customize Your Layout',
    body: 'Tap "Customize Layout" on the dashboard to enter edit mode. Tiles wiggle — drag them to reorder, tap to resize, or hide tiles you don\'t need.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="12" height="12" rx="2"/><rect x="20" y="4" width="12" height="12" rx="2"/><rect x="4" y="20" width="12" height="12" rx="2"/><rect x="20" y="20" width="12" height="12" rx="2"/><line x1="18" y1="2" x2="18" y2="34"/><line x1="2" y1="18" x2="34" y2="18"/></svg>`,
    anim: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:12px 16px;width:100%;box-sizing:border-box;">
  ${['Balance','Budgets','Bills','Goals'].map((label,i)=>`
  <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:8px;text-align:center;font-size:.7rem;color:rgba(255,255,255,.88);animation:wt-wiggle 1.2s ${i*.18}s ease-in-out infinite;">${label}</div>`).join('')}
</div>
<div style="position:absolute;bottom:14px;right:22px;width:18px;height:18px;border-radius:50%;background:#4ecb8d;opacity:.7;animation:wt-tap 1.8s .4s ease-in-out infinite;pointer-events:none;"></div>`,
  },
  // ── 5. Add Transaction ────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Adding a Transaction',
    body: 'Tap the + tab, enter an amount, pick Expense / Income, add a description and category. Tap the ✓ checkmark to save. The category field auto-suggests from your history.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="13"/><line x1="18" y1="11" x2="18" y2="25"/><line x1="11" y1="18" x2="25" y2="18"/></svg>`,
    anim: `<div style="padding:10px 16px;width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:7px;">
  <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:7px 10px;display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:.68rem;color:rgba(255,255,255,.42);">Amount</span>
    <span style="font-size:1rem;font-weight:700;color:rgba(255,255,255,.88);animation:wt-count 2.4s ease-in-out infinite;">$42.50</span>
  </div>
  <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:7px 10px;">
    <span style="font-size:.68rem;color:rgba(255,255,255,.42);">Description</span>
    <div style="font-size:.78rem;color:rgba(255,255,255,.88);margin-top:1px;animation:wt-count 2.4s .3s ease-in-out infinite;">Grocery run</div>
  </div>
  <button style="background:#4ecb8d;color:#000;border:none;border-radius:8px;padding:8px;font-size:.78rem;font-weight:700;width:100%;animation:wt-tap 2s 1s ease-in-out infinite;">Save ✓</button>
</div>`,
  },
  // ── 6. Ledger ─────────────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Ledger',
    body: 'Every transaction with a running balance. Search and filter by date or category. Tap any row to expand and edit it inline — change amount, date, or category, then tap Save.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h18a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><line x1="13" y1="12" x2="23" y2="12"/><line x1="13" y1="18" x2="23" y2="18"/><line x1="13" y1="24" x2="19" y2="24"/></svg>`,
    anim: `<div style="padding:8px 14px;width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:5px;">
  ${[['Coffee','Food','-$4.20','#ff453a'],['Paycheck','Income','+$1,600','#32d74b'],['Gas','Gas','-$52.00','#ff453a']].map(([desc,cat,amt,color],i)=>`
  <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:7px 10px;display:flex;align-items:center;justify-content:space-between;animation:wt-row-in .5s ${i*.35}s both;">
    <div>
      <div style="font-size:.78rem;color:rgba(255,255,255,.88);">${desc}</div>
      <div style="font-size:.65rem;color:rgba(255,255,255,.42);">${cat}</div>
    </div>
    <span style="font-size:.82rem;font-weight:700;color:${color};">${amt}</span>
  </div>`).join('')}
</div>`,
  },
  // ── 7. Weekly Planner ─────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Weekly Planner',
    body: 'Set your fixed bills and a minimum balance to keep. The planner spreads what\'s left across the weeks and days remaining in the current month, and feeds the Per Week / Per Day tiles on your dashboard.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="26" height="24" rx="2"/><line x1="5" y1="14" x2="31" y2="14"/><line x1="12" y1="4" x2="12" y2="10"/><line x1="24" y1="4" x2="24" y2="10"/><rect x="10" y="19" width="4" height="4" rx=".5"/><rect x="22" y="19" width="4" height="4" rx=".5"/></svg>`,
    anim: `<div style="padding:10px 16px;width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:6px;">
  <div style="display:flex;gap:6px;">
    <div style="flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:6px 8px;font-size:.68rem;color:rgba(255,255,255,.42);">Balance<br><span style="color:rgba(255,255,255,.88);font-size:.8rem;">$1,240</span></div>
    <div style="flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:6px 8px;font-size:.68rem;color:rgba(255,255,255,.42);">Bills<br><span style="color:rgba(255,255,255,.88);font-size:.8rem;">$340</span></div>
  </div>
  <button style="background:rgba(78,203,141,.18);color:#4ecb8d;border:1px solid #4ecb8d55;border-radius:8px;padding:7px;font-size:.78rem;font-weight:700;animation:wt-tap 2.2s .6s ease-in-out infinite;">Calculate →</button>
  <div style="background:rgba(78,203,141,.08);border:1px solid #4ecb8d33;border-radius:8px;padding:7px 10px;display:flex;align-items:center;justify-content:space-between;animation:wt-appear .5s .9s both;">
    <span style="font-size:.68rem;color:rgba(255,255,255,.42);">Daily Limit</span>
    <span style="font-size:1rem;font-weight:700;color:#4ecb8d;">$64 / day</span>
  </div>
</div>`,
  },
  // ── 8. Bills ──────────────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Bills',
    body: 'Add recurring bills with a name, amount, due date, and repeat schedule. Tap "Mark Paid" on a bill card to log it as an expense automatically. Bills due soon show a red badge on the nav icon.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h20a1 1 0 0 1 1 1v26l-4.5-3-3 3-3-3-3 3-3-3-4.5 3V5a1 1 0 0 1 1-1z"/><circle cx="18" cy="16" r="1.5" fill="currentColor" stroke="none"/><line x1="18" y1="10" x2="18" y2="14"/><line x1="13" y1="23" x2="23" y2="23"/></svg>`,
    anim: `<div style="padding:10px 16px;width:100%;box-sizing:border-box;">
  <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:10px 12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <div>
        <div style="font-size:.82rem;font-weight:700;color:rgba(255,255,255,.88);">Netflix</div>
        <div style="font-size:.68rem;color:rgba(255,255,255,.42);">Monthly · $17.99</div>
      </div>
      <span style="background:#ff453a22;color:#ff453a;font-size:.62rem;font-weight:700;padding:2px 7px;border-radius:20px;border:1px solid #ff453a44;">Due in 2d</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
      <button style="flex:1;background:rgba(50,215,75,.15);color:#32d74b;border:1px solid #32d74b44;border-radius:7px;padding:6px;font-size:.72rem;font-weight:700;animation:wt-tap 2s .5s ease-in-out infinite;">Mark Paid</button>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#4ecb8d" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation:wt-pulse 2s ease-in-out infinite;opacity:.7;"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
  </div>
</div>`,
  },
  // ── 9. Debt Tracker ───────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Debt Tracker',
    body: 'Add debt accounts in Settings → Accounts, then track them here. Tap a card to expand it, enter a monthly payment, and see your payoff date plus Snowball vs Avalanche comparison.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="28" height="19" rx="3"/><line x1="4" y1="16" x2="32" y2="16"/><rect x="8" y="21" width="7" height="3.5" rx="1.5"/><circle cx="28" cy="22.8" r="2" stroke-width="1.5"/></svg>`,
    anim: `<div style="padding:10px 16px;width:100%;box-sizing:border-box;">
  <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:10px;padding:10px 12px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <svg viewBox="0 0 36 36" width="28" height="28" fill="none" stroke="#ffa040" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="28" height="19" rx="3"/><line x1="4" y1="16" x2="32" y2="16"/><rect x="8" y="21" width="7" height="3.5" rx="1.5"/></svg>
      <div>
        <div style="font-size:.8rem;font-weight:700;color:rgba(255,255,255,.88);">Visa Card</div>
        <div style="font-size:.65rem;color:rgba(255,255,255,.42);">$2,400 of $8,000</div>
      </div>
    </div>
    <div style="background:rgba(255,255,255,.10);border-radius:4px;height:7px;overflow:hidden;">
      <div style="height:100%;background:#4ecb8d;border-radius:4px;width:30%;transform-origin:left;animation:wt-bar-fill 2.8s ease-in-out infinite;"></div>
    </div>
    <div style="font-size:.65rem;color:rgba(255,255,255,.42);margin-top:4px;">Paid off 30% · Payoff: Mar 2027</div>
  </div>
</div>`,
  },
  // ── 10. Savings Goals ─────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Savings Goals',
    body: 'Tap "Add Goal" and enter a name, target amount, and optional deadline. Tap the "Add" button on any goal card to contribute. Contributions appear in your ledger as transfers.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="19" r="12"/><circle cx="18" cy="19" r="7"/><circle cx="18" cy="19" r="2.5" fill="currentColor" stroke="none"/><line x1="28" y1="6" x2="21.5" y2="13.5"/><polyline points="30.5 4.5 28 4.5 28 7.5"/></svg>`,
    anim: `<div style="display:flex;flex-direction:column;align-items:center;padding:10px 0;">
  <svg viewBox="0 0 64 64" width="68" height="68">
    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="5"/>
    <circle cx="32" cy="32" r="28" fill="none" stroke="#4ecb8d" stroke-width="5" stroke-linecap="round" stroke-dasharray="176" stroke-dashoffset="176" transform="rotate(-90 32 32)" style="animation:wt-ring-60 2.8s ease-in-out infinite;"/>
    <text x="32" y="30" text-anchor="middle" fill="rgba(255,255,255,.88)" font-size="11" font-weight="700">60%</text>
    <text x="32" y="43" text-anchor="middle" fill="rgba(255,255,255,.42)" font-size="8">$1,200/$2,000</text>
  </svg>
  <div style="font-size:.78rem;font-weight:700;color:rgba(255,255,255,.88);margin-top:4px;animation:wt-count 2.8s ease-in-out infinite;">Emergency Fund</div>
</div>`,
  },
  // ── 11. Category Budgets ──────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Category Budgets',
    body: 'Go to Budgets, pick a category, and enter a monthly cap. The dashboard tile turns amber when you\'re near the limit and red when you\'re over. Set budgets for every category you track.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="13"/><line x1="18" y1="9" x2="18" y2="27"/><path d="M22.5 13.5a4 4 0 0 0-8 0c0 2.2 1.8 3.3 4 4.2 2.2.9 4 2 4 4.3a4 4 0 0 1-8 0"/></svg>`,
    anim: `<div style="padding:8px 16px;width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:6px;">
  ${[['Food','62%','#4ecb8d',.62],['Gas','89%','#ffa040',.89],['Entertainment','34%','#4ecb8d',.34]].map(([cat,pct,color,w],i)=>`
  <div style="animation:wt-row-in .5s ${i*.28}s both;">
    <div style="display:flex;justify-content:space-between;font-size:.68rem;margin-bottom:3px;">
      <span style="color:rgba(255,255,255,.88);">${cat}</span>
      <span style="color:${color};font-weight:700;">${pct}</span>
    </div>
    <div style="background:rgba(255,255,255,.10);border-radius:4px;height:6px;overflow:hidden;">
      <div style="height:100%;background:${color};border-radius:4px;width:${pct};transform-origin:left;animation:wt-bar-fill 2.8s ${i*.22}s ease-in-out infinite;"></div>
    </div>
  </div>`).join('')}
</div>`,
  },
  // ── 12. Settings ──────────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Settings',
    body: 'Choose Dark / Light / Terminal theme and pick an accent color — changes apply instantly. Scroll down to set a PIN or enable Face ID / fingerprint to keep your finances private.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="7"/><circle cx="18" cy="18" r="13" stroke-dasharray="3 3"/><line x1="18" y1="5" x2="18" y2="2"/><line x1="18" y1="31" x2="18" y2="34"/><line x1="5" y1="18" x2="2" y2="18"/><line x1="31" y1="18" x2="34" y2="18"/></svg>`,
    anim: `<div style="padding:10px 16px;width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;">
  <div style="display:flex;gap:7px;justify-content:center;">
    ${[['#4ecb8d',true],['#ffa040',false],['#0a84ff',false],['#bf5af2',false]].map(([color,active])=>`
    <div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid ${active?'#fff':'transparent'};box-shadow:${active?`0 0 0 1px ${color}`:'none'};animation:${active?'wt-pulse 2s ease-in-out infinite':'none'};"></div>`).join('')}
  </div>
  <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:8px;padding:7px 12px;">
    <span style="font-size:.75rem;color:rgba(255,255,255,.88);">PIN Lock</span>
    <svg viewBox="0 0 36 36" width="20" height="20" fill="none" stroke="#4ecb8d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="animation:wt-pulse 2.5s 1s ease-in-out infinite;"><rect x="8" y="16" width="20" height="16" rx="3"/><path d="M12 16v-4a6 6 0 0 1 12 0v4"/><circle cx="18" cy="24" r="2" fill="#4ecb8d" stroke="none"/></svg>
  </div>
</div>`,
  },
  // ── 13. Nav Bar ───────────────────────────────────────────────────────────
  { tab: null, target: null,
    title: 'Customize Your Nav Bar',
    body: 'Hold the bottom nav bar for 1 second to open the editor. Tap any slot to select it, then pick a different page for that spot. Put the sections you use most one tap away.',
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="26" width="28" height="6" rx="2"/><line x1="10" y1="29" x2="26" y2="29"/><circle cx="14" cy="29" r="2" fill="currentColor" stroke="none"/><circle cx="22" cy="29" r="2" fill="currentColor" stroke="none"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="24" y1="4" x2="24" y2="20"/><polyline points="8 8 12 4 16 8"/><polyline points="20 16 24 20 28 16"/></svg>`,
    anim: `<div style="padding:8px 12px;width:100%;box-sizing:border-box;">
  <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:10px;display:flex;justify-content:space-around;padding:8px 4px;">
    ${[['🏠','Home',false],['➕','Add',false],['📒','Ledger',true],['📅','Weekly',false]].map(([icon,label,active])=>`
    <div style="display:flex;flex-direction:column;align-items:center;gap:3px;opacity:${active?'1':'.5'};">
      <span style="font-size:1.1rem;">${icon}</span>
      <span style="font-size:.6rem;color:${active?'#4ecb8d':'rgba(255,255,255,.42)'};font-weight:${active?'700':'400'};animation:${active?'wt-nav-swap 3s ease-in-out infinite':'none'};display:block;">${label}</span>
    </div>`).join('')}
  </div>
</div>`,
  },
  // ── 14. All Set ───────────────────────────────────────────────────────────
  { tab: null, target: null,
    title: "You're All Set!",
    body: "That's the full tour. Log transactions, plan your week, track bills and debt, set goals, and customize the app to fit your life. Find this tour again anytime on the About page.",
    icon: `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="13"/><polyline points="12 18 16.5 23 24 13"/></svg>`,
    anim: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px 0;">
  <svg viewBox="0 0 56 56" width="70" height="70" fill="none">
    <circle cx="28" cy="28" r="24" stroke="#4ecb8d" stroke-width="2.5" opacity=".25"/>
    <circle cx="28" cy="28" r="24" stroke="#4ecb8d" stroke-width="2.5" stroke-dasharray="150" stroke-dashoffset="150" style="animation:wt-ring-60 2.8s ease-in-out infinite;opacity:.6;" transform="rotate(-90 28 28)"/>
    <polyline points="16,29 23,37 40,19" fill="none" stroke="#4ecb8d" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="60" stroke-dashoffset="60" style="animation:wt-check-draw 1.6s .4s ease-out infinite;"/>
  </svg>
  <span style="font-size:.88rem;font-weight:700;color:#4ecb8d;animation:wt-count 2.8s ease-in-out infinite;">Ready to budget!</span>
</div>`,
  },
];

let _wtStep = 0;
let _wtOpen = false;

function openTutorial() {
  if (_wtOpen) return;

  // Close the account picker overlay if it's open — the tour navigates tabs,
  // and showingAccountPicker overrides render() to always show the picker.
  if (showingAccountPicker) {
    showingAccountPicker = false;
    currentTab = 'dashboard';
    render();
  }

  _wtOpen = true;
  _wtStep = 0;

  // Backdrop — transparent click-capture layer; background toggled per step
  const bd = document.createElement('div');
  bd.id = 'wt-bd';
  bd.addEventListener('click', _advanceWalkthrough);

  // Spotlight ring (box-shadow provides the dark overlay)
  const hl = document.createElement('div');
  hl.id = 'wt-hl';
  hl.style.display = 'none';

  // Compact card — skip × is now inside the card header
  const card = document.createElement('div');
  card.id = 'wt-card';

  document.body.append(bd, hl, card);
  _renderWalkthroughStep(0);
}

function _closeWalkthrough() {
  _wtOpen = false;
  ['wt-bd','wt-hl','wt-card','wt-skip'].forEach(id => document.getElementById(id)?.remove());
  // Always land back on the dashboard after the tour
  showTab('dashboard');
}

function _advanceWalkthrough() {
  if (!_wtOpen) return;
  if (_wtStep < WALKTHROUGH_STEPS.length - 1) { _wtStep++; _renderWalkthroughStep(_wtStep); }
  else _closeWalkthrough();
}

function _renderWalkthroughStep(i) {
  const step = WALKTHROUGH_STEPS[i];
  const card = document.getElementById('wt-card');
  const hl   = document.getElementById('wt-hl');
  const bd   = document.getElementById('wt-bd');
  if (!card) return;

  const isLast = i === WALKTHROUGH_STEPS.length - 1;
  const total  = WALKTHROUGH_STEPS.length;

  card.innerHTML = `
    <div class="wt-hdr">
      <span class="wt-title">${step.title}</span>
      <button class="wt-skip-x" id="wt-skip-x" title="Skip tour">✕</button>
    </div>
    ${step.anim ? `<div class="wt-anim-box" style="position:relative;">${step.anim}</div>` : ''}
    <p class="wt-body">${step.body}</p>
    <div class="wt-footer">
      <div class="wt-dots">${Array.from({length:total},(_,j)=>`<span class="wt-dot${j===i?' wt-dot--on':''}"></span>`).join('')}</div>
      <div class="wt-btns">
        <button class="wt-back${i===0?' wt-back--hidden':''}" id="wt-back">← Back</button>
        <button class="wt-next" id="wt-next">${isLast ? 'Done ✓' : 'Next →'}</button>
      </div>
    </div>`;

  // Card clicks must not bubble to backdrop
  card.onclick = e => e.stopPropagation();

  document.getElementById('wt-skip-x')?.addEventListener('click', e => {
    e.stopPropagation(); _closeWalkthrough();
  });
  document.getElementById('wt-back')?.addEventListener('click', e => {
    e.stopPropagation();
    if (_wtStep > 0) { _wtStep--; _renderWalkthroughStep(_wtStep); }
  });
  document.getElementById('wt-next')?.addEventListener('click', e => {
    e.stopPropagation(); _advanceWalkthrough();
  });

  // All steps are self-contained — always use centered overlay, no spotlight needed
  hl.style.cssText = 'display:none';
  if (bd) bd.style.background = 'rgba(0,0,0,.80)';
  card.style.top = '';
  card.style.bottom = '';
  card.className = 'wt-card--center';
}

// Keep old name as alias for any external references

function attachAbout() {
  document.getElementById('force-update-btn')?.addEventListener('click', async () => {
    const btn    = document.getElementById('force-update-btn');
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
      // Clear seen-version so What's New popup fires after reload
      localStorage.removeItem('slawminyaw_seen_version');
      btn.textContent = 'Reloading…';
      window.location.href = window.location.pathname + '?v=' + Date.now();
    } catch(e) {
      status.textContent = 'Error: ' + e.message;
      btn.disabled = false;
      btn.innerHTML = `${ICONS.refresh} Force Update`;
    }
  });
}

// ── csv helper ─────────────────────────────────────────────────────────────
// Properly handles RFC-4180 quoted fields, escaped double-quotes (""), and
// the UTF-8 BOM Excel sometimes prepends.
function parseCSVLine(line) {
  const result = []; let cur = '', inQ = false, i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i+1] === '"') { cur += '"'; i += 2; continue; } // escaped ""
      if (ch === '"') { inQ = false; i++; continue; }
      cur += ch;
    } else {
      if (ch === '"') { inQ = true; i++; continue; }
      if (ch === ',') { result.push(cur.trim()); cur = ''; i++; continue; }
      cur += ch;
    }
    i++;
  }
  result.push(cur.trim());
  return result;
}

// Parse a date string from many formats Excel produces → YYYY-MM-DD
function parseExcelDate(raw) {
  const s = (raw || '').trim().replace(/"/g, '');
  if (!s) return null;
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // M/D/YYYY or MM/DD/YYYY or M/D/YY
  const mdyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (mdyMatch) {
    let [, m, d, y] = mdyMatch;
    if (y.length === 2) y = parseInt(y) < 50 ? '20' + y : '19' + y;
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  // Try native Date parse as a last resort
  const dt = new Date(s);
  if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
  return null;
}

// ── swipe to delete ────────────────────────────────────────────────────────
let _swipeDeleteDocListenerAdded = false;
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
  if (!_swipeDeleteDocListenerAdded) {
    _swipeDeleteDocListenerAdded = true;
    document.addEventListener('touchstart', e => {
      if (swipedRow && !swipedRow.contains(e.target)) { swipedRow.classList.remove('swiped'); swipedRow = null; }
    }, { passive: true });
  }
  document.querySelectorAll('.swipe-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      // Clear swiped state immediately — prevents the document touchstart handler
      // from firing a layout-shift animation while the modal confirm button is being tapped
      if (swipedRow) { swipedRow.classList.remove('swiped'); swipedRow = null; }
      showConfirmModal({
        title: 'Delete Transaction', danger: true,
        message: 'Delete this transaction? This cannot be undone.',
        confirmText: 'Delete',
        onConfirm: async () => { await api.deleteTransaction(idx); rerenderKeepScroll(); },
      });
    });
  });
}

// ── event handlers ─────────────────────────────────────────────────────────
// ── focus trap (accessible modal dialogs: drawer, bell panel) ───────────────
// Moves focus into the panel, keeps Tab/Shift-Tab cycling inside it, closes on
// Esc, and restores focus to the trigger on release. Returns a release fn.
const _FOCUSABLE_SEL = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function _trapFocus(container, onEscape) {
  if (!container) return () => {};
  const prevFocus = document.activeElement;
  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); onEscape && onEscape(); return; }
    if (e.key !== 'Tab') return;
    const items = [...container.querySelectorAll(_FOCUSABLE_SEL)].filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey, true);
  requestAnimationFrame(() => container.querySelector(_FOCUSABLE_SEL)?.focus());
  return () => {
    document.removeEventListener('keydown', onKey, true);
    if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
  };
}

// ── DAWG utility functions ─────────────────────────────────────────────────
function openDawgDrawer() {
  const overlay = document.getElementById('dawg-drawer-overlay');
  const drawer  = document.getElementById('dawg-drawer');
  if (!overlay || !drawer) return;
  // Hide budgeting entries in Simple (Tracker) mode
  const simple = isSimpleMode();
  drawer.querySelectorAll('.dawg-drawer-item[data-budgeting]').forEach(el => {
    el.style.display = simple ? 'none' : '';
  });
  overlay.classList.remove('hidden');
  drawer.classList.remove('hidden');
  requestAnimationFrame(() => drawer.classList.add('open'));
  drawer._releaseTrap = _trapFocus(drawer, closeDawgDrawer);
}
function closeDawgDrawer() {
  const drawer  = document.getElementById('dawg-drawer');
  const overlay = document.getElementById('dawg-drawer-overlay');
  if (!drawer) return;
  drawer._releaseTrap?.(); drawer._releaseTrap = null;
  drawer.classList.remove('open');
  setTimeout(() => {
    drawer.classList.add('hidden');
    overlay?.classList.add('hidden');
  }, 250);
}
function getDawgNotifications() {
  const notes = [];
  notes.push({ type:'update', icon:'🆕', title:`v${VERSION} installed`, body:'Budget DAWGs is up to date' });
  const now = new Date(); now.setHours(0,0,0,0);
  const curMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  (state.bills||[]).forEach(b => {
    if (isBillPaidFor(b, curMonth)) return; // already paid this month
    const d = getDaysUntilDue(b.dueDay);
    if (d >= 0 && d <= 3) {
      notes.push({ type:'bill', icon:'📄', title:`${b.name} due`, body: d===0 ? 'Due today!' : `Due in ${d} day${d===1?'':'s'}` });
    }
  });
  const { expense: _mExp } = monthTotals(curMonth);
  const _tBudget = Object.values(state.budgets||{}).reduce((s,v)=>s+(parseFloat(v)||0),0);
  if (_tBudget > 0 && _mExp > _tBudget) {
    notes.push({ type:'warn', icon:'⚠️', title:'Over budget', body:`${fmt(_mExp - _tBudget)} over monthly budget` });
  }
  return notes;
}
function updateDawgBellBadge() {
  const badge = document.getElementById('dawg-bell-badge');
  if (!badge) return;
  const hasAlerts = getDawgNotifications().some(n => n.type !== 'update');
  badge.classList.toggle('hidden', !hasAlerts);
}
function updateDawgTopbar() {
  const acct      = state.accounts.find(a => a.id === currentAccountId);
  const multiAcct = (state.accounts || []).length > 1;
  const name      = acct?.name || 'Account';
  const nameEl    = document.getElementById('dawg-topbar-acct-name');
  const iconEl    = document.getElementById('dawg-topbar-acct-icon');
  const pill      = document.getElementById('dawg-acct-switch');
  const acctsBtn  = document.getElementById('dawg-accts-btn');
  if (nameEl) nameEl.textContent = name;
  if (iconEl) iconEl.innerHTML = _ACCT_SVG[acct?.type] || _ACCT_SVG.checking;
  if (pill) {
    pill.title     = multiAcct ? 'Switch account' : name;
    pill.className = `dawg-acct-pill ${multiAcct ? 'dawg-acct-pill-multi' : 'dawg-acct-pill-solo'}`;
    let arrow = pill.querySelector('.dawg-acct-pill-arrow');
    if (multiAcct && !arrow) {
      pill.insertAdjacentHTML('beforeend', '<span class="dawg-acct-pill-arrow">▾</span>');
    } else if (!multiAcct && arrow) {
      arrow.remove();
    }
  }
  // Always show the accounts grid button — useful even with one account
  if (acctsBtn) acctsBtn.style.display = '';
  updateDawgBellBadge();
}
function toggleDawgAcctDropdown() {
  const panel = document.getElementById('dawg-acct-dropdown');
  if (!panel) return;
  if (!panel.classList.contains('hidden')) {
    panel.classList.add('hidden');
    return;
  }
  // Always position below the fixed topbar
  panel.style.top    = 'calc(var(--topbar-h) + var(--safe-top) + 8px)';
  panel.style.bottom = 'auto';
  const rows = (state.accounts || []).map(a => {
    const isActive = a.id === currentAccountId;
    return `<button class="dawg-acct-dd-row${isActive ? ' active' : ''}" data-id="${a.id}">
      <span class="dawg-acct-dd-icon">${_ACCT_SVG[a.type] || _ACCT_SVG.checking}</span>
      <span class="dawg-acct-dd-name">${_escHtml(a.name)}</span>
      ${isActive ? '<span class="dawg-acct-dd-check">✓</span>' : ''}
    </button>`;
  }).join('');
  panel.innerHTML = `<div class="dawg-acct-dd-header">ACCOUNTS</div>${rows}`;
  panel.classList.remove('hidden');
  panel.querySelectorAll('.dawg-acct-dd-row').forEach(btn => {
    btn.addEventListener('click', async () => {
      panel.classList.add('hidden');
      if (btn.dataset.id !== currentAccountId) {
        await api.switchAccount(btn.dataset.id, true);
      }
    });
  });
  if (!panel._closeListener) {
    panel._closeListener = e => {
      const navBtn  = document.getElementById('dawg-nav-accts');
      const pillBtn = document.getElementById('dawg-acct-switch');
      if (!panel.contains(e.target) &&
          e.target !== navBtn  && !navBtn?.contains(e.target) &&
          e.target !== pillBtn && !pillBtn?.contains(e.target)) {
        panel.classList.add('hidden');
        document.removeEventListener('click', panel._closeListener);
        panel._closeListener = null;
      }
    };
    setTimeout(() => document.addEventListener('click', panel._closeListener), 10);
  }
}

function toggleDawgBell() {
  const panel = document.getElementById('dawg-bell-panel');
  if (!panel) return;
  const closeBell = () => {
    panel.classList.add('hidden');
    if (panel._closeListener) { document.removeEventListener('click', panel._closeListener); panel._closeListener = null; }
    panel._releaseTrap?.(); panel._releaseTrap = null;
  };
  if (panel.classList.contains('hidden')) {
    const notes = getDawgNotifications();
    panel.innerHTML = `<div class="dawg-notif-header">NOTIFICATIONS</div>` +
      (notes.length
        ? notes.map(n => `<div class="dawg-notif-row"><span class="dawg-notif-icon">${n.icon}</span><div class="dawg-notif-body"><div class="dawg-notif-title">${_escHtml(n.title)}</div><div class="dawg-notif-sub">${_escHtml(n.body)}</div></div></div>`).join('')
        : `<div class="dawg-notif-empty">No new notifications</div>`);
    panel.classList.remove('hidden');
    panel._releaseTrap = _trapFocus(panel, closeBell);
    panel._closeListener = e => {
      if (!panel.contains(e.target) && e.target.id !== 'dawg-bell') closeBell();
    };
    setTimeout(() => document.addEventListener('click', panel._closeListener), 10);
  } else {
    closeBell();
  }
}

function attachDashboardDawg() {
  // Roll the balance hero (and any other [data-countup] stats) to their values
  _runCountUps(document.getElementById('main-content'));
  // Backup reminder banner
  document.getElementById('backup-banner-x')?.addEventListener('click', () => {
    _backupBannerDismissed = true;
    document.getElementById('backup-banner')?.remove();
  });
  document.getElementById('backup-banner-go')?.addEventListener('click', () => {
    showTab('import');
    setTimeout(() => document.getElementById('backup-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  });
  document.getElementById('dash-reconcile')?.addEventListener('click', showReconcileModal);
  document.getElementById('dash-privacy-btn')?.addEventListener('click', toggleAmountsHidden);

  // LOCK TF IN tap glitch
  const _lockinEl = document.querySelector('.dawg-lockin');
  if (_lockinEl) {
    _lockinEl.style.cursor = 'pointer';
    _lockinEl.addEventListener('click', () => {
      _lockinEl.classList.remove('lockin-glitch-tap');
      void _lockinEl.offsetWidth;
      _lockinEl.classList.add('lockin-glitch-tap');
      _lockinEl.addEventListener('animationend', () => _lockinEl.classList.remove('lockin-glitch-tap'), { once: true });
    });
  }

  // Dashboard edit account button (all account types)
  document.getElementById('dash-acct-edit')?.addEventListener('click', () => showAccountEdit(currentAccountId));
  // Retirement dashboard: Add Contribution button
  document.getElementById('ret-dash-add-contrib')?.addEventListener('click', () => showAddContribModal(currentAccountId));

  document.getElementById('dash-layout-btn')?.addEventListener('click', enterDashEditMode);
  document.getElementById('dawg-goto-budgets')?.addEventListener('click',      () => showTab('weekly'));
  document.getElementById('dawg-goto-ledger')?.addEventListener('click',       () => showTab('ledger'));
  document.getElementById('dawg-goto-breakdown')?.addEventListener('click',    () => showTab('breakdown'));
  document.getElementById('dawg-goto-goals')?.addEventListener('click',        () => showTab('goals'));
  document.getElementById('dawg-goto-txns')?.addEventListener('click',         () => showTab('ledger'));
  // New tile nav buttons
  document.getElementById('dawg-goto-bills')?.addEventListener('click',        () => showTab('bills'));
  document.getElementById('dawg-goto-debt')?.addEventListener('click',         () => showTab('debt'));
  document.getElementById('dawg-goto-weekly')?.addEventListener('click',       () => showTab('weekly'));
  document.getElementById('dawg-goto-budgets-page')?.addEventListener('click', () => showTab('budgets'));
  // Quick Add tile buttons — pre-select expense or income type
  document.getElementById('dawg-qa-expense')?.addEventListener('click', () => { _quickAddType = 'expense'; showTab('add'); });
  document.getElementById('dawg-qa-income')?.addEventListener('click',  () => { _quickAddType = 'income';  showTab('add'); });

  // Month navigator
  document.getElementById('dash-month-prev')?.addEventListener('click', () => {
    const yr = parseInt(dashMonth.slice(0,4)), mo = parseInt(dashMonth.slice(5,7));
    const d  = new Date(yr, mo - 2, 1); // mo-1 for 0-index, then -1 more for previous month
    dashMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0');
    render();
  });
  document.getElementById('dash-month-next')?.addEventListener('click', () => {
    const now = localMonthKey();
    if (dashMonth >= now) return;
    const yr = parseInt(dashMonth.slice(0,4)), mo = parseInt(dashMonth.slice(5,7));
    const d  = new Date(yr, mo, 1); // mo already 0-indexed offset by +1 = next month
    dashMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0');
    render();
  });

  // Sparkline — clip to end of browsed month when navigating past months
  const _isPastSpark = dashMonth < localMonthKey();
  const _sparkMaxDate = _isPastSpark ? (() => {
    const [sy, sm] = dashMonth.split('-').map(Number);
    return new Date(sy, sm, 0).toISOString().split('T')[0];
  })() : null;
  let _dawgSpark = null;
  function buildSparkline(range) {
    const canvas = document.getElementById('dawg-sparkline');
    if (!canvas) return;
    const _sparkWrap = canvas.closest('.dawg-sparkline-wrap');
    if (_dawgSpark) { _dawgSpark.destroy(); _dawgSpark = null; _dawgSparkGlobal = null; }
    const { labels, data } = getDawgSparklineData(range, _sparkMaxDate);
    if (!data.length) { _sparkWrap?.classList.add('chart-ready'); return; }
    const ctx  = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight||80);
    // Debt sparkline: red when high balance, yellow mid, green when low
    const _spAcct    = state.accounts.find(a => a.id === currentAccountId);
    const _spIsDebt  = _spAcct?.type === 'credit' || _spAcct?.type === 'loan';
    let _sparkClrRgb, _sparkClr;
    if (_spIsDebt) {
      let _spInc = 0, _spExp = 0;
      for (const t of state.transactions) { if (t.type==='income') _spInc+=t.amount; else _spExp+=t.amount; }
      const _spBal   = Math.max(0,(state.startingBalance||0)+_spExp-_spInc);
      const _spLimit = parseFloat(_spAcct?.credit_limit||0) || parseFloat(state.startingBalance||0) || 1;
      const _spRatio = Math.min(_spBal/_spLimit,1);
      if (_spRatio > 0.5) { _sparkClrRgb='220,50,50';  _sparkClr='#dc3232'; }
      else if (_spRatio > 0.25) { _sparkClrRgb='220,160,40'; _sparkClr='#dca028'; }
      else { _sparkClrRgb='50,200,80'; _sparkClr='#32c850'; }
    } else {
      const _spBalDate = _sparkMaxDate || today();
      const _spCurBal  = balanceAsOf(_spBalDate);
      if (_spCurBal < 0) {
        _sparkClrRgb = '220,50,50';
        _sparkClr    = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#dc3232';
      } else {
        _sparkClrRgb = document.body.classList.contains('light') ? '34,170,34' : '57,255,20';
        _sparkClr    = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      }
    }
    // VS Code theme: multi-color horizontal gradient line
    const _vsTheme = (loadSettings().theme) || 'dark';
    if (_vsTheme === 'vscode' && !_spIsDebt) {
      const _vsW = canvas.offsetWidth || 300;
      const _vsGrad = ctx.createLinearGradient(0, 0, _vsW, 0);
      _vsGrad.addColorStop(0,    '#569cd6');
      _vsGrad.addColorStop(0.35, '#4ec9b0');
      _vsGrad.addColorStop(0.7,  '#c586c0');
      _vsGrad.addColorStop(1,    '#9cdcfe');
      _sparkClr    = _vsGrad;
      _sparkClrRgb = '86,156,214';
    }
    grad.addColorStop(0, `rgba(${_sparkClrRgb},.28)`);
    grad.addColorStop(1, `rgba(${_sparkClrRgb},0)`);

    // Horizontal gradient for the line: fades from transparent on left → full color on right
    const _lineGrad = ctx.createLinearGradient(0, 0, canvas.offsetWidth || 300, 0);
    _lineGrad.addColorStop(0,   `rgba(${_sparkClrRgb}, 0.05)`);
    _lineGrad.addColorStop(0.3, `rgba(${_sparkClrRgb}, 0.25)`);
    _lineGrad.addColorStop(1,   `rgba(${_sparkClrRgb}, 1)`);
    // For VS Code theme the line uses a multi-color gradient; keep the string for the dot
    const _sparkClrStr = (typeof _sparkClr === 'string') ? _sparkClr : `rgb(${_sparkClrRgb})`;

    const _DRAW_MS = 2200;  // ms per left→right pass
    const _easeIO  = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t;

    const _MON_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const _pulsePlugin = {
      id: 'dawgPulse',
      afterInit(chart) {
        chart._drawPhase = 0;
        let _lastTs = null;
        const tick = ts => {
          if (!chart.canvas?.isConnected) return;
          const dt = _lastTs ? Math.min(ts - _lastTs, 60) : 0;
          _lastTs  = ts;
          // Continuous 0→1 cycle, wraps seamlessly
          chart._drawPhase = (chart._drawPhase + dt / _DRAW_MS) % 1;
          chart.draw();
          chart._pulseRaf = requestAnimationFrame(tick);
        };
        chart._pulseRaf = requestAnimationFrame(tick);
      },
      afterDraw(chart) {
        const meta = chart.getDatasetMeta(0);
        if (!meta?.data?.length) return;
        const { chartArea, ctx: c } = chart;
        const raw     = chart._drawPhase ?? 0;
        const phase   = _easeIO(raw);
        const revealX = chartArea.left + (chartArea.right - chartArea.left) * phase;
        const h       = (chartArea.bottom - chartArea.top) + 12;
        const y0      = chartArea.top - 6;

        // Month boundary markers — subtle vertical hairlines with month label
        // labels are "MM-DD" strings; draw a marker wherever the month number changes
        const pts = meta.data;
        if (labels.length > 1) {
          let prevMo = labels[0].slice(0, 2);
          for (let i = 1; i < labels.length; i++) {
            const mo = labels[i].slice(0, 2);
            if (mo !== prevMo && pts[i]) {
              const mx = pts[i].getProps(['x'], true).x;
              // Hairline
              c.save();
              c.strokeStyle = 'rgba(255,255,255,.09)';
              c.lineWidth = 1;
              c.setLineDash([3, 5]);
              c.beginPath();
              c.moveTo(mx, chartArea.top);
              c.lineTo(mx, chartArea.bottom);
              c.stroke();
              // Month label
              const moIdx = parseInt(mo, 10) - 1;
              c.font = '500 9px "Plus Jakarta Sans", sans-serif';
              c.fillStyle = 'rgba(110,110,115,.7)';
              c.textAlign = 'center';
              c.fillText(_MON_ABBR[moIdx] || mo, mx, chartArea.bottom + 10);
              c.restore();
            }
            prevMo = mo;
          }
        }

        // Overwrite effect: fade the undrawn right portion proportional to how far
        // through the pass we are — new line overwrites old, old slowly ghosts away
        c.save();
        c.globalCompositeOperation = 'destination-out';
        c.globalAlpha = raw;
        c.fillRect(revealX, y0, (chartArea.right - revealX) + 6, h);
        c.restore();

        // Dot at the current draw tip
        const total = pts.length - 1;
        const pos   = phase * total;
        const i0    = Math.min(Math.floor(pos), total - 1);
        const frac  = pos - i0;
        const p0    = pts[i0].getProps(['x','y'], true);
        const p1    = pts[Math.min(i0+1, total)].getProps(['x','y'], true);
        const dotX  = p0.x + frac*(p1.x - p0.x);
        const dotY  = p0.y + frac*(p1.y - p0.y);

        c.save();
        c.globalAlpha = 1;
        c.shadowColor = _sparkClrStr;
        c.shadowBlur  = 5;
        c.beginPath(); c.arc(dotX, dotY, 2.4, 0, Math.PI*2);
        c.fillStyle = _sparkClrStr; c.fill();
        c.restore();
      },
      beforeDestroy(chart) {
        if (chart._pulseRaf) { cancelAnimationFrame(chart._pulseRaf); chart._pulseRaf = null; }
      }
    };
    _withChart(() => {
    if (!document.body.contains(canvas)) return;
    if (!canvas.getContext || !canvas.getContext('2d')) return;  // canvas can't yield a 2D context yet
    Chart.getChart(canvas)?.destroy();   // clear any chart left on this canvas before reusing it
    _dawgSpark = _dawgSparkGlobal = new Chart(canvas, {
      type:'line',
      data:{ labels, datasets:[{ data, borderColor:_lineGrad, borderWidth:2, pointRadius:0, tension:0.4, fill:true, backgroundColor:grad }] },
      plugins:[_pulsePlugin],
      options:{
        responsive:true, maintainAspectRatio:false,
        layout:{ padding:{ bottom:14 } },
        plugins:{ legend:{display:false}, tooltip:{enabled:false} },
        scales:{ x:{display:false}, y:{display:false} },
        animation:{ duration:0 }   // plugin drives all animation
      }
    });
    _sparkWrap?.classList.add('chart-ready');
    });
  }
  document.querySelectorAll('.dawg-tbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dawg-tbtn').forEach(b => b.classList.remove('dawg-tbtn-active'));
      btn.classList.add('dawg-tbtn-active');
      _moveTbtnPill();
      buildSparkline(btn.dataset.range);
    });
  });
  // Default to ALL so the graph shows the full balance history as one continuous line
  document.querySelectorAll('.dawg-tbtn').forEach(b =>
    b.classList.toggle('dawg-tbtn-active', b.dataset.range === 'all'));
  requestAnimationFrame(_moveTbtnPill);
  buildSparkline('all');

}

// Slide the segmented-control pill under the active range button (per container)
function _moveTbtnPill() {
  document.querySelectorAll('.dawg-time-btns').forEach(c => {
    const pill = c.querySelector('.dawg-tbtn-pill');
    const act  = c.querySelector('.dawg-tbtn-active');
    if (pill && act) { pill.style.left = act.offsetLeft + 'px'; pill.style.width = act.offsetWidth + 'px'; }
  });
}

// ── Fast-add bottom sheet ──────────────────────────────────────────────────
function _showFastAdd() {
  if (document.getElementById('fast-add-sheet')) return;
  const cats     = getCategories();
  const todayStr = today();
  const accounts = state.accounts || [];
  const multiAcct = accounts.length > 1;
  const tmpls    = getCommonTemplates();

  // Account chips for a picker; `selId` is highlighted (null = none selected yet)
  const acctChips = (selId) => accounts.map(a =>
    `<button class="fas-acct-chip${a.id === selId ? ' fas-acct-active' : ''}" data-acct="${a.id}">${_escHtml(a.name)}</button>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.id        = 'fast-add-overlay';
  overlay.className = 'fast-add-overlay';

  overlay.innerHTML = `
    <div id="fast-add-sheet" class="fast-add-sheet">
      <div class="fas-grabber"></div>
      <div class="fas-type-row">
        <button class="fas-type-btn fas-expense-active" data-type="expense">Expense</button>
        <button class="fas-type-btn" data-type="income">Income</button>
        ${multiAcct ? `<button class="fas-type-btn" data-type="transfer">Transfer</button>` : ''}
      </div>
      ${tmpls.length ? `
      <div class="fas-field" id="fas-tmpl-field">
        <label class="fas-label">Frequent</label>
        <div class="fas-cats" id="fas-tmpls">
          ${tmpls.map((t, i) => `<button class="tmpl-chip" data-tmpl="${i}">
            <span class="cat-dot" style="background:${CAT_COLORS[t.category] || '#9896a4'}"></span>
            <span class="tmpl-chip-lbl">${_escHtml(t.description || t.category)}</span>
            <span class="tmpl-chip-amt">${fmt(t.amount)}</span>
          </button>`).join('')}
        </div>
      </div>` : ''}
      <div class="fas-amount-row">
        <span class="fas-currency">$</span>
        <input type="number" id="fas-amount" class="fas-amount-input" placeholder="0.00"
               inputmode="decimal" step="0.01" min="0" autocomplete="off">
      </div>
      ${multiAcct ? `
      <div class="fas-field">
        <label class="fas-label" id="fas-from-label">Account</label>
        <div class="fas-accts" id="fas-from-accts">${acctChips(currentAccountId)}</div>
      </div>
      <div class="fas-field" id="fas-to-field" style="display:none">
        <label class="fas-label">To account</label>
        <div class="fas-accts" id="fas-to-accts">${acctChips(null)}</div>
      </div>` : ''}
      <div class="fas-field" id="fas-cat-field">
        <label class="fas-label">Category</label>
        <div class="fas-cats" id="fas-cats">
          ${cats.map((c, i) => `<button class="fas-cat-chip${i === 0 ? ' fas-cat-active' : ''}" data-cat="${_escHtml(c)}">${_escHtml(c)}</button>`).join('')}
        </div>
      </div>
      <input type="text" id="fas-desc" class="fas-desc-input" placeholder="Description (optional)" autocomplete="off">
      <button id="fas-submit" class="fas-submit-btn btn-primary">Add</button>
    </div>`;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.querySelector('#fas-amount')?.focus(), 80);

  let selType  = 'expense';
  let selCat   = cats[0];
  let fromAcct = currentAccountId;
  let toAcct   = null;

  function applyType(type) {
    selType = type;
    overlay.querySelectorAll('.fas-type-btn').forEach(b =>
      b.classList.remove('fas-expense-active','fas-income-active','fas-transfer-active'));
    const cls = type === 'income' ? 'fas-income-active' : type === 'transfer' ? 'fas-transfer-active' : 'fas-expense-active';
    overlay.querySelector(`.fas-type-btn[data-type="${type}"]`)?.classList.add(cls);
    const isXfer = type === 'transfer';
    const toField  = overlay.querySelector('#fas-to-field');
    const catField = overlay.querySelector('#fas-cat-field');
    if (toField)  toField.style.display  = isXfer ? '' : 'none';
    if (catField) catField.style.display = isXfer ? 'none' : '';
    const fromLabel = overlay.querySelector('#fas-from-label');
    if (fromLabel) fromLabel.textContent = isXfer ? 'From account' : 'Account';
    overlay.querySelector('#fas-submit').textContent = isXfer ? 'Transfer' : 'Add';
  }

  overlay.querySelectorAll('.fas-type-btn').forEach(btn =>
    btn.addEventListener('click', () => applyType(btn.dataset.type)));

  overlay.querySelectorAll('.fas-cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      overlay.querySelectorAll('.fas-cat-chip').forEach(c => c.classList.remove('fas-cat-active'));
      chip.classList.add('fas-cat-active');
      selCat = chip.dataset.cat;
    });
  });

  // Account pickers (from / to)
  const wireAccts = (containerId, onPick) => {
    overlay.querySelectorAll(`#${containerId} .fas-acct-chip`).forEach(chip => {
      chip.addEventListener('click', () => {
        overlay.querySelectorAll(`#${containerId} .fas-acct-chip`).forEach(c => c.classList.remove('fas-acct-active'));
        chip.classList.add('fas-acct-active');
        onPick(chip.dataset.acct);
      });
    });
  };
  wireAccts('fas-from-accts', id => { fromAcct = id; });
  wireAccts('fas-to-accts',   id => { toAcct = id; });

  // "Frequent" template chips — tap to pre-fill amount / category / description
  overlay.querySelectorAll('#fas-tmpls .tmpl-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const t = tmpls[+chip.dataset.tmpl];
      if (!t) return;
      applyType('expense');
      const amtEl = overlay.querySelector('#fas-amount');
      if (amtEl) amtEl.value = t.amount;
      const descEl = overlay.querySelector('#fas-desc');
      if (descEl) descEl.value = t.description || '';
      selCat = t.category;
      overlay.querySelectorAll('.fas-cat-chip').forEach(c =>
        c.classList.toggle('fas-cat-active', c.dataset.cat === t.category));
      // If the habit's category isn't one of the rendered chips (e.g. a custom /
      // imported category), add it so the selection is actually visible.
      if (![...overlay.querySelectorAll('.fas-cat-chip')].some(c => c.dataset.cat === t.category)) {
        const catBox = overlay.querySelector('#fas-cats');
        if (catBox) {
          const nc = document.createElement('button');
          nc.className = 'fas-cat-chip fas-cat-active';
          nc.dataset.cat = t.category;
          nc.textContent = t.category;
          nc.addEventListener('click', () => {
            overlay.querySelectorAll('.fas-cat-chip').forEach(c => c.classList.remove('fas-cat-active'));
            nc.classList.add('fas-cat-active');
            selCat = nc.dataset.cat;
          });
          catBox.prepend(nc);
        }
      }
      overlay.querySelectorAll('#fas-tmpls .tmpl-chip').forEach(c => c.classList.remove('tmpl-chip-active'));
      chip.classList.add('tmpl-chip-active');
      if (amtEl) { amtEl.focus(); amtEl.select(); }
      haptic([8]);
    });
  });

  // Push a history entry so the phone/browser back button closes the sheet
  // instead of leaving the page. close(fromPop=true) is called by the popstate
  // handler (the entry is already consumed); otherwise we pop it ourselves.
  history.pushState({ dawgSheet: true }, '');
  let _closing = false;
  function close(fromPop) {
    if (_closing) return;
    _closing = true;
    overlay.classList.add('fast-add-out');
    setTimeout(() => overlay.remove(), 260);
    if (!fromPop) {
      try { if (history.state && history.state.dawgSheet) history.back(); } catch (e) {}
    }
  }
  overlay._closeFromPop = () => close(true);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay.querySelector('#fas-submit').addEventListener('click', async () => {
    const amount = parseFloat(overlay.querySelector('#fas-amount').value);
    if (!amount || amount <= 0) { overlay.querySelector('#fas-amount').focus(); return; }
    const desc = overlay.querySelector('#fas-desc').value.trim();

    if (selType === 'transfer') {
      if (!toAcct || toAcct === fromAcct) {
        const toField = overlay.querySelector('#fas-to-field');
        toField?.classList.add('fas-shake');
        setTimeout(() => toField?.classList.remove('fas-shake'), 450);
        return;
      }
      const toA = accounts.find(a => a.id === toAcct);
      const frA = accounts.find(a => a.id === fromAcct);
      const toIsDebt = toA && (toA.type === 'credit' || toA.type === 'loan');
      const stamp = Date.now();
      // Money leaves the source (excluded from weekly spend — it's a move, not spending)
      _postTxnToAccount(fromAcct, {
        type: 'expense', amount, date: todayStr, category: 'Transfer',
        description: (toIsDebt ? 'Payment → ' : 'Transfer → ') + (toA?.name || 'Other'),
        account: fromAcct, ts: stamp, excludeFromBudget: true, _xfer: 1,
      });
      // Money arrives at the destination — for a credit/loan this reduces what's owed
      _postTxnToAccount(toAcct, {
        type: 'income', amount, date: todayStr, category: toIsDebt ? 'Payment' : 'Transfer',
        description: (toIsDebt ? 'Payment ← ' : 'Transfer ← ') + (frA?.name || 'Other'),
        account: toAcct, ts: stamp + 1, _xfer: 1,
      });
      if (fromAcct === currentAccountId || toAcct === currentAccountId) await autoUpdateWeeklyPlan();
      haptic([10]);
      showTransfer(amount, desc || (toA?.name || ''));
      close(); render(); return;
    }

    const finalDesc = desc || (selType === 'income' ? 'Income' : selCat);
    const t = {
      type: selType, amount,
      description: finalDesc,
      category: selType === 'income' ? 'Income' : selCat,
      account: fromAcct,
      date: todayStr,
      ts: Date.now(),
    };
    _postTxnToAccount(fromAcct, t);
    if (fromAcct === currentAccountId) await autoUpdateWeeklyPlan();
    haptic([10]);
    if (selType === 'expense') { showRobbery(amount, finalDesc); checkRoast(selCat); checkSpendingAlert(selCat); }
    else showPayday(amount, finalDesc);
    close();
    render();
  });
}

function attachHandlers() {
  switch (currentTab) {
    case 'dashboard':
      attachDashboardDawg();
      break;
    case 'add':       attachAdd();       break;
    case 'ledger':    attachLedger();    break;
    case 'weekly':    attachWeekly(); calcWeekly(); break;
    case 'bills':     attachBills();     break;
    case 'insights':  attachInsights();  break;
    case 'breakdown': attachBreakdown(); break;
    case 'report':    attachReport();    break;
    case 'debt':      attachDebt();      break;
    case 'goals':     attachGoals();     break;
    case 'import':    attachImport();    break;
    case 'budgets':     attachBudgets();     break;
    case 'challenges':  attachChallenges();  break;
    case 'retirement':  attachRetirement();  break;
    case 'accounts':    attachAccounts();    break;
    case 'notes':     attachNotes();     break;
    case 'settings':  attachSettings();  break;
    case 'about':     attachAbout();     break;
  }
}

async function autoUpdateWeeklyPlan() {
  const wp = state.weekly_plan;
  if (!wp) return;
  const { income, expense } = totals();
  const liveBalance = (state.startingBalance || 0) + income - expense;
  const bills    = parseFloat(wp.bills   || 0) || 0;
  const stopAt   = parseFloat(wp.stop_at || 0) || 0;
  const now      = new Date(); now.setHours(0,0,0,0);
  const monday   = new Date(now); monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  const { daysLeft: days, weeksLeft: weeks } = monthWindow(now, monday);  // month-based, matches planner
  const available = Math.max(0, liveBalance - stopAt - bills);
  const perWeek  = available / weeks;
  const perDay   = available / days;
  // budget_per_week/day = the committed limit — only updated when budget is positive,
  // so it survives when the user dips into their buffer (available = 0).
  const budgetPerWeek = available > 0 ? perWeek : (parseFloat(wp.budget_per_week) || parseFloat(wp.per_week) || 0);
  const budgetPerDay  = available > 0 ? perDay  : (parseFloat(wp.budget_per_day)  || parseFloat(wp.per_day)  || 0);
  // per_week/per_day always store the last known positive limit — never 0 — so the
  // fallback chain in _getLimit and calcWeekly can always recover the committed budget.
  await api.saveWeeklyPlan({ ...wp, per_week: budgetPerWeek, per_day: budgetPerDay, budget_per_week: budgetPerWeek, budget_per_day: budgetPerDay });
}

function attachAdd() {
  // Pre-select type if arriving from Quick Add tile
  if (_quickAddType) {
    const radio = document.querySelector(`input[name="etype"][value="${_quickAddType}"]`);
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
    _quickAddType = null;
  }

  // ── "Frequent" template chips — tap to pre-fill (expenses only) ───────────
  document.querySelectorAll('#add-tmpl-chips .tmpl-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const t = getCommonTemplates()[+chip.dataset.tmpl];
      if (!t) return;
      const expRadio = document.querySelector('input[name="etype"][value="expense"]');
      if (expRadio && !expRadio.checked) { expRadio.checked = true; expRadio.dispatchEvent(new Event('change', { bubbles: true })); }
      const amtEl = document.getElementById('add-amount');
      if (amtEl) amtEl.value = t.amount;
      const descEl = document.getElementById('add-desc');
      if (descEl) descEl.value = t.description || '';
      const catEl = document.getElementById('add-cat');
      if (catEl) {
        catEl._userTouched = true;  // don't let auto-categorize override the chip
        if ([...catEl.options].some(o => o.value === t.category)) {
          catEl.value = t.category;
          const ci = document.getElementById('add-cat-custom');
          if (ci) ci.style.display = 'none';
        } else {
          catEl.value = '__custom__';
          const ci = document.getElementById('add-cat-custom');
          if (ci) { ci.style.display = ''; ci.value = t.category; }
        }
      }
      document.querySelectorAll('#add-tmpl-chips .tmpl-chip').forEach(c => c.classList.remove('tmpl-chip-active'));
      chip.classList.add('tmpl-chip-active');
      if (amtEl) { amtEl.focus(); amtEl.select(); }  // ready to tweak today's price
      haptic([8]);
    });
  });

  // ── split helpers ───────────────────────────────────────────────────────
  const cats = getCategories();
  if (!_splitRows.length) {
    _splitRows = [{ cat: cats[0], amount: '' }, { cat: cats[0], amount: '' }];
  }

  function updateSplitSummary() {
    const total     = parseFloat(document.getElementById('add-amount')?.value || 0);
    const allocated = _splitRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const rem       = +(total - allocated).toFixed(2);
    const el        = document.getElementById('split-summary');
    if (!el) return;
    if (total > 0) {
      const done = Math.abs(rem) < 0.005;
      el.textContent = done
        ? `✓ ${fmt(allocated)} of ${fmt(total)} — fully split`
        : rem > 0
          ? `${fmt(allocated)} split · ${fmt(rem)} remaining`
          : `Over-allocated by ${fmt(-rem)}`;
      el.style.color = done ? 'var(--success)' : 'var(--warn)';
    } else { el.textContent = ''; }
  }

  function renderSplitRows() {
    const container = document.getElementById('split-rows-container');
    if (!container) return;
    container.innerHTML = _splitRows.map((row, i) => `
      <div class="split-row" style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
        <select class="form-input split-cat" data-idx="${i}" style="flex:1;padding:6px 8px;font-size:13px">
          ${cats.map(c => `<option${c === row.cat ? ' selected' : ''}>${_escHtml(c)}</option>`).join('')}
        </select>
        <input type="number" class="form-input split-amount" data-idx="${i}"
          value="${row.amount}" placeholder="$0.00" step="0.01" min="0" inputmode="decimal"
          style="width:92px;padding:6px 8px;font-size:13px">
        ${_splitRows.length > 2 ? `<button class="btn-xs split-del-row" data-idx="${i}"
          style="background:var(--danger);color:#fff;border-color:var(--danger);flex-shrink:0">✕</button>` : ''}
      </div>`).join('');
    updateSplitSummary();
    container.querySelectorAll('.split-cat').forEach(sel => {
      sel.addEventListener('change', () => { _splitRows[+sel.dataset.idx].cat = sel.value; });
    });
    container.querySelectorAll('.split-amount').forEach(inp => {
      inp.addEventListener('input', () => {
        _splitRows[+inp.dataset.idx].amount = inp.value;
        updateSplitSummary();
      });
    });
    container.querySelectorAll('.split-del-row').forEach(btn => {
      btn.addEventListener('click', () => { _splitRows.splice(+btn.dataset.idx, 1); renderSplitRows(); });
    });
  }

  document.getElementById('split-toggle')?.addEventListener('change', e => {
    const on      = e.target.checked;
    const section = document.getElementById('split-section');
    const catRow  = document.getElementById('add-cat-row');
    if (section) section.style.display = on ? '' : 'none';
    if (catRow)  catRow.style.display  = on ? 'none' : '';
    if (on) renderSplitRows();
  });

  document.getElementById('split-add-row-btn')?.addEventListener('click', () => {
    _splitRows.push({ cat: cats[0], amount: '' });
    renderSplitRows();
  });

  document.getElementById('add-amount')?.addEventListener('input', () => {
    if (document.getElementById('split-toggle')?.checked) updateSplitSummary();
  });

  // Calculator keypad for the amount field
  document.getElementById('add-calc-btn')?.addEventListener('click', () => openCalcKeypad(document.getElementById('add-amount')));

  // Show/hide custom category text input when "Custom…" is selected
  document.getElementById('add-cat')?.addEventListener('change', e => {
    e.target._userTouched = true;  // stop auto-categorization from overriding a manual pick
    const customInp = document.getElementById('add-cat-custom');
    if (customInp) customInp.style.display = e.target.value === '__custom__' ? '' : 'none';
  });

  // Auto-suggest a category from the description as you type (expense only),
  // unless you've manually chosen one. Never overrides a manual pick.
  const _descEl = document.getElementById('add-desc');
  const _catEl  = document.getElementById('add-cat');
  if (_descEl && _catEl) {
    const _autoCat = () => {
      if (_catEl._userTouched) return;
      const etype = document.querySelector('input[name="etype"]:checked')?.value || 'expense';
      if (etype !== 'expense') return;
      const guess = _guessCategory(_descEl.value.trim(), 'expense');
      if (guess && guess !== 'Other' && [..._catEl.options].some(o => o.value === guess)) {
        _catEl.value = guess;
      }
    };
    _descEl.addEventListener('input', _debounce(_autoCat, 350));
    _descEl.addEventListener('blur', _autoCat);
  }

  // Show/hide transfer-specific fields
  document.querySelectorAll('input[name="etype"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isTransfer = radio.value === 'transfer';
      const toRow      = document.getElementById('add-to-acct-row');
      const catRow     = document.getElementById('add-cat-row');
      const recurRow   = document.getElementById('add-recurring-row');
      const excludeRow = document.getElementById('add-exclude-row');
      const descRow    = document.getElementById('add-desc-row');
      const splitRow   = document.getElementById('add-split-row');
      if (toRow)    toRow.style.display    = isTransfer ? '' : 'none';
      if (catRow)   catRow.style.display   = isTransfer ? 'none' : (document.getElementById('split-toggle')?.checked ? 'none' : '');
      const _hideAdv = isTransfer || isSimpleMode();   // advanced rows stay hidden in Simple mode
      if (recurRow) recurRow.style.display = _hideAdv ? 'none' : '';
      if (excludeRow) excludeRow.style.display = _hideAdv ? 'none' : '';
      if (descRow)  descRow.style.display  = isTransfer ? 'none' : '';
      if (splitRow) splitRow.style.display = _hideAdv ? 'none' : '';
    });
  });

  document.getElementById('add-btn')?.addEventListener('click', async () => {
    const amtVal = document.getElementById('add-amount').value;
    const amount = parseFloat(amtVal);
    if (!amtVal || isNaN(amount) || amount <= 0) { showStatus('add-status', 'Enter a valid amount.', 'error'); return; }
    const type = document.querySelector('input[name="etype"]:checked').value;
    const date = document.getElementById('add-date').value || today();

    // ── Split transaction mode ─────────────────────────────────────────────
    if (document.getElementById('split-toggle')?.checked && type !== 'transfer') {
      const allocated = _splitRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
      if (Math.abs(allocated - amount) > 0.005) {
        showStatus('add-status', `Split total ${fmt(allocated)} must equal ${fmt(amount)}. Adjust your splits.`, 'error');
        return;
      }
      const desc        = document.getElementById('add-desc').value.trim() || '—';
      const acct        = document.getElementById('add-acct').value;
      const isRecurring = document.getElementById('add-recurring').checked;
      const isExclude   = document.getElementById('add-exclude-budget')?.checked;
      let count = 0;
      const stamp = Date.now();
      for (const row of _splitRows) {
        const splitAmt = parseFloat(row.amount);
        if (!splitAmt || splitAmt <= 0) continue;
        const t = { type, amount: splitAmt, description: desc, category: row.cat,
                    account: acct, date, recurring: isRecurring, ts: stamp + count };
        if (isRecurring) t.recur_month = localMonthKey();
        if (isExclude)   t.excludeFromBudget = true;
        await api.addTransaction(t);
        count++;
      }
      showStatus('add-status', `✓ Split into ${count} entries (${fmt(amount)} total)`, 'success');
      document.getElementById('add-amount').value = '';
      document.getElementById('add-desc').value   = '';
      document.getElementById('add-recurring').checked = false;
    if (document.getElementById('add-exclude-budget')) document.getElementById('add-exclude-budget').checked = false;
      _splitRows = [{ cat: cats[0], amount: '' }, { cat: cats[0], amount: '' }];
      document.getElementById('split-toggle').checked = false;
      document.getElementById('split-section').style.display = 'none';
      document.getElementById('add-cat-row').style.display   = '';
      playSound(type);
      haptic([30]);
      return;
    }

    if (type === 'transfer') {
      const toAcctId   = document.getElementById('add-to-acct')?.value;
      const curAcctId  = document.getElementById('add-acct').value || currentAccountId;
      if (!toAcctId || toAcctId === curAcctId) {
        showStatus('add-status', 'Choose a different destination account.', 'error'); return;
      }
      const toAcct      = state.accounts.find(a => a.id === toAcctId);
      const toAcctName  = toAcct?.name || 'Other';
      const curAcctName = state.accounts.find(a => a.id === curAcctId)?.name || 'Other';
      const toIsDebt    = toAcct && (toAcct.type === 'credit' || toAcct.type === 'loan');
      const stamp = Date.now();
      // Money LEAVES the source account (excluded from weekly spend — it's a move, not spending)
      _postTxnToAccount(curAcctId, {
        type: 'expense', amount, date, category: 'Transfer',
        description: (toIsDebt ? 'Payment → ' : 'Transfer → ') + toAcctName,
        account: curAcctId, ts: stamp, excludeFromBudget: true, _xfer: 1,
      });
      // Money ARRIVES at the destination — for a credit/loan this income reduces what's owed
      _postTxnToAccount(toAcctId, {
        type: 'income', amount, date, category: toIsDebt ? 'Payment' : 'Transfer',
        description: (toIsDebt ? 'Payment ← ' : 'Transfer ← ') + curAcctName,
        account: toAcctId, ts: stamp + 1, _xfer: 1,
      });
      await autoUpdateWeeklyPlan();
      showStatus('add-status', `✓ ${toIsDebt ? 'Paid' : 'Moved'} ${fmt(amount)} to ${toAcctName}`, 'success');
      document.getElementById('add-amount').value = '';
      playSound('transfer');
      haptic([20, 40, 20]);
      showTransfer(amount, (toIsDebt ? 'Payment → ' : 'Transfer → ') + toAcctName);
      render(); return;
    }

    const isRecurring = document.getElementById('add-recurring').checked;
    // Category: dropdown with "Custom…" option reveals a free-text input.
    const _catSel = document.getElementById('add-cat');
    let chosenCat = _catSel?.value === '__custom__'
      ? (document.getElementById('add-cat-custom')?.value.trim() || 'Other')
      : ((_catSel?.value || '').trim() || 'Other');
    if (!getCategories().includes(chosenCat)) {
      const s = loadSettings();
      const custom = s.customCategories || [];
      if (!custom.includes(chosenCat)) { custom.push(chosenCat); s.customCategories = custom; saveSettings(s); }
    }
    const isExclude = document.getElementById('add-exclude-budget')?.checked;
    const t = {
      type,
      amount,
      description: document.getElementById('add-desc').value.trim() || '—',
      category:    chosenCat,
      account:     document.getElementById('add-acct').value,
      date,
      recurring:   isRecurring,
      ts:          Date.now()
    };
    if (isRecurring) t.recur_month = localMonthKey();
    if (isExclude)   t.excludeFromBudget = true;
    // Duplicate guard: warn if an identical entry was just added (same type/amount/desc/cat < 2 min ago)
    const _dup = state.transactions.find(x =>
      x.type === t.type && Math.abs((x.amount || 0) - t.amount) < 0.005 &&
      (x.description || '').trim().toLowerCase() === t.description.trim().toLowerCase() &&
      x.category === t.category && (Date.now() - (x.ts || 0)) < 120000);
    if (_dup) {
      const ok = await confirmAsync({
        title: 'Possible duplicate',
        message: `You just added "${_escHtml(t.description)}" for ${fmt(t.amount)} a moment ago. Add it again?`,
        confirmText: 'Add anyway', cancelText: 'Cancel',
      });
      if (!ok) { showStatus('add-status', 'Cancelled — duplicate not added.', 'error'); return; }
    }
    let prevBal = 0;
    for (const tx of state.transactions) prevBal += tx.type==='income' ? tx.amount : -tx.amount;
    await api.addTransaction(t);
    await autoUpdateWeeklyPlan(); // runs on every transaction so dashboard always matches planner
    const newBal = prevBal + (t.type==='income' ? t.amount : -t.amount);
    showStatus('add-status', `✓ Added ${t.type}: ${fmt(t.amount)} (${t.category})`, 'success');
    document.getElementById('add-amount').value = '';
    document.getElementById('add-desc').value   = '';
    document.getElementById('add-recurring').checked = false;
    if (document.getElementById('add-exclude-budget')) document.getElementById('add-exclude-budget').checked = false;
    playSound(t.type);
    haptic(t.type === 'income' ? [20, 50, 20] : [30]);
    if (t.type === 'expense') showRobbery(t.amount, t.description);
    else if (t.type === 'income') showPayday(t.amount, t.description);
    else if (t.type === 'transfer') showTransfer(t.amount, t.description);
    if (t.type === 'expense') { checkRoast(t.category); checkSpendingAlert(t.category); }
    checkMilestones(prevBal, newBal);
    checkWeekMilestone();
  });
}

function exportCSV(allAccounts = false) {
  // Collect transactions — either active account or every account
  let txns = [];
  if (allAccounts) {
    for (const acct of state.accounts) {
      const d = JSON.parse(localStorage.getItem(accountDataKey(acct.id)) || '{}');
      (d.transactions || []).forEach(t => txns.push({ ...t, _acctName: acct.name }));
    }
  } else {
    txns = state.transactions.map(t => ({
      ...t,
      _acctName: state.accounts.find(a => a.id === (t.account||'main'))?.name || 'Main',
    }));
  }

  // Sort oldest → newest so Excel running-balance formula works top-down
  txns.sort((a,b) => a.date.localeCompare(b.date) || (a.ts||0) - (b.ts||0));

  // Build running balance column
  let running = allAccounts ? 0 : (state.startingBalance || 0);
  const rows = [[
    'Date', 'Type', 'Category', 'Description', 'Amount',
    'Signed Amount', 'Running Balance', 'Account', 'Recurring',
  ]];
  for (const t of txns) {
    const signed = t.type === 'income' ? t.amount : -t.amount;
    running += signed;
    rows.push([
      t.date,
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.category || 'Other',
      t.description || '',
      t.amount.toFixed(2),       // always positive — use Type to know direction
      signed.toFixed(2),         // negative = expense, positive = income
      running.toFixed(2),
      t._acctName || 'Main',
      t.recurring ? 'Yes' : 'No',
    ]);
  }

  // RFC-4180 quoting + UTF-8 BOM so Excel opens it correctly without a wizard
  const q  = v => `"${String(v).replace(/"/g, '""')}"`;
  const csv = '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  const suffix = allAccounts ? 'all-accounts' : (state.accounts.find(x=>x.id===currentAccountId)?.name||'account').toLowerCase().replace(/\s+/g,'-');
  a.download = `budget-dawgs-${suffix}-${today()}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function exportCSVTemplate() {
  const header  = ['Date','Type','Category','Description','Amount','Account'];
  const example = ['2026-05-20','Expense','Food','Grocery run','87.50','Main'];
  const q   = v => `"${String(v).replace(/"/g,'""')}"`;
  const csv = '﻿' + [header, example].map(r => r.map(q).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'budget-dawgs-import-template.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function attachLedger() {
  document.getElementById('ledger-search')?.addEventListener('input', _debounce(e => {
    // Update ONLY the list — never re-render the whole page, or the search box would lose
    // focus and the mobile keyboard would close after each keystroke.
    ledgerFilter = e.target.value.toLowerCase();
    _ledgerShowAll = false;  // a new search starts capped again
    _refreshLedgerList();
  }, 200));
  document.getElementById('ledger-sort')?.addEventListener('change', e => {
    ledgerSort = e.target.value; render();
  });
  document.getElementById('ledger-cat-filter')?.addEventListener('change', e => {
    ledgerCatFilter = e.target.value; render();
  });
  document.getElementById('ledger-date-from')?.addEventListener('change', e => {
    ledgerDateFrom = e.target.value; render();
  });
  document.getElementById('ledger-date-to')?.addEventListener('change', e => {
    ledgerDateTo = e.target.value; render();
  });
  document.querySelectorAll('.type-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      ledgerTypeFilter = btn.dataset.type;
      render();
    });
  });
  document.querySelectorAll('.lv-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      if (ledgerView === btn.dataset.view) return;
      ledgerView = btn.dataset.view;
      render();
    });
  });
  document.getElementById('ledger-density')?.addEventListener('click', () => {
    const s = loadSettings();
    s.ledgerDensity = s.ledgerDensity === 'compact' ? 'comfortable' : 'compact';
    saveSettings(s);
    // Toggle in place — no full re-render, so scroll position and search focus are kept.
    const list = document.querySelector('.ledger-list');
    if (list) list.classList.toggle('compact', s.ledgerDensity === 'compact');
    const btn = document.getElementById('ledger-density');
    if (btn) { btn.textContent = s.ledgerDensity === 'compact' ? '≣' : '≡'; btn.setAttribute('aria-label', `Toggle row density (currently ${s.ledgerDensity})`); }
  });

  document.getElementById('ledger-all-accts')?.addEventListener('click', () => {
    ledgerAllAccounts = !ledgerAllAccounts;
    _ledgerShowAll = false;
    render();
  });

  document.getElementById('ledger-clear-filters')?.addEventListener('click', () => {
    ledgerFilter = ''; ledgerTypeFilter = 'all'; ledgerCatFilter = '';
    ledgerDateFrom = ''; ledgerDateTo = '';
    render();
  });

  _attachLedgerRows();

  document.getElementById('ledger-export-csv')?.addEventListener('click', () => exportCSV(false));
  document.getElementById('ledger-find-dupes')?.addEventListener('click', showDuplicatesModal);
  document.getElementById('ledger-find-amount')?.addEventListener('click', showAmountFinderModal);
}

// Re-render ONLY the ledger list + count, leaving the filter bar (and the focused search
// box) intact. Used while typing in search so the keyboard never closes.
function _refreshLedgerList() {
  const curList = document.querySelector('.ledger-list');
  if (!curList) { render(); return; }
  const tmp = document.createElement('div');
  tmp.innerHTML = renderLedger();
  const newList = tmp.querySelector('.ledger-list');
  if (newList) curList.innerHTML = newList.innerHTML;
  const newSub = tmp.querySelector('.page-sub');
  const curSub = document.querySelector('.page .page-sub');
  if (newSub && curSub) curSub.textContent = newSub.textContent;
  _attachLedgerRows();
}

// Attach a SINGLE delegated click handler to the ledger list (instead of one
// listener per row × four button types). The .ledger-list element persists
// across partial search refreshes, so a flag prevents double-binding; a full
// render() replaces the element, so the fresh one rebinds once.
function _attachLedgerRows() {
  const list = document.querySelector('.ledger-list');
  if (list && !list._delegated) {
    list._delegated = true;
    list.addEventListener('click', _onLedgerListClick);
  }
  attachSwipeDelete();
}

async function _onLedgerListClick(e) {
  const editBtn = e.target.closest('.ledger-edit-btn');
  if (editBtn) {
    e.stopPropagation();
    const row     = editBtn.closest('.ledger-row');
    const editDiv = row.querySelector('.ledger-inline-edit');
    const isOpen  = editDiv.style.display === 'block';
    document.querySelectorAll('.ledger-inline-edit').forEach(d => d.style.display = 'none');
    document.querySelectorAll('.ledger-row').forEach(r => r.classList.remove('selected'));
    if (!isOpen) { editDiv.style.display = 'block'; row.classList.add('selected'); }
    return;
  }

  const saveBtn = e.target.closest('.ie-save');
  if (saveBtn) {
    e.stopPropagation();
    const idx  = parseInt(saveBtn.dataset.idx);
    const edit = saveBtn.closest('.ledger-inline-edit');
    await api.patchTransaction(idx, {
      type:        edit.querySelector('.ie-type').value,
      date:        edit.querySelector('.ie-date').value,
      category:    edit.querySelector('.ie-cat').value,
      description: edit.querySelector('.ie-desc').value,
      amount:      parseFloat(edit.querySelector('.ie-amount').value) || 0,
      excludeFromBudget: !!edit.querySelector('.ie-exclude')?.checked,
    });
    await autoUpdateWeeklyPlan(); // keep dashboard per-week/day in sync after the edit
    rerenderKeepScroll();
    return;
  }

  const cancelBtn = e.target.closest('.ie-cancel');
  if (cancelBtn) {
    e.stopPropagation();
    cancelBtn.closest('.ledger-inline-edit').style.display = 'none';
    cancelBtn.closest('.ledger-row').classList.remove('selected');
    return;
  }

  const delBtn = e.target.closest('.ledger-delete');
  if (delBtn) {
    e.stopPropagation();
    const idx = parseInt(delBtn.dataset.idx);
    const t   = state.transactions[idx];
    showConfirmModal({
      title: 'Delete Transaction', danger: true,
      message: `Delete "${_escHtml(t.description)}" (${fmt(t.amount)})? This cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => { await api.deleteTransaction(idx); selectedLedgerIdx = null; rerenderKeepScroll(); },
    });
    return;
  }

  if (e.target.closest('#ledger-show-all')) {
    _ledgerShowAll = true;
    _refreshLedgerList();
  }
}

function attachWeekly() {
  const _debouncedCalc = () => { clearTimeout(_wkCalcTimer); _wkCalcTimer = setTimeout(calcWeekly, 300); };
  ['wk-bills','wk-stop-at'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', _debouncedCalc);
    document.getElementById(id)?.addEventListener('input',  _debouncedCalc);
  });
  document.getElementById('wk-save')?.addEventListener('click', async () => {
    const plan = {
      ...state.weekly_plan,
      bills:           document.getElementById('wk-bills').value,
      stop_at:         document.getElementById('wk-stop-at').value,
      per_week:        lastCalcPerWeek,
      per_day:         lastCalcPerDay,
      budget_per_week: lastCalcPerWeek > 0 ? lastCalcPerWeek : (parseFloat(state.weekly_plan?.budget_per_week) || 0),
      budget_per_day:  lastCalcPerDay  > 0 ? lastCalcPerDay  : (parseFloat(state.weekly_plan?.budget_per_day)  || 0),
      saved_date:      today(),
    };
    await api.saveWeeklyPlan(plan);
    const el = document.getElementById('wk-save-status');
    if (el) { el.textContent = '✓ Saved'; setTimeout(() => { el.textContent = ''; }, 3000); }
  });

  // ── Forfeit / undo forfeit past week ────────────────────────────────────
  document.getElementById('wk-dh-body')?.addEventListener('click', async e => {
    const btn = e.target.closest('.wkb-forfeit-btn');
    if (!btn) return;
    e.stopPropagation(); // don't trigger the row expand toggle
    const weekStart   = btn.dataset.week;
    const wp          = { ...state.weekly_plan };
    const forfeited   = [...(wp.forfeitedWeeks || [])];
    const idx         = forfeited.indexOf(weekStart);
    if (idx !== -1) { forfeited.splice(idx, 1); }
    else            { forfeited.push(weekStart); }
    wp.forfeitedWeeks = forfeited;
    await api.saveWeeklyPlan(wp);
    calcWeekly();
  });
}

function attachImport() {
  // ── import mode toggle (append / overwrite) ───────────────────────────────
  let importMode = 'append';
  const hintEl = document.getElementById('import-mode-hint');
  document.querySelectorAll('.import-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      importMode = btn.dataset.mode;
      document.querySelectorAll('.import-mode-btn').forEach(b => b.classList.remove('import-mode-active'));
      btn.classList.add('import-mode-active');
      if (hintEl) hintEl.textContent = importMode === 'overwrite'
        ? 'Replaces ALL existing transactions with the imported file. Cannot be undone.'
        : 'Adds new transactions on top of existing ones.';
      // Clear any pending preview when mode switches
      const prev = document.getElementById('import-preview');
      if (prev) { prev.style.display = 'none'; prev.innerHTML = ''; }
      const fileEl = document.getElementById('import-file');
      if (fileEl) fileEl.value = '';
    });
  });

  document.getElementById('import-json-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        const isMulti = data._multiAccount && data.accountData && typeof data.accountData === 'object';
        if (!isMulti && !data.transactions) throw new Error('Invalid backup file');
        const acctList  = data.accounts || defaultAccounts();
        const acctCount = acctList.length;
        const txnCount  = isMulti
          ? Object.values(data.accountData).reduce((s, d) => s + ((d.transactions || []).length), 0)
          : (data.transactions || []).length;
        showConfirmModal({
          title: 'Restore Backup?',
          message: `This will replace ALL current data with the backup (${txnCount} transaction${txnCount !== 1 ? 's' : ''} across ${acctCount} account${acctCount !== 1 ? 's' : ''}). This cannot be undone.`,
          confirmText: 'Restore', danger: true,
          onConfirm: () => {
            if (data.settings && typeof data.settings === 'object') saveSettings(data.settings);
            state.notes = data.notes || [];
            saveNotes(state.notes);
            if (isMulti) {
              // Write every account's data back to its own key, then load the chosen account.
              state.accounts = acctList.length ? acctList : defaultAccounts();
              _saveAccounts();
              Object.entries(data.accountData).forEach(([id, d]) => {
                localStorage.setItem(accountDataKey(id), JSON.stringify(d || {}));
              });
              const startId = state.accounts.find(a => a.id === data.currentAccountId) ? data.currentAccountId : state.accounts[0].id;
              currentAccountId = startId;
              _loadAccountData(startId);
            } else {
              // Legacy single-account backup → restore into the current account.
              state.transactions = data.transactions || [];
              state.weekly_plan  = data.weekly_plan  || {};
              state.budgets      = data.budgets      || {};
              state.bills        = data.bills        || [];
              state.goals        = data.goals        || [];
              state.challenges   = data.challenges   || [];
              if (typeof data.startingBalance === 'number') state.startingBalance = data.startingBalance;
              state.accounts     = acctList.length ? acctList : defaultAccounts();
              _save(); _saveAccounts();
            }
            updateAccountSwitcher();
            showStatus('json-import-status', `✓ Restored ${txnCount} transaction${txnCount !== 1 ? 's' : ''} from backup.`, 'success', 0);
            render();
          },
        });
      } catch(err) {
        showStatus('json-import-status', `Error: ${err.message}`, 'error', 0);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('export-csv-btn')?.addEventListener('click', () => exportCSV(false));
  document.getElementById('export-csv-all-btn')?.addEventListener('click', () => exportCSV(true));
  document.getElementById('export-template-btn')?.addEventListener('click', exportCSVTemplate);

  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    _save();   // flush the current account so its stored data is fresh
    // Collect EVERY account's data, not just the current one.
    const accountData = {};
    (state.accounts || []).forEach(a => {
      try { accountData[a.id] = JSON.parse(localStorage.getItem(accountDataKey(a.id)) || '{}'); }
      catch { accountData[a.id] = {}; }
    });
    const payload = JSON.stringify({
      _backupVersion: VERSION,
      _multiAccount:  true,
      accounts:       state.accounts,
      currentAccountId,
      accountData,                 // { accountId: {transactions, weekly_plan, budgets, bills, goals, challenges, startingBalance} }
      notes:          state.notes, // notes are global (not per-account)
      settings:       loadSettings(),
      // Legacy single-account fields (current account) so older app versions can still restore:
      transactions:   state.transactions,
      weekly_plan:    state.weekly_plan,
      budgets:        state.budgets,
      bills:          state.bills,
      goals:          state.goals,
      challenges:     state.challenges,
      startingBalance: state.startingBalance,
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `budget-dawgs-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    markBackupDone();
    const st = document.getElementById('backup-status');
    if (st) { st.textContent = '✓ Backed up today'; st.style.color = 'var(--success)'; }
    const banner = document.getElementById('backup-banner');
    if (banner) banner.remove();
  });

  document.getElementById('import-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        // Strip BOM if Excel added one
        const raw   = ev.target.result.replace(/^﻿/, '');
        // Split on \r\n or \n
        const lines = raw.split(/\r?\n/);
        if (lines.length < 2) { showStatus('import-status', 'File appears empty.', 'error', 0); return; }

        // Normalise header names — handle many bank/Excel column name variations
        const rawHeaders = parseCSVLine(lines[0]);
        const headers    = rawHeaders.map(h => h.replace(/"/g,'').trim().toLowerCase());

        // Map common column-name aliases to canonical names
        const alias = {
          date:        ['date','transaction date','trans date','posting date','posted date','value date'],
          type:        ['type','transaction type','trans type','debit/credit'],
          amount:      ['amount','transaction amount','trans amount','debit amount','credit amount','withdrawal','deposit','sum'],
          description: ['description','desc','memo','narrative','details','payee','merchant','name','note','notes'],
          category:    ['category','cat','label','tag'],
          account:     ['account','account name','acct','account number'],
        };

        const colIdx = {};
        for (const [canon, variants] of Object.entries(alias)) {
          const idx = headers.findIndex(h => variants.includes(h));
          if (idx !== -1) colIdx[canon] = idx;
        }

        if (colIdx.date === undefined && colIdx.amount === undefined) {
          showStatus('import-status', 'Could not detect Date or Amount columns. Check column headers match the expected format.', 'error', 0);
          return;
        }

        // Parse all rows first (preview + commit in one pass)
        const parsed = []; let errors = 0;
        const _learned = _learnedCategoryMap();  // build history index once for auto-categorization
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          try {
            const vals = parseCSVLine(line);
            const get  = key => colIdx[key] !== undefined ? (vals[colIdx[key]] || '').replace(/"/g,'').trim() : '';

            // Date — try multiple formats
            const dateRaw = get('date');
            const date    = parseExcelDate(dateRaw) || today();

            // Amount — strip $, commas, spaces; handle (123.45) = negative
            let amtStr = get('amount').replace(/[$,\s]/g, '');
            let amount = 0;
            if (/^\([\d.]+\)$/.test(amtStr)) {
              // Accounting negative format: (123.45)
              amount = parseFloat(amtStr.slice(1, -1));
            } else {
              amount = parseFloat(amtStr);
            }
            if (isNaN(amount) || amount === 0) { errors++; continue; }
            amount = Math.abs(amount);

            // Type — infer from column name or value
            let type = 'expense';
            const rawType = get('type').toLowerCase();
            if (rawType.includes('income') || rawType.includes('credit') || rawType.includes('deposit')) {
              type = 'income';
            } else if (rawType.includes('expense') || rawType.includes('debit') || rawType.includes('withdrawal')) {
              type = 'expense';
            } else if (rawType === 'income' || rawType === 'expense' || rawType === 'transfer') {
              type = rawType;
            }
            // If column was "signed amount", negative = expense, positive = income
            if (colIdx.amount !== undefined && headers[colIdx.amount] === 'signed amount') {
              const signed = parseFloat((vals[colIdx.amount] || '0').replace(/[$,\s]/g,''));
              type   = signed >= 0 ? 'income' : 'expense';
              amount = Math.abs(signed);
            }

            const _desc = get('description');
            parsed.push({
              date,
              type,
              category:    get('category') || _guessCategory(_desc, type, _learned),
              description: _desc || '—',
              amount,
              account:     currentAccountId,
              ts:          Date.now() + i,
            });
          } catch(err) { errors++; }
        }

        if (!parsed.length) {
          showStatus('import-status', `No valid rows found.${errors ? ` (${errors} rows had errors)` : ''}`, 'error', 0);
          return;
        }

        // Show preview before committing
        const previewEl = document.getElementById('import-preview');
        if (previewEl) {
          const sample = parsed.slice(0, 5);
          previewEl.innerHTML = `
            <div style="font-size:.78rem;color:var(--muted);margin-bottom:8px">
              Preview — first ${Math.min(5, parsed.length)} of ${parsed.length} rows
              ${errors ? `<span style="color:var(--warn)"> · ${errors} rows skipped</span>` : ''}
            </div>
            <div style="overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;font-size:.75rem">
                <tr style="color:var(--muted)">
                  <th style="text-align:left;padding:4px 6px">Date</th>
                  <th style="text-align:left;padding:4px 6px">Type</th>
                  <th style="text-align:left;padding:4px 6px">Category</th>
                  <th style="text-align:left;padding:4px 6px">Description</th>
                  <th style="text-align:right;padding:4px 6px">Amount</th>
                </tr>
                ${sample.map(t => `<tr style="border-top:1px solid var(--border)">
                  <td style="padding:4px 6px">${t.date}</td>
                  <td style="padding:4px 6px;color:${t.type==='income'?'var(--success)':'var(--danger)'}">${t.type}</td>
                  <td style="padding:4px 6px">${_escHtml(t.category)}</td>
                  <td style="padding:4px 6px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_escHtml(t.description)}</td>
                  <td style="padding:4px 6px;text-align:right">${fmt(t.amount)}</td>
                </tr>`).join('')}
              </table>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button id="import-confirm-btn" class="btn-primary" style="flex:1">Import ${parsed.length} Transactions</button>
              <button id="import-cancel-btn" class="btn-sm">Cancel</button>
            </div>`;
          previewEl.style.display = '';

          document.getElementById('import-confirm-btn')?.addEventListener('click', async () => {
            const doImport = async () => {
              const importBtn = document.getElementById('import-confirm-btn');
              if (importBtn) { importBtn.disabled = true; importBtn.textContent = 'Importing…'; }
              if (importMode === 'overwrite') {
                state.transactions = [];
              }
              for (const t of parsed) await api.addTransaction(t);
              _save();
              previewEl.style.display = 'none';
              const modeNote = importMode === 'overwrite' ? ' (replaced existing)' : '';
              showStatus('import-status', `✓ Imported ${parsed.length} transactions.${errors?` (${errors} skipped)`:''}${modeNote}`, 'success', 0);
              render();
            };

            if (importMode === 'overwrite') {
              showConfirmModal({
                title: 'Overwrite All Transactions?',
                message: `This will permanently delete all ${state.transactions.length} existing transaction${state.transactions.length !== 1 ? 's' : ''} and replace them with the ${parsed.length} rows from your file. This cannot be undone.`,
                confirmText: 'Yes, Overwrite',
                danger: true,
                onConfirm: doImport,
              });
            } else {
              await doImport();
            }
          });
          document.getElementById('import-cancel-btn')?.addEventListener('click', () => {
            previewEl.style.display = 'none';
            showStatus('import-status', 'Import cancelled.', 'error', 2000);
          });
        } else {
          // Fallback: commit immediately if preview element missing
          if (importMode === 'overwrite') state.transactions = [];
          parsed.forEach(t => state.transactions.push(t));
          _save();
          showStatus('import-status', `✓ Imported ${parsed.length} transactions.`, 'success', 0);
          render();
        }
      } catch(err) {
        showStatus('import-status', `Error reading file: ${err.message}`, 'error', 0);
      }
    };
    reader.readAsText(file, 'utf-8');
  });
}

// ── account switcher ───────────────────────────────────────────────────────
function updateAccountSwitcher() {
  const sel = document.getElementById('account-switcher');
  if (!sel) return;
  if (state.accounts.length <= 1) {
    sel.style.display = 'none';
    document.getElementById('acct-home-btn')?.remove();
    return;
  }
  sel.style.display = '';
  sel.innerHTML = state.accounts.map(a =>
    `<option value="${a.id}"${a.id === currentAccountId ? ' selected' : ''}>${_escHtml(a.name)}</option>`
  ).join('');
  // Inject home/picker button once
  if (!document.getElementById('acct-home-btn')) {
    const btn = document.createElement('button');
    btn.id        = 'acct-home-btn';
    btn.className = 'acct-home-btn';
    btn.title     = 'All Accounts';
    btn.textContent = '⊞';
    sel.insertAdjacentElement('beforebegin', btn);
    btn.addEventListener('click', () => {
      _navPush();
      _pageTransition = 'zoom-out';
      showingAccountPicker = true;
      render();
    });
  }
}

// ── version check ──────────────────────────────────────────────────────────
let _upToDate     = false;  // true when version.txt confirms we're on latest
let _latestVersion = null;  // set to the live version string if newer than ours

async function checkForUpdate() {
  try {
    const res  = await fetch('./version.txt?_=' + Date.now(), { cache: 'no-cache' });
    const live = (await res.text()).trim();
    if (!live) return;
    if (live !== VERSION) {
      // A newer version is available — update state and refresh picker if open
      const changed = _latestVersion !== live;
      _upToDate      = false;
      _latestVersion = live;
      if (changed && showingAccountPicker) render();
    } else {
      // We are on the latest version
      const changed = !_upToDate;
      _upToDate      = true;
      _latestVersion = VERSION;
      if (changed && showingAccountPicker) render();
    }
  } catch(e) { /* offline — skip */ }
}

async function forceUpdate() {
  // Clear the "seen version" flag so the What's New popup fires after reload
  localStorage.removeItem('slawminyaw_seen_version');
  try {
    // Delete the app's cached assets so the reload repopulates from the network.
    // (Keep the Google-fonts cache — it never changes.)
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => !/fonts/i.test(k)).map(k => caches.delete(k)));
    }
    // IMPORTANT: do NOT unregister the service worker. Keeping it registered means
    // the reload below stays CONTROLLED, so it flows through the SW's network-first
    // (cache:'no-cache') fetch handler and pulls fresh app.js/style.css immediately.
    // Unregistering made the reload uncontrolled, so the browser's own HTTP cache
    // served stale files — the update only appeared after leaving + reopening the app.
    // Also nudge the SW to fetch any new sw.js in the background.
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) { try { await reg.update(); } catch (e) {} }
    }
  } catch (e) { /* best-effort — fall through to reload regardless */ }
  // Cache-busting navigation so the HTML is re-fetched; sub-resources come fresh
  // via the controlling SW's no-cache fetch.
  window.location.replace(window.location.pathname + '?v=' + Date.now());
}

// Terminal-style update flow — types a boot log, then installs or reports up-to-date.
function _showUpdateTerminal() {
  if (document.getElementById('update-term-overlay')) return;
  haptic([10]);

  const overlay = document.createElement('div');
  overlay.id        = 'update-term-overlay';
  overlay.className = 'update-term-overlay';
  overlay.style.setProperty('--txn-accent', 'var(--accent)');
  overlay.innerHTML = `
    <div class="upd-term">
      <div class="txn-term-bar">
        <span class="txn-term-dot"></span><span class="txn-term-dot"></span><span class="txn-term-dot"></span>
        <span class="txn-term-title">budgetdawgs:~$ update</span>
      </div>
      <div class="txn-term-body" id="upd-term-body"></div>
    </div>`;
  document.body.appendChild(overlay);

  const body = overlay.querySelector('#upd-term-body');
  const addLine = (html, cls = '') => {
    const d = document.createElement('div');
    d.className = 'upd-line' + (cls ? ' ' + cls : '');
    d.innerHTML = html;
    body.appendChild(d);
  };
  let canClose = false;
  const close = () => { overlay.classList.add('update-term-out'); setTimeout(() => overlay.remove(), 260); };
  overlay.addEventListener('click', () => { if (canClose) close(); });

  setTimeout(() => addLine('&gt; checking remote……'), 200);
  setTimeout(() => addLine('&gt; comparing version……'), 800);
  setTimeout(async () => {
    await checkForUpdate();
    const newer = _latestVersion && _latestVersion !== VERSION;
    if (newer) {
      addLine(`&gt; <span class="upd-ok">v${_latestVersion} found</span> — installing <span class="txn-tcur">▋</span>`, 'upd-big');
      setTimeout(() => forceUpdate(), 1200); // navigates away (reload)
    } else {
      addLine(`&gt; <span class="upd-ok">up to date ✓</span> (v${VERSION})`, 'upd-big');
      addLine('// tap to close', 'upd-dim');
      canClose = true;
      setTimeout(() => { if (overlay.isConnected) close(); }, 2400);
    }
  }, 1450);
}

// ── what's new popup ──────────────────────────────────────────────────────
function maybeShowWhatsNew() {
  const seenKey = 'slawminyaw_seen_version';
  if (localStorage.getItem(seenKey) === VERSION) return;
  const entry = CHANGELOG.find(function(c) { return c.version === VERSION; });
  if (!entry || !entry.changes.length) {
    localStorage.setItem(seenKey, VERSION);
    return;
  }

  // Build with DOM methods — no nested template literals
  const overlay = document.createElement('div');
  overlay.id = 'whats-new-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';

  const card = document.createElement('div');
  card.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:22px;padding:24px 22px 20px;max-width:420px;width:100%;box-shadow:0 8px 48px rgba(0,0,0,.7);max-height:80dvh;display:flex;flex-direction:column;overflow:hidden;';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-shrink:0';
  header.innerHTML = '<img src="' + mascotSrc() + '" style="width:44px;height:44px;object-fit:contain;flex-shrink:0" alt="">';
  const htext = document.createElement('div');
  const hlabel = document.createElement('div');
  hlabel.style.cssText = 'font-size:.65rem;font-weight:800;letter-spacing:.12em;color:var(--muted);text-transform:uppercase';
  hlabel.textContent = "What's New";
  const htitle = document.createElement('div');
  htitle.style.cssText = 'font-size:1.1rem;font-weight:800;color:var(--text)';
  htitle.textContent = 'Budget DAWGs v' + VERSION;
  htext.appendChild(hlabel);
  htext.appendChild(htitle);
  header.appendChild(htext);

  const list = document.createElement('ul');
  list.style.cssText = 'list-style:none;padding:0;margin:0;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px;padding-right:4px;';
  entry.changes.forEach(function(change) {
    const li = document.createElement('li');
    li.style.cssText = 'display:flex;gap:10px;align-items:flex-start;background:var(--surface2);border-radius:12px;padding:10px 12px;';
    const bullet = document.createElement('span');
    bullet.style.cssText = 'color:var(--accent);font-size:.9rem;flex-shrink:0;margin-top:1px';
    bullet.textContent = '✶';
    const text = document.createElement('span');
    text.style.cssText = 'font-size:.84rem;color:var(--text);line-height:1.45';
    text.textContent = change;
    li.appendChild(bullet);
    li.appendChild(text);
    list.appendChild(li);
  });

  const btn = document.createElement('button');
  btn.id = 'whats-new-ok';
  btn.style.cssText = 'margin-top:18px;width:100%;padding:14px;flex-shrink:0;background:var(--accent);color:#000;border:none;border-radius:13px;font-family:var(--font-body);font-size:.9rem;font-weight:800;cursor:pointer;letter-spacing:.04em;transition:opacity .15s;';
  btn.textContent = 'Got it';

  card.appendChild(header);
  card.appendChild(list);
  card.appendChild(btn);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function dismiss() {
    localStorage.setItem(seenKey, VERSION);
    overlay.style.transition = 'opacity .25s';
    overlay.style.opacity = '0';
    setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 260);
  }
  btn.addEventListener('click', dismiss);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) dismiss(); });
}

// ── dollar burst ───────────────────────────────────────────────────────────
function spawnDollarBurst(originEl) {
  const rect    = originEl.getBoundingClientRect();
  const cx      = rect.left + rect.width  / 2;
  const cy      = rect.top  + rect.height / 2;
  const theme   = (loadSettings().theme) || 'dark';
  const symbols = theme === 'gengar'
    ? ['👻','🔮','👻','⚡','🔮','👻','✨']
    : theme === 'jurassicpark'
    ? ['🦖','🌿','🦖','🦕','🌿','🦖','🦕']
    : ['$','$','$','💸','$','💵','$'];
  const count   = 7;
  for (let i = 0; i < count; i++) {
    const el  = document.createElement('span');
    el.className = 'dollar-particle';
    el.textContent = symbols[i % symbols.length];
    // Spread evenly + tiny jitter so they fan out
    const angle = (i / count) * 360 + (Math.random() - 0.5) * 25;
    const dist  = 32 + Math.random() * 36;
    const dx    = Math.cos(angle * Math.PI / 180) * dist;
    const dy    = Math.sin(angle * Math.PI / 180) * dist - 10;
    const rot   = (Math.random() - 0.5) * 200;
    const delay = Math.random() * 60;
    el.style.cssText = `left:${cx}px;top:${cy}px;--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;animation-delay:${delay}ms`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ── nav icon glitch ────────────────────────────────────────────────────────
function triggerNavGlitch(btn) {
  btn.classList.remove('nav-glitch-tap');
  void btn.offsetWidth; // force reflow to restart animation
  btn.classList.add('nav-glitch-tap');
  btn.addEventListener('animationend', () => btn.classList.remove('nav-glitch-tap'), { once: true });
}

// ── Screen flash + page-title glitch on tab navigation ─────────────────────
function _screenFlash() {
  // Capture NOW — _applyPageTransition resets _pageTransition to 'fade' ~1 rAF later
  const _isSlide = _pageTransition === 'slide-right' || _pageTransition === 'slide-left';
  // (Accent full-screen flash overlay removed — it tinted the whole UI on every
  //  navigation. The page-title glitch below is kept.)
  // Slides take 340ms — wait until the panel finishes sliding in before glitching the title
  // Fade/zoom: 80ms is enough for the new page to be visible
  setTimeout(() => {
    const _t = document.querySelector('.page-title');
    if (!_t) return;
    _t.classList.remove('page-title-glitch');
    void _t.offsetWidth;
    _t.classList.add('page-title-glitch');
    _t.addEventListener('animationend', () => _t.classList.remove('page-title-glitch'), { once: true });
  }, _isSlide ? 390 : 80);
}

// Universal icon tap glitch — same RGB-split effect on any element
function triggerIconGlitch(el) {
  if (!el) return;
  el.classList.remove('icon-glitch-tap');
  void el.offsetWidth;
  el.classList.add('icon-glitch-tap');
  el.addEventListener('animationend', () => el.classList.remove('icon-glitch-tap'), { once: true });
}

// ── biometric helpers ──────────────────────────────────────────────────────
function _b64ToUint8(b64) {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
function _uint8ToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
async function setupBiometric() {
  if (!window.PublicKeyCredential) return false;
  try {
    const chal = crypto.getRandomValues(new Uint8Array(32));
    const uid  = crypto.getRandomValues(new Uint8Array(16));
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: chal,
      rp: { name: 'Budget DAWGs', id: window.location.hostname },
      user: { id: uid, name: 'dawg-user', displayName: 'Budget DAWGs User' },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 60000,
    }});
    if (!cred) return false;
    localStorage.setItem('slawminyaw_biometric_cred', _uint8ToB64(cred.rawId));
    return true;
  } catch(e) { return false; }
}
async function verifyBiometric() {
  const credB64 = localStorage.getItem('slawminyaw_biometric_cred');
  if (!credB64 || !window.PublicKeyCredential) return false;
  try {
    const chal = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({ publicKey: {
      challenge: chal,
      rpId: window.location.hostname,
      userVerification: 'required',
      allowCredentials: [{ id: _b64ToUint8(credB64), type: 'public-key' }],
      timeout: 60000,
    }});
    return !!assertion;
  } catch(e) { return false; }
}

// ── pin lock ───────────────────────────────────────────────────────────────
function showPinLock(onSuccess) {
  const existing = document.getElementById('pin-lock-overlay');
  if (existing) existing.remove();
  const saved      = localStorage.getItem('slawminyaw_pin');
  const bioEnabled = !!localStorage.getItem('slawminyaw_biometric_cred');

  function showPinUI() {
    if (!saved) { onSuccess(); return; }
    let entered = '';
    const overlay = document.createElement('div');
    overlay.id = 'pin-lock-overlay';
    overlay.className = 'pin-lock-overlay';
    overlay.innerHTML = `
      <div class="pin-lock-card">
        <div class="pin-lock-title">Enter PIN</div>
        <div class="pin-dots" id="pin-dots">
          <span class="pin-dot"></span><span class="pin-dot"></span><span class="pin-dot"></span><span class="pin-dot"></span>
        </div>
        <div class="pin-numpad">
          ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k => `<button class="pin-key${k===''?' pin-key-blank':''}" data-key="${k}">${k}</button>`).join('')}
        </div>
        <div id="pin-error" class="pin-error"></div>
      </div>`;
    document.body.appendChild(overlay);
    function updateDots() {
      overlay.querySelectorAll('.pin-dot').forEach((d, i) => d.classList.toggle('filled', i < entered.length));
    }
    overlay.querySelectorAll('.pin-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.key;
        if (k === '⌫') { entered = entered.slice(0, -1); }
        else if (k !== '' && entered.length < 4) { entered += k; }
        updateDots();
        if (entered.length === 4) {
          const checkPin = async () => {
            let match = false;
            if (saved.length === 4) {
              // Legacy plain-text PIN — verify and silently migrate to hash
              match = (entered === saved);
              if (match) { const h = await _hashPin(entered); localStorage.setItem('slawminyaw_pin', h); }
            } else {
              match = ((await _hashPin(entered)) === saved);
            }
            if (match) { overlay.remove(); onSuccess(); }
            else {
              overlay.querySelector('#pin-error').textContent = 'Incorrect PIN';
              entered = ''; updateDots();
              setTimeout(() => { if (overlay.isConnected) overlay.querySelector('#pin-error').textContent = ''; }, 1500);
            }
          };
          checkPin();
        }
      });
    });
  }

  if (!saved && !bioEnabled) { onSuccess(); return; }

  // Push a history entry so the back button can't bypass the lock screen
  history.pushState({ dawgLock: true }, '');

  if (bioEnabled) {
    // Block the UI immediately so the app content isn't visible while waiting
    const blocker = document.createElement('div');
    blocker.id = 'bio-lock-overlay';
    blocker.style.cssText = 'position:fixed;inset:0;z-index:9998;background:var(--bg,#0f0f14);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px';
    blocker.innerHTML = `
      <img src="${mascotSrc()}" style="width:90px;opacity:.75;filter:drop-shadow(0 4px 20px rgba(0,0,0,.7))">
      <div style="font-size:.9rem;color:var(--muted,#b0aec8);letter-spacing:.04em">Verifying identity…</div>`;
    document.body.appendChild(blocker);

    verifyBiometric().then(ok => {
      blocker.remove();
      if (ok) { onSuccess(); return; }
      if (saved) showPinUI();
      else onSuccess();
    }).catch(() => {
      blocker.remove();
      if (saved) showPinUI();
      else onSuccess();
    });
    return;
  }
  showPinUI();
}

function makeDawgNavBtn(key) {
  const item   = NAV_ITEMS.find(n => n.key === key) || { key, label: key };
  const srcSvg = document.querySelector(`.nav-btn[data-tab="${key}"] .nav-icon svg`);
  const btn    = document.createElement('button');
  btn.className    = 'dawg-nav-btn';
  btn.dataset.tab  = key;
  btn.innerHTML    = `<span class="dawg-nav-icon">${srcSvg ? srcSvg.outerHTML : ''}</span><span class="dawg-nav-lbl">${item.label}</span>`;
  btn.addEventListener('click', () => { triggerNavGlitch(btn); showTab(btn.dataset.tab); });
  return btn;
}

// For debt accounts, swap the (inapplicable) Weekly slot for the next sensible tab.
function _navKeyForAccount(key, layout) {
  if (key === 'weekly' && _isDebtAcct(_currentAcct())) {
    for (const alt of ['debt', 'ledger', 'bills', 'budgets']) {
      if (!layout.includes(alt)) return alt;
    }
    return 'debt';
  }
  return key;
}

function renderDawgNav() {
  const nav    = document.getElementById('dawg-bottom-nav');
  const center = nav?.querySelector('.dawg-nav-center-btn');
  if (!nav || !center) return;
  const layout = loadNavLayout().map((k, _i, arr) => _navKeyForAccount(k, arr)); // 4 keys

  // Remove old configurable buttons
  nav.querySelectorAll('.dawg-nav-btn:not(.dawg-nav-center-btn)').forEach(b => b.remove());

  // Left 2: insert before center; Right 2: append after center
  nav.insertBefore(makeDawgNavBtn(layout[0]), center);
  nav.insertBefore(makeDawgNavBtn(layout[1]), center);
  nav.appendChild(makeDawgNavBtn(layout[2]));
  nav.appendChild(makeDawgNavBtn(layout[3]));

  // Sync active state
  nav.querySelectorAll('.dawg-nav-btn[data-tab]').forEach(b =>
    b.classList.toggle('dawg-nav-active', b.dataset.tab === currentTab));
}

function openNavEditSheet() {
  if (document.getElementById('nav-edit-ov')) return;

  const NAV_SLOTS = 4;
  let slots = [...loadNavLayout()]; // 4 keys currently in nav
  let selectedSlot = null;          // index 0-3 of the slot being edited

  const ov = document.createElement('div');
  ov.id = 'nav-edit-ov';
  ov.className = 'dash-edit-ov';
  document.body.appendChild(ov);

  function itemFor(key) { return NAV_ITEMS.find(n => n.key === key); }

  function buildSlotsHtml() {
    // Visual order mirrors the actual nav bar: slot0 slot1 [🐕] slot2 slot3
    return `
      <div class="nem-slots" id="nem-slots">
        ${slots.map((key, i) => {
          const item = itemFor(key);
          const active = i === selectedSlot ? ' nem-slot-active' : '';
          return `<button class="nem-slot-btn${active}" data-slot="${i}">
            <span class="nem-slot-num">${i < 2 ? i + 1 : i + 2}</span>
            <span class="nem-slot-icon">${item?.icon || ''}</span>
            <span class="nem-slot-lbl">${item?.label || key}</span>
          </button>`;
        }).join('')}
      </div>`;
  }

  function buildPickerHtml() {
    if (selectedSlot === null) {
      return `<p class="nem-picker-hint">Tap a slot above to change it</p>`;
    }
    const currentKey = slots[selectedSlot];
    const available  = NAV_ITEMS.filter(n => !n.required);
    const options = available.map(item => {
      const isCurrent    = item.key === currentKey;
      const isOtherSlot  = !isCurrent && slots.includes(item.key);
      return `<button class="nem-pick-btn${isCurrent ? ' nem-pick-current' : ''}" data-pick="${item.key}">
        <span class="nem-pick-icon">${item.icon}</span>
        <span class="nem-pick-lbl">${item.label}</span>
        ${isCurrent    ? '<span class="nem-pick-check">✓</span>'  : ''}
        ${isOtherSlot  ? '<span class="nem-pick-swap">⇄ swap</span>' : ''}
      </button>`;
    }).join('');
    return `
      <p class="nem-picker-label">Slot ${selectedSlot < 2 ? selectedSlot + 1 : selectedSlot + 2} — pick a section:</p>
      <div class="nem-picker">${options}</div>`;
  }

  function rebuild() {
    ov.innerHTML = `
      <div class="dash-edit-sheet" id="nav-edit-sheet">
        <div class="dem-grabber"></div>
        <div class="dem-hdr">
          <span class="dem-title">Customize Nav Bar</span>
          <button class="dem-close" id="nem-close">✕</button>
        </div>
        <p class="dem-hint">Tap a slot · pick a section to swap it in</p>
        ${buildSlotsHtml()}
        <div class="nem-picker-wrap" id="nem-picker-wrap">${buildPickerHtml()}</div>
        <div class="dem-footer">
          <button class="dem-done" id="nem-done">Done</button>
        </div>
      </div>`;
    attachHandlers();
  }

  function attachHandlers() {
    ov.addEventListener('click', e => { if (e.target === ov) exitEdit(false); });
    ov.querySelector('#nem-close')?.addEventListener('click', () => exitEdit(false));
    ov.querySelector('#nem-done')?.addEventListener('click',  () => exitEdit(true));

    // Slot button taps — select or deselect
    ov.querySelector('#nem-slots')?.addEventListener('click', e => {
      const btn = e.target.closest('.nem-slot-btn');
      if (!btn) return;
      const idx = parseInt(btn.dataset.slot, 10);
      selectedSlot = (selectedSlot === idx) ? null : idx;
      rebuild();
    });

    // Picker taps — assign or swap
    ov.querySelector('#nem-picker-wrap')?.addEventListener('click', e => {
      const btn = e.target.closest('.nem-pick-btn');
      if (!btn || selectedSlot === null) return;
      const pickedKey  = btn.dataset.pick;
      const currentKey = slots[selectedSlot];
      if (pickedKey === currentKey) { selectedSlot = null; rebuild(); return; }
      // If picked key is in another slot, swap those two slots
      const otherIdx = slots.indexOf(pickedKey);
      if (otherIdx !== -1) slots[otherIdx] = currentKey;
      slots[selectedSlot] = pickedKey;
      selectedSlot = null;
      rebuild();
    });
  }

  function exitEdit(save) {
    ov.remove();
    if (save) { saveNavLayout(slots); renderDawgNav(); }
  }

  rebuild();
}

// ── init ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    triggerNavGlitch(btn);
    showTab(btn.dataset.tab);
  }));

// DAWG bottom nav — built dynamically from saved layout
renderDawgNav();
document.getElementById('dawg-nav-accts')?.addEventListener('click', () => {
  const _centerBtn = document.getElementById('dawg-nav-accts');
  if (_centerBtn) {
    _centerBtn.classList.remove('nav-dob-tap');
    void _centerBtn.offsetWidth;
    _centerBtn.classList.add('nav-dob-tap');
    // Listen on the child img — that's where the animation runs
    const _dobImg = _centerBtn.querySelector('.dawg-nav-dob') || _centerBtn;
    _dobImg.addEventListener('animationend', () => _centerBtn.classList.remove('nav-dob-tap'), { once: true });
  }
  showTab('dashboard');
});
// Long-press on DAWG nav bar opens nav customization
(function() {
  const _nav = document.getElementById('dawg-bottom-nav');
  if (!_nav) return;
  let _lpt = null, _sx = 0, _sy = 0;
  const _clear = () => { clearTimeout(_lpt); _lpt = null; };
  _nav.addEventListener('pointerdown', e => {
    if (e.target.closest('.dawg-nav-center-btn')) return;
    _sx = e.clientX; _sy = e.clientY;
    _lpt = setTimeout(() => { _clear(); openNavEditSheet(); }, 600);
  });
  _nav.addEventListener('pointerup',     _clear);
  _nav.addEventListener('pointercancel', _clear);
  // Only cancel if the finger actually moved (8px threshold prevents phantom micro-moves)
  _nav.addEventListener('pointermove', e => {
    if (Math.abs(e.clientX - _sx) > 8 || Math.abs(e.clientY - _sy) > 8) _clear();
  });
})();
// DAWG persistent topbar — hamburger, accounts grid, account pill (permanent HTML elements)
document.getElementById('dawg-hamburger')?.addEventListener('click', () => {
  triggerIconGlitch(document.getElementById('dawg-hamburger'));
  openDawgDrawer();
});
document.getElementById('dawg-accts-btn')?.addEventListener('click', () => {
  triggerIconGlitch(document.getElementById('dawg-accts-btn'));
  _navPush();
  _pageTransition = 'zoom-out';
  showingAccountPicker = true;
  render();
});
document.getElementById('dawg-acct-switch')?.addEventListener('click', () => {
  triggerIconGlitch(document.getElementById('dawg-acct-switch'));
  toggleDawgAcctDropdown();
});
// DAWG drawer close + item listeners (permanent HTML elements)
document.getElementById('dawg-drawer-close')?.addEventListener('click', closeDawgDrawer);
document.getElementById('dawg-drawer-overlay')?.addEventListener('click', closeDawgDrawer);
document.querySelectorAll('.dawg-drawer-item').forEach(btn =>
  btn.addEventListener('click', () => {
    const icon = btn.querySelector('.dawg-di-icon');
    if (icon) triggerIconGlitch(icon);
    closeDawgDrawer();
    if (btn.dataset.tab === '__accounts__') { _navPush(); showingAccountPicker = true; render(); }
    else showTab(btn.dataset.tab);
  }));

// ── PWA install prompt ────────────────────────────────────────────────────
let _pwaInstallPrompt = null;

// Chrome/Edge/Android: browser fires this when the app is installable
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _pwaInstallPrompt = e;
  const btn = document.getElementById('pwa-install-btn');
  if (btn) {
    btn.classList.remove('hidden');
    const lbl = document.getElementById('pwa-install-lbl');
    if (lbl) lbl.textContent = 'Add to Home Screen';
  }
});

// Hide the button once the app has been installed
window.addEventListener('appinstalled', () => {
  _pwaInstallPrompt = null;
  document.getElementById('pwa-install-btn')?.classList.add('hidden');
});

// iOS/Safari doesn't fire beforeinstallprompt — detect it and show a tip button instead
(function() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode = window.navigator.standalone === true;
  if (isIos && !isInStandaloneMode) {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) {
      btn.classList.remove('hidden');
      const lbl = document.getElementById('pwa-install-lbl');
      if (lbl) lbl.textContent = 'Add to Home Screen (iOS tip)';
    }
  }
})();

document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
  // iOS: show a tip since the browser handles installation manually
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos || !_pwaInstallPrompt) {
    closeDawgDrawer();
    setTimeout(() => {
      alert('To install: tap the Share button (the box with an arrow) at the bottom of Safari, then tap "Add to Home Screen".');
    }, 300);
    return;
  }
  closeDawgDrawer();
  _pwaInstallPrompt.prompt();
  const { outcome } = await _pwaInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    _pwaInstallPrompt = null;
    document.getElementById('pwa-install-btn')?.classList.add('hidden');
  }
});


// Keyboard "Done" / checkmark — blur the focused input to dismiss the keyboard.
// Prevents accidental form submission and lets the user review before hitting Save.
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const el = e.target;
  if (el.tagName !== 'INPUT' && el.tagName !== 'SELECT') return;
  // Let date inputs handle Enter natively
  if (el.type === 'date') return;
  e.preventDefault();
  el.blur();
}, { passive: false });

// System back button — navigates within the app before exiting
window.addEventListener('popstate', () => {
  // Lock screens always block back navigation
  if (document.getElementById('pin-lock-overlay') || document.getElementById('bio-lock-overlay')) {
    history.pushState({ dawgLock: true }, '');
    return;
  }
  // Close the quick-add sheet first if it's open (its history entry was just consumed)
  const fastAdd = document.getElementById('fast-add-overlay');
  if (fastAdd) { (fastAdd._closeFromPop || (() => fastAdd.remove()))(); return; }
  // Close any open modal/drawer first before actually going back
  const drawer = document.getElementById('dawg-drawer');
  if (drawer && !drawer.classList.contains('hidden')) { closeDawgDrawer(); history.pushState({ dawgNav: true }, ''); return; }
  const dropdown = document.getElementById('dawg-acct-dropdown');
  if (dropdown && !dropdown.classList.contains('hidden')) { dropdown.classList.add('hidden'); history.pushState({ dawgNav: true }, ''); return; }
  // Navigate to previous app state
  if (_navStack.length > 0) {
    const prev = _navStack.pop();
    _navigatingBack = true;
    // Restore account if it changed
    if (prev.accountId && prev.accountId !== currentAccountId) {
      currentAccountId = prev.accountId;
      _loadAccountData(prev.accountId);
      updateAccountSwitcher();
    }
    showingAccountPicker = prev.picker;
    const _bFromIdx = NAV_TABS.indexOf(currentTab);
    const _bToIdx   = NAV_TABS.indexOf(prev.tab);
    const _bBothNav = _bFromIdx !== -1 && _bToIdx !== -1;
    _pageTransition = (prev.picker || showingAccountPicker)
      ? 'zoom-out'
      : (prev.tab === 'dashboard')
        ? 'zoom-out'
        : (_bBothNav && _bFromIdx !== _bToIdx)
          ? (_bToIdx < _bFromIdx ? 'slide-left' : 'slide-right')
          : 'fade';
    currentTab = prev.tab;
    if (_dawgSparkGlobal) { _dawgSparkGlobal.destroy(); _dawgSparkGlobal = null; }
    document.querySelectorAll('.nav-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === prev.tab));
    document.querySelectorAll('.dawg-nav-btn[data-tab]').forEach(b =>
      b.classList.toggle('dawg-nav-active', b.dataset.tab === prev.tab));
    render();
    _navigatingBack = false;
  }
  // If stack is empty, fall through — browser exits the PWA (correct behaviour)
});

(async () => {
  // Test harness (tests.html) loads app.js only to exercise the pure helpers — skip boot.
  if (window.__APP_TEST__) return;
  // If a lock is configured, cover the app content immediately so it can't be
  // glimpsed between the splash fading out and the biometric/PIN overlay appearing.
  const _hasLock = !!localStorage.getItem('slawminyaw_pin') || !!localStorage.getItem('slawminyaw_biometric_cred');
  let _earlyBlocker = null;
  if (_hasLock) {
    _earlyBlocker = document.createElement('div');
    _earlyBlocker.style.cssText = 'position:fixed;inset:0;z-index:9997;background:var(--bg,#0f0f14)';
    document.body.appendChild(_earlyBlocker);
  }
  await runSplash();
  showPinLock(async () => {
    _earlyBlocker?.remove();
    try {
    await api.load();
    await processRecurring();
    initSoundsToggle();
    applySettings();
    // Re-fit logo once custom fonts finish loading — applySettings fires before
    // web fonts are ready, so the first measurement uses the fallback font width.
    updateAccountSwitcher();
    document.getElementById('account-switcher')?.addEventListener('change', async e => {
      await api.switchAccount(e.target.value, true);
    });
    if (state.accounts.length > 1) showingAccountPicker = true;
    // Seed base history entry — back button will hit popstate with an empty stack and exit cleanly
    history.replaceState({ dawgBase: true }, '');
    render();
    // Reveal the app now that the first frame is painted — eliminates the raw-HTML flash
    requestAnimationFrame(() => {
      const appEl = document.getElementById('app');
      if (appEl) appEl.style.opacity = '1';
    });
    // Defer non-critical startup work — badges, bill/notes notifications,
    // what's-new modal, paycheck/contribution catch-up, and the update check —
    // to idle time so none of it competes with first paint or the user's first tap.
    const _runIdle = (typeof requestIdleCallback === 'function')
      ? cb => requestIdleCallback(cb, { timeout: 2000 })
      : cb => setTimeout(cb, 200);
    _runIdle(() => {
      updateBillBadge();
      checkBillNotifications();
      updateNotesBadge();
      checkNotesAlert();
      maybeShowWhatsNew();
      _checkPaychecks();
      _checkContributions();
      checkForUpdate();
      _ensureChart();  // warm Chart.js after first paint so charts are ready when needed
    });

    // ── swipe between tabs ────────────────────────────────────────────────
    (function attachSwipeTabs() {
      const mc = document.getElementById('main-content');
      if (!mc) return;
      let tx0 = 0, ty0 = 0, swipeTouchTarget = null;
      mc.addEventListener('touchstart', e => {
        tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY;
        swipeTouchTarget = e.target;
      }, { passive: true });
      mc.addEventListener('touchend', e => {
        // Never swipe tabs when the accounts overview or an account is showing
        if (showingAccountPicker) return;
        // Never swipe tabs when the gesture started on a ledger row (has its own swipe-to-delete)
        if (swipeTouchTarget?.closest('.ledger-row')) return;
        // Never swipe tabs when the gesture started on a range slider
        if (swipeTouchTarget && (
          (swipeTouchTarget.tagName === 'INPUT' && swipeTouchTarget.type === 'range') ||
          swipeTouchTarget.classList.contains('slider')
        )) return;
        const dx = e.changedTouches[0].clientX - tx0;
        const dy = Math.abs(e.changedTouches[0].clientY - ty0);
        if (Math.abs(dx) < 55 || dy > 45) return;
        const _settings = loadSettings();
        const isDawg    = THEMES[(_settings.theme)||'dark']?.dawg;
        let visible;
        if (isDawg) {
          // In DAWG mode only swipe between the 5 nav bar tabs
          visible = loadNavLayout();
        } else {
          const hidden = _settings.hiddenTabs || [];
          visible = NAV_ITEMS.map(n => n.key).filter(k => !hidden.includes(k));
        }
        const idx = visible.indexOf(currentTab);
        if (dx < 0 && idx < visible.length - 1) showTab(visible[idx + 1]);
        else if (dx > 0 && idx > 0)              showTab(visible[idx - 1]);
      }, { passive: true });
    })();

    // ── pull to refresh ───────────────────────────────────────────────────
    (function attachPullToRefresh() {
      const mc = document.getElementById('main-content');
      if (!mc) return;
      const ind = document.createElement('div');
      ind.className = 'ptr-indicator';
      ind.innerHTML = '<div class="ptr-spinner"></div>';
      (document.getElementById('app') || document.body).appendChild(ind);
      const TH = 72; // pull distance (px) to trigger a refresh
      let startY = 0, dist = 0, active = false, refreshing = false;
      mc.addEventListener('touchstart', e => {
        // Only arm at the very top of the scroll, and not over the accounts picker
        if (refreshing || mc.scrollTop > 0 || showingAccountPicker) { active = false; return; }
        startY = e.touches[0].clientY; active = true; dist = 0;
      }, { passive: true });
      mc.addEventListener('touchmove', e => {
        if (!active || refreshing) return;
        dist = e.touches[0].clientY - startY;
        if (dist <= 0) { ind.style.transform = ''; ind.style.opacity = ''; return; }
        const pull = Math.min(dist * 0.5, 90);
        ind.style.transform = `translateX(-50%) translateY(${pull}px)`;
        ind.style.opacity = Math.min(pull / TH, 1);
        ind.classList.toggle('ptr-ready', dist > TH);
      }, { passive: true });
      mc.addEventListener('touchend', () => {
        if (!active || refreshing) return;
        active = false;
        if (dist > TH) {
          refreshing = true;
          ind.classList.add('ptr-spinning');
          ind.style.transform = 'translateX(-50%) translateY(60px)';
          ind.style.opacity = '1';
          setTimeout(() => {
            rerenderKeepScroll();
            ind.classList.remove('ptr-spinning', 'ptr-ready');
            ind.style.transform = ''; ind.style.opacity = '';
            refreshing = false;
          }, 520);
        } else {
          ind.style.transform = ''; ind.style.opacity = '';
          ind.classList.remove('ptr-ready');
        }
      }, { passive: true });
    })();

    // ── auto-theme: update when system preference changes ─────────────────
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const s = loadSettings();
      if ((s.theme || 'dark') === 'auto') applySettings();
    });

    // Re-run paycheck / contribution catch-up when the app regains focus.
    // (Initial run is deferred to idle above.)
    window.addEventListener('focus', _checkPaychecks);
    window.addEventListener('focus', _checkContributions);

    // Check for a new version on focus and every 2 minutes while open.
    // (Initial check is deferred to idle above.)
    window.addEventListener('focus', checkForUpdate);
    setInterval(checkForUpdate, 120_000);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        reg.update();
        window.addEventListener('focus', () => reg.update());
      }).catch(() => {});
      // Auto-reload when a NEW service worker takes over a page that was ALREADY
      // controlled (a genuine background update). Skip the first-claim case: right
      // after a forced update the page reloads uncontrolled, then the fresh SW claims
      // it via clients.claim() — reloading again there caused a double splash.
      let _swReloaded = false;
      const _wasControlled = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!_wasControlled || _swReloaded) return;
        _swReloaded = true;
        window.location.reload();
      });
    }
    } catch(err) {
      // Surface init errors — always make the app visible so the error message isn't hidden
      console.error('[Budget DAWGs] Init error:', err);
      const appEl2 = document.getElementById('app');
      if (appEl2) appEl2.style.opacity = '1';
      const mc = document.getElementById('main-content');
      if (mc) mc.innerHTML = `<div style="padding:32px 24px;text-align:center">
        <div style="font-size:1.1rem;font-weight:700;color:var(--danger);margin-bottom:8px">Something went wrong loading the app.</div>
        <div style="font-size:.85rem;color:var(--muted);margin-bottom:20px">${err?.message || 'Unknown error'}</div>
        <button onclick="location.reload()" style="padding:12px 28px;background:var(--accent);color:#000;border:none;border-radius:12px;font-weight:700;font-size:.9rem;cursor:pointer">Reload</button>
      </div>`;
    }
  });
})();
