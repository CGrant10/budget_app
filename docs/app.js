'use strict';

const VERSION = '4.7.3';
const DEFAULT_CATEGORIES = ['Food','Gas','Car','Boat','Tools','Home','Entertainment','Health','Other'];

function getCategories() {
  const s = loadSettings();
  return [...DEFAULT_CATEGORIES, ...(s.customCategories || [])];
}

const CHANGELOG = [
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
    label:'Dark',
    ..._D,
    accent:'#4ecb8d', accent2:'#a07858', success:'#4ecb8d', warn:'#c0a038', danger:'#c05050',
    grad:'linear-gradient(135deg, #2d3830 0%, #4ecb8d 100%)',
    cats:{ Food:'#4ecb8d', Gas:'#c05858', Car:'#6888a8', Boat:'#4898a8', Tools:'#b87840', Home:'#7ca048', Entertainment:'#8890a8', Health:'#4090a8', Other:'#787880' },
  },
  oled: {
    label:'OLED Black',
    bg:'#000000', surface:'#0a0a0a', surface2:'#101010', card:'#0c0c0c',
    text:'#e2e2e4', muted:'#888890', border:'#1c1c1c',
    accent:'#4ecb8d', accent2:'#a07858', success:'#4ecb8d', warn:'#c0a038', danger:'#c05050',
    grad:'linear-gradient(135deg, #000a04 0%, #4ecb8d 100%)',
    font:'default',
    cats:{ Food:'#4ecb8d', Gas:'#c05858', Car:'#6888a8', Boat:'#4898a8', Tools:'#b87840', Home:'#7ca048', Entertainment:'#8890a8', Health:'#4090a8', Other:'#787880' },
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
  light: {
    label:'Light',
    bg:'#f3f3f3', surface:'#ffffff', surface2:'#e8e8e8', card:'#efefef',
    accent:'#4ecb8d', accent2:'#a06838', success:'#2ea870', warn:'#988018', danger:'#a84040',
    grad:'linear-gradient(135deg, #1a4030 0%, #4ecb8d 100%)',
    text:'#181820', muted:'#606070', border:'#d5d5d5', light:true, font:'default',
    cats:{ Food:'#2ea870', Gas:'#a84040', Car:'#4858a0', Boat:'#308898', Tools:'#986030', Home:'#608038', Entertainment:'#804898', Health:'#308898', Other:'#606078' },
  },
  denim: {
    label:'Denim',
    ..._D,
    accent:'#4080b0', accent2:'#b07840', success:'#52a872', warn:'#c0a038', danger:'#c05050',
    cats:{ Food:'#52a872', Gas:'#c05858', Car:'#4070b0', Boat:'#3898b8', Tools:'#b07840', Home:'#608898', Entertainment:'#6060a8', Health:'#3898b8', Other:'#607898' },
  },
  ember: {
    label:'Ember',
    ..._D,
    accent:'#c07830', accent2:'#c05030', success:'#52a872', warn:'#c0a038', danger:'#c05050',
    cats:{ Food:'#78a858', Gas:'#c85040', Car:'#b07830', Boat:'#509880', Tools:'#c86830', Home:'#a89840', Entertainment:'#b06070', Health:'#609878', Other:'#988060' },
  },
  gengar: {
    label:'Gengar 👻',
    ..._D,
    accent:'#a060c8', accent2:'#c06880', success:'#52a872', warn:'#c0a038', danger:'#c05050',
    cats:{ Food:'#52a872', Gas:'#c06878', Car:'#9060c8', Boat:'#6080b8', Tools:'#c07060', Home:'#88a050', Entertainment:'#a850b8', Health:'#5880b0', Other:'#887898' },
  },
  jurassicpark: {
    label:'Jurassic Park 🦖',
    ..._D,
    accent:'#c8a020', accent2:'#c84820', success:'#5aaa40', warn:'#c8a020', danger:'#c84030',
    cats:{ Food:'#5aaa40', Gas:'#c84030', Car:'#c8a020', Boat:'#409870', Tools:'#c86020', Home:'#80a830', Entertainment:'#a07020', Health:'#50a860', Other:'#788858' },
  },
  auto: { label:'✨ Auto (System)', ..._D, accent:'#4ecb8d', accent2:'#a07858', success:'#4ecb8d', warn:'#c0a038', danger:'#c05050', grad:'linear-gradient(135deg, #2d3830 0%, #4ecb8d 100%)' },
  dawg: {
    label:'DAWG 🐕',
    bg:'#080808', surface:'#101010', surface2:'#181818', card:'#121212',
    text:'#ffffff', muted:'#707070', border:'#222222',
    accent:'#39ff14', accent2:'#00cc00', success:'#39ff14', warn:'#ffd700', danger:'#ff4444',
    grad:'linear-gradient(135deg, #000000 0%, #071a00 60%, #39ff14 100%)',
    font:'default', dawg:true,
    cats:{ Food:'#39ff14', Gas:'#ff4444', Car:'#00aaff', Boat:'#00e5ff', Tools:'#ffd700', Home:'#39ff14', Entertainment:'#cc44ff', Health:'#ff6699', Other:'#888888' },
  },
  dawglight: {
    label:'DAWG Light ☀️',
    bg:'#f4f4f4', surface:'#ffffff', surface2:'#e8e8e8', card:'#ffffff',
    text:'#111111', muted:'#777777', border:'#e0e0e0',
    accent:'#22aa22', accent2:'#007700', success:'#22aa22', warn:'#b87800', danger:'#cc2200',
    grad:'linear-gradient(135deg, #d0ecd0 0%, #22aa22 100%)',
    font:'default', dawg:true, light:true,
    cats:{ Food:'#22aa22', Gas:'#cc2200', Car:'#0066cc', Boat:'#0099bb', Tools:'#b87800', Home:'#22aa22', Entertainment:'#8800cc', Health:'#cc0066', Other:'#888888' },
  },
};

let CAT_COLORS = {
  Food:          '#4ecb8d',
  Snacks:        '#f7c96a',
  Gas:           '#f76a6a',
  Car:           '#7c6af7',
  Boat:          '#4ecbcb',
  Tools:         '#f7936a',
  Home:          '#8dcb4e',
  Transport:     '#6af7c9',
  Housing:       '#c96af7',
  Entertainment: '#f76ab5',
  Health:        '#4eaecb',
  Shopping:      '#cb4e8d',
  Income:        '#4ecb8d',
  Other:         '#9896a4',
};

// ── empty state ────────────────────────────────────────────────────────────
function emptyState(title, hint = '') {
  return `<div class="empty-state">
    <img src="./doberman.png" class="empty-dob" alt="">
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

// ── utilities ──────────────────────────────────────────────────────────────
function _debounce(fn, ms = 250) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
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
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function checkSpendingAlert(category) {
  const m = new Date().toISOString().slice(0, 7);
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
let dashChartMode = 'bar';
let currentAccountId = 'main';
const STORAGE_KEY  = 'slawminyaw';
const SETTINGS_KEY = 'slawminyaw_settings';
const ACCOUNTS_KEY = 'slawminyaw_accounts';
function accountDataKey(id) { return 'slawminyaw_data_' + id; }

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
}
function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch(e) { console.warn('Budget DAWGs: settings save failed', e); }
}
function defaultAccounts() { return [{ id: 'main', name: 'Main', type: 'checking' }]; }

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', required: true },
  { key: 'add',       label: 'Add',       icon: '➕' },
  { key: 'ledger',    label: 'Ledger',    icon: '📋' },
  { key: 'weekly',    label: 'Weekly',    icon: '📅' },
  { key: 'bills',     label: 'Bills',     icon: '📑' },
  { key: 'debt',     label: 'Debt',      icon: '💳' },
  { key: 'goals',     label: 'Goals',     icon: '🎯' },
  { key: 'import',    label: 'Import',    icon: '📥' },
  { key: 'budgets',   label: 'Budgets',   icon: '💰' },
  { key: 'settings',  label: 'Settings',  icon: '⚙️',  required: true },
  { key: 'about',     label: 'About',     icon: 'ℹ️',  required: true },
];

function applySettings() {
  const s = loadSettings();
  applyNavPosition(s.navPosition || 'bottom');
  applyNavItems(s.hiddenTabs || []);
  applyTheme(s.theme || 'dark');
  applyFontStyle(s.fontStyle || 'default');
}

// No-op: brand lockup uses a fixed image + short label — font shrinking no longer needed.
function fitLogo() {}

function applyFontStyle(style) {
  const map = {
    default:    "'Plus Jakarta Sans', sans-serif",
    system:     "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    terminal:   "'Consolas', 'Menlo', 'Monaco', 'Courier New', monospace",
    // Theme-specific authentic fonts
    vscode:     "'Consolas', 'Menlo', 'Monaco', 'Courier New', monospace",
    powershell: "'Cascadia Code', 'Cascadia Mono', 'Consolas', 'Courier New', monospace",
    cmd:        "'Lucida Console', 'Consolas', 'Courier New', monospace",
  };
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
      img.src = './doberman.png';
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
  document.body.classList.toggle('light', !!t.light);
  // Update category colors to match theme
  if (t.cats) Object.assign(CAT_COLORS, t.cats);
  // Auto-apply bundled font for terminal-style themes
  if (t.font) {
    applyFontStyle(t.font);
    const _fs = loadSettings();
    _fs.fontStyle = t.font;
    saveSettings(_fs);
  }
  // All themes now use the DAWG layout — always enable dawg-mode
  document.getElementById('app')?.classList.add('dawg-mode');
  // Gengar ghost background overlay — lives inside #app so it's above body's solid bg
  let gOverlay = document.getElementById('gengar-bg-overlay');
  if (theme === 'gengar') {
    if (!gOverlay) {
      gOverlay = document.createElement('div');
      gOverlay.id = 'gengar-bg-overlay';
      const app = document.getElementById('app');
      if (app) app.insertBefore(gOverlay, app.firstChild);
    }
  } else if (gOverlay) {
    gOverlay.remove();
  }
}

function _save() {
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
  } catch(e) { console.warn('Budget DAWGs: save failed', e); _showSaveError(); }
}
function _saveAccounts() {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state.accounts));
  } catch(e) { console.warn('Budget DAWGs: account save failed', e); _showSaveError(); }
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
    if (accStr) {
      state.accounts = JSON.parse(accStr);
    } else {
      // Migrate from old single-key format
      const old = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
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
  async switchAccount(id) {
    currentAccountId = id;
    _loadAccountData(id);
    updateAccountSwitcher();
    currentTab = 'dashboard'; // always land on dashboard when switching accounts
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
  const currentMonth = new Date().toISOString().slice(0, 7);
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
    const ai  = state.transactions.reduce((s,t) => t.type==='income'  ? s+t.amount : s, 0);
    const ae  = state.transactions.reduce((s,t) => t.type==='expense' ? s+t.amount : s, 0);
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
function totals() {
  let income = 0, expense = 0;
  const bycat = {};
  for (const t of state.transactions) {
    if (t.type === 'income') { income += t.amount; }
    else { expense += t.amount; bycat[t.category] = (bycat[t.category] || 0) + t.amount; }
  }
  return { income, expense, bycat };
}

function monthTotals(monthStr) {
  let income = 0, expense = 0;
  const bycat = {};
  for (const t of state.transactions) {
    if (!t.date.startsWith(monthStr)) continue;
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

// ── health score ───────────────────────────────────────────────────────────
function calcHealthScore() {
  const m = new Date().toISOString().slice(0, 7);
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
    const paid = state.bills.filter(b => b.paidMonth === m).length;
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
let dashMonth = new Date().toISOString().slice(0, 7);
let debtSubTab = 'credit'; // 'credit' | 'loan'
let debtCalcMode = 'snowball'; // 'snowball' | 'avalanche'
let debtMonthlyPay = '';
let showingAccountPicker = false;
let _pageTransition = 'fade'; // 'fade' | 'slide-left' | 'slide-right'
let selectedLedgerIdx = null;
let ledgerFilter = '';
let ledgerSort = 'date-desc';
let ledgerTypeFilter = 'all';
let ledgerCatFilter = '';
let ledgerDateFrom = '';
let ledgerDateTo = '';
let _insightTimer = null;
let _dawgSparkGlobal = null; // module-level ref so tab switches can destroy it
let _splitRows    = []; // [{cat, amount}] for split-transaction mode

function showTab(key) {
  if (currentTab === 'ledger' && key !== 'ledger') {
    ledgerFilter = ''; ledgerSort = 'date-desc'; ledgerTypeFilter = 'all';
    ledgerCatFilter = ''; ledgerDateFrom = ''; ledgerDateTo = '';
  }
  if (_insightTimer) { clearInterval(_insightTimer); _insightTimer = null; }
  if (_dawgSparkGlobal) { _dawgSparkGlobal.destroy(); _dawgSparkGlobal = null; }
  // About page always uses base dark/light — unaffected by Dusk/Denim/Ember etc.
  const activeTheme = (loadSettings().theme) || 'dark';
  if (key === 'about') {
    const isLight = !!(THEMES[activeTheme] || THEMES.dark).light;
    applyTheme(isLight ? 'light' : 'dark');
    // Always keep dawg-mode (universal layout)
    document.getElementById('app')?.classList.add('dawg-mode');
  } else if (currentTab === 'about') {
    applyTheme(activeTheme);
  }
  _pageTransition = 'fade';
  currentTab = key;
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === key));
  document.querySelectorAll('.dawg-nav-btn[data-tab]').forEach(b =>
    b.classList.toggle('dawg-nav-active', b.dataset.tab === key));
  render();
}

// ── chart ──────────────────────────────────────────────────────────────────
let spendingChart = null;

function showCatModal(cat) {
  const m = dashMonth;
  const txns = state.transactions
    .filter(t => t.type === 'expense' && t.category === cat && t.date.startsWith(m))
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = txns.reduce((s, t) => s + t.amount, 0);
  const catColor = CAT_COLORS[cat] || 'var(--accent)';
  const rowsHtml = txns.length
    ? txns.map(t => `<div class="cat-modal-row"><span class="cat-modal-date">${t.date.slice(5)}</span><span class="cat-modal-desc">${t.description}</span><span class="cat-modal-amt">-${fmt(t.amount)}</span></div>`).join('')
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

function getLastSixWeeks() {
  const weeks = [];
  for (let i = 0; i < 6; i++) {
    const mon = new Date();
    mon.setHours(0, 0, 0, 0);
    mon.setDate(mon.getDate() - mon.getDay() + 1 - (5 - i) * 7);
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    const monStr = mon.toISOString().slice(0, 10);
    const sunStr = sun.toISOString().slice(0, 10);
    const label  = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

function getMonthCatData(monthStr) {
  const m = monthStr || new Date().toISOString().slice(0, 7);
  const { bycat } = monthTotals(m);
  const entries = Object.entries(bycat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return {
    labels: entries.map(([c]) => c),
    data:   entries.map(([, v]) => v),
    colors: entries.map(([c]) => CAT_COLORS[c] || '#9896a4'),
  };
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
      spendingChart = new Chart(chartEl, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Spent',
            data,
            backgroundColor: colors,
            borderRadius: 2,
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
      });
    }
  } else {
    const { labels, data, colors } = getMonthCatData(dashMonth);
    if (!data.length) {
      const wrap = chartEl.closest('.chart-wrap');
      if (wrap) wrap.innerHTML = '<p class="empty-msg" style="padding:40px 0;text-align:center">No spending this month yet.</p>';
    } else {
      const total = data.reduce((s, v) => s + v, 0);
      spendingChart = new Chart(chartEl, {
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
                font: { size: 12, family: 'Outfit' },
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
      });
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
    const now = new Date().toISOString().slice(0, 7);
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
            textEl.style.opacity = '0';
            setTimeout(() => { textEl.textContent = allInsights[insightIdx]; textEl.style.opacity = '1'; }, 250);
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
  const m = new Date().toISOString().slice(0, 7);
  return state.bills
    .filter(b => b.paidMonth !== m && getDaysUntilDue(b.dueDay) <= days)
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

// ── net worth ──────────────────────────────────────────────────────────────
function getNetWorth() {
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
  return { accounts: items, total };
}

// ── running balances ──────────────────────────────────────────────────────
function calcRunningBalances() {
  const sorted = state.transactions
    .map((t, i) => ({ ...t, _i: i }))
    .sort((a, b) => a.date.localeCompare(b.date) || a._i - b._i);
  let running = state.startingBalance || 0;
  const map = {};
  for (const t of sorted) {
    running += t.type === 'income' ? t.amount : -t.amount;
    map[t._i] = running;
  }
  return map;
}

// ── spending insights ──────────────────────────────────────────────────────
function getSpendingInsights(monthStr) {
  const refDate = monthStr
    ? new Date(parseInt(monthStr.slice(0,4)), parseInt(monthStr.slice(5,7)) - 1, 1)
    : new Date();
  const thisM = monthStr || refDate.toISOString().slice(0, 7);
  const lastM = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1).toISOString().slice(0, 7);
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
  const currentM = new Date().toISOString().slice(0, 7);
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
        <div style="font-size:2rem;margin-bottom:12px">💳</div>
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

  // Determine which sub-tabs have accounts
  const hasCredit = creditAccts.length > 0;
  const hasLoans  = loanAccts.length  > 0;
  // Snap debtSubTab to a valid value
  if (debtSubTab === 'credit' && !hasCredit) debtSubTab = 'loan';
  if (debtSubTab === 'loan'   && !hasLoans)  debtSubTab = 'credit';

  const subNavHtml = (hasCredit && hasLoans) ? `
    <div class="debt-subnav">
      <button class="debt-pill${debtSubTab === 'credit' ? ' active' : ''}" data-sub="credit">💳 Credit Cards</button>
      <button class="debt-pill${debtSubTab === 'loan'   ? ' active' : ''}" data-sub="loan">🏦 Loans</button>
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
        <span class="debt-txn-desc">${t.description || 'Payment'}</span>
        <span class="debt-txn-amt success">-${fmt(t.amount)}</span>
      </div>`).join('');

    // Charge/expense transactions
    const charges = txns.filter(t => t.type === 'expense').sort((a, b) => b.date.localeCompare(a.date));
    const chargeRows = charges.slice(0, 20).map(t => `
      <div class="debt-txn-row">
        <span class="debt-txn-date">${t.date}</span>
        <span class="debt-txn-desc">${t.description || t.category || '—'}</span>
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
          <div class="debt-acct-name">${acct.name}</div>
          <div class="debt-acct-type">${acct.type === 'loan' ? '🏦 Loan' : '💳 Credit'}</div>
        </div>
        <div class="debt-owed-row">
          <span class="debt-owed-label">OWED</span>
          <span class="debt-owed-value" style="color:${owed > 0 ? 'var(--danger)' : 'var(--success)'}">${fmt(owed)}</span>
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
        <div class="debt-summary-sub">${allDebt.length} account${allDebt.length !== 1 ? 's' : ''}</div>
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
  const TYPE_COLORS = { checking:'#5b8de8', savings:'#32d74b', credit:'#ff453a', loan:'#ffd60a', cash:'#52d68a' };
  const rows = state.accounts.map(acct => {
    const d        = JSON.parse(localStorage.getItem(accountDataKey(acct.id)) || '{}');
    const txns     = d.transactions || [];
    const startBal = parseFloat(d.startingBalance) || 0;
    let inc = 0, exp = 0;
    for (const t of txns) { if (t.type === 'income') inc += t.amount; else exp += t.amount; }
    const isDebt   = acct.type === 'credit' || acct.type === 'loan';
    const balance  = isDebt ? Math.max(0, startBal + exp - inc) : startBal + inc - exp;
    const balColor = isDebt ? 'var(--danger)' : (balance >= 0 ? 'var(--success)' : 'var(--danger)');
    const balLabel = isDebt ? `Owes ${fmt(balance)}` : fmt(balance);
    const typeLbl  = acct.type.charAt(0).toUpperCase() + acct.type.slice(1);
    const stripe   = TYPE_COLORS[acct.type] || 'var(--accent)';
    const icon     = _ACCT_SVG[acct.type] || _ACCT_SVG.checking;
    return `
      <div class="acct-row" data-id="${acct.id}">
        <div class="acct-row-stripe" style="background:${stripe}"></div>
        <div class="acct-row-icon" style="color:${stripe}">${icon}</div>
        <div class="acct-row-info">
          <div class="acct-row-name">${acct.name}</div>
          <div class="acct-row-type">${typeLbl}</div>
        </div>
        <div class="acct-row-right">
          <div class="acct-row-bal" style="color:${balColor}">${balLabel}</div>
        </div>
        <div class="acct-row-chevron">›</div>
      </div>`;
  }).join('');

  const count = state.accounts.length;
  return `
    <div class="dawg-page acct-picker-page">
      <div class="dawg-hero acct-picker-hero">
        <div class="dawg-hero-glow"></div>
        <div style="display:flex;align-items:center;gap:12px;padding:14px 14px 0">
          <img src="./doberman.png" class="dawg-hero-dob" style="width:70px;flex-shrink:0" alt="">
          <div>
            <div class="acct-picker-title">My Accounts</div>
            <div class="acct-picker-sub">${count} account${count !== 1 ? 's' : ''} · tap to open</div>
          </div>
        </div>
      </div>
      <div class="acct-list">${rows}</div>
    </div>`;
}

// ── splash screen ──────────────────────────────────────────────────────────
function runSplash() {
  return new Promise(resolve => {
    const el = document.getElementById('splash-screen');
    if (!el) return resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.classList.add('dismiss');
      setTimeout(() => { el.remove(); resolve(); }, 450);
    };
    // Auto-dismiss after 1.9s (bar fills at 2.1s — starts fading just before)
    setTimeout(finish, 1900);
    // Hard fallback: if anything delays init, tap anywhere skips the splash
    el.addEventListener('click', finish, { once: true });
    // Nuclear fallback: force-remove after 5s no matter what
    setTimeout(() => { if (!done) { done = true; el.remove(); resolve(); } }, 5000);
  });
}

// ── render ─────────────────────────────────────────────────────────────────
const ANIM_CLASSES = ['anim-slide-right','anim-slide-left','anim-fade-up','anim-zoom-in','anim-zoom-out'];

function _applyPageTransition(main) {
  // Remove any existing animation classes so re-triggering works
  main.classList.remove(...ANIM_CLASSES);
  // Force reflow so removing + re-adding the class restarts the animation
  void main.offsetWidth;
  if      (_pageTransition === 'slide-right') main.classList.add('anim-slide-right');
  else if (_pageTransition === 'slide-left')  main.classList.add('anim-slide-left');
  else if (_pageTransition === 'zoom-in')     main.classList.add('anim-zoom-in');
  else if (_pageTransition === 'zoom-out')    main.classList.add('anim-zoom-out');
  else                                        main.classList.add('anim-fade-up');
  // Reset to default after each render
  _pageTransition = 'fade';
  // *** Critical: strip the class once the animation ends so overflow:hidden
  // from anim-zoom-in/out never persists and blocks scrolling ***
  main.addEventListener('animationend', () => main.classList.remove(...ANIM_CLASSES), { once: true });
}

function render() {
  if (spendingChart) { spendingChart.destroy(); spendingChart = null; }
  const main = document.getElementById('main-content');
  const appEl = document.getElementById('app');

  if (showingAccountPicker) {
    appEl?.classList.add('picker-mode');
    main.innerHTML = renderAccountPicker();
    _applyPageTransition(main);
    document.querySelectorAll('.acct-row').forEach(tile => {
      tile.addEventListener('click', async () => {
        _pageTransition = 'zoom-in';
        showingAccountPicker = false;        // set BEFORE switchAccount so its render() sees correct state
        await api.switchAccount(tile.dataset.id); // internally calls render() — no extra call needed
      });
    });
    document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="color"]):not([type="range"]):not([type="date"])').forEach(el => el.setAttribute('enterkeyhint', 'done'));
    updateDawgTopbar();
    return;
  }

  appEl?.classList.remove('picker-mode');
  switch (currentTab) {
    case 'dashboard': main.innerHTML = renderDashboard(); break;
    case 'add':       main.innerHTML = renderAdd();       break;
    case 'ledger':    main.innerHTML = renderLedger();    break;
    case 'weekly':    main.innerHTML = renderWeekly();    break;
    case 'bills':     main.innerHTML = renderBills();     break;
    case 'debt':      main.innerHTML = renderDebt();      break;
    case 'goals':     main.innerHTML = renderGoals();     break;
    case 'import':    main.innerHTML = renderImport();    break;
    case 'budgets':     main.innerHTML = renderBudgets();     break;
    case 'challenges':  main.innerHTML = renderChallenges(); break;
    case 'accounts':    main.innerHTML = renderAccounts();   break;
    case 'settings':  main.innerHTML = renderSettings();  break;
    case 'about':     main.innerHTML = renderAbout();     break;
  }
  _applyPageTransition(main);
  attachHandlers();
  updateBillBadge();
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
  // Sum all transactions on or before dateStr
  let bal = state.startingBalance || 0;
  for (const t of state.transactions) {
    if (t.date <= dateStr) bal += t.type === 'income' ? t.amount : -t.amount;
  }
  return bal;
}

// ── DAWG dashboard layout ──────────────────────────────────────────────────
function renderDashboardDawg() {
  const _curAcctD = state.accounts.find(a => a.id === currentAccountId);
  const _isDebt   = _curAcctD?.type === 'credit' || _curAcctD?.type === 'loan';

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
    const _incUpTo = state.transactions.filter(t=>t.date<=balAsOfStr&&t.type==='income').reduce((s,t)=>s+t.amount,0);
    const _expUpTo = state.transactions.filter(t=>t.date<=balAsOfStr&&t.type==='expense').reduce((s,t)=>s+t.amount,0);
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

  // Budget overview — prefer weekly planner per-week budget; fall back to monthly budget total
  const _wp         = state.weekly_plan;
  const weekBudget  = parseFloat(_wp?.per_week || 0);
  const _wkNow      = new Date(); _wkNow.setHours(0,0,0,0);
  const _wkMon      = new Date(_wkNow); _wkMon.setDate(_wkNow.getDate() - (_wkNow.getDay()===0?6:_wkNow.getDay()-1));
  const _monStr     = _wkMon.toISOString().split('T')[0];
  const _wkExp      = state.transactions.filter(t => t.type==='expense' && t.date >= _monStr).reduce((s,t)=>s+t.amount,0);
  const _wkInc      = state.transactions.filter(t => t.type==='income'  && t.date >= _monStr).reduce((s,t)=>s+t.amount,0);
  const weekSpent   = Math.max(0, _wkExp - _wkInc);
  // Carry-over: if previous weeks in this plan cycle were over/under budget, adjust this week's budget
  let effectiveWeekBudget = weekBudget;
  if (weekBudget > 0 && _wp?.saved_date && !isPastDash) {
    const _planOrigin = new Date(_wp.saved_date + 'T00:00:00');
    _planOrigin.setDate(_planOrigin.getDate() - (_planOrigin.getDay()===0?6:_planOrigin.getDay()-1)); // snap to Monday
    const _msPerWeek = 7*24*60*60*1000;
    const _completedWks = Math.floor((_wkMon - _planOrigin) / _msPerWeek);
    if (_completedWks > 0) {
      const _originStr  = _planOrigin.toISOString().split('T')[0];
      const _pastExp    = state.transactions.filter(t=>t.type==='expense'&&t.date>=_originStr&&t.date<_monStr).reduce((s,t)=>s+t.amount,0);
      const _pastInc    = state.transactions.filter(t=>t.type==='income' &&t.date>=_originStr&&t.date<_monStr).reduce((s,t)=>s+t.amount,0);
      const _pastNet    = Math.max(0, _pastExp - _pastInc);
      const _carryOver  = _completedWks * weekBudget - _pastNet; // positive = banked, negative = debt
      effectiveWeekBudget = Math.max(0, weekBudget + _carryOver);
    }
  }
  const totalBudget = (weekBudget ? effectiveWeekBudget : 0) || Object.values(state.budgets||{}).reduce((s,v)=>s+(parseFloat(v)||0),0);
  const budgetSpent = (weekBudget && !isPastDash) ? weekSpent : mExp;
  const budgetPct   = totalBudget > 0 ? Math.min(budgetSpent / totalBudget * 100, 100) : 0;
  const budgetColor = budgetPct >= 90 ? 'var(--danger)' : budgetPct >= 75 ? 'var(--warn)' : 'var(--accent)';
  const budgetLbl   = weekBudget ? 'weekly' : 'monthly';
  const _ds            = loadSettings();
  const _showBudget    = _ds.dawgBudget         !== false;
  const _showBreakdown = _ds.dawgBreakdown       !== false;
  const _showGoals     = _ds.dawgGoals           !== false;
  const _showTxns      = _ds.dawgTransactions    !== false;
  const _showNetWorth  = _ds.dawgNetWorth         === true;
  const _showInsights  = _ds.dawgInsights         === true;

  const totalMExp  = Object.values(bycat).reduce((s,v)=>s+v, 0);
  const catEntries = Object.entries(bycat).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const catIcons   = { Food:'🍔', Gas:'⛽', Car:'🚗', Boat:'⛵', Tools:'🔧', Home:'🏠', Entertainment:'🎮', Health:'❤️', Shopping:'🛍️', Transport:'🚗', Housing:'🏠', Other:'💬' };

  const spendHtml = catEntries.length ? catEntries.map(([cat,amt]) => {
    const pct = totalMExp > 0 ? (amt/totalMExp*100).toFixed(0) : 0;
    const barW = totalMExp > 0 ? (amt/totalMExp*100).toFixed(1) : 0;
    return `<div class="dawg-cat-row">
      <span class="dawg-cat-icon">${catIcons[cat]||'💰'}</span>
      <span class="dawg-cat-name">${cat}</span>
      <div class="dawg-cat-bar-wrap"><div class="dawg-cat-bar" style="width:${barW}%"></div></div>
      <span class="dawg-cat-amt">${fmt(amt)}</span>
      <span class="dawg-cat-pct">${pct}%</span>
    </div>`;
  }).join('') : '<p class="dawg-empty">No spending this month</p>';

  const goals = state.goals || [];
  const goalsHtml = goals.slice(0,3).map(g => {
    const pct = g.target > 0 ? Math.min(g.current/g.target*100,100) : 0;
    return `<div class="dawg-goal-row">
      <div class="dawg-goal-icon">🎯</div>
      <div class="dawg-goal-info">
        <div class="dawg-goal-name">${g.name}</div>
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
    const icon   = isInc ? '💵' : (catIcons[t.category] || '💳');
    const dlbl   = t.date === todayStr ? 'Today' : t.date === yesterdayStr ? 'Yesterday' : t.date.slice(5);
    return `<div class="dawg-txn-row">
      <div class="dawg-txn-icon">${icon}</div>
      <div class="dawg-txn-info">
        <div class="dawg-txn-desc">${t.description || t.category || '—'}</div>
        <div class="dawg-txn-date">${dlbl}</div>
      </div>
      <div class="dawg-txn-amt" style="color:${color}">${sign}${fmt(t.amount)}</div>
    </div>`;
  }).join('') : '<p class="dawg-empty">No transactions yet</p>';

  const multiAcct = state.accounts && state.accounts.length > 1;
  const _curAcct  = state.accounts.find(a => a.id === currentAccountId);
  const _acctName = _curAcct?.name || 'Account';
  return `<div class="dawg-page">
    <div class="dawg-hero">
      <div class="dawg-hero-glow"></div>
      <div class="dawg-hero-inner">
        <div class="dawg-hero-tagline">YOUR DAWG<br>IS WATCHING.<br><em class="dawg-lockin">LOCK TF IN.</em></div>
        <img src="./doberman.png" class="dawg-hero-dob" alt="">
      </div>
    </div>

    <div class="dawg-balance-card">
      <div class="dawg-balance-label">${_isDebt ? (_curAcctD?.type==='loan' ? 'LOAN BALANCE' : 'BALANCE OWED') : 'TOTAL BALANCE'}</div>
      <div class="dawg-balance-amt" style="color:${balColor}">${fmt(balance)}</div>
      ${paymentDueStr ? `<div class="dawg-balance-due" style="color:${parseInt(_curAcctD?.payment_due_day)>0&&Math.round((new Date(new Date().getFullYear(),new Date().getMonth(),parseInt(_curAcctD.payment_due_day))-new Date())/86400000)<=3?'var(--warn)':'var(--muted)'}">${paymentDueStr}</div>` : ''}
      <div class="dawg-balance-delta" style="color:${deltaColor}">${deltaStr}</div>
      <div class="dawg-sparkline-wrap"><canvas id="dawg-sparkline"></canvas></div>
      <div class="dawg-time-btns">
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

    ${_showBudget && !_isDebt ? `<div class="dawg-mid-row">
      <div class="dawg-overview-card">
        <div class="dawg-card-title">BUDGET OVERVIEW</div>
        <div class="dawg-donut-wrap">
          <canvas id="dawg-donut" width="120" height="120"></canvas>
          <div class="dawg-donut-center">
            <div class="dawg-donut-pct" style="color:${budgetColor}">${budgetPct.toFixed(0)}%</div>
            <div class="dawg-donut-lbl">of budget<br>used</div>
          </div>
        </div>
        <div class="dawg-budget-row">
          <div class="dawg-budget-stat"><span class="dawg-stat-val">${fmt(budgetSpent)}</span><span class="dawg-stat-lbl">spent</span></div>
          <div class="dawg-budget-stat"><span class="dawg-stat-val">${fmt(totalBudget)}</span><span class="dawg-stat-lbl">${budgetLbl}</span></div>
        </div>
        <button class="dawg-view-btn" id="dawg-goto-budgets">VIEW BUDGET ›</button>
      </div>
      ${_showBreakdown ? `<div class="dawg-breakdown-card">
        <div class="dawg-card-title">SPENDING BREAKDOWN</div>
        <div class="dawg-cat-list">${spendHtml}</div>
        <button class="dawg-view-btn" id="dawg-goto-ledger">VIEW ANALYTICS ›</button>
      </div>` : ''}
    </div>` : (_isDebt && _showBreakdown && _curAcctD?.type !== 'loan') ? `<div class="dawg-mid-row">
      <div class="dawg-breakdown-card" style="flex:1">
        <div class="dawg-card-title">SPENDING BREAKDOWN</div>
        <div class="dawg-cat-list">${spendHtml}</div>
        <button class="dawg-view-btn" id="dawg-goto-ledger">VIEW ANALYTICS ›</button>
      </div>
    </div>` : ''}

    ${_isDebt ? (() => {
      const _payoff = calcDebtPayoff(balance, _curAcctD?.interest_rate, _curAcctD?.monthly_payment);
      const _noPayoff = _curAcctD?.monthly_payment && balance > 0 && !_payoff;
      return `<div class="dawg-section-card dawg-due-tile">
        <div class="dawg-section-hdr">
          <span class="dawg-card-title">DEBT DETAILS</span>
        </div>
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
    })() : ''}

    ${_showGoals && goals.length ? `<div class="dawg-section-card">
      <div class="dawg-section-hdr">
        <span class="dawg-card-title">SAVINGS GOALS</span>
        <button class="dawg-view-all" id="dawg-goto-goals">VIEW ALL</button>
      </div>
      ${goalsHtml}
    </div>` : ''}

    ${_showTxns ? `<div class="dawg-section-card" style="margin-bottom:14px">
      <div class="dawg-section-hdr">
        <span class="dawg-card-title">${isPastDash ? dashMonthLabel.toUpperCase() + ' TRANSACTIONS' : 'RECENT TRANSACTIONS'}</span>
        <button class="dawg-view-all" id="dawg-goto-txns">VIEW ALL</button>
      </div>
      ${recentTxns.length ? txnHtml : `<p class="dawg-empty">No transactions in ${dashMonthLabel}</p>`}
    </div>` : ''}

    ${(() => {
      if (!_showNetWorth || _isDebt) return '';
      const nw = getNetWorth();
      if (state.accounts.length < 1) return '';
      return `<div class="dawg-section-card" style="margin-bottom:14px">
        <div class="dawg-section-hdr"><span class="dawg-card-title">NET WORTH</span></div>
        <div style="font-size:1.4rem;font-weight:700;color:${nw.total >= 0 ? 'var(--success)' : 'var(--danger)'};margin-bottom:10px">${fmt(nw.total)}</div>
        ${nw.accounts.map(a => {
          const isDebtA = a.type === 'credit' || a.type === 'loan';
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:.82rem;color:var(--text)">${a.name}${isDebtA ? `<span style="font-size:.7rem;color:var(--muted);margin-left:4px">(${a.type})</span>` : ''}</span>
            <span style="font-size:.82rem;font-weight:600;color:${a.balance >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(a.balance)}</span>
          </div>`;
        }).join('')}
      </div>`;
    })()}

    ${(() => {
      if (!_showInsights || _isDebt) return '';
      const ins = getSpendingInsights(dashMonth);
      if (!ins.length) return '';
      return `<div class="dawg-section-card" style="margin-bottom:14px">
        <div class="dawg-section-hdr"><span class="dawg-card-title">SPENDING INSIGHTS</span></div>
        ${ins.map(i => `<div style="font-size:.82rem;color:var(--text);padding:5px 0;border-bottom:1px solid var(--border);line-height:1.45">${i}</div>`).join('')}
      </div>`;
    })()}
  </div>`;
}

// ── dashboard ──────────────────────────────────────────────────────────────
function renderDashboard() {
  return renderDashboardDawg();
}

// ── budgets ────────────────────────────────────────────────────────────────
function getSmartBudgetSuggestions() {
  const now = new Date();
  const suggestions = {};
  const monthsWithData = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsWithData.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  for (const cat of getCategories()) {
    const monthlySums = monthsWithData.map(m =>
      state.transactions.filter(t => t.type==='expense' && t.category===cat && t.date.startsWith(m))
        .reduce((s,t) => s+t.amount, 0)
    ).filter(v => v > 0);
    if (monthlySums.length >= 1) {
      const avg = monthlySums.reduce((s,v) => s+v, 0) / monthlySums.length;
      suggestions[cat] = Math.ceil(avg / 5) * 5; // round up to nearest $5
    }
  }
  return suggestions;
}

function renderBudgets() {
  const m = new Date().toISOString().slice(0, 7);
  const { bycat } = monthTotals(m);
  const suggestions = getSmartBudgetSuggestions();
  const hasSuggestions = Object.keys(suggestions).length > 0;
  const suggestionsHtml = hasSuggestions ? `
    <div class="budget-suggest-banner">
      <div class="budget-suggest-hdr">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
        Smart Suggestions
        <span style="font-size:.75rem;font-weight:500;color:var(--muted)">based on your last 3 months</span>
      </div>
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
      <button id="budget-apply-all" class="btn-secondary" style="margin-top:10px;width:100%">Apply All Suggestions</button>
    </div>` : '';
  const rows = getCategories().map(cat => {
    const spent    = bycat[cat] || 0;
    const limit    = parseFloat(state.budgets[cat] || 0);
    const pct      = limit > 0 ? Math.min(spent / limit * 100, 100) : 0;
    const catColor = CAT_COLORS[cat] || '#9896a4';
    const barColor = pct >= 90 ? 'var(--danger)' : pct >= 75 ? 'var(--warn)' : catColor;
    const progressHtml = limit > 0 ? `
      <div class="budget-progress-wrap">
        <div class="breakdown-bar-bg small"><div class="breakdown-bar-fill" style="width:${pct.toFixed(1)}%;background:${barColor}"></div></div>
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
  // Apply single suggestion
  document.querySelectorAll('.budget-suggest-apply').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById('budget-' + btn.dataset.cat);
      if (inp) { inp.value = btn.dataset.amt; btn.textContent = '✓'; btn.disabled = true; }
    });
  });
  // Apply all suggestions
  document.getElementById('budget-apply-all')?.addEventListener('click', () => {
    const suggestions = getSmartBudgetSuggestions();
    Object.entries(suggestions).forEach(([cat, amt]) => {
      const inp = document.getElementById('budget-' + cat);
      if (inp) inp.value = amt;
    });
    document.querySelectorAll('.budget-suggest-apply').forEach(btn => { btn.textContent = '✓'; btn.disabled = true; });
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
    const curMonth = today.toISOString().slice(0, 7);
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

  const catOptions = getCategories().map(c => `<option>${c}</option>`).join('');

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
          ${ch.data.category} · ${days} day${days !== 1 ? 's' : ''} left
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
          ${ch.data.category} · ${fmt(spent)} of ${fmt(ch.data.target)} target
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
    : `<div style="text-align:center;padding:24px 0;color:var(--muted);font-size:.85rem">No active challenges — start one below!</div>`;

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
      const today = new Date().toISOString().slice(0,10);
      const endPast = ch.type === 'spending_freeze'
        ? ch.data.endDate < today
        : ch.data.month < today.slice(0,7);
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
  const catOptions  = getCategories().map(c => `<option>${c}</option>`).join('');
  const acctOptions = state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  const toAcctOptions = state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
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
            <label class="radio-label"><input type="radio" name="etype" value="transfer"> Transfer</label>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">Amount ($)</label>
          <input type="number" id="add-amount" class="form-input" placeholder="0.00" step="0.01" min="0" inputmode="decimal">
        </div>
        <div class="form-row" id="add-desc-row">
          <label class="form-label">Description</label>
          <input type="text" id="add-desc" class="form-input" placeholder="What was this for?">
        </div>
        <div class="form-row" id="add-cat-row">
          <label class="form-label">Category</label>
          <select id="add-cat" class="form-input form-select">${catOptions}</select>
        </div>
        <div class="form-row" id="add-split-row">
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
          <label class="form-label">To Account</label>
          <select id="add-to-acct" class="form-input form-select">${toAcctOptions}</select>
        </div>
        <div class="form-row">
          <label class="form-label">Date</label>
          <input type="date" id="add-date" class="form-input" value="${today()}">
        </div>
        <div class="form-row" id="add-recurring-row">
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
  const cats = getCategories();
  const catOptFilter = cats.map(c =>
    `<option value="${c}"${c === ledgerCatFilter ? ' selected' : ''}>${c}</option>`).join('');

  let rows = state.transactions.map((t, i) => ({ ...t, _i: i }));
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
  const rowsHtml = rows.map(t => {
    const sign      = t.type === 'income' ? '+' : '-';
    const cls       = t.type === 'income' ? 'income' : 'expense';
    const prefix    = t.recurring ? '↻ ' : '';
    const catColor  = CAT_COLORS[t.category] || '#9896a4';
    const acct      = state.accounts.find(a => a.id === (t.account || 'main'));
    const acctBadge = acct && acct.id !== 'main' ? `<span class="acct-badge">${acct.name}</span>` : '';
    const allCats   = [...new Set([...cats, t.category])];
    const catOptions = allCats.map(c =>
      `<option value="${c}"${c === t.category ? ' selected' : ''}>${c}</option>`).join('');
    return `
      <div class="ledger-row" data-idx="${t._i}">
        <div class="ledger-row-inner">
          <div class="ledger-main">
            <div class="ledger-desc"><span class="cat-dot" style="background:${catColor}"></span>${prefix}${t.description}</div>
            <div class="ledger-meta">${t.date} · ${t.category}${acctBadge}</div>
          </div>
          <div class="ledger-right">
            <div class="ledger-amt ${cls}">${sign}${fmt(t.amount)}</div>
            <div class="ledger-running-bal">bal: ${fmt(runBal[t._i])}</div>
            <button class="ledger-edit-btn" data-idx="${t._i}" title="Edit">✏️</button>
            <button class="ledger-delete" data-idx="${t._i}">✕</button>
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
            <input type="text" class="form-input ie-desc" value="${t.description}" placeholder="Description">
            <input type="number" class="form-input ie-amount" value="${t.amount}" step="0.01" min="0" placeholder="Amount" inputmode="decimal">
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
      <p class="page-sub">${rows.length} transaction${rows.length !== 1 ? 's' : ''}</p>
      <div class="ledger-filter-bar">
        <div class="lf-row1">
          <input type="search" id="ledger-search" class="form-input lf-search" placeholder="Search…" value="${ledgerFilter}">
          <select id="ledger-sort" class="form-input lf-sort">
            <option value="date-desc"${ledgerSort === 'date-desc' ? ' selected' : ''}>Newest</option>
            <option value="date-asc"${ledgerSort === 'date-asc' ? ' selected' : ''}>Oldest</option>
            <option value="amount-desc"${ledgerSort === 'amount-desc' ? ' selected' : ''}>$ High</option>
            <option value="amount-asc"${ledgerSort === 'amount-asc' ? ' selected' : ''}>$ Low</option>
          </select>
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
          <button id="ledger-export-csv" class="btn-xs">📥 CSV</button>
        </div>
      </div>
      <div class="ledger-list">
        ${rowsHtml || (state.transactions.length === 0
          ? emptyState('No transactions yet', 'Tap Add to log your first one')
          : '<p style="padding:24px 0;text-align:center;color:var(--muted);font-size:.85rem">No matching transactions</p>')}
      </div>
    </div>`;
}

// ── weekly ─────────────────────────────────────────────────────────────────
function renderWeekly() {
  const { income, expense } = totals();
  const wp = state.weekly_plan;
  const defBalance = wp.balance ?? ((state.startingBalance || 0) + income - expense).toFixed(2);
  const defBills   = wp.bills   ?? '0';
  const defBuffer  = wp.buffer  ?? 10;
  const defPaydate = wp.paydate ?? (() => {
    const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0];
  })();
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
      <div id="wk-live"></div>
      <div id="wk-week-section" style="display:none">
        <h2 class="section-title" style="margin-bottom:10px">Week-by-week breakdown</h2>
        <div class="wkb-rows" id="wk-past-rows"></div>
        <div class="wkb-rows" id="wk-future-rows"></div>
      </div>
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
    ['PER WEEK',  fmt(perWeek),   'var(--warn)',    `across ${weeks} week${weeks!==1?'s':''}`],
    ['PER DAY',   fmt(perDay),    'var(--warn)',    'daily limit'],
    ...(bufPct ? [['BUFFER', fmt(buffer), '#6ec8d8', 'emergency fund']] : []),
  ].map(([t,v,c,s]) => `<div class="card"><div class="card-title">${t}</div><div class="card-value" style="color:${c}">${v}</div><div class="card-sub">${s}</div></div>`).join('');

  const thisWeekTxns = state.transactions.filter(t=>t.date>=mondayStr).sort((a,b)=>b.date.localeCompare(a.date));
  const thisWeekTxnHtml = thisWeekTxns.length
    ? thisWeekTxns.map(t=>`<div class="pw-txn-row"><span class="pw-txn-date">${t.date}</span><span class="pw-txn-amt" style="color:${t.type==='income'?'var(--success)':'var(--danger)'}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</span><span class="pw-txn-cat">${t.category||''}</span><span class="pw-txn-desc">${t.description||''}</span></div>`).join('')
    : '<p class="pw-empty">No transactions yet this week.</p>';

  const monLabel = monday.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const paydate  = paydateStr ? new Date(paydateStr+'T00:00:00') : new Date(now.getTime()+(days-1)*86400000);

  // ── Unified week list: find the earliest Monday that has data (up to 12 weeks back)
  // then build one continuous list through to paydate — no weeks ever shift or disappear.
  let startMonday = new Date(monday);
  for (let i = 12; i >= 1; i--) {
    const m  = new Date(monday); m.setDate(monday.getDate() - i*7);
    const mS = m.toISOString().split('T')[0];
    const mE = new Date(m); mE.setDate(m.getDate() + 6);
    const mES = mE.toISOString().split('T')[0];
    if (state.transactions.some(t => t.date >= mS && t.date <= mES)) { startMonday = m; break; }
  }

  const totalDaysSpan = Math.round((paydate - startMonday) / 86400000) + 1;
  const totalWeeks    = Math.max(1, Math.ceil(totalDaysSpan / 7));

  const txnRow = t => `<div class="pw-txn-row"><span class="pw-txn-date">${t.date}</span><span class="pw-txn-amt" style="color:${t.type==='income'?'var(--success)':'var(--danger)'}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</span><span class="pw-txn-cat">${t.category||''}</span><span class="pw-txn-desc">${t.description||''}</span></div>`;

  const pastRowsHtml  = [];
  const futureRowsHtml = [];

  Array.from({length: totalWeeks}, (_, w) => {
    const sd = new Date(startMonday); sd.setDate(startMonday.getDate() + w*7);
    const ed = new Date(startMonday); ed.setDate(startMonday.getDate() + (w+1)*7 - 1);
    if (ed > paydate) ed.setTime(paydate.getTime());
    const sdS = sd.toISOString().split('T')[0];
    const edS = ed.toISOString().split('T')[0];
    const isCurrent = sdS <= mondayStr && mondayStr <= edS;
    const isPast    = edS < mondayStr;
    const lbl = `${sd.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${ed.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
    const wkTxns = state.transactions.filter(t=>t.date>=sdS&&t.date<=edS);
    const wkExp  = wkTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const wkInc  = wkTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const wkNet  = Math.max(0, wkExp - wkInc);
    const txnHtml = wkTxns.length
      ? wkTxns.sort((a,b)=>b.date.localeCompare(a.date)).map(txnRow).join('')
      : '<p class="pw-empty">No transactions.</p>';

    if (isPast) {
      // Past weeks — static, only transaction data, never recalculated from settings
      const pastPct      = perWeek > 0 ? Math.min(wkExp / perWeek * 100, 100) : 0;
      const pastBarColor = wkExp > perWeek && perWeek > 0 ? 'var(--danger)' : wkExp >= perWeek * 0.8 && perWeek > 0 ? 'var(--warn)' : 'var(--muted)';
      const spentColor   = perWeek > 0 && wkExp > perWeek ? 'var(--danger)' : wkExp > 0 ? 'var(--text)' : 'var(--muted)';
      const spentLabel   = wkExp > 0 ? `${fmt(wkExp)} / ${fmt(perWeek)}` : 'No spending';
      const miniBar      = perWeek > 0 ? `<div class="breakdown-bar-bg small" style="flex:1;margin:0 8px"><div class="breakdown-bar-fill" style="width:${pastPct.toFixed(1)}%;background:${pastBarColor}"></div></div>` : `<span style="flex:1"></span>`;
      pastRowsHtml.push(`<div class="wkb-row wkb-past"><div class="wkb-header"><span class="week-dates">${lbl}</span>${miniBar}<span class="wkb-amounts" style="color:${spentColor}">${spentLabel}</span><span class="pw-week-toggle">▼</span></div><div class="pw-week-txns">${txnHtml}</div></div>`);
    } else {
      // Current + future weeks — live, recalculated on every settings change
      const wkPct   = perWeek > 0 ? Math.min(wkNet/perWeek*100,100) : 0;
      const wkColor = wkPct>=100?'var(--danger)':wkPct>=80?'var(--warn)':wkNet>0?'var(--success)':'var(--muted)';
      const badge   = isCurrent ? '<span class="wkb-current-badge">THIS WEEK</span>' : '';
      futureRowsHtml.push(`<div class="wkb-row${isCurrent?' wkb-current':''}"><div class="wkb-header">${badge}<span class="week-dates">${lbl}</span><div class="breakdown-bar-bg small"><div class="breakdown-bar-fill" style="width:${wkPct.toFixed(1)}%;background:${wkColor}"></div></div><span class="wkb-amounts" style="color:${wkColor}">${fmt(wkNet)} / ${fmt(perWeek)}</span><span class="pw-week-toggle">▼</span></div><div class="pw-week-txns">${txnHtml}</div></div>`);
    }
  });

  // ── Write summary + this-week tracker to #wk-live (always updated) ─────
  const liveEl = document.getElementById('wk-live');
  if (!liveEl) return;
  liveEl.innerHTML = `
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
    </div>`;
  liveEl.querySelector('.wt-txns-toggle')?.addEventListener('click', function() {
    const body = this.nextElementSibling;
    const open = body.style.display !== 'block';
    body.style.display = open ? 'block' : 'none';
    this.textContent = open ? '▲  hide transactions' : '▼  show transactions';
  });

  // ── Write past rows ONCE — never overwrite if already populated ─────────
  const pastEl = document.getElementById('wk-past-rows');
  if (pastEl && !pastEl.children.length && pastRowsHtml.length) {
    pastEl.innerHTML = pastRowsHtml.join('');
    pastEl.querySelectorAll('.wkb-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const txns = hdr.nextElementSibling;
        const tog  = hdr.querySelector('.pw-week-toggle');
        const open = txns.style.display !== 'block';
        txns.style.display = open ? 'block' : 'none';
        if (tog) tog.textContent = open ? '▲' : '▼';
      });
    });
  }

  // ── Always rebuild current + future rows ───────────────────────────────
  const futureEl = document.getElementById('wk-future-rows');
  if (futureEl) {
    futureEl.innerHTML = futureRowsHtml.join('');
    futureEl.querySelectorAll('.wkb-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const txns = hdr.nextElementSibling;
        const tog  = hdr.querySelector('.pw-week-toggle');
        const open = txns.style.display !== 'block';
        txns.style.display = open ? 'block' : 'none';
        if (tog) tog.textContent = open ? '▲' : '▼';
      });
    });
  }

  // Show the week-by-week section if there's anything to show
  const weekSection = document.getElementById('wk-week-section');
  if (weekSection) weekSection.style.display = '';
}

// ── bills ──────────────────────────────────────────────────────────────────
function renderBills() {
  const m = new Date().toISOString().slice(0, 7);
  const catOptions = getCategories().map(c => `<option>${c}</option>`).join('');
  const billsHtml = state.bills.length ? state.bills.map((b, i) => {
    const d    = getDaysUntilDue(b.dueDay);
    const paid = b.paidMonth === m;
    let badge  = '';
    if (paid)        badge = '<span class="bill-badge paid">PAID</span>';
    else if (d === 0) badge = '<span class="bill-badge due-today">TODAY</span>';
    else if (d <= 3)  badge = `<span class="bill-badge due-soon">in ${d}d</span>`;
    else if (d <= 7)  badge = `<span class="bill-badge upcoming-soon">in ${d}d</span>`;
    else              badge = `<span class="bill-badge upcoming">day ${b.dueDay}</span>`;
    return `
      <div class="bill-card">
        <div class="bill-card-main">
          <span class="cat-dot" style="background:${CAT_COLORS[b.category]||'#9896a4'}"></span>
          <div class="bill-card-info">
            <div class="bill-card-name">${b.name}</div>
            <div class="bill-card-meta">${b.category} · due day ${b.dueDay} of month</div>
          </div>
          <div class="bill-card-right">
            <div class="bill-card-amt">${fmt(b.amount)}</div>
            ${badge}
          </div>
        </div>
        <div class="bill-card-actions">
          <button class="btn-xs bill-paid-btn" data-idx="${i}" data-paid="${paid}">${paid ? 'Mark Unpaid' : '✓ Mark Paid'}</button>
          <button class="btn-xs bill-delete-btn" style="background:var(--danger);color:white;border-color:var(--danger)" data-idx="${i}">Delete</button>
        </div>
      </div>`;
  }).join('') : emptyState('No bills yet', 'Add a recurring bill below to start tracking');

  const totalMonthly = state.bills.reduce((s, b) => s + b.amount, 0);
  const totalUnpaid  = state.bills.filter(b => b.paidMonth !== m).reduce((s, b) => s + b.amount, 0);

  // ── bill calendar ──────────────────────────────────────────────────────────
  const billCalHtml = (() => {
    if (!state.bills.length) return '';
    const now2     = new Date();
    const yr2      = now2.getFullYear();
    const mo2      = now2.getMonth();
    const firstDay = new Date(yr2, mo2, 1).getDay();   // 0=Sun
    const daysInM  = new Date(yr2, mo2 + 1, 0).getDate();
    const todayD   = now2.getDate();
    const curM     = now2.toISOString().slice(0, 7);
    // Map dueDay -> bills
    const billsByDay = {};
    state.bills.forEach(b => { (billsByDay[b.dueDay] = billsByDay[b.dueDay] || []).push(b); });
    const dayHdrs = ['S','M','T','W','T','F','S'].map(d => `<div class="bcal-hdr">${d}</div>`).join('');
    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<div class="bcal-cell"></div>';
    for (let d = 1; d <= daysInM; d++) {
      const bs   = billsByDay[d] || [];
      const paid = bs.length && bs.every(b => b.paidMonth === curM);
      const cls  = ['bcal-cell', d === todayD ? 'today' : '', bs.length ? (paid ? 'bill-paid' : 'bill-due') : ''].filter(Boolean).join(' ');
      const tip  = bs.map(b => b.name).join(', ');
      cells += `<div class="${cls}"${tip ? ` title="${tip}"` : ''}><span class="bcal-num">${d}</span>${bs.length ? '<span class="bcal-dot"></span>' : ''}</div>`;
    }
    return `
      <div class="bill-cal">
        <div class="bcal-month">${now2.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</div>
        <div class="bcal-legend"><span class="bcal-legend-due"></span>Due <span class="bcal-legend-paid"></span>Paid</div>
        <div class="bcal-grid">${dayHdrs}${cells}</div>
      </div>`;
  })();

  return `
    <div class="page">
      <h1 class="page-title">Bills</h1>
      <p class="page-sub">track recurring monthly bills</p>
      ${state.bills.length ? `
      <div class="cards-grid" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">MONTHLY TOTAL</div>
          <div class="card-value" style="color:var(--accent2)">${fmt(totalMonthly)}</div>
          <div class="card-sub">all bills</div>
        </div>
        <div class="card">
          <div class="card-title">STILL DUE</div>
          <div class="card-value" style="color:${totalUnpaid>0?'var(--warn)':'var(--success)'}">${fmt(totalUnpaid)}</div>
          <div class="card-sub">this month</div>
        </div>
      </div>
      ${billCalHtml}` : ''}
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
        <div id="bill-status" class="form-status"></div>
        <button id="bill-add-btn" class="btn-primary">Add Bill</button>
      </div>
      <h2 class="section-title">Your Bills</h2>
      <div class="bills-list">${billsHtml}</div>
    </div>`;
}

function attachBills() {
  document.getElementById('bill-add-btn')?.addEventListener('click', async () => {
    const name    = document.getElementById('bill-name').value.trim();
    const amount  = parseFloat(document.getElementById('bill-amount').value);
    const dueDay  = parseInt(document.getElementById('bill-dueday').value);
    const category = document.getElementById('bill-cat').value;
    if (!name) { showStatus('bill-status', 'Enter a bill name.', 'error'); return; }
    if (isNaN(amount) || amount <= 0) { showStatus('bill-status', 'Enter a valid amount.', 'error'); return; }
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) { showStatus('bill-status', 'Enter a day 1–31.', 'error'); return; }
    state.bills.push({ id: Date.now(), name, amount, dueDay, category, paidMonth: null });
    await api.saveBills(state.bills);
    render();
  });

  document.querySelectorAll('.bill-paid-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i    = parseInt(btn.dataset.idx);
      const paid = btn.dataset.paid === 'true';
      const m    = new Date().toISOString().slice(0, 7);
      state.bills[i].paidMonth = paid ? null : m;
      await api.saveBills(state.bills);
      if (!paid) haptic([20, 40, 20]);
      if (!paid) {
        // Was just marked paid — offer to log as expense
        const b = state.bills[i];
        showConfirmModal({
          title: 'Log as Expense?',
          message: `Add "${b.name}" as a ${fmt(b.amount)} expense?`,
          confirmText: 'Log it',
          cancelText: 'Skip',
          onConfirm: async () => {
            await api.addTransaction({
              type: 'expense', amount: b.amount, description: b.name,
              category: b.category, date: new Date().toISOString().slice(0, 10), account: currentAccountId,
            });
            render();
          },
          onCancel: () => render(),
        });
      } else { render(); }
    });
  });

  document.querySelectorAll('.bill-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      showConfirmModal({
        title: 'Delete Bill',
        message: `Delete "${state.bills[i].name}"? This cannot be undone.`,
        confirmText: 'Delete', danger: true,
        onConfirm: async () => { state.bills.splice(i, 1); await api.saveBills(state.bills); render(); },
      });
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
          <span class="goal-name">${g.name}</span>
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

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:6px">📤 Export to Excel / CSV</h2>
        <p class="code-hint" style="margin-bottom:12px">Opens directly in Excel. Includes Date, Type, Category, Description, Amount, Signed Amount, Running Balance, Account, and Recurring columns.</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button id="export-csv-btn" class="btn-primary">⬇ Export This Account (CSV)</button>
          <button id="export-csv-all-btn" class="btn-primary" style="background:var(--surface2);border:1px solid var(--border);color:var(--text)">⬇ Export All Accounts (CSV)</button>
          <button id="export-json-btn" class="btn-primary" style="background:var(--surface2);border:1px solid var(--border);color:var(--text)">⬇ Download Budget DAWGs Backup (JSON)</button>
        </div>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:6px">📥 Import from Excel / CSV</h2>
        <p class="code-hint">Accepts files saved from Excel as CSV. Required columns: <strong>Date</strong> and <strong>Amount</strong>. Optional: Type, Category, Description, Account.</p>
        <p class="code-hint" style="margin-top:6px">Date formats accepted: <code>2026-05-20</code>, <code>5/20/2026</code>, <code>05/20/26</code></p>
        <p class="code-hint" style="margin-top:4px">Also works with most bank export formats (Debit/Credit columns, accounting negatives, etc.)</p>
        <button id="export-template-btn" class="btn-xs" style="margin-top:8px;margin-bottom:2px">⬇ Download blank template</button>
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
        <h2 class="section-title" style="margin-bottom:6px">📥 Restore from Backup</h2>
        <p class="code-hint">Restores everything from a Budget DAWGs JSON backup file.</p>
        <div id="json-import-status" class="form-status" style="margin-top:6px"></div>
        <label class="btn-primary" style="display:inline-block;margin-top:8px;cursor:pointer;text-align:center;width:100%;box-sizing:border-box">
          ⬆ Load Backup File
          <input type="file" id="import-json-file" accept=".json" style="display:none">
        </label>
      </div>
    </div>`;
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
  const today = new Date().toISOString().slice(0,10);
  if (s.lastNotifDate === today) return;
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
  s.lastNotifDate = today;
  saveSettings(s);
}

// ── settings ───────────────────────────────────────────────────────────────
function renderSettings() {
  const s          = loadSettings();
  const theme      = s.theme || 'dark';
  const customCats = s.customCategories || [];
  const fontStyle  = s.fontStyle || 'default';
  const bioEnabled = !!localStorage.getItem('slawminyaw_biometric_cred');

  const fontBtns = [
    { key:'default',  label:'Default',  sub:'Plus Jakarta Sans' },
    { key:'system',   label:'System',   sub:'iOS / Segoe UI' },
    { key:'terminal', label:'Terminal', sub:'Consolas / Menlo' },
  ].map(f => `<button class="nav-pos-btn${fontStyle === f.key ? ' active' : ''}" data-font-style="${f.key}" style="line-height:1.3"><span style="display:block">${f.label}</span><span style="font-size:.65rem;opacity:.55;font-weight:400;font-family:'Plus Jakarta Sans',sans-serif">${f.sub}</span></button>`).join('');

  const customCatRows = customCats.length ? customCats.map((c, i) => `
    <div class="custom-cat-row">
      <span class="custom-cat-name">${c}</span>
      <button class="btn-xs custom-cat-del" data-idx="${i}" style="background:var(--danger);color:#fff;border-color:var(--danger)">✕</button>
    </div>`).join('') : '<p style="font-size:.8rem;color:var(--muted);margin-bottom:6px">No custom categories yet.</p>';

  const themeDot = theme === 'light'
    ? 'background:#ffffff;border:1.5px solid #bbb'
    : `background:${THEMES[theme]?.accent || 'var(--accent)'}`;

  return `
    <div class="page">
      <h1 class="page-title">Settings</h1>

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
        <h2 class="section-title" style="margin-bottom:10px">Theme</h2>
        <div style="display:flex;align-items:center;gap:10px">
          <span id="theme-swatch" style="width:20px;height:20px;border-radius:50%;flex-shrink:0;${themeDot}"></span>
          <select id="theme-select" class="form-input form-select" style="flex:1">
            ${Object.entries(THEMES).map(([key, t]) =>
              `<option value="${key}"${theme === key ? ' selected' : ''}>${t.label}</option>`
            ).join('')}
          </select>
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
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Dashboard Tiles</h2>
        <p class="code-hint" style="margin-bottom:12px">Show or hide tiles on the main dashboard.</p>
        <div class="tab-toggles">
          ${[
            { key:'dawgBudget',       label:'Budget Overview',    defaultOff: false },
            { key:'dawgBreakdown',    label:'Spending Breakdown',  defaultOff: false },
            { key:'dawgGoals',        label:'Savings Goals',       defaultOff: false },
            { key:'dawgTransactions', label:'Recent Transactions',  defaultOff: false },
            { key:'dawgNetWorth',     label:'Net Worth',            defaultOff: true  },
            { key:'dawgInsights',     label:'Spending Insights',    defaultOff: true  },
          ].map(item => `
            <label class="tab-toggle">
              <span class="tab-toggle-label">${item.label}</span>
              <input type="checkbox" class="tab-toggle-input dawg-tile-toggle" data-tile="${item.key}"
                ${item.defaultOff ? (s[item.key] === true ? 'checked' : '') : (s[item.key] !== false ? 'checked' : '')}>
              <span class="tab-toggle-switch"></span>
            </label>`).join('')}
        </div>
      </div>
    </div>`;
}

function attachSettings() {
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

  // Theme dropdown
  document.getElementById('theme-select')?.addEventListener('change', e => {
    const s = loadSettings();
    s.theme = e.target.value;
    saveSettings(s);
    applyTheme(s.theme);
    // Update swatch dot color
    const swatch = document.getElementById('theme-swatch');
    if (swatch) {
      swatch.style.cssText = `width:20px;height:20px;border-radius:50%;flex-shrink:0;${
        e.target.value === 'light'
          ? 'background:#ffffff;border:1.5px solid #bbb'
          : `background:${THEMES[e.target.value]?.accent || 'var(--accent)'}`
      }`;
    }
  });

  // Go to accounts page
  document.getElementById('goto-accounts-card')?.addEventListener('click', () => {
    showTab('accounts');
  });

  // Custom categories
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

  const _tileRender = _debounce(() => render(), 150);
  document.querySelectorAll('.dawg-tile-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      const s = loadSettings();
      s[cb.dataset.tile] = cb.checked;
      saveSettings(s);
      _tileRender();
    });
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
  cash:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
};
const ACCT_TYPE_META = [
  { key:'checking', icon:_ACCT_SVG.checking, label:'Checking' },
  { key:'savings',  icon:_ACCT_SVG.savings,  label:'Savings'  },
  { key:'credit',   icon:_ACCT_SVG.credit,   label:'Credit'   },
  { key:'loan',     icon:_ACCT_SVG.loan,     label:'Loan'     },
  { key:'cash',     icon:_ACCT_SVG.cash,     label:'Cash'     },
];

function _buildAccountCards() {
  const _calSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:3px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  return state.accounts.map((a) => {
    const isDebtAcct = a.type === 'credit' || a.type === 'loan';
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
    const debtFields = isDebtAcct ? `
      <div class="acct-settings-debt" style="margin-top:10px">
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
          <span class="acct-card-name">${a.name}</span>
          <span class="acct-card-type-lbl" style="font-size:11px;color:var(--muted);white-space:nowrap">${typeMeta.icon} ${typeMeta.label}</span>
          ${a.id === currentAccountId ? '<span class="acct-badge" style="font-size:9px">active</span>' : ''}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${a.id !== currentAccountId ? `<button class="btn-xs acct-switch-btn" data-id="${a.id}">Switch</button>` : ''}
          <button type="button" class="acct-card-toggle" data-id="${a.id}" aria-label="Expand">›</button>
        </div>
      </div>
      <div class="acct-card-body" style="display:none">
        <input type="text" class="form-input acct-name-input" value="${a.name}" data-id="${a.id}"
          style="width:100%;margin-bottom:10px;font-size:16px;font-weight:600;box-sizing:border-box${a.id === currentAccountId ? ';border-color:var(--accent)' : ''}"
          placeholder="Account name">
        <p style="font-size:11px;color:var(--muted);margin:0 0 6px;text-transform:uppercase;letter-spacing:.06em">Account Type</p>
        <input type="hidden" class="acct-type-select" data-id="${a.id}" value="${a.type}">
        <div class="acct-type-chips" data-id="${a.id}" style="margin-bottom:10px">${typeChips}</div>
        ${debtFields}
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
      const card   = hdr.closest('.acct-settings-card');
      const body   = card.querySelector('.acct-card-body');
      const toggle = card.querySelector('.acct-card-toggle');
      const opening = card.classList.contains('acct-card-collapsed');
      card.classList.toggle('acct-card-collapsed', !opening);
      body.style.display = opening ? '' : 'none';
      if (toggle) toggle.textContent = opening ? '∨' : '›';
    });
  });

  // Account edit save — handles name, type, and debt fields all at once
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
        title: `Delete "${acct.name}"?`, danger: true,
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
  // Only show changelog entries for the current major.minor (e.g. 2.8.x)
  const [major, minor] = VERSION.split('.');
  const verPrefix = `${major}.${minor}.`;
  const changelogHtml = CHANGELOG.filter(e => e.version.startsWith(verPrefix)).map(entry => `
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
        <img src="doberman.png" alt="Budget DAWGs"
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
        <button id="open-tutorial-btn" class="btn-secondary" style="width:100%;margin-bottom:10px">📖 App Tutorial</button>
        <hr style="border:none;border-top:1px solid var(--border);margin:0 0 12px">
        <p class="code-hint" style="margin-bottom:12px">If the app feels out of date, tap below to clear the cache and reload the latest version.</p>
        <button id="force-update-btn" class="btn-primary" style="width:100%">🔄 Force Update</button>
        <div id="force-update-status" class="form-status" style="margin-top:8px"></div>
      </div>
      <p style="text-align:center;font-size:.75rem;color:var(--muted);margin-top:8px">© ${built} SlawMinYaw's Budget DAWGs. All rights reserved.</p>
    </div>`;
}

// ── tutorial ───────────────────────────────────────────────────────────────
const TUTORIAL_SLIDES = [
  { icon:'👋', title:'Welcome to Budget DAWGs',        body:'Your all-in-one budgeting companion. Track spending, plan your weeks, manage bills, crush debt, hit savings goals, and run multiple accounts — all offline, all yours. Tap Next for a quick tour.' },
  { icon:'🏦', title:'Multiple Accounts',              body:'The app opens to a tile screen when you have 2+ accounts, showing each one with its current balance. Tap a tile to enter it. Tap the ⊞ button in the header to return to the account list at any time.' },
  { icon:'➕', title:'Adding Transactions',            body:'Tap Add to log income, an expense, or a transfer between accounts. Pick a category, enter an amount, and choose a date. Hit ✓ Done on the keyboard to confirm without jumping to the next field.' },
  { icon:'📊', title:'Dashboard',                     body:'See your balance, income, and expenses for any month. Use the ‹ › arrows to browse history — the balance card shows exactly what you had on the last day of that month. Swipe left or right anywhere to change tabs.' },
  { icon:'📋', title:'Ledger',                        body:'Every transaction listed with a running balance — just like a bank statement. Tap ✏️ to edit inline, or swipe left to delete. Use the filter and sort controls at the top to narrow things down.' },
  { icon:'🥧', title:'Charts & Spending Breakdown',   body:'Toggle between a bar chart and pie chart on the Dashboard. Tap any bar or slice to see every transaction in that category for the month. The breakdown below the chart shows budget progress per category.' },
  { icon:'🎯', title:'Goals & Budgets',               body:'Goals tracks savings targets with a progress bar — contribute any amount anytime. Budgets sets a monthly spending limit per category; the breakdown turns amber or red when you are close to or over the limit.' },
  { icon:'📑', title:'Bills',                         body:'Add recurring bills and the app tracks what is due, what is coming up, and what is overdue. Bills due within 3 days get a badge on the nav. Marking a bill paid can auto-log it as an expense.' },
  { icon:'📅', title:'Weekly Planner',                body:'Enter your next paycheck date and the app calculates a safe daily and weekly spend budget after bills and an optional emergency buffer. Past weeks expand to show every transaction in that period.' },
  { icon:'💳', title:'Debt Tracker',                  body:'Add credit cards or loans under Settings → Accounts and set the starting balance to what you owe. The Debt tab shows balance, payoff progress, and a Snowball vs Avalanche calculator if you enter a monthly payment budget.' },
  { icon:'⚙️', title:'Settings & Themes',             body:'Choose from 10+ themes — including VS Code, PowerShell, and CMD which each apply their authentic monospace font automatically. Move the nav bar to any side, hide tabs you do not use, set a PIN lock, and tune your dashboard cards.' },
];

let tutorialSlide = 0;

function openTutorial() {
  tutorialSlide = 0;
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) { renderTutorialSlide(); overlay.classList.remove('hidden'); }
}
function closeTutorial() {
  document.getElementById('tutorial-overlay')?.classList.add('hidden');
}
function renderTutorialSlide() {
  const slide = TUTORIAL_SLIDES[tutorialSlide];
  const el    = document.getElementById('tutorial-card');
  if (!el || !slide) return;
  const isLast = tutorialSlide === TUTORIAL_SLIDES.length - 1;
  el.innerHTML = `
    <div class="tut-icon">${slide.icon}</div>
    <div class="tut-title">${slide.title}</div>
    <p class="tut-body">${slide.body}</p>
    <div class="tut-dots">${TUTORIAL_SLIDES.map((_,i)=>`<span class="tut-dot${i===tutorialSlide?' active':''}"></span>`).join('')}</div>
    <div class="tut-btns">
      <button class="btn-secondary tut-btn-prev" id="tut-prev" ${tutorialSlide===0?'style="visibility:hidden"':''}>← Back</button>
      <button class="btn-primary tut-btn-next" id="tut-next">${isLast ? 'Done ✓' : 'Next →'}</button>
    </div>`;
  document.getElementById('tut-prev')?.addEventListener('click', () => { tutorialSlide--; renderTutorialSlide(); });
  document.getElementById('tut-next')?.addEventListener('click', () => {
    if (tutorialSlide < TUTORIAL_SLIDES.length - 1) { tutorialSlide++; renderTutorialSlide(); }
    else closeTutorial();
  });
}

function attachAbout() {
  document.getElementById('open-tutorial-btn')?.addEventListener('click', openTutorial);

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
      btn.textContent = 'Reloading…';
      window.location.href = window.location.pathname + '?v=' + Date.now();
    } catch(e) {
      status.textContent = 'Error: ' + e.message;
      btn.disabled = false;
      btn.textContent = '🔄 Force Update';
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
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      showConfirmModal({
        title: 'Delete Transaction', danger: true,
        message: 'Delete this transaction? This cannot be undone.',
        confirmText: 'Delete',
        onConfirm: async () => { await api.deleteTransaction(idx); ledgerFilter = ''; render(); },
      });
    });
  });
}

// ── event handlers ─────────────────────────────────────────────────────────
// ── DAWG utility functions ─────────────────────────────────────────────────
function openDawgDrawer() {
  const overlay = document.getElementById('dawg-drawer-overlay');
  const drawer  = document.getElementById('dawg-drawer');
  if (!overlay || !drawer) return;
  overlay.classList.remove('hidden');
  drawer.classList.remove('hidden');
  requestAnimationFrame(() => drawer.classList.add('open'));
}
function closeDawgDrawer() {
  const drawer  = document.getElementById('dawg-drawer');
  const overlay = document.getElementById('dawg-drawer-overlay');
  if (!drawer) return;
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
    if (b.paidMonth === curMonth) return; // already paid this month
    const d = getDaysUntilDue(b.dueDay);
    if (d >= 0 && d <= 3) {
      notes.push({ type:'bill', icon:'📄', title:`${b.name} due`, body: d===0 ? 'Due today!' : `Due in ${d} day${d===1?'':'s'}` });
    }
  });
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const { expense: _mExp } = monthTotals(thisMonth);
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
      <span class="dawg-acct-dd-name">${a.name}</span>
      ${isActive ? '<span class="dawg-acct-dd-check">✓</span>' : ''}
    </button>`;
  }).join('');
  panel.innerHTML = `<div class="dawg-acct-dd-header">ACCOUNTS</div>${rows}`;
  panel.classList.remove('hidden');
  panel.querySelectorAll('.dawg-acct-dd-row').forEach(btn => {
    btn.addEventListener('click', async () => {
      panel.classList.add('hidden');
      if (btn.dataset.id !== currentAccountId) {
        await api.switchAccount(btn.dataset.id);
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
  if (panel.classList.contains('hidden')) {
    const notes = getDawgNotifications();
    panel.innerHTML = `<div class="dawg-notif-header">NOTIFICATIONS</div>` +
      (notes.length
        ? notes.map(n => `<div class="dawg-notif-row"><span class="dawg-notif-icon">${n.icon}</span><div class="dawg-notif-body"><div class="dawg-notif-title">${n.title}</div><div class="dawg-notif-sub">${n.body}</div></div></div>`).join('')
        : `<div class="dawg-notif-empty">No new notifications</div>`);
    panel.classList.remove('hidden');
    setTimeout(() => {
      const closePanel = e => {
        if (!panel.contains(e.target) && e.target.id !== 'dawg-bell') {
          panel.classList.add('hidden');
          document.removeEventListener('click', closePanel);
        }
      };
      document.addEventListener('click', closePanel);
    }, 10);
  } else {
    panel.classList.add('hidden');
  }
}

function attachDashboardDawg() {
  document.getElementById('dawg-goto-budgets')?.addEventListener('click', () => showTab('weekly'));
  document.getElementById('dawg-goto-ledger')?.addEventListener('click',  () => showTab('ledger'));
  document.getElementById('dawg-goto-goals')?.addEventListener('click',   () => showTab('goals'));
  document.getElementById('dawg-goto-txns')?.addEventListener('click',    () => showTab('ledger'));

  // Month navigator
  document.getElementById('dash-month-prev')?.addEventListener('click', () => {
    const yr = parseInt(dashMonth.slice(0,4)), mo = parseInt(dashMonth.slice(5,7));
    const d  = new Date(yr, mo - 2, 1); // mo-1 for 0-index, then -1 more for previous month
    dashMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0');
    render();
  });
  document.getElementById('dash-month-next')?.addEventListener('click', () => {
    const now = new Date().toISOString().slice(0, 7);
    if (dashMonth >= now) return;
    const yr = parseInt(dashMonth.slice(0,4)), mo = parseInt(dashMonth.slice(5,7));
    const d  = new Date(yr, mo, 1); // mo already 0-indexed offset by +1 = next month
    dashMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0');
    render();
  });

  // Donut chart — uses weekly planner per-week budget if available
  const donutCanvas = document.getElementById('dawg-donut');
  if (donutCanvas) {
    const _wp2      = state.weekly_plan;
    const _wb       = parseFloat(_wp2?.per_week || 0);
    const _dn       = new Date(); _dn.setHours(0,0,0,0);
    const _dm       = new Date(_dn); _dm.setDate(_dn.getDate() - (_dn.getDay()===0?6:_dn.getDay()-1));
    const _wse      = state.transactions.filter(t=>t.type==='expense'&&t.date>=_dm.toISOString().split('T')[0]).reduce((s,t)=>s+t.amount,0);
    const _wsi      = state.transactions.filter(t=>t.type==='income' &&t.date>=_dm.toISOString().split('T')[0]).reduce((s,t)=>s+t.amount,0);
    const _ws       = Math.max(0, _wse - _wsi);
    const _tm       = `${_dn.getFullYear()}-${String(_dn.getMonth()+1).padStart(2,'0')}`;
    const { expense: _me } = monthTotals(_tm);
    const _tb       = _wb || Object.values(state.budgets||{}).reduce((s,v)=>s+(parseFloat(v)||0),0);
    const _bs       = _wb ? _ws : _me;
    const _cs2      = getComputedStyle(document.documentElement);
    const _accentC  = _cs2.getPropertyValue('--accent').trim();
    const _warnC    = _cs2.getPropertyValue('--warn').trim();
    const _dangerC  = _cs2.getPropertyValue('--danger').trim();
    const _dp       = _tb > 0 ? _bs/_tb : 0;
    const _dc       = _dp >= 0.9 ? _dangerC : _dp >= 0.75 ? _warnC : _accentC;
    const _spent    = Math.min(_bs, _tb || _bs);
    const _remain   = Math.max(0, (_tb||_bs) - _spent) || 0.001;
    const _emptyClr = document.body.classList.contains('light') ? '#e0e0e0' : '#1e1e1e';
    new Chart(donutCanvas, {
      type:'doughnut',
      data:{ datasets:[{ data:[_spent, _remain], backgroundColor:[_dc, _emptyClr], borderWidth:0 }] },
      options:{ responsive:false, cutout:'74%', plugins:{ legend:{display:false}, tooltip:{enabled:false} }, animation:{duration:500} }
    });
  }

  // Sparkline — clip to end of browsed month when navigating past months
  const _isPastSpark = dashMonth < new Date().toISOString().slice(0,7);
  const _sparkMaxDate = _isPastSpark ? (() => {
    const [sy, sm] = dashMonth.split('-').map(Number);
    return new Date(sy, sm, 0).toISOString().split('T')[0];
  })() : null;
  let _dawgSpark = null;
  function buildSparkline(range) {
    const canvas = document.getElementById('dawg-sparkline');
    if (!canvas) return;
    if (_dawgSpark) { _dawgSpark.destroy(); _dawgSpark = null; _dawgSparkGlobal = null; }
    const { labels, data } = getDawgSparklineData(range, _sparkMaxDate);
    if (!data.length) return;
    const ctx  = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight||80);
    // Debt sparkline: red when high balance, yellow mid, green when low
    const _spAcct    = state.accounts.find(a => a.id === currentAccountId);
    const _spIsDebt  = _spAcct?.type === 'credit' || _spAcct?.type === 'loan';
    let _sparkClrRgb, _sparkClr;
    if (_spIsDebt) {
      const _spInc   = state.transactions.reduce((s,t)=>t.type==='income' ?s+t.amount:s,0);
      const _spExp   = state.transactions.reduce((s,t)=>t.type==='expense'?s+t.amount:s,0);
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
    grad.addColorStop(0, `rgba(${_sparkClrRgb},.28)`);
    grad.addColorStop(1, `rgba(${_sparkClrRgb},0)`);
    const _pulsePlugin = {
      id: 'dawgPulse',
      afterInit(chart) {
        chart._pulsePhase = 0;
        const tick = () => {
          if (!chart.canvas?.isConnected) return;
          chart._pulsePhase = (chart._pulsePhase + 0.004) % 1;
          chart.draw();
          chart._pulseRaf = requestAnimationFrame(tick);
        };
        chart._pulseRaf = requestAnimationFrame(tick);
      },
      afterDraw(chart) {
        const ds = chart.data.datasets[0];
        if (!ds?.data?.length) return;
        const meta = chart.getDatasetMeta(0);
        if (!meta?.data?.length) return;
        const pts = meta.data;
        const clr = ds.borderColor || '#39ff14';
        const phase = chart._pulsePhase || 0;

        // Interpolate position along the line
        const total = pts.length - 1;
        const pos   = phase * total;
        const idx   = Math.min(Math.floor(pos), total - 1);
        const frac  = pos - idx;
        const p1 = pts[idx].getProps(['x','y'], true);
        const p2 = pts[Math.min(idx + 1, total)].getProps(['x','y'], true);
        const x  = p1.x + frac * (p2.x - p1.x);
        const y  = p1.y + frac * (p2.y - p1.y);

        const ctx = chart.ctx;
        ctx.save();
        // Outer glow ring
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = clr;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        // Inner dot
        ctx.globalAlpha = 1;
        ctx.shadowColor = clr;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = clr;
        ctx.fill();
        ctx.restore();
      },
      beforeDestroy(chart) {
        if (chart._pulseRaf) { cancelAnimationFrame(chart._pulseRaf); chart._pulseRaf = null; }
      }
    };
    _dawgSpark = _dawgSparkGlobal = new Chart(canvas, {
      type:'line',
      data:{ labels, datasets:[{ data, borderColor:_sparkClr, borderWidth:2, pointRadius:0, tension:0.4, fill:true, backgroundColor:grad }] },
      plugins:[_pulsePlugin],
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{enabled:false} },
        scales:{ x:{display:false}, y:{display:false} },
        animation:{duration:400}
      }
    });
  }
  document.querySelectorAll('.dawg-tbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dawg-tbtn').forEach(b => b.classList.remove('dawg-tbtn-active'));
      btn.classList.add('dawg-tbtn-active');
      buildSparkline(btn.dataset.range);
    });
  });
  buildSparkline('1m');

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
    case 'debt':      attachDebt();      break;
    case 'goals':     attachGoals();     break;
    case 'import':    attachImport();    break;
    case 'budgets':     attachBudgets();     break;
    case 'challenges':  attachChallenges(); break;
    case 'accounts':    attachAccounts();   break;
    case 'settings':  attachSettings();  break;
    case 'about':     attachAbout();     break;
  }
}

async function autoUpdateWeeklyPlan(incomeAdded) {
  const wp = state.weekly_plan;
  if (!wp || !wp.paydate || !wp.per_week) return;
  const storedBalance = parseFloat(wp.balance || '0') || 0;
  const newBalance    = storedBalance + incomeAdded;
  const bills         = parseFloat(wp.bills  || '0') || 0;
  const bufPct        = parseInt(wp.buffer   || '0') || 0;
  const paydate       = new Date(wp.paydate + 'T00:00:00');
  const now           = new Date(); now.setHours(0,0,0,0);
  const days          = Math.max(1, Math.round((paydate - now) / 86400000) + 1);
  const spendable     = Math.max(0, newBalance - bills);
  const available     = Math.max(0, spendable - spendable * bufPct / 100);
  const weeks         = Math.ceil(days / 7);
  const perWeek       = weeks > 0 ? available / weeks : 0;
  await api.saveWeeklyPlan({ ...wp, balance: newBalance.toFixed(2), per_week: perWeek });
}

function attachAdd() {
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
          ${cats.map(c => `<option${c === row.cat ? ' selected' : ''}>${c}</option>`).join('')}
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

  // Show/hide transfer-specific fields
  document.querySelectorAll('input[name="etype"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isTransfer = radio.value === 'transfer';
      const toRow      = document.getElementById('add-to-acct-row');
      const catRow     = document.getElementById('add-cat-row');
      const recurRow   = document.getElementById('add-recurring-row');
      const descRow    = document.getElementById('add-desc-row');
      const splitRow   = document.getElementById('add-split-row');
      if (toRow)    toRow.style.display    = isTransfer ? '' : 'none';
      if (catRow)   catRow.style.display   = isTransfer ? 'none' : (document.getElementById('split-toggle')?.checked ? 'none' : '');
      if (recurRow) recurRow.style.display = isTransfer ? 'none' : '';
      if (descRow)  descRow.style.display  = isTransfer ? 'none' : '';
      if (splitRow) splitRow.style.display = isTransfer ? 'none' : '';
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
      let count = 0;
      const stamp = Date.now();
      for (const row of _splitRows) {
        const splitAmt = parseFloat(row.amount);
        if (!splitAmt || splitAmt <= 0) continue;
        const t = { type, amount: splitAmt, description: desc, category: row.cat,
                    account: acct, date, recurring: isRecurring, ts: stamp + count };
        if (isRecurring) t.recur_month = new Date().toISOString().slice(0, 7);
        await api.addTransaction(t);
        count++;
      }
      showStatus('add-status', `✓ Split into ${count} entries (${fmt(amount)} total)`, 'success');
      document.getElementById('add-amount').value = '';
      document.getElementById('add-desc').value   = '';
      document.getElementById('add-recurring').checked = false;
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
      const toAcctName  = state.accounts.find(a => a.id === toAcctId)?.name  || 'Other';
      const curAcctName = state.accounts.find(a => a.id === curAcctId)?.name || 'Other';
      // Add expense on current account
      await api.addTransaction({ type: 'expense', amount, description: 'Transfer → ' + toAcctName, category: 'Transfer', date, account: curAcctId });
      // Add income on destination account (direct localStorage write to avoid switching)
      const destKey  = accountDataKey(toAcctId);
      const destData = JSON.parse(localStorage.getItem(destKey) || '{}');
      if (!destData.transactions) destData.transactions = [];
      destData.transactions.push({ type: 'income', amount, description: 'Transfer ← ' + curAcctName, category: 'Transfer', date, account: toAcctId });
      localStorage.setItem(destKey, JSON.stringify(destData));
      showStatus('add-status', `✓ Transferred ${fmt(amount)}`, 'success');
      document.getElementById('add-amount').value = '';
      render(); return;
    }

    const isRecurring = document.getElementById('add-recurring').checked;
    const t = {
      type,
      amount,
      description: document.getElementById('add-desc').value.trim() || '—',
      category:    document.getElementById('add-cat').value,
      account:     document.getElementById('add-acct').value,
      date,
      recurring:   isRecurring,
      ts:          Date.now()
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
    haptic(t.type === 'income' ? [20, 50, 20] : [30]);
    if (localStorage.getItem('sounds') !== 'off') {
      if (t.type === 'expense') showRobbery(t.amount);
      else if (t.type === 'income') showPayday(t.amount);
    }
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
  a.download = `budget-dawgs-${suffix}-${new Date().toISOString().slice(0,10)}.csv`;
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
    ledgerFilter = e.target.value.toLowerCase(); render();
  }, 220));
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

  document.querySelectorAll('.ledger-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const row     = btn.closest('.ledger-row');
      const editDiv = row.querySelector('.ledger-inline-edit');
      const isOpen  = editDiv.style.display === 'block';
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
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const t   = state.transactions[idx];
      showConfirmModal({
        title: 'Delete Transaction', danger: true,
        message: `Delete "${t.description}" (${fmt(t.amount)})? This cannot be undone.`,
        confirmText: 'Delete',
        onConfirm: async () => { await api.deleteTransaction(idx); selectedLedgerIdx = null; ledgerFilter = ''; render(); },
      });
    });
  });

  attachSwipeDelete();

  document.getElementById('ledger-export-csv')?.addEventListener('click', () => exportCSV(false));
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
      balance:    document.getElementById('wk-balance').value,
      bills:      document.getElementById('wk-bills').value,
      paydate:    document.getElementById('wk-paydate').value,
      buffer:     parseInt(document.getElementById('wk-buffer').value),
      per_week:   lastCalcPerWeek,
      saved_date: today(),
    };
    await api.saveWeeklyPlan(plan);
    const el = document.getElementById('wk-save-status');
    if (el) { el.textContent = '✓ Saved'; setTimeout(() => { el.textContent = ''; }, 3000); }
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
        if (!data.transactions) throw new Error('Invalid backup file');
        const txnCount = (data.transactions || []).length;
        const acctCount = (data.accounts || []).length;
        showConfirmModal({
          title: 'Restore Backup?',
          message: `This will replace ALL current data with the backup (${txnCount} transactions, ${acctCount} account${acctCount !== 1 ? 's' : ''}). This cannot be undone.`,
          confirmText: 'Restore', danger: true,
          onConfirm: () => {
            state.transactions = data.transactions || [];
            state.weekly_plan  = data.weekly_plan  || {};
            state.budgets      = data.budgets      || {};
            state.bills        = data.bills        || [];
            state.goals        = data.goals        || [];
            state.accounts     = data.accounts     || defaultAccounts();
            if (!state.accounts.length) state.accounts = defaultAccounts();
            _save(); _saveAccounts();
            showStatus('json-import-status', `✓ Restored ${state.transactions.length} transactions from backup.`, 'success', 0);
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
    const payload = JSON.stringify({
      transactions: state.transactions,
      weekly_plan:  state.weekly_plan,
      budgets:      state.budgets,
      bills:        state.bills,
      goals:        state.goals,
      accounts:     state.accounts,
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `budget-dawgs-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
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

            parsed.push({
              date,
              type,
              category:    get('category') || 'Other',
              description: get('description') || '—',
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
                  <td style="padding:4px 6px">${t.category}</td>
                  <td style="padding:4px 6px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description}</td>
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
    `<option value="${a.id}"${a.id === currentAccountId ? ' selected' : ''}>${a.name}</option>`
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
      _pageTransition = 'zoom-out';
      showingAccountPicker = true;
      render();
    });
  }
}

// ── version check ──────────────────────────────────────────────────────────
let _reloading = false;
async function checkForUpdate() {
  if (_reloading) return;
  try {
    const res  = await fetch('./version.txt?_=' + Date.now(), { cache: 'no-cache' });
    const live = (await res.text()).trim();
    if (live && live !== VERSION) {
      // Guard against infinite reload loop: only reload once per session.
      // If we already tried a reload and the version still doesn't match,
      // the SW cache is stale — skip silently rather than looping forever.
      if (sessionStorage.getItem('slawminyaw_reloaded') === live) return;
      sessionStorage.setItem('slawminyaw_reloaded', live);
      _reloading = true;
      window.location.reload();
    }
  } catch(e) { /* offline — skip */ }
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
  header.innerHTML = '<img src="./doberman.png" style="width:44px;height:44px;object-fit:contain;flex-shrink:0" alt="">';
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
      <img src="doberman.png" style="width:90px;opacity:.75;filter:drop-shadow(0 4px 20px rgba(0,0,0,.7))">
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

// ── init ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    spawnDollarBurst(btn);
    showTab(btn.dataset.tab);
  }));

// DAWG 5-tab bottom nav (permanent HTML elements)
document.querySelectorAll('.dawg-nav-btn[data-tab]').forEach(btn =>
  btn.addEventListener('click', () => {
    spawnDollarBurst(btn);
    showTab(btn.dataset.tab);
  }));
document.getElementById('dawg-nav-accts')?.addEventListener('click', () => showTab('dashboard'));
// DAWG persistent topbar — hamburger, bell, account pill (permanent HTML elements)
document.getElementById('dawg-hamburger')?.addEventListener('click', openDawgDrawer);
document.getElementById('dawg-bell')?.addEventListener('click', toggleDawgBell);
document.getElementById('dawg-acct-switch')?.addEventListener('click', () => toggleDawgAcctDropdown());
// DAWG drawer close + item listeners (permanent HTML elements)
document.getElementById('dawg-drawer-close')?.addEventListener('click', closeDawgDrawer);
document.getElementById('dawg-drawer-overlay')?.addEventListener('click', closeDawgDrawer);
document.querySelectorAll('.dawg-drawer-item').forEach(btn =>
  btn.addEventListener('click', () => {
    closeDawgDrawer();
    if (btn.dataset.tab === '__accounts__') { showingAccountPicker = true; render(); }
    else showTab(btn.dataset.tab);
  }));

// Floating tutorial button
document.getElementById('tut-float-btn')?.addEventListener('click', openTutorial);
// Close tutorial on backdrop click
document.getElementById('tutorial-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('tutorial-overlay')) closeTutorial();
});

// Re-push history state whenever back is pressed while a lock overlay is active
window.addEventListener('popstate', () => {
  if (document.getElementById('pin-lock-overlay') || document.getElementById('bio-lock-overlay')) {
    history.pushState({ dawgLock: true }, '');
  }
});

(async () => {
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
    document.fonts.ready.then(fitLogo);
    updateAccountSwitcher();
    document.getElementById('account-switcher')?.addEventListener('change', async e => {
      await api.switchAccount(e.target.value);
    });
    if (state.accounts.length > 1) showingAccountPicker = true;
    render();
    updateBillBadge();
    checkBillNotifications();
    maybeShowWhatsNew();

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
          visible = ['add', 'ledger', 'weekly', 'settings'];
        } else {
          const hidden = _settings.hiddenTabs || [];
          visible = NAV_ITEMS.map(n => n.key).filter(k => !hidden.includes(k));
        }
        const idx = visible.indexOf(currentTab);
        if (dx < 0 && idx < visible.length - 1) showTab(visible[idx + 1]);
        else if (dx > 0 && idx > 0)              showTab(visible[idx - 1]);
      }, { passive: true });
    })();

    // ── auto-theme: update when system preference changes ─────────────────
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const s = loadSettings();
      if ((s.theme || 'dark') === 'auto') applySettings();
    });

    // Check for a new version every open and every time the app is foregrounded
    checkForUpdate();
    window.addEventListener('focus', checkForUpdate);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        reg.update();
        window.addEventListener('focus', () => reg.update());
      }).catch(() => {});
      // controllerchange fires when a new SW takes over — checkForUpdate()
      // already handles version-mismatch reloads, so skip redundant reload here
    }
    } catch(err) {
      // Surface init errors so a blank screen doesn't look like a stuck splash
      console.error('[Budget DAWGs] Init error:', err);
      const mc = document.getElementById('main-content');
      if (mc) mc.innerHTML = `<div style="padding:32px 24px;text-align:center">
        <div style="font-size:1.1rem;font-weight:700;color:var(--danger);margin-bottom:8px">Something went wrong loading the app.</div>
        <div style="font-size:.85rem;color:var(--muted);margin-bottom:20px">${err?.message || 'Unknown error'}</div>
        <button onclick="location.reload()" style="padding:12px 28px;background:var(--accent);color:#000;border:none;border-radius:12px;font-weight:700;font-size:.9rem;cursor:pointer">Reload</button>
      </div>`;
    }
  });
})();
