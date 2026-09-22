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
