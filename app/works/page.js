'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resize } from '@/lib/img';

const api = async (url, method = 'GET', body) => {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && !url.includes('2fa-disable')) { location.href = '/'; throw new Error('Session expired'); }
  if (!r.ok) throw new Error(d.error || 'Error');
  return d;
};

export default function Works() {
  const r = useRouter();
  const [v, setV] = useState('works');
  const [list, setList] = useState([]);
  const [f, setF] = useState('all');
  const [edit, setEdit] = useState(null);
  const [pre, setPre] = useState('created');
  const [sure, setSure] = useState(null);

  const load = () => api('/api/works').then(setList).catch(() => r.replace('/'));
  useEffect(() => { load(); }, []);
  useEffect(() => { document.body.dataset.t = v === 'works' ? 'works' : v === 'sec' ? 'sec' : 'create'; }, [v]);

  const nav = (x, type = 'created') => { setEdit(null); setPre(type); setV(x); };
  const logout = async () => { await api('/api/auth/logout', 'POST'); r.replace('/'); };
  const del = async id => {
    if (sure !== id) { setSure(id); setTimeout(() => setSure(null), 3000); return; }
    await api('/api/works/' + id, 'DELETE'); setSure(null); load();
  };
  const shown = list.filter(w => f === 'all' || w.type === f);

  return (
    <>
      <nav><b><img src="/logo.png" alt="" />MWA</b><button className="btn s o" onClick={logout}>Lock</button></nav>
      <div className="app">
        <aside>
          <button className={'btn s ' + (v === 'works' ? '' : 'o')} onClick={() => nav('works')}>My Works</button>
          <button className={'btn s ' + (v === 'create' && pre === 'created' ? '' : 'o')} onClick={() => nav('create')}>+ Create</button>
          <button className={'btn s ' + (v === 'create' && pre === 'received' ? '' : 'o')} onClick={() => nav('create', 'received')}>+ Add received web</button>
          <button className={'btn s ' + (v === 'sec' ? '' : 'o')} onClick={() => nav('sec')}>Security / 2FA</button>
        </aside>
        <main>
          {v === 'works' && (<>
            <span className="eb">{list.length} total</span><h2>My Works</h2>
            <div className="row" style={{ marginTop: 16 }}>
              {['all', 'created', 'received'].map(x => <button key={x} className={'btn s ' + (f === x ? '' : 'o')} onClick={() => setF(x)}>{x}</button>)}
            </div>
            <div className="grid">
              {shown.map(w => (
                <div className="card" key={w._id}>
                  {w.img && <img src={w.img} alt="" />}
                  <span className="tag">{w.type}</span>
                  <h3>{w.name}</h3><span className="eb">{w.date}</span><p>{w.description}</p>
                  <div className="row">
                    {w.link && <a className="btn s o" href={w.link} target="_blank" rel="noopener noreferrer">Visit</a>}
                    <button className="btn s o" onClick={() => { setEdit(w); setV('create'); }}>Update</button>
                    <button className="btn s g" onClick={() => del(w._id)}>{sure === w._id ? 'Sure?' : 'Delete'}</button>
                  </div>
                </div>
              ))}
            </div>
            {!shown.length && <p style={{ marginTop: 24 }}>Nothing here yet. Hit + Create.</p>}
          </>)}
          {v === 'create' && <Form key={edit?._id || pre} init={edit} pre={pre} done={() => { setEdit(null); setV('works'); load(); }} cancel={() => { setEdit(null); setV('works'); }} />}
          {v === 'sec' && <Security />}
        </main>
      </div>
    </>
  );
}

function Form({ init, pre, done, cancel }) {
  const [s, setS] = useState(init || { name: '', description: '', date: new Date().toISOString().slice(0, 10), link: '', type: pre, img: '' });
  const [e, setE] = useState('');
  const set = k => ev => setS({ ...s, [k]: ev.target.value });
  const save = async ev => {
    ev.preventDefault();
    try { s._id ? await api('/api/works/' + s._id, 'PUT', s) : await api('/api/works', 'POST', s); done(); }
    catch (x) { setE(x.message); }
  };
  return (
    <div className="sec">
      <span className="eb">{s._id ? 'Update' : 'New'}</span><h2>{s._id ? 'Update work' : 'Create'}</h2>
      <form onSubmit={save}>
        <label>Image</label>
        <input type="file" accept="image/*" onChange={async ev => ev.target.files[0] && setS({ ...s, img: await resize(ev.target.files[0]) })} />
        {s.img && <img src={s.img} alt="" style={{ width: '100%', borderRadius: 12, marginTop: 8 }} />}
        <label>Name</label><input required value={s.name} onChange={set('name')} />
        <label>Description</label><textarea rows={4} value={s.description} onChange={set('description')} />
        <label>Date</label><input type="date" value={s.date} onChange={set('date')} />
        <label>Link</label><input type="url" placeholder="https://" value={s.link} onChange={set('link')} />
        <label>Type</label>
        <select value={s.type} onChange={set('type')}><option value="created">Created</option><option value="received">Received web</option></select>
        <div className="row" style={{ marginTop: 24 }}>
          <button className="btn">Save</button><button type="button" className="btn o" onClick={cancel}>Cancel</button>
        </div>
        <div className="err">{e}</div>
      </form>
    </div>
  );
}

function Security() {
  const [on, setOn] = useState(null); const [q, setQ] = useState(null);
  const [c, setC] = useState(''); const [pw, setPw] = useState(''); const [e, setE] = useState('');
  useEffect(() => { api('/api/auth/status').then(s => setOn(!!s.totp)); }, []);
  const run = fn => async ev => { ev.preventDefault(); setE(''); try { await fn(); } catch (x) { setE(x.message); } };
  return (
    <div className="sec">
      <span className="eb">Security</span><h2>2-Factor Auth</h2>
      <p style={{ margin: '12px 0' }}>Status: <b>{on ? 'ON' : 'OFF'}</b></p>
      {on === false && !q && <button className="btn" onClick={run(async () => setQ(await api('/api/auth/2fa-setup', 'POST')))}>Enable 2FA</button>}
      {q && (
        <form onSubmit={run(async () => { await api('/api/auth/2fa-enable', 'POST', { code: c }); setQ(null); setC(''); setOn(true); })}>
          <p>Scan with Google Authenticator / Authy:</p>
          <img src={q.qr} alt="QR" style={{ width: 200, background: '#fff', borderRadius: 12, margin: '10px 0' }} />
          <code>{q.secret}</code>
          <label>Enter the 6-digit code to confirm</label>
          <input inputMode="numeric" maxLength={6} value={c} onChange={ev => setC(ev.target.value)} />
          <div className="row" style={{ marginTop: 16 }}><button className="btn">Confirm</button></div>
        </form>
      )}
      {on && (
        <form onSubmit={run(async () => { await api('/api/auth/2fa-disable', 'POST', { password: pw }); setPw(''); setOn(false); })}>
          <label>Password (to turn off 2FA)</label>
          <input type="password" value={pw} onChange={ev => setPw(ev.target.value)} />
          <div className="row" style={{ marginTop: 16 }}><button className="btn o">Turn off 2FA</button></div>
        </form>
      )}
      <div className="err">{e}</div>
    </div>
  );
}