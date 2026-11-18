import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Pill } from 'lucide-react';
import { useAuth } from '../context/auth-context';

export default function Login() {
  const { user, ready, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user && ready) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card login-card" onSubmit={submit}>
        <div className="login-logo">
          <Pill size={28} />
        </div>
        <h2>NovaPharm</h2>
        <p className="muted">Sign in to your pharmacy account.</p>

        <input
          type="email"
          placeholder="Email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
          }
