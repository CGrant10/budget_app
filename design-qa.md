# Bank matching and backup permission QA — v5.73.0

final result: passed

## Scope and behavior

The user approved account reconciliation and reported having to press Allow twice for backup on launch. The previous reconciliation sheet only added a balance-adjustment transaction. The new Match my bank flow compares a statement's posted balance against selected recorded entries, starting from the account's opening balance. It saves a checkpoint only at a zero-cent difference and leaves transaction amounts, balances, budgets, and pending entries intact.

The launch path previously opened an app confirmation labeled Allow before requesting native file access. It now shows a dismissible reminder. Resume requests browser permission directly from its click with the already loaded file handle. Concurrent resume requests share one operation. Save now preloads its handle before enabling the button. Granted file access continues to back up silently once daily; populated-backup protection remains.

## UI and evidence

The new sheet uses existing theme surfaces, action colors, type families, quiet separators, and 44px buttons. Phone layouts use a scrollable body and fixed action footer; desktop uses a centered dialog. It supports statement dates, search, checking visible entries, advisory duplicate labels, and paging for long histories. Focus is trapped, the background is inert, Escape closes, and cancel leaves the saved checkpoint unchanged.

Fresh Chromium evidence is in `/workspace/setup-audit/reconcile-5730`. Mobile captures use 390 × 844 CSS pixels, fixed November 25, 2026, 18:00 UTC, America/Chicago, and isolated test accounts. No pixel-density normalization was needed. Desktop uses 1440 × 1000. Visual reference is the approved Daily Snapshot style already in the app; this is a functional extension using its design language.

Opened and reviewed: `gengar-ready.png`, `match-bears.png`, `match-light.png`, `match-powershell.png`, `match-bears-ledger.png`, `match-bears-quiet.png`, `match-desktop.png`, and the backup reminder. Captures include ready-to-save and empty-target states. `matrix-results.json` records the responsive checks. Offline evidence is `match-offline.png`.

The new date controls follow dark/light native color schemes so calendar affordances remain visible. Backup reminders and short confirmation toasts stack without covering the Resume action.

## Data and correctness

- Calculations use integer cents and recorded dates. Later entries are excluded; unchecked entries remain part of the app's existing financial calculations.
- Cash overdrafts and signed debt credits are supported. Bills, transfers, refunds, and adjustments count once as recorded.
- Each account stores one latest checkpoint and a multiset of matched entry signatures. Duplicate rows retain independent counts. Changed entries need matching again; Ledger shows when earlier records or opening balances change.
- Checkpoints survive account switches, reloads, full backups, legacy-shaped exports/restores, and undo restores. Older backups cannot inherit an unrelated current checkpoint.
- Save refuses mismatches, malformed amounts/dates, future statement dates, changed review inputs, account switches, changed stored financial data, or storage changes while a review is open. Storage failure retains the previous checkpoint.
- No transaction is added, removed, or edited by bank matching.

## Verification

- All **13 Node test files passed**, including new bank-match and auto-backup coverage and expanded backup-restore tests. Existing financial regression suites passed.
- Existing browser suite: **30/30 passed**.
- Functional browser checks passed: entry selection, search, date changes, zero-difference save gating, cancellation/Escape, focus/inert state, unchanged financial data, reload persistence, edited-entry invalidation, debt matching, and empty-account isolation.
- Backup browser checks used a substituted native file handle through the real UI: no app Allow modal, no native request during startup, one request after Resume with active user activation, duplicate startup coalescing, disabled repeated taps, one write, no repeat that day, and Save now activation.
- **454** sheet/reminder/theme/skin/viewport/text states passed: all 28 themes, no skin plus all three skins, widths 320/390, and additional 200% text checks for Bears, Gengar, and PowerShell. No horizontal overflow, unusable body height, or undersized visible sheet buttons in tested states.
- Desktop, advisory duplicate warnings, and a 250-entry paged/searchable history passed.
- Offline v5.73.0 reload retained the checkpoint and checked entries. Reviewing and saving offline worked with external fonts blocked. Both full and legacy compatibility backup payloads included the checkpoint.
- Zero uncaught page errors in successful functional, matrix, and offline runs. Source syntax, diff whitespace, and version/cache/changelog consistency checked.

## Limits

Browser-native permission presentation is controlled by Chrome/Edge and the operating system. Automated tests verify the application's request count and active click handling using a substituted handle; they do not certify every physical device's native permission UI. The app no longer adds its own Allow dialog. A browser may still require file access after a restart.

This release provides manual statement matching. It does not connect to a bank or classify unchecked entries as a new financial transaction status. Unsaved checkbox changes are discarded when closing the review; saved matches persist. Duplicate labels are review hints, never automatic deletion.
