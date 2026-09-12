import { executeAgentCommand } from './agent';
import { useStore } from './store';

// Each tab has its own state. Explicit session targeting prevents cross-tab writes.
export const agentSession = Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16).padStart(8, '0')).join('-');
export function startAgentBridge() {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  let replies: { id: string; result: unknown }[] = [];
  const poll = async () => {
    if (stopped) return;
    try {
      const response = await fetch('/api/demo/poll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: agentSession, label: `${useStore.getState().identity?.name ?? 'Signed out'} · ${location.host}`, replies }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok || stopped) return;
      const body = await response.json();
      replies = [];
      for (const item of body.commands ?? []) {
        if (stopped) break;
        const result = Date.now() > item.expires ? { ok: false, message: 'Command expired; submit again.' } : executeAgentCommand(item.command, item.payload, 'cli');
        replies.push({ id: item.id, result });
      }
    } catch { /* A restarted local server reconnects on the next poll. */ }
    finally { if (!stopped) timer = setTimeout(poll, replies.length ? 0 : 700); }
  };
  void poll();
  return () => { stopped = true; clearTimeout(timer); };
}
