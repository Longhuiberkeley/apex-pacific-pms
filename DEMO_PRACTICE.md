> **Updated local walkthrough:** [Analyst workflow demo](DEMO_V3_WALKTHROUGH.md) covers the new Screening, Data library, permissions, CLI intake, Monitoring and Fees pages. The public deployment may still use the older flow below.

# Long Hui’s demo practice sheet

This file is enough to rehearse without the chat. The app is **Apex Pacific PMS v3**, a fictional
fund-of-funds operating platform. Start with the first-look tour, then practice the main route.
Use the suggested words as prompts; rewrite them in your own voice.

## Present from someone else’s computer — no installation

**Public demo:** https://longhuiberkeley.github.io/apex-pacific-pms/

**This practice guide online:** https://github.com/Longhuiberkeley/apex-pacific-pms/blob/main/DEMO_PRACTICE.md

**Full README:** https://github.com/Longhuiberkeley/apex-pacific-pms/blob/main/README.md

1. Open the public demo in a current Chrome, Edge, Firefox or Safari browser with internet access.
   No GitHub account, terminal, Node installation or connection to your own computer is needed.
2. Use **Skip MFA**, or enter the fictional demo email `a.chan@apexpacific.example`.
   Do not enter a real password; this is a mock login.
3. Click **Presenter guide ↗** at the bottom of the sidebar to open these instructions in a
   separate tab. Keep only one copy of the demo itself open.
4. Check zoom and projector readability, then follow sections 3 and 4 below. The main walkthrough
   works entirely in the public site: research, editing, submissions, role switching, reviews,
   task handoffs, document review, Book and Audit.
5. To illustrate agent submission without installing anything, use the built-in console:
   open the backtick button at the bottom of the sidebar and run `tasks get A-101`, then
   `tasks submit A-101 --example` on a fresh assignment. This uses prepared research and the
   same review workflow. The public site’s Agent access tab shows these browser commands.

**Do not use the localhost or 192.168 links on a borrowed computer** unless you deliberately
set up the local server. External terminal/Claude Code submissions require that local setup;
GitHub Pages does not provide the local CLI bridge. The browser console works on the public site.

**Before leaving home:** download or print this guide, and keep a screen recording or screenshots
of a successful rehearsal for a venue with unreliable internet. The public site is not packaged
for offline use. On the borrowed machine, open the demo once before the talk and check it loads.

**Fresh start:** refresh the public page to reset its in-memory state. Work done on your computer
does not appear on the borrowed computer. If an older version appears, use Ctrl+Shift+R on
Windows/Linux or Cmd+Shift+R in Chrome on macOS, or reopen the page in a private window.

## 1. What I want the audience to remember

> We can build our own ERP-like software around how our company actually works. AI can do
> substantial research and read documents. Software keeps the records, checks the numbers,
> and passes work to the right person. People make the important decisions.

Three ideas to make visible:

1. **One shared workplace:** research, documents, assignments and decisions belong to the same fund record.
2. **Different ways to use AI:** deterministic code, AI inside a fixed process, and agents doing broader tasks.
3. **Smooth handoffs:** the next person inherits the conditions and context, not just a notification.

Opening line:

> “This is an interactive prototype using fictional funds and prepared AI examples. I want to
> show how the work could fit together.”

## 2. Start the app locally (optional; skip when using the public demo)

On the machine where this project is stored, open Terminal and run:

```bash
cd /Volumes/ExternalDrive/Documents_external/githubcode/ai_outlook2027/_local/pms_demo_v3
npm run dev
```

- Leave that terminal running. If dependencies are missing, run `npm install` first.
- On that machine, open **http://localhost:5199/**.
- On another device on the same network, use **http://192.168.28.193:5199/** while that is the
  host’s address. If the network changes, use the Network address printed by Vite in Terminal.
- If the terminal says port 5199 is already in use, try the existing page first. If Vite chooses
  another port, use the URL it actually prints, including that port.
- Sign in with **a.chan@apexpacific.example**, or use **Skip MFA** for the default PM account.

**Refresh = reset.** All edits and submissions disappear, and login returns. Changing roles in
Team preserves the work. Each browser tab has independent state, so use one tab for the demo.

## 3. First look — do this before trying to present

Give yourself 10–15 minutes without a timer. Do not approve anything on this first pass.

| Open | What to notice |
|---|---|
| **Today** | A daily action desk: documents, reviews and follow-ups. Click the Halcyon NAV pack to see the source next to extracted fields. |
| **Team workspace** | Assignments with owners and stages. Change **Group by** from Stage to Person, then back. Hover on a person. |
| **Pipeline → Silk River** | A prospective investment. Its **Next step** points to the current assignment. Open it, look at the brief and source library, then close it with ×. |
| **Silk River → Research & work** | The same assignments, attached to the manager’s permanent record. |
| **Book** | Allocations and proposed changes. Sable starts above the allowed allocation for a stale NAV, so Rule E is already failing. |
| **Audit** | Recent history: who did what. Hover over the sidebar label, then open it. |
| **Modules** | The tools in the platform and examples of future additions. |

The map in one sentence:

> **Today shows what needs attention; Team shows who owns it; the fund page holds its context;
> Book holds allocations; Audit records the actions; Modules explains the platform’s tools.**

The demo has some older daily-operation examples in Today. Follow the connected route below
for the main presentation. After exploring, **refresh** so rehearsal starts from a known state.

## 4. Main rehearsal — about 6–8 minutes

### A. Team: introduce the workplace

**Click:** sign in → Team workspace → Group by **Person** → back to **Stage**.

**Say:** “The manager sees who is doing what, what is blocked, and what needs review. Analysts
have assignments and submit their work, a bit like Canvas.”

Point to the three mode cards:

- **Deterministic:** code follows fixed rules and calculates the numbers.
- **Type 1:** software asks AI to do one part of an established process.
- **Type 2:** an agent works on a broader assignment and submits the result here.

### B. Silk River: the analyst submits AI-assisted research

1. In Team’s **Demo role** dropdown, choose **L. Wu · Analyst**.
2. Click **Silk River** under Pipeline → **Open screening assignment**.
3. Expand a source in the **Source library**.
4. Click **Load prepared AI research**.
5. Edit **Conditions & follow-up** to:

   > Obtain administrator confirmation of redemption terms and the audited track record before
   > an IC recommendation. Ask specifically about redemption gates.

6. Scroll down and click **Submit for review**.

**Say:** “AI does the preparation. The analyst adds judgment and submits a standard deliverable
with its sources. Research could also be done by an external agent and submitted using a CLI.”

**Check:** status is **Needs review** and the submitter is **L. Wu**. Nothing was invested.

### C. PM review: carry the conditions into the next task

1. Close the assignment with ×.
2. Open Team → switch **Demo role** to **A. Chan · PM**.
3. Open Silk River → **Review screening submission**.
4. Scroll to **Human decision** and enter:

   > Proceed to diligence. Independently confirm the liquidity terms before bringing this to IC.

5. Click **Accept → begin diligence**.
6. Find **Handoff created** and click **Open next assignment**.

**Show:** M. Lee owns the new document-request task. Both the analyst’s conditions and the PM’s
instruction are already in the brief.

**Say:** “This is the smooth handoff. A person makes the decision; software creates the next
task with the context attached.”

**Check:** acceptance begins **diligence**, not an investment. Only one follow-up task is created.

**Optional:** in **Activity note**, enter “Requested the audited track record and redemption
terms from the administrator; follow up on 12 September.” Click **Record request sent**.
Silk River’s next action becomes **View outstanding documents**. This records a fictional
request as sent; the demo does not send an email.

### D. Fund record: show where the work stays

**Click:** close the assignment → Silk River → **Research & work**.

**Show:** the completed screening assignment and its follow-up. Open the screening assignment
and expand **Submission & decision history** if time permits.

**Say:** “The research, sources, decision and follow-up stay attached to this manager. We can
come back later and understand why we made the decision.”

Close the assignment before the next step.

### E. Type 1: a document goes through a fixed process

**Click:** Today → **Halcyon August NAV pack**. Hover over a highlighted source value and the
matching extracted field. Point out the fee adjustment labelled **code**.

**Say:** “Here the software asks AI to read a document. Code does the arithmetic, then a person
checks and approves the record.”

The calculation is **$17.1M × (0.12% − 0.15%) = −$5,130**: a simple comparison of rates on the
same base and period. It is separate from the July restatement, not a full fee-accrual engine.

**Click:** **Approve** → Team. Find **Review the NAV-pack extraction** under **Done**.

**Check:** approving the document completed its linked assignment.

### F. Deterministic Book: check, decide, hand off

1. Open **Book**. Point out that Sable’s old NAV triggers Rule E at the starting allocation.
2. Change Sable’s dollar amount to **7125000** and click outside the field to apply the edit.
3. Show **5%** Sable, **17%** proposed cash, and Rules **A–E passing**.
4. Click **Approve — IC** as PM.
5. Open Team and show **Review capital instructions · ticket #1** assigned to Operations.

**Say:** “The arithmetic and checks are fixed software. The PM approves the proposal, then
Operations receives the next task. Approving a target allocation does not mean a trade settled.”

**Optional blocked example, before step 2:** enter **37762500** for Northgate and leave the
field. Rule A also fails and approval is disabled. Click **Discard**, then continue with Sable.

### G. Close with the platform idea

Hover over **Audit**, then open it: “Here is the recent history—person, agent and software.”
Open **Modules** briefly: “We can add more tools around this shared foundation.”

Closing line:

> “The opportunity is custom software for our workflow, with strong AI where it helps. Daily
> productivity now, and organized records we can build on later.”

## 5. Optional external-agent demonstration

Use this **instead of B’s portal submission**, on a fresh assignment. It is optional for your
first rehearsal; the complete main route works without a terminal demonstration.

1. Keep the app running and signed in.
2. Open Silk River’s assignment → **Agent access / CLI**.
3. In a second terminal, change into `_local/pms_demo_v3` using the full path in section 2.
4. Copy the displayed `export APEX_URL=...` and `export APEX_SESSION=...` commands into it.
5. Run:

```bash
node scripts/apex.mjs tasks get A-101
node scripts/apex.mjs tasks submit A-101 --json=examples/research.json
```

**Check:** the browser shows **Needs review**, submitted by **External agent (cli)**.
Continue with PM review in C. Do not also submit the portal version.

**Say:** “An agent such as Claude Code can read the brief, do its research outside the app,
and submit a structured result. The team still gets one review queue and history.”

The provided JSON is prepared example work. A live model call is not required. The external CLI
requires the development server and signed-in browser; a static preview alone does not run it.
After a refresh, copy the new session exports again.

## 6. Recovery card

| Problem | Action |
|---|---|
| Page does not open | Check the server terminal and use its printed URL. Prefer localhost on the host machine. |
| Wrong starting state | Refresh and sign in again. This clears the rehearsal’s changes. |
| Cannot find a sidebar action | Close the assignment or sheet using its top-right ×. |
| Screening already submitted | Continue with PM review, or refresh to restart. |
| Review buttons disabled | Close assignment → Team → Demo role **A. Chan · PM**. |
| Acceptance does nothing useful | Enter a review note first; read any displayed message. |
| Book approval blocked | Discard earlier proposals. Set Sable to **7125000**, leave the field, and read the rule results. |
| CLI cannot find the browser | Keep it signed in; use its current session exports. |
| Losing time | Finish after the Silk River handoff. Summarize the three modes verbally. |

**Three-minute version:** stay signed in as PM. Team → Silk River → load research → edit →
submit → accept with a note → next assignment. The submission will correctly name A. Chan.
Close with the three mode cards. Skip role switching, document review and Book.

## 7. Last checks before presenting

- [ ] I have followed the main route myself once without reading the chat.
- [ ] I can explain the three execution modes in one sentence each.
- [ ] I have checked the browser zoom and projector readability.
- [ ] The server is running and I have tested the URL on the presentation device.
- [ ] I have refreshed into a clean starting state and opened Team.
- [ ] I have this file open beside the demo, or have printed the short route below.
- [ ] If using the CLI, I have copied the current browser session exports after the final reset.
- [ ] I have saved screenshots or a short recording of my successful run as a fallback.

**Pocket route:**

> Team → Analyst → Silk River → research → edit → submit → PM → review note → accept →
> next task → fund record → Halcyon document → approve → Book → Sable 7,125,000 → approve →
> Operations task → Audit → Modules.

## 8. My practice notes

Date / device / screen size:

Time taken:

Where I hesitated:

Words I want to simplify:

Steps to skip if short on time:

Questions I expect from the audience:

Changes I want before the presentation:

## Prototype facts to remember

The funds and data are fictional. Built-in AI research and document extraction are prepared
examples. Edits, submissions, reviews, calculations, task handoffs and local CLI submissions
work. The demo does not connect email delivery, live document ingestion, trade execution,
persistent storage or synchronized multi-user sessions. Source references are checked for
known IDs; a human still judges the conclusions. The full fee-accrual engine and LP portal
are future modules.

For further technical details, see [README.md](README.md).
