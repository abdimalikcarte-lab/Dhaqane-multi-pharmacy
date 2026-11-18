import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/auth-context';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get('/users').then(setUsers).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  async function run(fn, ok) {
    try {
      setError('');
      await fn();
      setMsg(ok);
      setTimeout(() => setMsg(''), 2500);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const addUser = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/users', form);
      setForm({ fullName: '', email: '', password: '', role: 'user' });
    }, 'User added');
  };

  const resetPw = (u) => {
    const password = window.prompt(`New password for ${u.full_name} (8+ characters)`);
    if (password) run(() => api.patch(`/users/${u.id}/password`, { password }), 'Password updated');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Users</h2>
          <p className="muted">Manage who can use this pharmacy</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {msg && <p className="success">{msg}</p>}

      <div className="card">
        <h3>Add user</h3>
        <form className="row" onSubmit={addUser}>
          <input placeholder="Full name" required value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <input type="email" placeholder="Email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Password (8+)" required minLength={8} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="user">Cashier</option>
            <option value="admin">Pharmacy Admin</option>
          </select>
          <button className="btn">Add user</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.role === 'admin' ? 'Admin' : 'Cashier'}</td>
                <td>
                  <span className={`tag ${u.is_active ? 'ok' : 'urgent'}`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <div className="row">
                    <button className="btn ghost" onClick={() => resetPw(u)}>Reset password</button>
                    {u.id !== user.id && (
                      <button className="btn ghost"
                        onClick={() => run(() => api.patch(`/users/${u.id}/active`, { isActive: !u.is_active }),
                          u.is_active ? 'User disabled' : 'User enabled')}>
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  }
