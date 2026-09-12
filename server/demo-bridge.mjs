import { randomUUID } from 'node:crypto';

/** Dev-only transport. All application logic still executes in the selected browser store. */
export default function demoBridge() {
  return {
    name: 'apex-demo-agent-bridge',
    configureServer(server) {
      const sessions = new Map();
      const pending = new Map();
      const json = (res, status, body) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(body));
      };
      server.middlewares.use('/api/demo', async (req, res) => {
        const path = req.url?.split('?')[0];
        if (req.method === 'GET' && path === '/sessions') {
          return json(res, 200, { sessions: [...sessions.entries()].filter(([, s]) => Date.now() - s.seen < 10000).map(([id, s]) => ({ id, label: s.label })) });
        }
        if (req.method !== 'POST' || !['/poll', '/command'].includes(path)) return json(res, 404, { ok: false, message: 'Unknown demo endpoint.' });
        let body;
        try {
          let raw = '';
          for await (const chunk of req) {
            raw += chunk;
            if (Buffer.byteLength(raw) > 131072) return json(res, 413, { ok: false, message: 'Request exceeds 128 KB.' });
          }
          body = JSON.parse(raw);
          if (!body || typeof body !== 'object') throw new Error('Expected JSON object');
        } catch { return json(res, 400, { ok: false, message: 'Invalid JSON body.' }); }
        if (path === '/poll') {
          if (typeof body.session !== 'string' || body.session.length > 80) return json(res, 400, { ok: false, message: 'Session ID required.' });
          for (const [id, s] of sessions) if (Date.now() - s.seen > 60000) sessions.delete(id);
          const session = sessions.get(body.session) ?? { queue: [] };
          session.seen = Date.now(); session.label = String(body.label ?? '').slice(0, 160);
          sessions.set(body.session, session);
          if (Array.isArray(body.replies)) for (const reply of body.replies) {
            const request = pending.get(reply?.id);
            if (request?.session === body.session) request.finish(reply.result);
          }
          const commands = session.queue.filter((c) => pending.has(c.id) && c.expires > Date.now());
          session.queue = [];
          return json(res, 200, { commands });
        }
        if (typeof body.command !== 'string' || body.command.length > 2000) return json(res, 400, { ok: false, message: 'Command required.' });
        const active = [...sessions.entries()].filter(([, s]) => Date.now() - s.seen < 10000);
        const target = body.session ?? (active.length === 1 ? active[0][0] : undefined);
        const session = active.find(([id]) => id === target)?.[1];
        if (!session) return json(res, 409, { ok: false, message: active.length ? 'Select a browser with --session=<id>. Run sessions to list them.' : 'Open the local demo in a browser and sign in first.' });
        if (pending.size >= 50) return json(res, 429, { ok: false, message: 'Too many pending demo commands.' });
        const id = randomUUID();
        const timer = setTimeout(() => finish({ ok: false, message: 'Browser response timed out. Read current state before retrying a write.' }), 12000);
        const finish = (result) => { clearTimeout(timer); pending.delete(id); json(res, 200, result); };
        pending.set(id, { session: target, finish });
        session.queue.push({ id, command: body.command, payload: body.payload, expires: Date.now() + 11000 });
      });
      server.httpServer?.on('close', () => {
        for (const p of pending.values()) p.finish({ ok: false, message: 'Demo server stopped.' });
      });
    },
  };
}
