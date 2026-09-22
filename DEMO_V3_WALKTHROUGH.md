# Fund workflow walkthrough

All examples are fictional. Start `npm run dev`, then use the printed Network URL (currently http://192.168.28.193:5199/) and Skip MFA. The sidebar switches PM / Analyst. Each browser has separate state; refresh resets work.

## Where to go

- **Today:** My work for reviews and assigned follow-ups, Team work for the shared work board, Document intake for incoming files and firm-level invoices.
- **Funds:** Candidates / Invested / All. Compare candidate screening results here; open a fund for the actual research, evidence and decisions.
- **Portfolio:** allocations, limits and investment approvals.

Each fund has Overview, Research & diligence, Documents & data, Operations, and Activity. Operations contains Reporting & monitoring and Management fees. All activity is a secondary workspace view. Presenter tools contains the demo explanation, CLI console and this guide.

The original internal IDs still work in the CLI. They are tucked under technical details in the human interface.

## 1. Compare candidates, then investigate one fund

Open Funds → Candidates. Select Dovetail Equity, which passes the default checks. Change Annualized return from 11 to 14.5: it leaves the eligible group. Restore defaults and apply settings if needed.

Open Fund record → Research & diligence. Inspect the screening evidence, then open its research assignment. Load prepared research, inspect sources, and edit Conditions & follow-up. Submit for review. As PM, request changes or accept with a note. The next assignment carries the analyst’s conditions and your instruction. No investment has been made.

Say: “Code does the comparison. The analyst checks the evidence and adds judgment. The reviewer decides what happens next.”

## 2. Review evidence and save the agreed data

Open Halcyon → Documents & data → Harborline_August_NAV.pdf. Show the source mailbox, filename and original-file path. Switch between Annotated review and Original PDF. Approve & save record, then View saved record. The saved values, reviewer and source references remain inside Halcyon’s fund record.

For a correction example, use Today → Document intake → PacificFundServices_September_Invoice.pdf. Change the proposed expense classification to `6200-Administration`. Approve it and open the saved record. This firm-level invoice remains in intake because it has not been assigned to a fund.

Say: “We approve these values into the fund’s structured records. The original PDF remains our evidence.”

PDF assets are real files. The annotated review is a matching HTML rendition. Saved structured records are browser-session state, not a persistent database.

## 3. Show access restrictions

As PM, open Halcyon’s management fee terms under Documents & data. Switch to Analyst: a generic restricted-document marker replaces it. The approved terms and fee worksheet are also restricted. Silk River’s confidential reference assignment is hidden from the analyst’s work views and CLI.

In the agent console, `docs get private-reference`, `records get DATA-terms-hal`, and `tasks get PM-REF` are refused as Analyst. Switch to PM to restore access. These are application-level demo restrictions, not secure storage of static fixtures.

## 4. External agent contribution

Open any assignment → Agent access / CLI and copy APEX_URL and APEX_SESSION. From this directory:

```bash
node scripts/apex.mjs funds add --json=examples/candidate.json
node scripts/apex.mjs funds add --json=examples/candidate-second.json
node scripts/apex.mjs screening get
node scripts/apex.mjs tasks get RESEARCH-<returned-fund-id>
node scripts/apex.mjs tasks submit RESEARCH-<returned-fund-id> --json=/tmp/research.json
```

Give OpenCode or Claude Code `AGENT_DEMO.md` for the report contract. New candidates appear in Funds without refresh; their reports enter the same fund assignment and Today review queue. Duplicate names are rejected. After a timeout, read current state before retrying a write.

The transport is live; built-in research and extraction are prepared examples. The app does not invoke a model.

## 5. Resolve a reporting exception

Open Sable Creek → Operations → Reporting & monitoring. Its 38-day-old NAV exceeds the 30-day limit. Check reporting & assign follow-up, then open the investigation. Alternatively, Today’s overdue Sable alert opens that same investigation.

Prepare the findings, edit and submit. As PM, accept with “Obtain the overdue administrator pack and verify the valuation date.” The next Operations task inherits the instruction. The numerical issue remains until underlying data resolves it. Repeating the check does not duplicate the investigation.

## 6. Reconcile a management fee

After approving Halcyon’s NAV, open Halcyon → Operations → Management fees as PM. All three source links open approved records within Halcyon.

The August example calculates $17.1M × 1.44% × 31 / 365 = $20,913.53. Against a $22,500 invoice, the variance is $1,586.47. Edit a proposed rate or date, then restore approved inputs. Explain the discrepancy and approve. Expand the saved reconciliation for its calculation and reviewer; JSON is under Technical details.

The worksheet uses constant NAV and Actual/365. No payment is sent; incentive fees are outside this example.

## 7. Review the history

Open the fund’s Activity tab. It names the event and whether a team member, AI assistant or the system performed it. Internal field names, IDs and checksums are under Technical details. All activity shows the same events across funds and links back to each fund.

## Verification

`npm run build` validates TypeScript and the production bundle. `node scripts/verify-demo.mjs` runs behavioral, navigation, language and 1280×720 / 1920×1080 layout checks through a temporary Chrome debugging session on port 9333 with Vite on 5199. Screenshots go to `/tmp/apex-*.png`.

Use a temporary browser profile: the suite changes and resets that browser’s demo state. `python3 scripts/make-demo-pdfs.py` regenerates the PDF fixtures without third-party libraries.
