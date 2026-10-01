'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Start() {
  const r = useRouter();
  const [m, setM] = useState('load');
  const [p, setP] = useState('');
  const [c, setC] = useState(''); const [e, setE] = useState('');

  useEffect(() => {
    document.body.dataset.t = 'start';
    fetch('/api/auth/status').then(async x => {
      const s = await x.json().catch(() => ({}));
      if (!x.ok) { setE(s.detail || s.error || 'Server error — check the terminal'); return setM('err'); }
      if (s.auth) r.replace('/works');
      else setM(s.pending ? 'otp' : 'login');
    }).catch(() => { setE('Cannot reach the server'); setM('err'); });
  }, []);

  async function go(path, body) {
    setE('');
    const x = await fetch('/api/auth/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await x.json().catch(() => ({}));
    if (!x.ok) return setE(d.error);
    if (d.need2fa) setM('otp'); else r.push('/works');
  }
  const submit = ev => {
    ev.preventDefault();
    if (m === 'login') go('login', { password: p });
    else go('verify', { code: c });
  };
  if (m === 'load') return null;
  if (m === 'err') return <div className="start"><span className="eb">Something is wrong</span><h1>Error</h1><div className="err">{e}</div></div>;
  return (
    <>
      <nav><b><img src="/logo.png" alt="" />MWA</b></nav>
      <div className="start">
        <span className="eb">{m === 'otp' ? 'Two-factor authentication' : 'Welcome'}</span>
        <h1>{m === 'otp' ? 'Code' : <>My Works<br />API</>}</h1>
        <form onSubmit={submit}>
          {m !== 'otp' && <input type="password" placeholder="Password" value={p} onChange={ev => setP(ev.target.value)} />}
          {m === 'otp' && <input inputMode="numeric" maxLength={6} placeholder="6-digit code" value={c} onChange={ev => setC(ev.target.value)} autoFocus />}
          <button className="btn">{m === 'otp' ? 'Verify' : 'Enter'}</button>
        </form>
        <div className="err">{e}</div>
      </div>
    </>
  );
}