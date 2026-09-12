# Apex Pacific PMS — a fund operating ledger (demo)

> **This is a fictional demo.** Apex Pacific, its managers (Northgate, Kestrel, Meridian,
> Halcyon, Sable Creek, Kuramoto, Silk River), the administrator, the invoice, the email — every
> entity, document, and number here is invented for a live demo. No real fund, vendor, or data.
> It is the companion demo for the talk *Entering 2027: A Practical Guide to AI*.

**[Open the public demo](https://longhuiberkeley.github.io/apex-pacific-pms/)** ·
**[Presenter practice sheet](DEMO_PRACTICE.md)**

**Presenting from someone else’s computer?** Open the public demo, use **Skip MFA**, then
open Team workspace. No installation or GitHub account is needed. The sidebar’s **Presenter
guide ↗** opens the practice sheet. Its first section covers the browser-only route, reset,
projector preparation and fallback material. The external CLI needs a local development server;
the main walkthrough and built-in agent console work on the public site.

Apex Pacific is a custom operating platform for a fund of funds: **one record per manager,
shared assignments, strong AI assistance, and human decisions.** The sample portfolio has
$142.5M NAV, six invested managers, and Silk River in the pipeline.

## Long Hui's presenter guide — start here

**Practicing for the first time? Open [DEMO_PRACTICE.md](DEMO_PRACTICE.md).** It is a standalone
rehearsal sheet with a first-look tour, setup commands, click-by-click script, sample wording,
recovery steps and space for your notes. The longer guide and technical reference follow here.

### The point you are making

> “We can build our own management software around how our company works. AI can do serious
> research and read messy documents, while the software keeps the records, checks the numbers,
> and moves work to the right person.”

You are showing a **workflow idea**, not delivering a feature tour. Follow Silk River through
research and review, then show one document and one allocation decision. The audience should
remember that work and context move together.

### Before you present

1. From `_local/pms_demo_v3`, run `npm run dev` (run `npm install` first only if needed).
2. Open **http://192.168.28.193:5199/** on your current LAN, or **http://localhost:5199/** on
   the host machine. The LAN address can change when you change networks.
3. Refresh for a clean demo. Sign in as `a.chan@apexpacific.example`, or use **Skip MFA**.
4. Open **Team workspace**. Its **Demo role** dropdown switches between PM and Analyst.
5. Use one browser tab for the main demonstration. Each tab has its own demo state.

**Reset:** refreshing clears all changes and returns to login. Changing roles does not reset
the work. Close an assignment with its top-right × before changing the role in Team.

### Explain the sidebar in 20 seconds

| Place | Your plain-language explanation |
|---|---|
| **Today** | “What needs attention now: documents, reviews and follow-ups.” |
| **Team workspace** | “Who is doing what, and which work needs review.” |
| **Funds** | “Everything we know and do about each invested manager.” |
| **Pipeline** | “Managers we are considering. They have records before we invest.” |
| **Book** | “Our allocations and proposed changes.” |
| **Audit** | “Recent history: who did what.” |
| **Modules** | “The tools in this platform, and what we could add.” |

Hover on the sidebar labels to show these explanations. Team, Today and a fund's **Research &
work** tab link to the same research/follow-up assignments. The demo also contains older daily
operations examples in Today; the main story below uses the connected paths.

### Main walkthrough — about 6–8 minutes

#### 1. Team: the company's work in one place

**Click:** Team workspace → **Group by: Person**. Hover on L. Wu. Switch back to **Stage**.

**Say:** “As a manager, I can see the owners, deadlines, blockers and work awaiting review.
An analyst has an assignment, almost like submitting coursework in Canvas.”

**Point out:** the three mode cards at the top. Keep the distinction simple:

- **Deterministic:** code calculates numbers and follows fixed rules.
- **Type 1:** the software calls AI for one step, such as reading a document.
- **Type 2:** an agent works on a broader assignment and submits its result here.

**What this proves:** one platform can combine all three approaches.

#### 2. Silk River: AI research becomes a submitted piece of work

**Click:** set **Demo role → L. Wu · Analyst**. In the sidebar, click **Silk River**.
In Overview, click **Open screening assignment**.

**Show:** the brief, owner, due date and source library. Expand a source, then click
**Load prepared AI research**. Read a few lines rather than the whole draft.

**Edit “Conditions & follow-up” to:**

> “Obtain administrator confirmation of redemption terms and the audited track record before
> an IC recommendation. Ask specifically about redemption gates.”

**Click:** **Submit for review** (scroll down in the assignment).

**Say:** “The agent has done the preparation. The analyst contributes judgment and submits a
standard piece of work with its sources. This can come from the portal or from an external
agent using a command-line tool.”

**Expected result:** status becomes **Needs review**, with L. Wu named as the submitter.
The record is saved; no investment has been added to the Book.

#### 3. PM review: the next person inherits the context

**Click:** close the assignment → Team → **Demo role → A. Chan · PM** → Silk River →
**Review screening submission**.

**Enter this review note:**

> “Proceed to diligence. Independently confirm the liquidity terms before bringing this to IC.”

**Click:** **Accept → begin diligence** → **Open next assignment**.

**Show:** the new task is assigned to M. Lee. The analyst's conditions and your PM note are
already in its brief. The required documents are listed.

**Say:** “This is the smooth handoff. We haven't copied the report into another app or asked
someone to recreate a task. Software carries the context forward after the human decision.”

**Optional 20-second follow-up:** enter an Activity note describing the fictional request,
then click **Record request sent**. Close the assignment and open Silk River again:
the next action is now **View outstanding documents**. Today also links to the same follow-up.

**Important wording:** this button records that a request was sent; the demo does not send
email. Accepting screening begins diligence, not an investment. Completing the document task
does not automatically complete diligence or approve an allocation.

**What changed from the old demo:** the separate **Request pack** button is gone. Silk River
now points to the next step of the same assignment flow, rather than creating a second chase.

#### 4. The fund record: organizational memory

**Click:** Silk River → **Research & work**. Open the completed screening assignment and expand
its **Submission & decision history**. Then close it and open **History** on the fund page.

**Say:** “The original recommendation, sources, human decision and follow-up stay attached to
this manager. Later, we can review why we considered it and what we asked people to verify.”

**What this proves:** centralization is useful both for today's work and future review.

#### 5. Type 1: AI reads; code calculates; a human checks

**Click:** Today → **Halcyon August NAV pack**. Hover on a highlighted source value and its
matching field. Point to the extracted values and the fee adjustment marked **code**.

**Say:** “Here the software invokes AI for a specific job: turn a document into fields.
The calculation then follows a fixed formula, and a person checks the result.”

**The example:** $17.1M × (0.12% − 0.15%) = **−$5,130**. This is a simple comparison of fee
rates on the same base and period. The July restatement is a separate issue.

**Click:** **Approve**. Go to Team and find **Review the NAV-pack extraction** in **Done**.

**What this proves:** document review completes the linked assignment. You can also show the
invoice's low-confidence GL classification if someone asks how corrections work.

#### 6. Deterministic Book: rules and a real decision point

**Click:** Book. Explain that Sable's old NAV causes Rule E to fail at the starting allocation.

**Optional blocked example:** change Northgate to **37,762,500**, then click outside the field.
Rule A also fails and approval is disabled. Click **Discard**.

**Successful path:** change Sable to **7,125,000**, then click outside the field. This is **5%**.
The proposed cash balance becomes **17%** and Rules A–E pass. Click **Approve — IC** as PM.

**Show:** Team has a new **Review capital instructions · ticket #1** assignment for Operations.

**Say:** “Code handles the arithmetic and checks. A person approves the change. Then software
creates the next operational task. An approved target allocation is not a settled trade.”

**Close:** hover over **Audit**, then open it to show recent actions by the person, agent and
software. Open **Modules** briefly: “We can add more tools to this same platform as we need them.”

### If you only have three minutes

Stay signed in as PM for the quick walkthrough (the submission will correctly name A. Chan).
Show Team → Silk River prepared research → edit → submit → accept with a note → next task.
Finish with the three mode cards and one sentence about Book's fixed calculations. Skip the
role switch, detailed history and document example.

### Optional: show an external agent submitting work

Use this **instead of the portal submission in step 2**, on a fresh assignment. In the
assignment's **Agent access / CLI** tab, copy the `APEX_URL` and `APEX_SESSION` exports into your
terminal. From `_local/pms_demo_v3`, run:

```bash
node scripts/apex.mjs tasks get A-101
node scripts/apex.mjs tasks submit A-101 --json=examples/research.json
```

**Say:** “Claude Code or another agent can work outside this app. It reads the assignment,
writes a standard JSON deliverable, and submits it here. The team still gets one review queue
and one history.”

**Expected result:** the assignment becomes **Needs review**, with **External agent (cli)** as
submitter. Continue with the PM review in step 3. The supplied JSON is prepared example work;
you do not need a live model call for this demonstration.

For an all-in-browser version, open the console using the backtick button and run
`tasks submit A-101 --example`. An assignment already awaiting review cannot be submitted
again until a reviewer requests changes.

### When something looks unexpected

| What you see | What to do |
|---|---|
| Silk River shows “Review screening submission” | Research was already submitted. Continue with the PM review. |
| Silk River shows a document task | Screening was already accepted. Open the follow-up, or refresh to restart. |
| PM review buttons are disabled | Close the assignment; switch Demo role to A. Chan in Team. |
| Accept asks for a note | Add the review instruction you want the next person to inherit. |
| Book approval is still blocked | Discard any earlier bad proposal; set Sable to 7,125,000 and leave the field. Check all rule messages. |
| CLI says select a browser | Use the session exports from that assignment's CLI tab. Refreshing creates a new session ID. |
| You lose track of your place | Refresh, sign in, and restart from Team. |

### Be clear about what is real in this prototype

- The built-in research response and document extraction are prepared examples, not live AI calls.
- Form edits, submissions, reviews, task handoffs, rule calculations and local CLI submissions work.
- Source-ID checks verify references exist; they do not prove a research conclusion is correct.
- Data is held in the current browser tab and resets on refresh. Email delivery, document receipt,
  trade execution and multi-user synchronization are not connected.
- The full fee-accrual engine and LP portal are future modules.

## What it shows

- **Team workspace** — a Canvas-like submission portal and work board. Group by stage or person;
  filter your assignments or reviews. Each assignment has an owner, deadline, brief, sources,
  structured submissions, version history, and a human decision. Hover on people, funds and
  execution-mode badges for context.
- **Three execution modes** — deterministic books/checks/handoffs; Type 1 document extraction
  inside a fixed workflow; Type 2 research performed by an analyst or external agent, submitted
  through the portal or CLI. Prepared AI responses are fixtures, not live model calls.
- **A complete handoff** — accept Silk River screening as PM: its pipeline stage becomes
  Diligence and Operations receives a new assignment carrying the analyst's conditions and the
  reviewer's instructions. Research acceptance never adds an investment to the book.
- **Today** — the landing view: a split queue of work needing a human (documents, SLA tasks,
  IC tickets) and the selected item's review surface.
- **Documents intake** — invoices, NAV packs, and manager emails parsed to schema with
  per-field confidence. Policy toggle `AUTO`/`MANUAL`; high-confidence docs get a quick
  approve/reject, everything else opens **assisted review**: the original document with
  highlight overlays synced to editable extracted fields, the AI's reasoning, and an
  Approve / Fix-and-approve / Reject-with-reason triad.
- **Fund pages** — one page per manager: overview, exposure, documents, **field-level change
  history** (who, when, old → new, checksum), and signed diligence verdicts.
  **Research & work** shows the same assignments and decisions as Team.
- **Book** — allocations edited in **dollars** (percent derived), cash absorbs the residual,
  and five deterministic invariants (A–E) judge every change in money language. A pasted raw
  agent proposal (Σ 101.3%) gets staged and BLOCKED by the engine.
- **Human-in-the-loop everywhere** — every actionable item can be inspected, edited, approved,
  or rejected with a reason; approvals that touch the book are PM-gated and re-validated at
  commit.
- **Audit** — actor-filtered, checksum-chained trail, a report register, and an LP DDQ §7
  print export.
- **Shell** — the same rails for agents: every UI form echoes as a command; gated verbs
  (triage, approve, verdict) refuse agents.
- **Modules** — the skeleton made visible: what's Live vs Slot (fee engine, LP portal), and a
  vacant CHK-11 row: *checks are data — add one without changing the app.*

## Run it

```bash
npm install
npm run dev        # http://localhost:5199/
```

- Fallback: `npm run build && npm run preview`
- **Login:** `a.chan@…` (**PM**) or `l.wu@…` (**Analyst**) — any password, or skip MFA.
- **LAN:** Vite binds to all interfaces. Use `http://<this-machine-IP>:5199/`.
- **Demo role:** switch PM / Analyst directly in Team. Refresh resets the in-memory demo.

## Agent access (local demo)

Run commands from this directory while a browser is signed in to `npm run dev`:

```bash
node scripts/apex.mjs tasks list
node scripts/apex.mjs tasks get A-101
node scripts/apex.mjs tasks submit A-101 --json=examples/research.json
node scripts/apex.mjs funds get SIL
node scripts/apex.mjs book get
node scripts/apex.mjs audit tail 10
```

An external agent such as Claude Code can read the brief and source excerpts, do its research,
write JSON, and submit it using these commands. Required fields and known source IDs are checked;
the content's quality is reviewed by a human. A submission is recorded as an external agent's
work and appears immediately in the browser's review queue. The console also supports
`tasks submit A-101 --example` as a quick prepared demonstration.

The **Agent access / CLI** tab on an assignment provides commands targeting that exact browser
session. `node scripts/apex.mjs sessions` lists connected browsers. Use `--session=<id>` when
several are open, and `--url=http://<host>:5199` to target another machine. These also have
`APEX_SESSION` and `APEX_URL` environment-variable equivalents.

Additional commands: `funds list`, `docs list`, `docs get <id>`,
`book propose --json=book.json` (all portfolio fund IDs and CASH, percentage weights).
The agent can stage proposals but cannot review submissions or approve investments.

The local HTTP bridge transports commands into the selected browser's actual store. It is a
dev-only demo transport, not a persistent backend; each browser has independent state. Static
builds retain the portal and built-in console, but the external CLI requires `npm run dev`.

**Gotcha:** if dependency versions change, wipe the Vite optimizer cache before restarting:

```bash
rm -rf node_modules/.vite && npm run dev -- --force
```

## Keys

| Key | Action |
|---|---|
| `1` | Today (landing) |
| `2` | Book |
| `3` | Audit sheet |
| `4` | Team workspace |
| `` ` `` | Shell |
| `⌘K` / `Ctrl+K` | Command palette |
| `Esc` | Closes everything |

## Architecture

- `src/lib/work.ts` — assignments, people, submission schema, evidence references and prepared research.
- `src/components/Team.tsx` / `Assignment.tsx` — team board, work portal, review and follow-up.
- `src/lib/agent.ts` — shared agent command contract (console and external CLI).
- `server/demo-bridge.mjs` / `src/lib/agentBridge.ts` — dev-only session-targeted browser transport.
- `scripts/apex.mjs` — dependency-free Node CLI; `examples/research.json` is a sample deliverable.
- `src/lib/fees.ts` — deterministic same-period fee-rate comparison.
- `src/lib/rules.ts` — deterministic invariants (A ≤25% · B sleeve ≤35% · C cash ≥10% · D Σ=100±0.05 · E stale>30d→≤5%). `validateBook` runs at stage and commit. Zero model calls.
- `src/lib/store.ts` — one zustand store: book/gate, docs, queue, audit (tagged, checksum-chained, advancing clock), entity history, shell transcript + `emitCmd` (form↔command parity), PM/Analyst gates.
- `src/lib/verbs.ts` — command registry (help + palette + `FENCE`). Gated verbs refuse agents.
- `src/lib/docs.ts` — intake eligibility (overall ≥0.90 and every required field ≥0.85) and field helpers.
- `src/lib/dd.ts` — CHK-01..10 diligence table, claim-vs-computed flags, pack/SLA state.
- `src/lib/types.ts` — `DocRecord`, views, fund tabs, intake policy, reject reasons.
- `src/data/seed.ts` — funds, books, documents, clock-sensitive boot numbers.
- `src/App.tsx` — shell, keys, `parityCheck` (dev-console assertion).
- `src/index.css` — Tailwind v4 `@theme` paper-and-ink tokens; IBM Plex Sans / Mono.
- `src/components/` — `Rail.tsx`, `StatusBar.tsx`, `Today.tsx`, `FundPage.tsx`, `Portfolio.tsx` (Book), `DocReview.tsx` / `DocOriginal.tsx`, `HitlTriad.tsx`, `ModulesSheet.tsx`, `Login.tsx`, `Shell.tsx`, `Palette.tsx`, `Drawers.tsx` (Audit sheet + LP DDQ print), `Ui.tsx` (Radix/cva primitives).

## Guardrails

- Boot parity asserted in dev (`[parity] boot state OK …` in console): 5/6 packs · +6.7% · cash 11.0 · Sable 38d · badge 5 · Rule E BLOCKED. The assertion must stay green.
- `npm run build` must stay green. `dist/` is the pre-cooked fallback (`npm run preview` on 5199).
- Clock pinned to 2026-09-07 09:41:12 base, advances with real time; seeded entries keep their stamps.
- Checksums are djb2/6hex — labeled "demo-grade" once, in the audit footer.

## License

MIT — see [LICENSE](LICENSE).
