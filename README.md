# Apex Pacific PMS — a fund operating ledger (demo)

> **This is a fictional demo.** Apex Pacific, its managers (Northgate, Kestrel, Meridian,
> Halcyon, Sable Creek, Kuramoto, Silk River), the administrator, the invoice, the email — every
> entity, document, and number here is invented for a live demo. No real fund, vendor, or data.
> It is the companion demo for the talk *Entering 2027: A Practical Guide to AI*.

Apex Pacific is the fund's operating ledger: **one record per manager, one book of dollars, a
human on every lever.** The product is a FoF allocator ($142.5M NAV, 6 managers + 1 pipeline
name) built as a paper-and-ink operating surface around a Type-1 engine — deterministic rules,
store gates, a checksum-chained audit trail, and form↔shell command parity — so every write is
named, staging is never committing, and agents never touch the IC lever.

## What it shows

- **Today** — the landing view: a split queue of work needing a human (documents, SLA tasks,
  IC tickets) and the selected item's review surface.
- **Documents intake** — invoices, NAV packs, and manager emails parsed to schema with
  per-field confidence. Policy toggle `AUTO`/`MANUAL`; high-confidence docs get a quick
  approve/reject, everything else opens **assisted review**: the original document with
  highlight overlays synced to editable extracted fields, the AI's reasoning, and an
  Approve / Fix-and-approve / Reject-with-reason triad.
- **Fund pages** — one page per manager: overview, exposure, documents, **field-level change
  history** (who, when, old → new, checksum), and signed diligence verdicts.
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
| `` ` `` | Shell |
| `⌘K` / `Ctrl+K` | Command palette |
| `Esc` | Closes everything |

## The demo (~6 minutes)

Beats mapped to the talk's slide titles:

0. **Land on Today.** Split view, invoice selected — operating ledger, work left, record right. *[What a Fund Can Do / A Menu]*
1. **Policy chip is AUTO.** Quick-approve the Halcyon NAV pack — one glance, thumbs up. Fee math is code; the model only read Note 4. *[The Spectrum; When It Touches Money; Why Software Is Always Nice]*
2. **Open the Meridian email.** Click the 0.15% highlight to the field and back; approve — prose becomes a record. *[Native Formats; One Job, Four Builds]*
3. **The invoice.** GL field 0.62 is obviously weak; edit it; Fix and approve. *[When It Touches Money; Structure an Agent]*
4. **Rail to Sable Creek.** Overview, Verdicts (CHK-08), History (Rule E line — the engine wrote it). *[A Menu; The Compounding Case]*
5. **Chrome Escalate.** Every write is a person or the engine, named. *[The 2030 Readiness Check]*
6. **Book.** Edit Northgate to $37,762,500 — Rule A fires in dollars; approve stays dead. *[When It Touches Money; One Job, Four Builds]*
7. **Paste agent proposal.** Σ 101.3 — engine BLOCKS; discard. *[The Spectrum]*
8. **Stage a legal tweak, IC Approve as PM.** Staging is not committing. *[When It Touches Money]*
9. **Modules sheet.** Live vs Slot, vacant CHK-11, fee hook. *[The Compounding Case; A Menu]*
10. **Audit.** Filter YOU / ENGINE; LP DDQ §7 print. *[The 2030 Readiness Check]*
11. **Role beat.** Sign out, in as `l.wu@` (Analyst): approve disabled.
12. **Shell.** `whoami`, try `book approve` (blocked), point at the form echo. *[Cowork to Software; Structure an Agent]*

If time runs short, drop beats 7, 11, 12 — never drop 2, 4, 6, 9.

## Architecture

- `src/lib/rules.ts` — pure Type-1 invariants (A ≤25% · B sleeve ≤35% · C cash ≥10% · D Σ=100±0.05 · E stale>30d→≤5%). `validateBook` runs at stage and commit. Zero model calls.
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
