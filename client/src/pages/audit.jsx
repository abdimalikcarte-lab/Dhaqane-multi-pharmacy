import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { dateTime } from '../utils/format';

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/audit').then(setLogs).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Audit log</h2>
          <p className="muted">Who changed what in this pharmacy</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <table>
          <thead>
            <tr><th>When</th><th>User</th><th>Action</th><th>Details</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="muted">{dateTime(l.created_at)}</td>
                <td>{l.user_name}</td>
                <td>{l.action}</td>
                <td className="muted">{l.details ? JSON.stringify(l.details) : ''}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan="4" className="muted">Nothing logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
