import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { Btn, Input } from './Ui';
import { Logo } from './Rail';

export default function Login() {
  const login = useStore((s) => s.login);
  const startTour = useStore((s) => s.startTour);
  const [email, setEmail] = useState('a.chan@apexpacific.example');
  const [err, setErr] = useState('');

  const go = () => {
    if (!email.includes('@')) {
      setErr('Enter a work email');
      return;
    }
    login(email);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-paper">
      <div className="w-[400px] max-w-[92vw] animate-pop rounded-lg border border-line bg-surface p-7 shadow-pop">
        <div className="mb-5 flex items-center gap-3">
          <Logo size={34} onPaper />
          <div>
            <h1 className="text-[20px] font-semibold text-ink">Apex Pacific</h1>
            <div className="mt-0.5 text-[12px] text-muted">Fund operating ledger</div>
          </div>
        </div>

        <label className="mb-1 block text-[12px] text-muted">Work email</label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          className="w-full py-2 text-[13px] font-sans"
        />
        <p className="mb-5 mt-1 text-[12px] text-muted">
          a.chan@ (PM) · l.wu@ (Analyst)
        </p>

        <p className="min-h-[18px] text-[12px] text-stop">{err}</p>

        <Btn tone="emerald" size="lg" className="w-full" onClick={go}>
          Sign in <ArrowRight size={14} />
        </Btn>
        <button onClick={go} className="mx-auto mt-3 block text-[12px] text-muted transition-colors hover:text-ink">
          Skip MFA
        </button>
        <div className="my-3 border-t border-line"/>
        <Btn tone="ghost" className="w-full" onClick={startTour}>Interactive demo</Btn>
        <p className="mt-2 text-center text-[12px] text-muted">Guided walkthrough · ~4 min · real screens</p>
      </div>
    </div>
  );
}
