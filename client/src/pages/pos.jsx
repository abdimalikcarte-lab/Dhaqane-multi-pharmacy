import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { money } from '../utils/format';

export default function Pos() {
  const [meds, setMeds] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [pay, setPay] = useState('cash');
  const [customer, setCustomer] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/medicines').then(setMeds).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const inCart = (id) => cart.find((c) => c.id === id)?.qty || 0;

  function add(m) {
    if (inCart(m.id) >= m.stock_qty) return setError(`Only ${m.stock_qty} in stock`);
    setError('');
    setCart((c) =>
      c.some((x) => x.id === m.id)
        ? c.map((x) => (x.id === m.id ? { ...x, qty: x.qty + 1 } : x))
        : [...c, { id: m.id, name: m.name, price: Number(m.price), qty: 1, max: m.stock_qty }]
    );
  }

  const setQty = (id, q) =>
    setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: Math.min(Math.max(q || 1, 1), x.max) } : x)));
  const remove = (id) => setCart((c) => c.filter((x) => x.id !== id));
  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

  async function complete() {
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/sales', {
        paymentMethod: pay,
        customerName: customer,
        items: cart.map((c) => ({ medicineId: c.id, qty: c.qty })),
      });
      setMsg(`Sale #${r.id} recorded: ${money(r.total)}`);
      setTimeout(() => setMsg(''), 4000);
      setCart([]);
      setCustomer('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const shown = meds.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>POS</h2>
          <p className="muted">Pick medicines to start a new sale</p>
        </div>
        <input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <p className="error">{error}</p>}
      {msg && <p className="success">{msg}</p>}

      <div className="grid-2">
        <div className="card">
          <h3>Medicines</h3>
          <table>
            <tbody>
              {shown.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{money(m.price)}</td>
                  <td className="muted">{m.stock_qty} left</td>
                  <td>
                    <button className="btn" disabled={m.stock_qty < 1} onClick={() => add(m)}>
                      Add
                    </button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td className="muted">No medicines found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Cart</h3>
          {cart.length === 0 ? (
            <p className="muted">Cart is empty. Add a medicine from the list.</p>
          ) : (
            <>
              <table>
                <tbody>
                  {cart.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>
                        <input type="number" min="1" max={c.max} style={{ width: 64 }} value={c.qty}
                          onChange={(e) => setQty(c.id, parseInt(e.target.value, 10))} />
                      </td>
                      <td>{money(c.price * c.qty)}</td>
                      <td><button className="btn ghost" onClick={() => remove(c.id)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="total">Total {money(total)}</p>
              <div className="row">
                <select value={pay} onChange={(e) => setPay(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_money">Mobile money</option>
                </select>
                <input placeholder="Customer (optional)" value={customer}
                  onChange={(e) => setCustomer(e.target.value)} />
                <button className="btn" disabled={busy} onClick={complete}>
                  {busy ? 'Saving...' : 'Complete sale'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
