# Analyst workflow walkthrough

All examples are fictional. Start `npm run dev`, then use the printed Network URL (currently http://192.168.28.193:5199/) and Skip MFA. The sidebar role selector switches PM / Analyst. Each browser has separate state. Refresh resets edits, records, candidates and submissions.

## 1. Prepare the shortlist

Open Screening. There are 16 new illustrative candidates alongside the existing pipeline. Inspect Dovetail Equity (C-004), which passes the default numerical checks. Change Annualized return from 11 to 14.5: it leaves the eligible group. Restore defaults, then Apply settings if changes remain. Open Dovetail’s research assignment.

Say: “Code checks every supplied metric. Missing evidence stays visible. The analyst decides whether the strategy and evidence justify further work.”

Load prepared AI research, inspect the source snapshot, and edit Conditions & follow-up. Submit for review. As PM, request changes or accept with a note. Open the follow-up: the analyst’s conditions and PM’s instruction are already there. No investment has been made.

## 2. Agree the data, preserve the original

Open Data library → Original files → PacificFundServices_September_Invoice.pdf. Show the mailbox, filename and raw-file path. Switch between Annotated review and Original PDF; open/download the actual PDF if useful.

Correct the proposed GL classification to `6200-Administration`. Click Approve & save record, then View saved record in the notification. The library shows typed values, human corrections, source references and the reviewer. Expand the JSON. Click the source link to return to the unchanged document.

Say: “We approve these reviewed values into the structured record. The original PDF remains evidence. The saved record can now feed calculations and other workflows.”

Records are session state, not a persistent database. PDF files are real downloadable fixture assets. The annotated review is a matching HTML rendition.

## 3. Show who can see what

As PM, open Halcyon management fee terms or the manager reference note. Switch the sidebar role to Analyst: restricted originals and records disappear, leaving generic markers. Team’s confidential reference assignment is also hidden. `docs get private-reference`, `records get DATA-terms-hal`, and `tasks get PM-REF` are refused in the analyst agent console. Switch to PM to restore access.

These are application-level demo permissions. Static fixtures are not secure storage.

## 4. Let an external agent contribute

Keep the browser open. From any assignment’s Agent access / CLI tab, copy the APEX_URL and APEX_SESSION exports. In this project directory:

```bash
node scripts/apex.mjs funds add --json=examples/candidate.json
node scripts/apex.mjs funds add --json=examples/candidate-second.json
node scripts/apex.mjs screening get
node scripts/apex.mjs tasks get RESEARCH-<returned-fund-id>
node scripts/apex.mjs tasks submit RESEARCH-<returned-fund-id> --json=/tmp/research.json
```

Give OpenCode or Claude Code `AGENT_DEMO.md` for the exact report contract. Both candidates appear without refreshing. The report enters the same human review workflow. Duplicate names are rejected; if a command times out, read the current state before retrying.

The browser transport is live; built-in research and extraction are prepared examples. The app does not call a model.

## 5. Investigate a daily exception

Open Monitoring → Run checks & create investigations. Sable’s 38-day-old NAV breaches the 30-day threshold. Open its assignment, load prepared research, edit and submit. As PM, accept with “Obtain the overdue administrator pack and verify the valuation date.” Open the resulting Operations task.

The breach remains visible because a reviewed explanation does not replace missing data. Running checks again does not duplicate the investigation.

## 6. Reconcile fees

First approve the Halcyon NAV extraction from Today or Data library. As PM, open Fees. The NAV, terms and invoice links point to approved structured records.

The August example uses $17.1M × 1.44% × 31 / 365 = $20,913.53. Against a $22,500 invoice, the variance is $1,586.47. Edit a proposed rate or date to show recalculation. Restore approved inputs; enter a discrepancy explanation and approve the reconciliation. Expand the saved result to show inputs, sources and reviewer. No payment is sent.

The worksheet uses constant NAV and Actual/365. It does not implement incentive fees or changing daily balances.

## Verification

`npm run build` validates TypeScript and the production bundle. `scripts/verify-demo.mjs` runs behavioral checks and 1280×720 / 1920×1080 layout checks using a temporary Chrome debugging session on port 9333 and Vite on 5199. It uses only Node’s built-in APIs and leaves screenshots under `/tmp/apex-*.png`.

Run the suite against a temporary browser profile; it changes and resets that browser’s demo state. `python3 scripts/make-demo-pdfs.py` regenerates the fictional PDF fixtures without third-party libraries.
