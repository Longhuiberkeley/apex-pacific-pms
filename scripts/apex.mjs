#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.findIndex((a) => a.startsWith(`--${name}=`) || a === `--${name}`);
  if (index < 0) return undefined;
  const [arg] = args.splice(index, 1);
  return arg.includes('=') ? arg.slice(arg.indexOf('=') + 1) : args.splice(index, 1)[0];
};
const url = (flag('url') ?? process.env.APEX_URL ?? 'http://localhost:5199').replace(/\/$/, '');
const session = flag('session') ?? process.env.APEX_SESSION;
const file = flag('json');
if (!args.length || args[0] === 'help' || args[0] === '--help') {
  console.log(`Apex local demo CLI — keep the demo browser signed in.

  node scripts/apex.mjs sessions
  node scripts/apex.mjs help
  node scripts/apex.mjs whoami
  node scripts/apex.mjs history
  node scripts/apex.mjs today queue
  node scripts/apex.mjs queue list
  node scripts/apex.mjs tasks list
  node scripts/apex.mjs tasks get A-101
  node scripts/apex.mjs tasks submit A-101 --json=research.json
  node scripts/apex.mjs funds add --json=examples/candidate.json
  node scripts/apex.mjs funds list
  node scripts/apex.mjs funds get SIL
  node scripts/apex.mjs docs list
  node scripts/apex.mjs docs get hal-nav-08
  node scripts/apex.mjs records list
  node scripts/apex.mjs records get DATA-hal-nav-08
  node scripts/apex.mjs screening get
  node scripts/apex.mjs screening list
  node scripts/apex.mjs fees get HAL
  node scripts/apex.mjs monitoring get
  node scripts/apex.mjs dd get SAB
  node scripts/apex.mjs book get
  node scripts/apex.mjs book propose --json=book.json
  node scripts/apex.mjs book paste --raw
  node scripts/apex.mjs audit tail 10

Options: --url=http://HOST:5199 --session=BROWSER_ID
Research fields: recommendation, rationale, risks, conditions, sources (source IDs).
Book JSON: every fund ID plus CASH, in percentage weights. Proposals never commit.
Human levers (review, approve, reject, verdict, triage, edit, book set/stage/discard, ops parse/reconcile/ack, criteria apply, policy intake, fee approval) return BLOCKED with an audit entry and belong to the UI.
Human reviews and approvals happen in the UI. Refreshing the browser resets its demo.`);
} else {
  try {
    const payload = file ? JSON.parse(await readFile(file, 'utf8')) : undefined;
    const response = await fetch(`${url}/api/demo/${args[0] === 'sessions' ? 'sessions' : 'command'}`, args[0] === 'sessions' ? {} : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: args.join(' '), payload, session }), signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
    if (!response.ok || result.ok === false) process.exitCode = 1;
  } catch (e) { console.error(`apex: ${e.message}`); process.exitCode = 1; }
}
