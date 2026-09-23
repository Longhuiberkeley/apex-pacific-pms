# Agent demonstration

Use only fictional data supplied by this demo. Work from this directory, with the local browser signed in. Copy APEX_URL and APEX_SESSION from an assignment's Agent access / CLI tab. Refresh resets that browser; other browsers have independent state.

1. Run `node scripts/apex.mjs screening get` and inspect applied thresholds.
2. Run `node scripts/apex.mjs funds add --json=examples/candidate.json` and then use `examples/candidate-second.json` to add a second row.
3. Read the returned assignment with `node scripts/apex.mjs tasks get RESEARCH-<returned-fund-id>`.
4. Prepare a JSON report containing recommendation, rationale, risks, conditions and sources. Cite only source IDs from the assignment. Explain evidence limitations; do not invent verification.
5. Save the report to a temporary JSON file and run `node scripts/apex.mjs tasks submit <assignment-id> --json=<file>`.
6. Read approved data using `node scripts/apex.mjs records list` or `records get DATA-hal-nav-08` after a person approves the NAV extraction.

The analyst/PM reviews the submission in the web app. Agents cannot approve documents or investments. Reads follow the selected browser's role. A timeout on a write requires reading current state before retrying. Repeated candidate names are rejected.

This uses live local transport with prepared fictional content; no model is called by the app. Never send email or contact an actual manager during the demonstration.

## Command reference

Every command returns one JSON envelope — `{ ok, message?, data }` — and `scripts/apex.mjs` exits with code 1 when `ok` is false. The surface column says who can actually run the verb: `cli` (external agent through `scripts/apex.mjs`, and the in-app shell), `in-app demo` (shell / ⌘K palette trigger only — not reachable from the terminal), `human` (a UI lever that only echoes as a receipt; agents get BLOCKED with an audit entry).

| Verb | Payload | Output shape | Surface |
| --- | --- | --- | --- |
| `help` | — | the three command groups (cli / in-app demo / human levers) | cli |
| `whoami` | — | signed-in human (name, email, role), actingAs, fence, writes, gated list | cli |
| `history` | — | the last 20 shell lines (typed commands and form receipts) | cli |
| `today queue` (alias `queue list`) | — | openApprovals, intakePolicy, gateOpen, queue, pendingDocs, triggers, broker state | cli |
| `tasks list` / `tasks get <ID>` | — | assignments with submission counts / one brief with sources and revisions | cli |
| `tasks submit <ID>` | submission JSON | revision recorded, routed to the named reviewer | cli |
| `funds list` / `funds get <ID>` | — | invested + pipeline / fund with documents, assignments, history, verdict | cli |
| `funds add` | candidate JSON | new fund id + `RESEARCH-<id>` assignment id | cli |
| `docs list` / `docs get <ID>` | — | structured document records / extracted fields and review status | cli |
| `records list` / `records get <ID>` | — | typed approved values, corrections, evidence references (role-filtered) | cli |
| `screening get` | — | applied criteria and evaluated candidates with evidence fields | cli |
| `screening list` (alias `screen list`) | — | pipeline rows: id, name, status, score, metricSource, metricAsOf | cli |
| `fees get <FUND>` | — | sources, worksheet inputs, computed comparison, saved reviews | cli |
| `monitoring get [FUND]` | — | NAV freshness checks per fund with investigation links | cli |
| `dd get <FUND>` | — | diligence state, why, open flags, check rows (CHK-*), verdict | cli |
| `book get` | — | committed book, staged proposal, rule violations | cli |
| `book propose` | book JSON | proposal staged (never committed) + violations | cli |
| `book paste --raw` (alias `book propose --raw`) | — | seeded raw agent book Σ 101.3 staged + violations | cli |
| `audit tail <n>` | — | last n checksum-chained audit entries | cli |
| `screen extract --now` | — | semantic extract with deterministic dedupe | in-app demo |
| `screen add "<name>"` | — | intake receipt — no score invented | in-app demo |
| `agent demo` | — | the raw agent vs the rails, twice | in-app demo |
| human levers (see below) | — | `BLOCKED` + audit entry | human |

### Payload schemas

- **submission** (`tasks submit <ID> --json=research.json`): `recommendation`, `rationale`, `risks`, `conditions`, `sources` (array of source IDs). Source IDs are checked against the assignment; unknown IDs are rejected. Explain evidence limitations; do not invent verification.
- **book** (`book propose --json=book.json`): every portfolio fund ID plus `CASH`, in percentage weights. Proposals are staged only — a proposal never commits; the PM's approval commits and re-runs the rules at the gate.
- **funds add** (`--json=examples/candidate.json`): `name` (required, deduped against the watchlist), optional `metrics`, `metricSource`, `metricAsOf`. Metrics require both a source and an `YYYY-MM-DD` as-of date; values are range-checked.

### Transport notes

- Command ≤ 2000 characters, payload ≤ 128 KB (larger bodies are refused with 413).
- 12 s response timeout — read current state before retrying a write; a timed-out write may already have landed.
- `node scripts/apex.mjs sessions` lists live browser sessions; target one with `--session=BROWSER_ID` (or `APEX_SESSION`), and point at another host with `--url` (or `APEX_URL`; default `http://localhost:5199`).
- Requires `npm run dev` running with a signed-in browser tab — commands are executed by that tab's live store.
- Each tab has independent state, and refreshing the browser resets its demo state.

## Human-gated levers

Every lever below is operated by a human in the UI. When a human pulls it, the command echoes into the shell transcript as a receipt (form echo — human lever, not agent-runnable). An agent that types any of them gets `BLOCKED` with an audit entry; the decision or record belongs to the UI:

- `tasks draft`, `tasks update`, `tasks review` — research drafts, activity notes and submission review (the assignee and named PM reviewer).
- `docs approve`, `docs reject`, `docs edit` — document review: approve & save, reject with a reason, correct an extracted field.
- `today approve`, `today reject` — signing Today's queue items to the ledger.
- `screen triage` — routing a candidate (park / send to diligence) in Funds → Candidate screening.
- `dd verdict` — recording a diligence verdict on the fund page (PM-signed).
- `book set`, `book stage --from=edit`, `book approve`, `book discard` — allocation cell edits, the staging receipt Portfolio emits when an edit stages the proposal, the IC approval lever and discarding a staged proposal.
- `fee approve` — approving a fee reconciliation (PM only; the approval emits its `fee approve` receipt).
- `criteria apply` — applying edited screening criteria.
- `policy intake` — switching intake policy (AUTO / MANUAL).
- `monitor assess` — turning a monitoring trigger into a workup.
- `ops parse monday.xls`, `ops reconcile monday.xls`, `ops ack HAL.restatement`, `ops queue-fx`, `ops escalate`, `ops open-pack` — the Today operations story: broker parse, ledger-vs-statement reconciliation, the Halcyon fee acknowledgement, queuing FX breaks, escalating the missing Sable pack, opening a reporting pack.

## UI ↔ CLI parity

What each screen can do, and which verb an agent has for it. Columns: UI screen/action · CLI verb · output · agent|human.

| UI screen / action | CLI verb | Output | agent\|human |
| --- | --- | --- | --- |
| Today queue | `today queue` | open approvals, queue items, pending docs, triggers, broker state | agent (read) |
| Today queue | `today approve` / `today reject` | `BLOCKED` + audit entry | human |
| Document intake | `docs list` / `docs get` | fields, confidence, review status, provenance | agent (read) |
| Document intake | `docs approve` / `docs reject` / `docs edit` | `BLOCKED` + audit entry | human |
| Approved data | `records list` / `records get` | typed approved values, corrections, evidence references | agent (read) |
| Screening | `screening get` / `screening list` (alias `screen list`) | criteria + results + evidence / pipeline rows | agent (read) |
| Screening | `funds add` | candidate + research assignment created (intake, never scored) | agent (intake) |
| Screening | `criteria apply` + `screen triage` | `BLOCKED` + audit entry | human |
| Assignments | `tasks list` / `tasks get` | briefs, evidence, submissions | agent (read) |
| Assignments | `tasks submit` | revision recorded, reviewer routed | agent (submit) |
| Assignments | `tasks review` | `BLOCKED` + audit entry | human |
| Assignments | `tasks draft` / `tasks update` | `BLOCKED` + audit entry (form receipts) | human |
| Fund + diligence | `funds get` / `dd get` | documents, assignments, history / DD state, flags, checks, verdict | agent (read) |
| Fund + diligence | `dd verdict` | `BLOCKED` + audit entry | human (PM-signed) |
| Monitoring | `monitoring get` | freshness checks + investigations | agent (read) |
| Monitoring | `monitor assess` / runMonitoring engine-UI, review | `BLOCKED` + audit entry | human |
| Fees | `fees get` | sources, worksheet inputs, computed comparison, saved reviews | agent (read) |
| Fees | `fee approve` (approveFee) | `BLOCKED` + audit entry; the PM's approval emits its `fee approve` receipt | human (PM) |
| Portfolio | `book get`, `book propose` / `book paste --raw` | committed / staged / violations — staged only, never commits | agent (read + stage) |
| Portfolio | `book stage --from=edit` (UI receipt) | echoed when a cell edit stages the proposal | human |
| Portfolio | `book approve` | `BLOCKED` + audit entry | human (PM) |
| Audit / Activity | `audit tail` | checksum-chained entries (technical surface — internal IDs allowed here only) | agent (read) |
