import { Fragment, useEffect, useState } from 'react';
import { api } from '../api/client';
import { money, dateTime, payLabel } from '../utils/format';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [open, setOpen] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/sales').then(setSales).catch((e) => setError(e.message));
  }, []);

  async function toggle(id) {
    if (open === id) return setOpen(null);
    setOpen(id);
    setDetail(null);
    try {
      setDetail(await api.get(`/sales/${id}`));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Sales records</h2>
          <p className="muted">Locked records. Sales cannot be edited or deleted.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <table>
          <thead>
            <tr><th>#</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Cashier</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <Fragment key={s.id}>
                <tr>
                  <td>{s.id}</td>
                  <td>{s.customer || 'Walk-in'}</td>
                  <td>{money(s.total)}</td>
                  <td>{payLabel(s.payment_method)}</td>
                  <td>{s.cashier}</td>
                  <td className="muted">{dateTime(s.created_at)}</td>
                  <td>
                    <button className="btn ghost" onClick={() => toggle(s.id)}>
                      {open === s.id ? 'Hide' : 'Items'}
                    </button>
                  </td>
                </tr>
                {open === s.id && (
                  <tr>
                    <td colSpan="7" className="detail">
                      {!detail ? (
                        'Loading...'
                      ) : (
                        detail.items.map((i, k) => (
                          <div key={k}>
                            {i.name}: {i.qty} × {money(i.unit_price)} = {money(i.qty * i.unit_price)}
                          </div>
                        ))
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan="7" className="muted">No sales yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
