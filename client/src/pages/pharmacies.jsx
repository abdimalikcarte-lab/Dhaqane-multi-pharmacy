import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/auth-context';

const EMPTY = { name: '', address: '', phone: '', adminName: '', adminEmail: '', adminPassword: '' };

export default function Pharmacies() {
  const { pharmacies, loadPharmacies, switchPharmacy } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function run(fn, ok) {
    try {
      setError('');
      await fn();
      await loadPharmacies();
      setMsg(ok);
      setTimeout(() => setMsg(''), 2500);
    } catch (e) {
      setError(e.message);
    }
  }

  const create = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/pharmacies', form);
      setForm(EMPTY);
    }, 'Pharmacy created');
  };

  const open = (p) => {
    switchPharmacy(p.id);
    navigate('/');
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Pharmacies</h2>
          <p className="muted">Create pharmacies and their first admin</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {msg && <p className="success">{msg}</p>}

      <div className="card">
        <h3>Add pharmacy</h3>
        <form className="row" onSubmit={create}>
          <input placeholder="Pharmacy name" required value={form.name} onChange={set('name')} />
          <input placeholder="Address" value={form.address} onChange={set('address')} />
          <input placeholder="Phone" value={form.phone} onChange={set('phone')} />
          <input placeholder="Admin name" required value={form.adminName} onChange={set('adminName')} />
          <input type="email" placeholder="Admin email" required value={form.adminEmail}
            onChange={set('adminEmail')} />
          <input type="password" placeholder="Admin password (8+)" required minLength={8}
            value={form.adminPassword} onChange={set('adminPassword')} />
          <button className="btn">Add pharmacy</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Address</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {pharmacies.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.address || '-'}</td>
                <td>
                  <span className={`tag ${p.status === 'active' ? 'ok' : 'urgent'}`}>
                    {p.status === 'active' ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td>
                  <div className="row">
                    <button className="btn ghost" onClick={() => open(p)}>Open</button>
                    <button className="btn ghost"
                      onClick={() => run(() => api.patch(`/pharmacies/${p.id}/status`,
                        { status: p.status === 'active' ? 'suspended' : 'active' }),
                        'Status updated')}>
                      {p.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pharmacies.length === 0 && (
              <tr><td colSpan="4" className="muted">No pharmacies yet. Add the first one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
