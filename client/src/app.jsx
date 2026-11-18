import { useEffect, useState } from 'react';
import { api } from './api/client';

export default function App() {
  const [status, setStatus] = useState('Checking API...');

  useEffect(() => {
    api
      .get('/health')
      .then((d) => setStatus(d.ok ? 'API connected' : 'API error'))
      .catch(() => setStatus('Cannot reach the server'));
  }, []);

  return (
    <div className="center">
      <div className="card">
        <h2>NovaPharm</h2>
        <p className="muted">{status}</p>
      </div>
    </div>
  );
}
