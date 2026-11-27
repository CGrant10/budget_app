# Daily allowance, manual bank matching, and compact entry — v5.76.0

final result: passed

## User requirements and resulting behavior

This follow-up explicitly replaces the previous Home-only weekly cap. Home and Weekly now use the same monthly dynamic daily allowance and current-day progress calculation. Weekly target/overage stays independent. The reproduced example shows **$200 daily** in both places and **$112 over** the weekly target; the Home daily calculation explains the shared rule rather than capping it to zero.

Manual bank matching opens as **Update balance**: one balance field, a clear Available/Posted choice, an adjustment preview, and one save action. There is no mandatory note or checkbox for this direct method. A dated, excluded-from-weekly-spending Adjustment entry records a nonzero difference; prior entries and opening balance are preserved. An exact match only saves the checkpoint. Available-balance matching carries recorded pending purchases once, keeps them pending, and saves the chosen basis per account. Credit/loan matching uses posted balance owed, not available credit. Detailed statement review remains a separate mode. Both methods retain separate draft inputs and existing review selections.

A **Match bank** shortcut beside the dashboard balance opens this flow directly. Add Entry puts type, amount, description, and Save together. Collapsed Details retains account, category, pending state, date, splitting, recurrence, and frequent templates. Native form submission, amount Next, synchronous category inference on save, and non-submit split/calculator controls keep keyboard entry predictable.

## Browser evidence

Artifacts: `/workspace/setup-audit/ease-5760`.

- Before captures opened: `before-add.png`, `before-bank.png` at 390 × 844.
- Final captures opened: `after-add.png`, `after-bank.png`, `entry-short-final.png` (320 × 480), `daily-home.png`, `daily-weekly.png`. The Home/Weekly case is real calculation data, not mocked output values.
- Additional captures: `final-entry-gengar.png`, `final-entry-bears.png`, `final-entry-light.png`, matching `final-bank-*` images, `zoom-*`, desktop entry/bank, `final-home.png`, and `offline.png`.
- Date/time: November 27, 2026 at 18:00 UTC, America/Chicago; Chromium, isolated local test accounts, deviceScaleFactor 1. No customer data or bank connection is involved.

## Findings and fixes

- **[Resolved] Daily rule mismatch:** Home previously showed the lower of the monthly daily allowance and the weekly remainder; Weekly showed the allowance itself. Removed the extra cap and its explanatory caption, reused the common monthly calculation, aligned the daily bar, and clarified the displayed amount as daily allowance. Saved plans/targets are not rewritten by changing views.
- **[Resolved] Manual matching required too many steps:** the direct method replaces transaction-by-transaction checking for a manual balance correction. The detailed review is still available. Currency input accepts ordinary dollar signs/grouping, with exact cents validation. Current and target balance basis is explicit, including pending amounts and historical dates.
- **[Resolved] Entry core fields were separated by status/settings:** moved description immediately after amount and collapsed less-used fields. The default and short-phone core flow passes bounds checks with no field hidden behind Save.
- **[Resolved] Sticky Save covered description at 320 × 480:** the shared page reserved navigation plus another 30px, causing the sticky footer to rise too far. The entry page now reserves exactly navigation space, and the cover uses that same height. Post-fix field and button rectangles do not overlap.
- **[Resolved] Global keyboard Done blocked the compact form:** explicit handlers and the new native form now own Next/Save. Description blur runs category inference before saving; split buttons are explicitly non-submit. Tested typed entry, Pending, splitting, transfers, destination accounts, and missing-entry return to review.

## Verification

- All **14 Node suites passed**. Added coverage for independent daily/weekly values, the $200 daily/$112 weekly-over example, available versus posted manual matching, formatted/invalid inputs, negative and zero balances, pending carry/preservation, changed-pending detection, no-op matches, debt semantics, stale storage, and atomic rollback.
- Browser functional workflow passed: shared daily allowance/progress, dashboard bank shortcut, keyboard entry, pending/split/transfer/selected-account routing, small-phone core field visibility, direct Available/Posted balance updates, preserved pending and weekly spend, exact matches, remembered basis, separate drafts across reload, detailed review, add-missing-entry return, stale-tab protection, quota rollback, and debt direction. No uncaught errors.
- **1,134 static UI states passed:** 28 themes × four skin choices × 320/390px × five states (basic entry, entry details/split, quick match, detailed review, Home), plus 12 enlarged-text and two desktop states. Static checks use settled/reduced-motion pages and inspect the active modal rather than background inputs. Results: `matrix.json`.
- **227 additional Home states passed** after the balance shortcut: all themes/skins/phone widths plus Gengar, Bears, and Light at 200% text. No horizontal overflow; balance shortcut remains usable.
- v5.76.0 service-worker **offline** reload and persistence passed. While offline, direct balance matching updated the actual account without changing discretionary spending; keyboard entry/category inference saved, and a second reload retained both changes and the shared daily amount. Cache version verified.
- Syntax, diff whitespace, cache/version/changelog consistency checked.

## Visual and accessibility checks

Existing theme color roles, mascot assets, typography preferences, and icon library remain. No new visual system, extra cards, security claims, or external bank services were added. The compact form uses normal 44–52px controls. Matching retains accessible modal focus, close/escape, labeled inputs and status/error feedback. Long detail/review content and large text can scroll; sticky actions remain reachable. The authentic Home layout and graph remain intact.

## Limits

Physical device keyboards and screen readers were not tested; verification uses Chromium emulation and real browser interaction. Available matching reflects **pending purchases recorded in this app**, which the UI states. Bank balance corrections are manual Ledger adjustments, not imported purchases. The dynamic daily amount is a monthly allowance, while the weekly target is an independent spending goal.

---

# Midnight Ledger dashboard QA — v5.75.0

final result: passed

## Target, viewport and evidence

The user explicitly chose **the original set's displayed option 3**, Midnight Ledger, rather than the later refinement set. Source visual truth: `/workspace/generated_images/exec-c880fdcf-5d18-468a-af31-5d455ac9f0a0.png`. Original pixels: 852 × 1846; normalized copy: `/workspace/setup-audit/midnight-5750/visual-target-390.png` at 390 × 844. Implementation: `/workspace/setup-audit/midnight-5750/mock-state-final.png`, 390 × 844 CSS/pixels, deviceScaleFactor 1, Chromium, America/Chicago, Friday November 27, 2026. No browser/device chrome is included.

Combined full-view evidence, opened and reviewed: `comparison-final.png` in the same directory (source left, implementation right). Focused combined evidence also opened: `comparison-money.png` and `comparison-ledger-bills.png`. Initial comparison: `comparison-initial.png`. The full-view comparison was repeated using the final v5.75.0 capture.

The visual fixture renders the shared mock values ($6,254.75 balance, $48.60 daily room, $182.35 weekly room, four specified entries, two bills) through the actual dashboard component. It is a local test fixture, not production budget logic. Separate tests use real calculations; the actual fixture's uncapped daily allowance exceeds the weekly remainder and correctly triggers a weekly cap. No sample amount is hardcoded in production.

## Comparison history and fixes

1. **[P2, resolved] Mobile vertical density hid upcoming bills.** Initial capture placed the end of Bills at y877 while navigation started at y774. Tightened header/section spacing and row rhythm, retained 48px transaction/bill targets, and reduced the shallow chart height. Final capture places all four activity rows and both bills above navigation: Bills ends y769, nav starts y774. Large balances, font settings and explanatory states may require normal vertical scrolling.
2. **[P2, resolved] Large-text labels overlapped and the balance split a final digit onto another line.** The 320px/200% text capture exposed overlap despite no document overflow. Navigation now grows with text size and constrains labels to their own tap areas; the money display responds to viewport width. A post-fix screenshot (`enlarged-gengar.png`) and targeted assertions verify separate, reachable labels and an intact balance. Calculations use bounded scrollable dialogs, keeping Close/Open Planner reachable.
3. **[P2, resolved] Dynamic daily cap was unexplained.** Today now labels a binding weekly cap or an exhausted weekly limit. Tapping either amount opens the corresponding calculation. Real-calculation reproduction of the user's state shows $0.00 Today and $112.00 over this week; the daily dialog explains that new spending adds to the weekly overage. No formula, target, stored plan, or financial history is changed by this clarification.

## Required fidelity surfaces

- **Fonts and typography:** existing Plus Jakarta Sans is the closest matching available font for Gengar; weights and tabular amounts follow the selected hierarchy. Existing theme/System/Terminal preferences remain. Large balance, paired allowance figures, 14px merchant labels, and aligned 15px amounts retain the reference's rhythm. Narrow/enlarged text flows vertically. Display values remain intact at the checked large-text size.
- **Spacing and layout:** full-width shallow graph replaces the former half-width graph; Today/This week remain paired at ordinary phone widths and stack when large text needs room. Four Ledger rows and two compact bills form unboxed sections. Flat navigation uses a shared height variable so sticky entry actions and content reserve the correct space. Desktop retains a centered readable column and side-by-side activity/bills.
- **Colors/tokens:** all styling uses theme/skin roles for background, text, borders, accent, action ink and over-limit danger. Gengar violet, Bears navy/orange, and light palettes were visually inspected; existing palette tests cover all 28 themes. No fixed purple palette is imposed on other themes.
- **Image quality and asset fidelity:** the supplied local Gengar/Doberman/sports artwork is retained rather than the mock generator's redrawn mascot. Merchant and bill icons are original, unmodified Phosphor 2.1.1 assets, vendored with the existing MIT license and added to the offline cache. No synthetic illustration or custom SVG replacement was introduced. The canvas chart is actual local financial data.
- **Copy/content:** date and chronology match November 27. Activity and bill copy uses real descriptions, amounts, status and due dates. Today keeps its actual spent caption rather than inventing a saved fixed daily denominator. The source's seven date labels become three legible date labels. Existing balance privacy and More insights remain available. These are intentional production adaptations, not missing product content.

## Verification

- All **14 Node suites passed**, including new assertions for binding daily caps, exact weekly exhaustion, the user's $112 weekly overage, and avoiding a false daily-overage label.
- Browser primary workflow passed: equal daily/weekly capped amounts; $0 Today/$112 over week; both calculation dialogs; Open Planner and return Home; Home active state; privacy; Add; filtered Ledger row navigation; bill navigation; expanded history. UI exploration preserved transactions, opening balance and plan values.
- **224 phone theme/skin/width states passed:** all 28 themes × four skin choices × 320/390px. Four Ledger rows, broad graph, usable nav dimensions and no horizontal page overflow in each state. Matrix: `/workspace/setup-audit/midnight-5750/matrix.json`.
- Gengar/Bears/Light at 200% text/320px passed post-fix overflow, nav-label bounds, reachable dialog controls and screenshot inspection. A 1440 × 1000 desktop capture and empty-account state passed. No uncaught page errors in successful browser runs.
- v5.75.0 service-worker offline reload passed with all six new icons cached. The real $0 Today/$112-over state and calculation dialog worked offline after selecting the account.
- Syntax, whitespace diff, release/cache/version/changelog consistency checked.

## Follow-up polish and limits

- P3: supplied pixel mascot art differs from the generator's illustration; preserving the app's authentic theme artwork is intentional.
- P3: at 200% text on a narrow phone, some navigation words wrap across lines while remaining legible and separated. Physical-device large-text and screen-reader review remain outside these emulator checks.
- The additional weekly-cap caption and long real descriptions may add vertical scrolling. Persistent controls remain reachable; no attempt is made to force every state into a fixed-height poster.

## Implementation checklist

- [x] Resolve and compare the original selected image.
- [x] Implement the full-width graph and paired spending room.
- [x] Preserve four Ledger entries, upcoming bills, theme roles and working actions.
- [x] Explain the weekly cap and the reported $112-over state.
- [x] Fix captured P2 issues and verify post-fix evidence.
- [x] Pass required functional, visual, responsive and release checks.

---

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

## Bank review follow-up — v5.74.1 (November 27, 2026)

Reproduced the confusing first-review state: a $100 opening balance and a posted $20 purchase appeared $20 apart from an $80 bank balance because no entries started checked. New reviews include eligible posted entries; saved reviews retain deliberate selections. Posted comparison and pending reservation are explained separately. Bulk selection covers all search results, including beyond 100 rendered rows.

Added an explicit adjustment path only when all posted entries are checked and a nonzero difference remains. It previews date, amount, direction, and resulting posted balance, requires a reason plus an unchecked-by-default consent control, and commits the new Ledger entry/checkpoint/draft clearing in one storage write. Cash, debt, and card-credit directions are covered. Existing entries/opening balance are preserved; adjustments are excluded from weekly spending. Failed writes restore transactions, match, and draft together. Changes to the target/date clear adjustment consent; adjustment consent is never restored from drafts.

All 14 Node suites passed, including added adjustment validation, positive/negative cash and debt direction, pending/future exclusions, stale storage, and rollback checks. Chromium workflow passed for initial match, pending amount, ordinary non-mutating save, deliberate adjustment, draft close/reload, 150-entry bulk checks, search scoping, and 320/390px widths across Gengar, Bears, Light, and PowerShell. No uncaught page errors. Fresh screenshots inspected: `/workspace/setup-audit/dashboard-mocks-20261125/bank-after-match.png` and `bank-after-adjustment.png`. The adjustment screenshot shows the lower scroll position and reachable action; no device/native bank connection is involved.
