# Theme presentation QA — v5.72.0

final result: passed

## Target and evidence

The user likes the approved Daily Snapshot design, but found Bears uncomfortable and requested pleasing typography and colors across every theme. Keep the current page hierarchy, native seven-day graph, four Ledger entries, and workflows; refine theme presentation.

Fresh review used isolated demo data in Chromium at 390 × 844, November 20, 2026, America/Chicago. All 28 themes were captured on Home, Add, Weekly, and Accounts before and after changes. Browser screenshots use the same CSS-pixel density and require no normalization. Desktop checks use 1440 × 1000. Images are browser evidence, not generated UI mockups.

Evidence directory: `/workspace/setup-audit/theme-polish-5720`.

- `audit.md`: findings, severity, and resolution.
- `before-board-1.png` through `before-board-4.png`, and matching `after-board-*`: all themes, opened and reviewed.
- `comparison-bears.png`, `comparison-cmd.png`: direct before/after comparisons, opened and reviewed.
- `after-bears-add.png`, `matrix-bears-wallet.png`, and Bears Ledger/Quiet/Grid skin wallet captures: individual controls, values, and surface treatments reviewed at readable size.
- `font-settings-bears.png`, `final-bears-quick-add.png`, `final-bears-desktop.png`, `final-bears-offline.png`: focused final checks.
- Metrics and test evidence: `before-theme-metrics.json`, `after-theme-metrics.json`, `matrix-results.json`, `resilience-results.json`.

## Final visual decisions

Bears uses softer navy surfaces, neutral separators, warm orange content accents, and a deeper orange primary fill. Sports themes use system fonts and restrained weights. Ten saturated sports, terminal, and Pokémon palettes are balanced; CMD uses neutral body text with green highlights. Gengar retains its primary purple identity and Jakarta typography.

Content accents and action fills have separate tokens. Foreground roles are adjusted against the page and three panel surfaces, starting from raw theme colors so repeated application does not compound changes. Themes without a dedicated action fill use their adjusted accent. Sheets outside the main app share the action color and computed ink.

Theme font follows the selected theme immediately. Explicit App font, System, and Terminal preferences persist across switches and reloads. Legacy System/Terminal choices are retained. Older auto-written font values follow the theme; the old format cannot distinguish a manually selected Default from an auto-written Default. Applying themes no longer modifies saved font settings.

The font selector has four choices, readable descriptions, and pressed states. Wide contribution values wrap at enlarged text sizes. Nine bundled sports/Pokémon mascot assets are precached so their visual identity remains available offline. Existing image assets and chart data are unchanged.

## Findings fixed during review

- Orange overuse and saturated Bears surfaces.
- Stale theme fonts and overwritten font preferences.
- Insufficient secondary/semantic foreground contrast on panel surfaces.
- PowerShell contribution overflow at 200% text and 320px.
- Missing team/Pokémon artwork on a first offline reload.

No actionable P0/P1/P2 findings remain within the reviewed scope.

## Verification

- Eleven Node test files passed, including meaningful new coverage for palette readability, custom extremes, repeatable adjustments, theme fonts, legacy settings, and explicit preferences. Financial regression suites passed.
- Existing browser test suite: **30/30 passed**. Real transaction save, balance update, four Ledger links, privacy, graph expansion/cleanup, system light/dark repaint, font choices, and reload persistence passed.
- **2,016** page/theme/skin/viewport states across all 28 themes, no skin plus all three skins, and 320px/390px. No horizontal overflow, unusable account-list height, or undersized visible native page buttons in tested states.
- **224** resolved palette combinations: main text, muted, accent, secondary accent, success, warning, and danger measured at least **4.5:1** on all four tested surfaces; action ink also measured at least 4.5:1.
- **224** final Settings/Retirement rechecks at 320px after font-description and wrapping corrections.
- **16** portal/theme/skin combinations, including extreme custom accents and clearing dedicated action colors on theme switches.
- **27** enlarged-text states at 200%/320px across Bears, Gengar, and PowerShell.
- **32** desktop states across Bears, Light, Gengar, and PowerShell with remote fonts blocked, exercising fallback typography.
- Offline reload preserved Bears, four Ledger entries, and Manage navigation. All sports/Pokémon themes rendered their mascot without network access; all nine assets were verified in the cache.
- Zero uncaught page errors in completed functional, matrix, targeted, and resilience runs. Syntax and diff whitespace checked; release metadata synchronized.

## Scope limits

Token contrast measurements do not cover every composited color, dense calendar cell, or screen-reader behavior. These are browser-emulator and offline checks, not physical-device certification. Financial algorithms and saved financial data formats are unchanged; the font preference is an additive settings field.
