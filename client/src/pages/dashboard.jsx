import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import { money, dateTime, payLabel } from '../utils/format';
import StockTag from '../components/stock-tag';

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then(setD)
      .catch((e) => setError(e.message));
  }, []);

  if (error)
    return (
      <div className="card">
        <p className="error">{error}</p>
        <p className="muted">Super admin: create a pharmacy first, then pick it from the top bar.</p>
      </div>
    );
  if (!d) return <p className="muted">Loading...</p>;

  const chart = d.daily.map((x) => ({ day: x.day.slice(5), total: Number(x.total) }));

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <p className="muted">Last 30 days</p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi k1"><span>Total sales</span><strong>{money(d.salesTotal)}</strong></div>
        <div className="kpi k2"><span>Sales count</span><strong>{d.salesCount}</strong></div>
        <div className="kpi k3"><span>Medicines</span><strong>{d.medicinesCount}</strong></div>
        <div className="kpi k4"><span>Low stock</span><strong>{d.lowStock.length}</strong></div>
      </div>

      <div className="card">
        <h3>Sales overview</h3>
        {chart.length === 0 ? (
          <p className="muted">No sales yet.</p>
        ) : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d3e5da" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => money(v)} />
                <Area type="monotone" dataKey="total" stroke="#059669" fill="#d1fae5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Low stock alerts</h3>
          {d.lowStock.length === 0 ? (
            <p className="muted">All medicines are well stocked.</p>
          ) : (
            <table>
              <tbody>
                {d.lowStock.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.stock_qty} pcs</td>
                    <td><StockTag qty={m.stock_qty} reorder={m.reorder_level} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>Recent sales</h3>
          {d.recentSales.length === 0 ? (
            <p className="muted">No sales yet.</p>
          ) : (
            <table>
              <tbody>
                {d.recentSales.map((s) => (
                  <tr key={s.id}>
                    <td>{s.customer || 'Walk-in'}</td>
                    <td>{money(s.total)}</td>
                    <td>{payLabel(s.payment_method)}</td>
                    <td className="muted">{dateTime(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
