'use strict';

const VERSION = '4.0.0';
const DEFAULT_CATEGORIES = ['Food','Gas','Car','Boat','Tools','Home','Entertainment','Health','Other'];

function getCategories() {
  const s = loadSettings();
  return [...DEFAULT_CATEGORIES, ...(s.customCategories || [])];
}

const CHANGELOG = [
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
const _D = { bg:'#111112', surface:'#1a1a1b', surface2:'#242425', card:'#1e1e1f', text:'#e2e2e4', muted:'#888890', border:'#28282a' };

const THEMES = {
  dark: {
    label:'Dark',
    ..._D,
    accent:'#4ecb8d', accent2:'#a07858', success:'#4ecb8d', warn:'#c0a038', danger:'#c05050',
    grad:'linear-gradient(135deg, #2d3830 0%, #4ecb8d 100%)',
    cats:{ Food:'#4ecb8d', Gas:'#c05858', Car:'#6888a8', Boat:'#4898a8', Tools:'#b87840', Home:'#7ca048', Entertainment:'#8890a8', Health:'#4090a8', Other:'#787880' },
  },
  light: {
    label:'Light',
    bg:'#f3f3f3', surface:'#ffffff', surface2:'#e8e8e8', card:'#efefef',
    accent:'#4ecb8d', accent2:'#a06838', success:'#2ea870', warn:'#988018', danger:'#a84040',
    grad:'linear-gradient(135deg, #1a4030 0%, #4ecb8d 100%)',
    text:'#181820', muted:'#606070', border:'#d5d5d5', light:true,
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
let state = { transactions: [], weekly_plan: {}, budgets: {}, bills: [], goals: [], accounts: [], startingBalance: 0 };
let lastCalcPerWeek = 0;
let dashChartMode = 'bar';
let currentAccountId = 'main';
const STORAGE_KEY  = 'slawminyaw';
const SETTINGS_KEY = 'slawminyaw_settings';
const ACCOUNTS_KEY = 'slawminyaw_accounts';
function accountDataKey(id) { return 'slawminyaw_data_' + id; }

function loadSettings() { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
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
}

// No-op: brand lockup uses a fixed image + short label — font shrinking no longer needed.
function fitLogo() {}

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
  localStorage.setItem(accountDataKey(currentAccountId), JSON.stringify({
    transactions:    state.transactions,
    weekly_plan:     state.weekly_plan,
    budgets:         state.budgets,
    bills:           state.bills,
    goals:           state.goals,
    startingBalance: state.startingBalance,
  }));
}
function _saveAccounts() {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(state.accounts));
}
function _loadAccountData(id) {
  const d = JSON.parse(localStorage.getItem(accountDataKey(id)) || '{}');
  state.transactions    = d.transactions    || [];
  state.weekly_plan     = d.weekly_plan     || {};
  state.budgets         = d.budgets         || {};
  state.bills           = d.bills           || [];
  state.goals           = d.goals           || [];
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

function showTab(key) {
  if (currentTab === 'ledger' && key !== 'ledger') {
    ledgerFilter = ''; ledgerSort = 'date-desc'; ledgerTypeFilter = 'all';
    ledgerCatFilter = ''; ledgerDateFrom = ''; ledgerDateTo = '';
  }
  if (_insightTimer) { clearInterval(_insightTimer); _insightTimer = null; }
  // About page always uses base dark/light — unaffected by Dusk/Denim/Ember etc.
  const activeTheme = (loadSettings().theme) || 'dark';
  if (key === 'about') {
    const isLight = !!(THEMES[activeTheme] || THEMES.dark).light;
    applyTheme(isLight ? 'light' : 'dark');
  } else if (currentTab === 'about') {
    applyTheme(activeTheme);
  }
  _pageTransition = 'fade';
  currentTab = key;
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === key));
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
            borderRadius: 5,
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

  // Starting balance (first-run card)
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
    const icon     = { checking:'🏦', savings:'💰', credit:'💳', loan:'📋', cash:'💵' }[acct.type] || '🏦';
    const typeLbl  = acct.type.charAt(0).toUpperCase() + acct.type.slice(1);
    const stripe   = TYPE_COLORS[acct.type] || 'var(--accent)';
    return `
      <div class="acct-row" data-id="${acct.id}">
        <div class="acct-row-stripe" style="background:${stripe}"></div>
        <div class="acct-row-icon">${icon}</div>
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
    <div class="page acct-picker-page">
      <div class="acct-picker-header">
        <img src="./doberman.png" alt="Budget DAWGs" class="acct-picker-dob">
        <div>
          <div class="acct-picker-title">My Accounts</div>
          <div class="acct-picker-sub">${count} account${count !== 1 ? 's' : ''} · tap to open</div>
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
    // Dismiss after 1.9s → fade-out takes .45s → remove and resolve
    setTimeout(() => {
      el.classList.add('dismiss');
      setTimeout(() => { el.remove(); resolve(); }, 450);
    }, 1900);
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
    case 'budgets':   main.innerHTML = renderBudgets();   break;
    case 'settings':  main.innerHTML = renderSettings();  break;
    case 'about':     main.innerHTML = renderAbout();     break;
  }
  _applyPageTransition(main);
  attachHandlers();
  updateBillBadge();
  // Show "Done" checkmark on mobile keyboard for all text/number inputs
  document.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="color"]):not([type="range"]):not([type="date"])').forEach(el => el.setAttribute('enterkeyhint', 'done'));
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

// ── dashboard ──────────────────────────────────────────────────────────────
function renderDashboard() {
  const ds = loadSettings();
  const showBills     = ds.dashBills     !== false;
  const showInsights  = ds.dashInsights  !== false;
  const showChart     = ds.dashChart     !== false;
  const showBreakdown = ds.dashBreakdown !== false;
  const showNetWorth  = ds.dashNetWorth  !== false;

  const { income, expense, bycat } = monthTotals(dashMonth);
  const currentM = new Date().toISOString().slice(0, 7);
  const isPastMonth = dashMonth < currentM;
  const acct   = state.accounts.find(a => a.id === currentAccountId);
  const isDebt = acct?.type === 'credit' || acct?.type === 'loan';

  // Balance: for debt accounts owed = startBal + expenses − income (payments reduce debt)
  // For past months compute as-of last day of that month
  let balance;
  if (isPastMonth) {
    const mo = parseInt(dashMonth.slice(5, 7));
    const yr = parseInt(dashMonth.slice(0, 4));
    const lastDayStr = dashMonth + '-' + String(new Date(yr, mo, 0).getDate()).padStart(2, '0');
    if (isDebt) {
      let owed = state.startingBalance || 0;
      for (const t of state.transactions) {
        if (t.date <= lastDayStr) owed += t.type === 'expense' ? t.amount : -t.amount;
      }
      balance = Math.max(0, owed);
    } else {
      balance = balanceAsOf(lastDayStr);
    }
  } else {
    const { income: ai, expense: ae } = totals();
    balance = isDebt
      ? Math.max(0, (state.startingBalance || 0) + ae - ai)
      : (state.startingBalance || 0) + ai - ae;
  }

  const debtTypeLbl = acct?.type === 'loan' ? '(Loan)' : '(Credit)';
  const balTitle = acct?.type === 'loan' ? 'LOAN BALANCE' : isDebt ? 'BALANCE OWED' : 'BALANCE';
  const balColor = isDebt ? 'var(--danger)' : (balance >= 0 ? 'var(--success)' : 'var(--danger)');
  const balSub   = isPastMonth
    ? `end of ${new Date(parseInt(dashMonth.slice(0,4)), parseInt(dashMonth.slice(5,7)) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}${isDebt ? ' · ' + debtTypeLbl : ''}`
    : isDebt
      ? `amount owed · ${debtTypeLbl}`
      : (state.startingBalance ? 'starting + income − expenses' : 'income − expenses');
  const health = calcHealthScore();

  // ── month-over-month deltas ──────────────────────────────────────────────
  const prevM = (() => {
    const yr = parseInt(dashMonth.slice(0, 4));
    const mo = parseInt(dashMonth.slice(5, 7));
    return new Date(yr, mo - 2, 1).toISOString().slice(0, 7);
  })();
  const prevTotals = monthTotals(prevM);
  const _momDelta = (cur, prev, higherIsBad) => {
    if (!prev || prev === 0) return null;
    const diff = cur - prev;
    const pct  = Math.abs(diff / prev * 100).toFixed(0);
    const up   = diff >= 0;
    return { diff, pct, arrow: up ? '↑' : '↓', color: (up === higherIsBad) ? 'var(--danger)' : 'var(--success)' };
  };
  const incomeDelta  = _momDelta(income,  prevTotals.income,  false); // up = good
  const expenseDelta = _momDelta(expense, prevTotals.expense, true);  // up = bad

  const cardDefs = [
    { title: balTitle, value: fmt(balance), color: balColor, sub: balSub },
    { title: 'INCOME',   value: fmt(income),   color: 'var(--success)', sub: 'total earned', delta: incomeDelta },
    { title: 'EXPENSES', value: fmt(expense),  color: 'var(--danger)',  sub: 'total spent',  delta: expenseDelta },
    { title: 'HEALTH',   value: String(health.total), color: health.color, sub: `grade ${health.grade}` },
  ];

  // ── first-run / debt summary card ─────────────────────────────────────────
  let firstRunHtml = '';
  if (isDebt && !state.startingBalance) {
    // Debt account but no balance set yet
    const debtPrompt = acct?.type === 'loan' ? 'Enter your current loan balance so we can track what you owe.' : 'Enter the current balance you owe on this card.';
    firstRunHtml = `
      <div class="form-card first-run-card" style="margin-bottom:16px;text-align:center;padding:20px">
        <div style="font-size:1.5rem;margin-bottom:8px">${acct?.type === 'loan' ? '🏦' : '💳'}</div>
        <div style="font-weight:600;color:var(--text);margin-bottom:6px">Set your starting balance</div>
        <p style="font-size:.82rem;color:var(--muted);margin-bottom:14px">${debtPrompt}</p>
        <div style="display:flex;gap:8px;justify-content:center;max-width:260px;margin:0 auto">
          <input type="number" id="starting-bal-input" class="form-input" placeholder="e.g. 4200.00" step="0.01" inputmode="decimal" style="flex:1">
          <button id="starting-bal-save" class="btn-primary" style="white-space:nowrap">Set Balance</button>
        </div>
        <span id="starting-bal-status" class="status-inline" style="display:block;margin-top:8px"></span>
      </div>`;
  } else if (isDebt && state.startingBalance) {
    // Rich debt summary card — replaces the first-run prompt once balance is set
    const recentTxns = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    const txnRowsHtml = recentTxns.length ? recentTxns.map(t => {
      const isPayment = t.type === 'income';
      const color     = isPayment ? 'var(--success)' : 'var(--danger)';
      const sign      = isPayment ? '−' : '+';
      const typeLabel = isPayment ? 'Payment' : (t.category || 'Charge');
      return `
        <div class="debt-dash-txn">
          <span class="debt-dash-txn-date">${t.date.slice(5)}</span>
          <span class="debt-dash-txn-type" style="color:${color}">${typeLabel}</span>
          <span class="debt-dash-txn-desc">${t.description && t.description !== '—' ? t.description : ''}</span>
          <span class="debt-dash-txn-amt" style="color:${color}">${sign}${fmt(t.amount)}</span>
        </div>`;
    }).join('') : '<p class="empty-msg" style="padding:8px 0">No transactions yet.</p>';

    // Category breakdown (credit cards only — loans don't have purchase categories)
    let catHtml = '';
    if (acct?.type === 'credit') {
      const { bycat: mCats } = monthTotals(dashMonth);
      const catEntries = Object.entries(mCats).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (catEntries.length) {
        const maxAmt = catEntries[0][1];
        catHtml = `
          <div class="debt-dash-section">This Month by Category</div>
          <div class="debt-dash-cats">
            ${catEntries.map(([cat, amt]) => {
              const cc = CAT_COLORS[cat] || 'var(--accent)';
              return `
                <div class="debt-dash-cat-row">
                  <span class="cat-dot" style="background:${cc}"></span>
                  <span class="debt-dash-cat-name">${cat}</span>
                  <div class="breakdown-bar-bg" style="flex:1;margin:0 8px"><div class="breakdown-bar-fill" style="width:${(amt/maxAmt*100).toFixed(1)}%;background:${cc}"></div></div>
                  <span class="debt-dash-cat-amt">${fmt(amt)}</span>
                </div>`;
            }).join('')}
          </div>`;
      }
    }

    firstRunHtml = `
      <div class="debt-dash-card" style="margin-bottom:16px">
        <div class="debt-dash-header">
          <div>
            <div class="debt-dash-acct-name">${acct?.name || ''}</div>
            <div class="debt-dash-acct-type">${acct?.type === 'loan' ? '🏦 Loan' : '💳 Credit Card'}</div>
          </div>
          <div class="debt-dash-owed">
            <div class="debt-dash-owed-amt" style="color:var(--danger)">${fmt(balance)}</div>
            <div class="debt-dash-owed-lbl">owed</div>
          </div>
        </div>
        ${catHtml}
        <div class="debt-dash-section">${acct?.type === 'loan' ? 'Payment History' : 'Recent Transactions'}</div>
        <div class="debt-dash-txns">${txnRowsHtml}</div>
      </div>`;
  } else if (state.transactions.length === 0) {
    // Regular account, no transactions yet
    firstRunHtml = `
      <div class="form-card first-run-card" style="margin-bottom:16px;text-align:center;padding:20px">
        <div style="font-size:1.5rem;margin-bottom:8px">👋</div>
        <div style="font-weight:600;color:var(--text);margin-bottom:6px">Set your starting balance</div>
        <p style="font-size:.82rem;color:var(--muted);margin-bottom:14px">Enter what's currently in your account so your balance is accurate from day one.</p>
        <div style="display:flex;gap:8px;justify-content:center;max-width:260px;margin:0 auto">
          <input type="number" id="starting-bal-input" class="form-input" placeholder="e.g. 1500.00" step="0.01" inputmode="decimal" style="flex:1">
          <button id="starting-bal-save" class="btn-primary" style="white-space:nowrap">Set Balance</button>
        </div>
        <span id="starting-bal-status" class="status-inline" style="display:block;margin-top:8px"></span>
      </div>`;
  }
  const cardsHtml = cardDefs.map(c => `
    <div class="card">
      <div class="card-title">${c.title}</div>
      <div class="card-value" style="color:${c.color}">${c.value}</div>
      <div class="card-sub">${c.sub}</div>
      ${c.delta ? `<div class="card-delta" style="color:${c.delta.color}">${c.delta.arrow} ${c.delta.pct}% vs last mo</div>` : ''}
    </div>`).join('');

  const nw = getNetWorth();
  const netWorthHtml = showNetWorth && state.accounts.length >= 2 ? `
    <div class="net-worth-card">
      <div class="net-worth-total-label">Net Worth</div>
      <div class="net-worth-total-value" style="color:${nw.total >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(nw.total)}</div>
      <div class="net-worth-rows">
        ${nw.accounts.map(a => {
          const isDebt = a.type === 'credit' || a.type === 'loan';
          const typeLabel = a.type === 'loan' ? '(Loan)' : a.type === 'credit' ? '(Credit)' : '';
          return isDebt ? `
          <div class="net-worth-row">
            <span class="net-worth-acct">${a.name}${typeLabel ? ` <span style="font-size:10px;color:var(--muted)">${typeLabel}</span>` : ''}</span>
            <span class="net-worth-bal" style="color:var(--danger)">Owes: ${fmt(-a.balance)}</span>
          </div>` : `
          <div class="net-worth-row">
            <span class="net-worth-acct">${a.name}</span>
            <span class="net-worth-bal" style="color:${a.balance >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(a.balance)}</span>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  const upcoming = getUpcomingBills(7);
  const upcomingHtml = showBills && upcoming.length ? `
    <h2 class="section-title">Bills Due Soon</h2>
    <div class="bills-list" style="margin-bottom:8px">
      ${upcoming.map(b => {
        const d = getDaysUntilDue(b.dueDay);
        const badge = d === 0 ? '<span class="bill-badge due-today">TODAY</span>'
          : `<span class="bill-badge due-soon">in ${d}d</span>`;
        return `<div class="bill-item"><span class="cat-dot" style="background:${CAT_COLORS[b.category]||'#9896a4'}"></span><span class="bill-name">${b.name}</span><span class="bill-amt">${fmt(b.amount)}</span>${badge}</div>`;
      }).join('')}
    </div>` : '';

  const maxCat = Math.max(...Object.values(bycat), 1);
  const breakdownHtml = Object.entries(bycat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
    const limit    = parseFloat(state.budgets[cat] || 0);
    const catColor = CAT_COLORS[cat] || 'var(--accent)';
    let barColor = catColor, badge = '';
    if (limit > 0) {
      const pct = amt / limit;
      if (pct >= 1)        { barColor = 'var(--danger)'; badge = '<span class="budget-badge over">OVER!</span>'; }
      else if (pct >= 0.8) { barColor = 'var(--warn)';   badge = '<span class="budget-badge warn">80%</span>'; }
    }
    return `
      <div class="breakdown-row">
        <span class="breakdown-label"><span class="cat-dot" style="background:${catColor}"></span>${cat}</span>
        <div class="breakdown-bar-bg">
          <div class="breakdown-bar-fill" style="width:${(amt/maxCat*100).toFixed(1)}%;background:${barColor}"></div>
        </div>
        <span class="breakdown-amt">${fmt(amt)}${badge}</span>
      </div>`;
  }).join('');

  const chartTitle = 'This Month by Category';
  const toggleLabel = dashChartMode === 'bar' ? '🥧 Pie' : '📊 Bar';

  const insights = getSpendingInsights(dashMonth);
  const safeInsights = JSON.stringify(insights).replace(/'/g, '&#39;');
  const insightsHtml = showInsights && insights.length ? `
    <div class="insight-card" id="insight-rotator" data-insights='${safeInsights}'>
      <div class="insight-card-inner">
        <span class="insight-card-text" id="insight-text">${insights[0]}</span>
      </div>
      ${insights.length > 1 ? `<div class="insight-dots">${insights.map((_, i) => `<span class="insight-dot${i === 0 ? ' active' : ''}"></span>`).join('')}</div>` : ''}
    </div>` : '';

  return `
    <div class="page">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-sub">your financial snapshot</p>
      ${firstRunHtml}
      <div class="dash-month-nav">
        <button class="dash-month-btn" id="dash-month-prev">‹</button>
        <span class="dash-month-label">${new Date(parseInt(dashMonth.slice(0,4)), parseInt(dashMonth.slice(5,7)) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        <button class="dash-month-btn" id="dash-month-next" ${dashMonth >= new Date().toISOString().slice(0,7) ? 'disabled' : ''}>›</button>
      </div>
      <div class="cards-grid">${cardsHtml}</div>
      ${netWorthHtml}
      ${upcomingHtml}
      ${insightsHtml}
      ${showChart ? `<div class="chart-header">
        <div class="section-title chart-section-title" style="margin:0">${chartTitle}</div>
        <button id="chart-toggle-btn" class="btn-xs">${toggleLabel}</button>
      </div>
      <div class="chart-wrap"><canvas id="spending-chart"></canvas></div>` : ''}
      ${showBreakdown && Object.keys(bycat).length ? `<h2 class="section-title">Spending by Category</h2><div class="breakdown">${breakdownHtml}</div>` : ''}
    </div>`;
}

// ── budgets ────────────────────────────────────────────────────────────────
function renderBudgets() {
  const m = new Date().toISOString().slice(0, 7);
  const { bycat } = monthTotals(m);
  const rows = getCategories().map(cat => {
    const spent    = bycat[cat] || 0;
    const limit    = parseFloat(state.budgets[cat] || 0);
    const pct      = limit > 0 ? Math.min(spent / limit * 100, 100) : 0;
    const catColor = CAT_COLORS[cat] || '#9896a4';
    const barColor = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warn)' : catColor;
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
    getCategories().forEach(cat => {
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
        ${rowsHtml || '<p class="empty-msg">No matching transactions.</p>'}
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

  const allWeekRows = Array.from({length: totalWeeks}, (_, w) => {
    const sd = new Date(startMonday); sd.setDate(startMonday.getDate() + w*7);
    const ed = new Date(startMonday); ed.setDate(startMonday.getDate() + (w+1)*7 - 1);
    if (ed > paydate) ed.setTime(paydate.getTime());
    const sdS = sd.toISOString().split('T')[0];
    const edS = ed.toISOString().split('T')[0];
    const isCurrent = sdS <= mondayStr && mondayStr <= edS;
    const isPast    = ed < now;
    const lbl = `${sd.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${ed.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
    const wkTxns = state.transactions.filter(t=>t.date>=sdS&&t.date<=edS);
    const wkExp  = wkTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const wkInc  = wkTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const wkNet  = Math.max(0, wkExp - wkInc);
    const wkPct  = perWeek > 0 ? Math.min(wkNet/perWeek*100,100) : 0;
    const wkColor = wkPct>=100?'var(--danger)':wkPct>=80?'var(--warn)':wkNet>0?'var(--success)':'var(--muted)';
    const txnHtml = wkTxns.length
      ? wkTxns.sort((a,b)=>b.date.localeCompare(a.date)).map(txnRow).join('')
      : '<p class="pw-empty">No transactions.</p>';
    const badge = isCurrent ? '<span class="wkb-current-badge">THIS WEEK</span>' : '';
    return `<div class="wkb-row${isCurrent?' wkb-current':isPast?' wkb-past':''}"><div class="wkb-header">${badge}<span class="week-dates">${lbl}</span><div class="breakdown-bar-bg small"><div class="breakdown-bar-fill" style="width:${wkPct.toFixed(1)}%;background:${wkColor}"></div></div><span class="wkb-amounts" style="color:${wkColor}">${fmt(wkNet)} / ${fmt(perWeek)}</span><span class="pw-week-toggle">▼</span></div><div class="pw-week-txns">${txnHtml}</div></div>`;
  }).join('');

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
    <div class="wkb-rows">${allWeekRows}</div>`;

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
  }).join('') : '<p class="empty-msg">No bills added yet.</p>';

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
        if (confirm(`Log "${b.name}" as a $${b.amount.toFixed(2)} expense?`)) {
          await api.addTransaction({
            type: 'expense',
            amount: b.amount,
            description: b.name,
            category: b.category,
            date: new Date().toISOString().slice(0, 10),
            account: currentAccountId,
          });
        }
      }
      render();
    });
  });

  document.querySelectorAll('.bill-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.idx);
      if (confirm(`Delete bill: ${state.bills[i].name}?`)) {
        state.bills.splice(i, 1);
        await api.saveBills(state.bills);
        render();
      }
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
  }).join('') : '<p class="empty-msg">No savings goals yet.</p>';

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
    btn.addEventListener('click', async () => {
      const i = parseInt(btn.dataset.idx);
      if (confirm(`Delete goal: ${state.goals[i].name}?`)) {
        state.goals.splice(i, 1);
        await api.saveGoals(state.goals);
        render();
      }
    });
  });
}

// ── import ─────────────────────────────────────────────────────────────────
function renderImport() {
  return `
    <div class="page">
      <h1 class="page-title">Import / Export</h1>
      <p class="page-sub">move data between devices</p>
      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Import Backup</h2>
        <p class="code-hint">Restore all data from a JSON backup file.</p>
        <div id="json-import-status" class="form-status"></div>
        <label class="btn-primary" style="display:inline-block;margin-top:10px;cursor:pointer;text-align:center;width:100%;box-sizing:border-box">
          ⬆ Load Backup
          <input type="file" id="import-json-file" accept=".json" style="display:none">
        </label>
      </div>
      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Export Backup</h2>
        <p class="code-hint">Includes transactions, bills, goals, accounts, and budgets.</p>
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
  const navPos     = s.navPosition || 'bottom';
  const hiddenTabs = s.hiddenTabs || [];
  const theme      = s.theme || 'dark';
  const logoFont   = s.logoFont || '';
  const logoColor  = s.logoColor || '';
  const customCats = s.customCategories || [];

  const navOpts = ['bottom','top','left','right'].map(p =>
    `<button class="nav-pos-btn${navPos === p ? ' active' : ''}" data-pos="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</button>`
  ).join('');

  const tabToggles = NAV_ITEMS.map(item => `
    <label class="tab-toggle${item.required ? ' tab-toggle--disabled' : ''}">
      <span class="tab-toggle-icon">${item.icon}</span>
      <span class="tab-toggle-label">${item.label}</span>
      <input type="checkbox" class="tab-toggle-input" data-tab="${item.key}"
        ${!hiddenTabs.includes(item.key) ? 'checked' : ''}
        ${item.required ? 'disabled' : ''}>
      <span class="tab-toggle-switch"></span>
    </label>`).join('');

  const accountRows = state.accounts.map((a) => `
    <div class="account-row" style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
      <input type="text" class="form-input acct-name-input" value="${a.name}" data-id="${a.id}"
        style="flex:1;padding:6px 10px;font-size:12px${a.id === currentAccountId ? ';border-color:var(--accent)' : ''}">
      <span class="account-type" style="font-size:10px;white-space:nowrap">${a.type}</span>
      <button class="btn-xs acct-rename-btn" data-id="${a.id}" title="Rename">✓</button>
      ${a.id !== 'main' ? `<button class="btn-xs acct-delete-btn" style="background:var(--danger);color:white;border-color:var(--danger)" data-id="${a.id}">✕</button>` : ''}
      ${a.id === currentAccountId ? '<span class="acct-badge" style="font-size:9px">active</span>' : `<button class="btn-xs acct-switch-btn" data-id="${a.id}" style="background:var(--surface2)">Switch</button>`}
    </div>`).join('');

  const themeRows = Object.entries(THEMES).map(([key, t]) => `
    <button class="theme-row${theme === key ? ' active' : ''}" data-theme="${key}">
      <span class="theme-dot" style="${key === 'light' ? 'background:#ffffff;border:1.5px solid #bbb' : 'background:' + t.accent}"></span>
      <span class="theme-row-name">${t.label}</span>
      ${theme === key ? '<span class="theme-check">✓</span>' : ''}
    </button>`).join('');

  const fonts = [
    // — Anime / Cool —
    { label:'Bangers',           value:'Bangers, cursive',               style:"font-family:'Bangers',cursive;letter-spacing:.08em",        group:'anime' },
    { label:'Russo One',         value:'Russo One, sans-serif',          style:"font-family:'Russo One',sans-serif",                        group:'anime' },
    { label:'Orbitron',          value:'Orbitron, sans-serif',           style:"font-family:'Orbitron',sans-serif;font-weight:700",          group:'anime' },
    { label:'Audiowide',         value:'Audiowide, sans-serif',          style:"font-family:'Audiowide',sans-serif",                        group:'anime' },
    { label:'Chakra Petch',      value:'Chakra Petch, sans-serif',       style:"font-family:'Chakra Petch',sans-serif;font-weight:700",      group:'anime' },
    { label:'Press Start 2P',    value:'"Press Start 2P", cursive',       style:"font-family:'Press Start 2P',cursive;font-size:.75em",       group:'anime' },
    // — Modern —
    { label:'Poppins',           value:'Poppins, sans-serif',            style:"font-family:'Poppins',sans-serif;font-weight:600",           group:'modern' },
    { label:'Montserrat',        value:'Montserrat, sans-serif',         style:"font-family:'Montserrat',sans-serif;font-weight:700",        group:'modern' },
    { label:'Raleway',           value:'Raleway, sans-serif',            style:"font-family:'Raleway',sans-serif;font-weight:600",           group:'modern' },
    { label:'Plus Jakarta Sans', value:'Plus Jakarta Sans, sans-serif',  style:"font-family:'Plus Jakarta Sans',sans-serif;font-weight:600", group:'modern' },
    // — Cursive / Script —
    { label:'Dancing Script',    value:'Dancing Script, cursive',        style:"font-family:'Dancing Script',cursive;font-weight:700",       group:'cursive' },
    { label:'Great Vibes',       value:'Great Vibes, cursive',           style:"font-family:'Great Vibes',cursive",                         group:'cursive' },
    { label:'Sacramento',        value:'Sacramento, cursive',            style:"font-family:'Sacramento',cursive;font-size:1.2em",           group:'cursive' },
    { label:'Pacifico',          value:'Pacifico, cursive',              style:"font-family:'Pacifico',cursive",                            group:'cursive' },
    { label:'Satisfy',           value:'Satisfy, cursive',               style:"font-family:'Satisfy',cursive",                             group:'cursive' },
  ];

  const fontGroupDefs = [
    { key:'anime',   label:'Anime / Cool' },
    { key:'modern',  label:'Modern' },
    { key:'cursive', label:'Script / Cursive' },
  ];
  const titlePreview = s.name || "SlawMinYaw's Budget DAWGs";
  const allFontsForPicker = [
    { label:'Default', value:'', style:'' },
    ...fonts,
  ];
  const esc = s => s.replace(/"/g, '&quot;');
  const fontPickerOptions = fontGroupDefs.map(g => {
    const items = fonts.filter(f => f.group === g.key).map(f => `
      <div class="fp-option${logoFont === f.value ? ' active' : ''}" data-font="${esc(f.value)}" data-style="${esc(f.style)}">
        <span class="fp-opt-name">${f.label}</span>
        <span class="fp-opt-preview" style="${f.style}">${titlePreview}</span>
      </div>`).join('');
    return `<div class="fp-group-label">${g.label}</div>${items}`;
  }).join('');
  const currentFont    = allFontsForPicker.find(f => f.value === logoFont) || allFontsForPicker[0];
  const fontSelect = `
    <div class="fp-picker" id="fp-picker">
      <div class="fp-trigger" id="fp-trigger">
        <span class="fp-trigger-preview" style="${currentFont.style || ''}">${titlePreview}</span>
        <span class="fp-trigger-label">${currentFont.label}</span>
        <span class="fp-arrow">▾</span>
      </div>
      <div class="fp-panel hidden" id="fp-panel">
        <div class="fp-option${!logoFont ? ' active' : ''}" data-font="" data-style="">
          <span class="fp-opt-name">Default</span>
          <span class="fp-opt-preview">${titlePreview}</span>
        </div>
        ${fontPickerOptions}
      </div>
    </div>`;

  const logoTransform = s.logoTransform || '';
  const caps = [
    { label:'Aa  Normal',     value:'',           style:'text-transform:none' },
    { label:'AA  Uppercase',  value:'uppercase',  style:'text-transform:uppercase' },
    { label:'aa  lowercase',  value:'lowercase',  style:'text-transform:lowercase' },
    { label:'Aᴀ  Small Caps', value:'small-caps', style:'font-variant:small-caps' },
  ];
  const capChips = caps.map(c => `
    <button class="cap-chip${logoTransform === c.value ? ' active' : ''}" data-transform="${c.value}"
      style="${c.style}">${c.label}</button>`).join('');

  const customCatRows = customCats.length ? customCats.map((c, i) => `
    <div class="custom-cat-row">
      <span class="custom-cat-name">${c}</span>
      <button class="btn-xs custom-cat-del" data-idx="${i}" style="background:var(--danger);color:#fff;border-color:var(--danger)">✕</button>
    </div>`).join('') : '<p style="font-size:.8rem;color:var(--muted);margin-bottom:6px">No custom categories yet.</p>';

  return `
    <div class="page">
      <h1 class="page-title">Settings</h1>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:12px">Personalize</h2>
        <div class="form-row">
          <label class="form-label">App title</label>
          <input type="text" id="setting-name" class="form-input" value="${s.name || ''}" placeholder="e.g. Cole's Finances">
        </div>
        <div class="form-row">
          <label class="form-label">Title font</label>
          ${fontSelect}
        </div>
        <div class="form-row">
          <label class="form-label">Capitalization</label>
          <div class="cap-grid">${capChips}</div>
        </div>
        <div class="form-row" style="align-items:center">
          <label class="form-label">Title color</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="color" id="logo-color" value="${logoColor || '#7c6af7'}" style="width:40px;height:32px;padding:2px;border:1px solid var(--border);border-radius:6px;background:var(--surface);cursor:pointer">
            ${logoColor ? `<button id="logo-color-reset" class="btn-xs" style="font-size:.7rem">Use theme</button>` : ''}
          </div>
        </div>
        <div class="btn-row">
          <button id="settings-save" class="btn-primary">Save</button>
          <span id="settings-status" class="status-inline"></span>
        </div>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Account</h2>
        <p class="code-hint" style="margin-bottom:12px">Your starting balance is added to your running balance but not counted as income.</p>
        <div class="form-row" style="align-items:center">
          <label class="form-label">Starting balance ($)</label>
          <input type="number" id="starting-bal-settings" class="form-input" value="${state.startingBalance || ''}" placeholder="0.00" step="0.01" inputmode="decimal" style="max-width:140px">
        </div>
        <div class="btn-row">
          <button id="starting-bal-settings-save" class="btn-primary">Save</button>
          <span id="starting-bal-settings-status" class="status-inline"></span>
        </div>
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:12px">Theme</h2>
        <div class="theme-list">${themeRows}</div>
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
        <h2 class="section-title" style="margin-bottom:8px">Accounts</h2>
        <p class="code-hint" style="margin-bottom:12px">Label transactions by account.</p>
        <div class="accounts-list">${accountRows}</div>
        <div class="form-row" style="margin-top:12px">
          <label class="form-label">Add account</label>
          <div style="display:flex;gap:8px;align-items:stretch">
            <input type="text" id="new-acct-name" class="form-input" placeholder="Account name" style="flex:1">
            <select id="new-acct-type" class="form-input form-select" style="width:120px">
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit</option>
              <option value="loan">Loan</option>
              <option value="cash">Cash</option>
            </select>
          </div>
        </div>
        <button id="add-acct-btn" class="btn-sm">Add Account</button>
        <span id="acct-status" class="form-status" style="font-size:11px"></span>
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
      </div>

      <div class="form-card">
        <h2 class="section-title" style="margin-bottom:8px">Dashboard</h2>
        <p class="code-hint" style="margin-bottom:12px">Choose which sections appear on your dashboard.</p>
        <div class="tab-toggles">
          ${[
            { key:'dashBills',     label:'Bills Due Soon' },
            { key:'dashInsights',  label:'Spending Insights' },
            { key:'dashChart',     label:'Chart' },
            { key:'dashBreakdown', label:'Spending Breakdown' },
            { key:'dashNetWorth',  label:'Net Worth' },
          ].map(item => `
          <label class="tab-toggle">
            <span class="tab-toggle-label">${item.label}</span>
            <input type="checkbox" class="tab-toggle-input dash-section-toggle" data-key="${item.key}"
              ${s[item.key] !== false ? 'checked' : ''}>
            <span class="tab-toggle-switch"></span>
          </label>`).join('')}
        </div>
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

  document.getElementById('starting-bal-settings-save')?.addEventListener('click', () => {
    const val = parseFloat(document.getElementById('starting-bal-settings')?.value);
    state.startingBalance = isNaN(val) ? 0 : val;
    _save();
    showStatus('starting-bal-settings-status', '✓ Saved', 'success', 2000);
  });

  // Logo color — immediate apply + save
  document.getElementById('logo-color')?.addEventListener('input', e => {
    const s = loadSettings();
    s.logoColor = e.target.value;
    saveSettings(s);
    const logo = document.querySelector('.logo');
    if (logo) logo.style.color = s.logoColor;
  });

  // Reset logo color to theme default
  document.getElementById('logo-color-reset')?.addEventListener('click', () => {
    const s = loadSettings();
    delete s.logoColor;
    saveSettings(s);
    const logo = document.querySelector('.logo');
    if (logo) logo.style.color = '';
    render();
  });

  // Custom font picker
  const fpTrigger = document.getElementById('fp-trigger');
  const fpPanel   = document.getElementById('fp-panel');
  const logo      = document.querySelector('.logo');

  fpTrigger?.addEventListener('click', () => {
    fpPanel?.classList.toggle('hidden');
  });

  // Close panel when clicking outside
  document.addEventListener('click', function fpOutside(e) {
    if (!document.getElementById('fp-picker')?.contains(e.target)) {
      fpPanel?.classList.add('hidden');
      document.removeEventListener('click', fpOutside);
    }
  });

  fpPanel?.querySelectorAll('.fp-option').forEach(opt => {
    // Hover → live preview
    opt.addEventListener('mouseenter', () => {
      if (logo) logo.style.fontFamily = opt.dataset.font || '';
    });
    opt.addEventListener('mouseleave', () => {
      const saved = loadSettings().logoFont || '';
      if (logo) logo.style.fontFamily = saved;
    });
    // Click → save
    opt.addEventListener('click', () => {
      const s = loadSettings();
      s.logoFont = opt.dataset.font;
      saveSettings(s);
      if (logo) logo.style.fontFamily = s.logoFont || '';
      fitLogo();
      fpPanel.classList.add('hidden');
      fpPanel.querySelectorAll('.fp-option').forEach(o => o.classList.toggle('active', o === opt));
      // Update trigger preview
      const prev = document.querySelector('.fp-trigger-preview');
      const lbl  = document.querySelector('.fp-trigger-label');
      if (prev) { prev.style.cssText = opt.dataset.style || ''; prev.textContent = opt.querySelector('.fp-opt-preview').textContent; }
      if (lbl)  lbl.textContent = opt.querySelector('.fp-opt-name').textContent;
    });
  });

  // Capitalization chips — immediate apply + save
  document.querySelectorAll('.cap-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = loadSettings();
      s.logoTransform = btn.dataset.transform;
      saveSettings(s);
      const logo = document.querySelector('.logo');
      if (logo) {
        if (s.logoTransform === 'small-caps') {
          logo.style.textTransform = '';
          logo.style.fontVariant   = 'small-caps';
        } else {
          logo.style.textTransform = s.logoTransform || '';
          logo.style.fontVariant   = '';
        }
        fitLogo();
      }
      document.querySelectorAll('.cap-chip').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  // Theme rows — immediate apply + save
  document.querySelectorAll('.theme-row').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = loadSettings();
      s.theme = btn.dataset.theme;
      saveSettings(s);
      applyTheme(s.theme);
      render(); // re-render settings so checkmark + active state update
    });
  });

  document.querySelectorAll('.nav-pos-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = loadSettings();
      s.navPosition = btn.dataset.pos;
      saveSettings(s);
      applyNavPosition(btn.dataset.pos);
      fitLogo(); // header width changes with nav position — remeasure immediately
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

  document.getElementById('add-acct-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('new-acct-name').value.trim();
    const type = document.getElementById('new-acct-type').value;
    if (!name) { showStatus('acct-status', 'Enter an account name.', 'error'); return; }
    await api.addAccount(name, type);
    showStatus('acct-status', `✓ "${name}" added. Switch to it above.`, 'success');
    document.getElementById('new-acct-name').value = '';
    render();
  });

  document.querySelectorAll('.acct-rename-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id    = btn.dataset.id;
      const input = btn.closest('.account-row').querySelector('.acct-name-input');
      const name  = input.value.trim();
      if (!name) return;
      await api.renameAccount(id, name);
      showStatus('acct-status', '✓ Renamed.', 'success');
    });
  });

  document.querySelectorAll('.acct-switch-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await api.switchAccount(btn.dataset.id);
    });
  });

  document.querySelectorAll('.acct-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id   = btn.dataset.id;
      const acct = state.accounts.find(a => a.id === id);
      if (!acct) return;
      if (confirm(`Delete "${acct.name}"? All its transactions, budgets, and bills will be permanently removed.`)) {
        await api.deleteAccount(id);
        render();
      }
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
    const pin1 = prompt('Enter a 4-digit PIN:');
    if (!pin1 || !/^\d{4}$/.test(pin1)) { showStatus('pin-status', 'PIN must be exactly 4 digits.', 'error'); return; }
    const pin2 = prompt('Confirm PIN:');
    if (pin1 !== pin2) { showStatus('pin-status', 'PINs do not match.', 'error'); return; }
    localStorage.setItem('slawminyaw_pin', pin1);
    showStatus('pin-status', '✓ PIN set.', 'success');
    render();
  });

  document.getElementById('pin-remove-btn')?.addEventListener('click', () => {
    if (confirm('Remove PIN lock?')) {
      localStorage.removeItem('slawminyaw_pin');
      render();
    }
  });

  // Dashboard section toggles
  document.querySelectorAll('.dash-section-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      const s = loadSettings();
      s[cb.dataset.key] = cb.checked;
      saveSettings(s);
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
  { icon:'👋', title:"Welcome to Budget DAWGs",         body:"Your all-in-one budgeting app. Track spending, plan weeks, manage bills, monitor debt, and keep multiple accounts — all in one place. Tap Next to take a quick tour." },
  { icon:'🏦', title:'Multiple Accounts',               body:"When you have 2+ accounts, the app opens to a tile screen showing every account with its current balance. Tap a tile to enter it. Use the ⊞ button in the header to return to the account list at any time." },
  { icon:'➕', title:'Adding Transactions',             body:'Tap ➕ Add to log income, an expense, or a transfer between accounts. Pick a category, enter an amount, and choose a date. The keyboard shows a ✓ Done key so you can close it without jumping to the next field.' },
  { icon:'📊', title:'Dashboard & Month Navigator',    body:"The Dashboard shows your balance, income, and expenses for the selected month. Use the ‹ › arrows to browse past months — your balance card shows what you actually had on the last day of that month." },
  { icon:'📋', title:'Ledger & Running Balance',        body:'The Ledger lists every transaction. Each row shows a running balance — what your account held right after that transaction, just like a bank statement. Tap ✏️ to edit a row inline, or swipe left to delete.' },
  { icon:'🥧', title:'Charts & Category Drill-down',   body:"Tap any bar or pie slice on the dashboard chart to see every transaction in that category for the month. Toggle between Bar and Pie views with the button above the chart." },
  { icon:'💳', title:'Debt: Credit Cards & Loans',      body:"Add accounts with type Credit or Loan in Settings → Accounts and set the starting balance to what you currently owe. The Debt tab shows each account's balance owed, a payoff progress bar, and full payment history." },
  { icon:'📑', title:'Bills & Notifications',           body:'Add recurring bills in the Bills tab. The app badges the Bills tab and sends a notification when bills are due within 3 days. Marking a bill paid offers to auto-log it as an expense.' },
  { icon:'📅', title:'Weekly Planner',                  body:'The Weekly tab calculates how much you can spend per week and per day until your next paycheck, after bills and an optional emergency buffer. Past weeks expand to show every transaction.' },
  { icon:'⚙️', title:'Settings & Personalization',      body:"Change your app title, font, capitalization, and color theme in Settings. Hide tabs you don't use, move the nav bar to any side, set a PIN lock, and toggle which sections appear on your dashboard." },
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
    case 'bills':     attachBills();     break;
    case 'debt':      attachDebt();      break;
    case 'goals':     attachGoals();     break;
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
  // Show/hide transfer-specific fields
  document.querySelectorAll('input[name="etype"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isTransfer = radio.value === 'transfer';
      const toRow      = document.getElementById('add-to-acct-row');
      const catRow     = document.getElementById('add-cat-row');
      const recurRow   = document.getElementById('add-recurring-row');
      const descRow    = document.getElementById('add-desc-row');
      if (toRow)    toRow.style.display    = isTransfer ? '' : 'none';
      if (catRow)   catRow.style.display   = isTransfer ? 'none' : '';
      if (recurRow) recurRow.style.display = isTransfer ? 'none' : '';
      if (descRow)  descRow.style.display  = isTransfer ? 'none' : '';
    });
  });

  document.getElementById('add-btn')?.addEventListener('click', async () => {
    const amtVal = document.getElementById('add-amount').value;
    const amount = parseFloat(amtVal);
    if (!amtVal || isNaN(amount) || amount <= 0) { showStatus('add-status', 'Enter a valid amount.', 'error'); return; }
    const type = document.querySelector('input[name="etype"]:checked').value;
    const date = document.getElementById('add-date').value || today();

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

function exportCSV() {
  const rows = [['Date','Type','Category','Description','Amount','Account']];
  [...state.transactions]
    .sort((a,b) => b.date.localeCompare(a.date))
    .forEach(t => {
      const acctName = (state.accounts.find(a => a.id === (t.account||'main'))?.name) || 'Main';
      rows.push([t.date, t.type, t.category, t.description || '', t.amount.toFixed(2), acctName]);
    });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `budget-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function attachLedger() {
  document.getElementById('ledger-search')?.addEventListener('input', e => {
    ledgerFilter = e.target.value.toLowerCase(); render();
  });
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

  attachSwipeDelete();

  document.getElementById('ledger-export-csv')?.addEventListener('click', exportCSV);
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
        state.bills        = data.bills        || [];
        state.goals        = data.goals        || [];
        state.accounts     = data.accounts     || defaultAccounts();
        if (!state.accounts.length) state.accounts = defaultAccounts();
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
      bills:        state.bills,
      goals:        state.goals,
      accounts:     state.accounts,
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `slawminyaw-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('import-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines   = ev.target.result.split('\n');
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
      _reloading = true;
      window.location.reload();
    }
  } catch(e) { /* offline — skip */ }
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

// ── pin lock ───────────────────────────────────────────────────────────────
function showPinLock(onSuccess) {
  const existing = document.getElementById('pin-lock-overlay');
  if (existing) existing.remove();
  const saved = localStorage.getItem('slawminyaw_pin');
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
        if (entered === saved) {
          overlay.remove();
          onSuccess();
        } else {
          overlay.querySelector('#pin-error').textContent = 'Incorrect PIN';
          entered = '';
          updateDots();
          setTimeout(() => { if (overlay.isConnected) overlay.querySelector('#pin-error').textContent = ''; }, 1500);
        }
      }
    });
  });
}

// ── init ───────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    spawnDollarBurst(btn);
    showTab(btn.dataset.tab);
  }));

// Floating tutorial button
document.getElementById('tut-float-btn')?.addEventListener('click', openTutorial);
// Close tutorial on backdrop click
document.getElementById('tutorial-overlay')?.addEventListener('click', e => {
  if (e.target === document.getElementById('tutorial-overlay')) closeTutorial();
});

(async () => {
  await runSplash();
  showPinLock(async () => {
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

    // ── swipe between tabs ────────────────────────────────────────────────
    (function attachSwipeTabs() {
      const mc = document.getElementById('main-content');
      if (!mc) return;
      let tx0 = 0, ty0 = 0;
      mc.addEventListener('touchstart', e => {
        tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY;
      }, { passive: true });
      mc.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - tx0;
        const dy = Math.abs(e.changedTouches[0].clientY - ty0);
        if (Math.abs(dx) < 55 || dy > 45) return;
        const hidden  = loadSettings().hiddenTabs || [];
        const visible = NAV_ITEMS.map(n => n.key).filter(k => !hidden.includes(k));
        const idx     = visible.indexOf(currentTab);
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
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!_reloading) { _reloading = true; window.location.reload(); }
      });
    }
  });
})();
