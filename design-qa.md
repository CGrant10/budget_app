# Everyday workflows QA — v5.74.0

final result: passed

## Scope

The user approved all seven recommendations from the November 25 product review: saved bank-review drafts, compact Bills, polished entry controls, immediate Undo, Pending/Posted purchases, irregular bill schedules, and account archiving. All use on-device data. The existing Daily Snapshot Home, small seven-day graph, four recent entries, theme identities, and offline model remain.

## Implemented behavior

1. **Resumable bank reviews.** Statement date, target, and checked entry identities save locally per account. Close, browser Back, immediate reload/pagehide, and backgrounding retain the draft. Add missing transaction returns to the same review. Saving a zero-difference match clears the draft. Financial changes in another tab prevent an obsolete match from being saved. Draft-only writes merge their field rather than overwrite financial data. Storage failures preserve the open review and offer an explicit close-without-saving action.
2. **Compact Bills.** List is the default; Calendar is a saved view choice. Unpaid occurrences sort before paid ones, by due date. Loan/card linking is in Edit, and existing links appear as captions. Add and other-month schedules stay collapsible. Calendar payment shortcuts remain available.
3. **Entry polish.** Native Expense/Income/Transfer and Posted/Pending radios have large segments. Splitting and monthly recurrence have shortcuts. Save remains reachable while scrolling; its background covers the reserved area above navigation. Split fields remain reachable, including at a short viewport height. Normal and split saves honor the selected account, commit atomically, and report storage failure.
4. **Immediate Undo.** Individual deletion, edits, posting, bulk deletion, and bulk category changes offer one latest-action Undo in Ledger. It restores transaction order, amounts, and metadata. Expected stored data is checked before rollback; newer changes are not replaced. Existing restore points remain available for deeper recovery. Programmatic bill reversals opt out to avoid undoing half a payment workflow.
5. **Pending/Posted purchases.** Legacy entries are posted. Pending applies to manually recorded purchases, not income, transfers, or bill-payment records. Pending expenses affect available money/spending using their recorded date; posting updates the same entry and does not deduct again. Ledger provides a badge, filter, inline edit, and quick Mark posted. Bank matching omits pending purchases and reports their count. JSON backup and CSV export/import retain status.
6. **Irregular bills.** Monthly, quarterly, yearly, and one-time schedules share occurrence-date and amount helpers across Home, Bills, tracked reserves, health, reminders, and forecasts. Anchored dates handle short months and leap years. Paid occurrences retain their original dates/amounts after edits. Manual reserve preferences remain independent. Linked payments and cash deduction/reversal still work.
7. **Account archives.** Zero-balance closed accounts can be archived while keeping their complete data. At least one active account remains. Pending purchases, unresolved current-month bills, and incoming linked bill payments prevent archival until resolved. Archived accounts leave everyday pickers/overview and active debt/retirement planning lists, and pause schedules. Net-worth movement still includes their historical transactions. Manage accounts restores them; schedules stay paused until explicitly reviewed and re-enabled. Full backups and exports preserve archived history.

## Visual evidence

Directory: `/workspace/setup-audit/everyday-5740`. Captures use isolated test accounts, Chromium, fixed November 25, 2026 at 18:00 UTC, America/Chicago. Phone screenshots are 390 × 844 CSS pixels with no density normalization. Desktop captures use 1440 × 1000. Source reference is the existing approved Daily Snapshot style and the user's approved fresh review captures, not a new generated mockup.

Opened and reviewed: `entry-final-bears.png`, `entry-gengar.png`, `final-bears-bills.png`, `final-gengar-bank.png`, `final-bears-ledger-accounts.png`, and initial functional Undo/draft/account captures. Initial functional captures had transient notifications; the clean `final-*` matrix captures and final entry capture are the delivery evidence. Existing surface, font, action, divider, and semantic tokens are used throughout.

Final evidence also includes `desktop-bears-add.png`, `desktop-bears-bills.png`, `offline-bears-bills.png`, and `zoom-bears-bill-edit.png`. Browser records are in `matrix-results.json` and `resilience-results.json`.

## Verification

- All **14 Node test files passed**. New coverage exercises anchored schedules, leap/short months, forecasts, paid-occurrence history, pending reservation/same-entry posting, atomic split failures, Undo safeguards, local draft isolation, and archival history/schedules. Existing test harness dependency lists were expanded without dropping their assertions.
- Main browser workflow passed: entry/posting/Undo, draft close/reload/missing-entry return, bill payment/deduction/reversal, linked loan payment, preserving paid history after edits, irregular schedule creation/month navigation, and archive/restore with unchanged account data.
- Additional browser edges passed: pending split entry, simulated split storage failure without partial rows, selected-account routing, quick pending entry, bulk category/delete Undo, draft backup/restore, obsolete-review protection, explicit draft-failure recovery, archived-history backup, and CSV status round-trip.
- Existing browser suite: **30/30 passed**.
- **2,240** normal page/theme/skin/viewport states passed: all 28 themes × no skin/all three skins × 320/390px × ten views. Included Home, Add/split, Ledger/Undo, Bills/list/calendar/edit, Manage/archives, wallet, and bank review. No horizontal overflow, unusable wallet/modal height, or undersized visible native page buttons in tested states.
- **224** final bill-editor rechecks passed after the enlarged-text correction.
- **27** enlarged-text states passed at 200%/320px for Gengar, Bears, and PowerShell. Initial QA found an 8px Save/Cancel overflow; wrapping flexible buttons fixed it.
- **20** desktop states passed across Bears, Light, Gengar, and PowerShell with remote fonts blocked to exercise fallback typography.
- Four final entry configurations passed, including a 320 × 480 viewport and split-field access above the sticky footer. A final decorative footer cover removes peeking content below the Save action.
- Offline v5.74.0 reload retained pending status, draft selections, schedules, and archive metadata. Offline bank review/save, Bills, and archived-account restore worked.
- Targeted browser checks passed for immediate pagehide draft flushing, Back closing/saving the review, status-filter clearing, escaped imported bill fields, archived closing-transfer totals, and inactive card/retirement planning and contribution guards.
- Zero uncaught page errors in completed successful browser runs. Syntax, diff whitespace, and synchronized app/cache/version/changelog checked.

## Limits

Immediate Undo is the latest eligible Ledger operation in the current session; restore points provide longer recovery. Archive deliberately requires a zero balance and resolved links/bills. Pending state is manual purchase metadata and follows existing date/budget rules. Matching does not connect to a bank. These are browser/emulator checks, not physical-device, native-permission, screen-reader, or whole-app security certification. No sign-in, cloud sync, bank access, or new external financial service was added.
