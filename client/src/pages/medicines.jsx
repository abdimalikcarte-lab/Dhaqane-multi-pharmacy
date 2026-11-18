import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/auth-context';
import { money } from '../utils/format';
import StockTag from '../components/stock-tag';

export default function Medicines() {
  const { can } = useAuth();
  const canAdd = can('medicines.create');
  const canPrice = can('price.update');
  const canStock = can('medicines.update');

  const [meds, setMeds] = useState([]);
  const [cats, setCats] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [prices, setPrices] = useState({});
  const [form, setForm] = useState({ name: '', price: '', stockQty: '', categoryId: '' });
  const [newCat, setNewCat] = useState('');

  async function load() {
    try {
      const [m, c] = await Promise.all([api.get('/medicines'), api.get('/medicines/categories')]);
      setMeds(m);
      setCats(c);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const flash = (t) => {
    setMsg(t);
    setTimeout(() => setMsg(''), 2500);
  };

  async function run(fn, okText) {
    try {
      await fn();
      flash(okText);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const addMed = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/medicines', form);
      setForm({ name: '', price: '', stockQty: '', categoryId: '' });
    }, 'Medicine added');
  };

  const addCat = (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    run(async () => {
      await api.post('/medicines/categories', { name: newCat });
      setNewCat('');
    }, 'Category added');
  };

  const savePrice = (m) =>
    run(async () => {
      await api.patch(`/medicines/${m.id}/price`, { price: prices[m.id] });
      setPrices((p) => {
        const n = { ...p };
        delete n[m.id];
        return n;
      });
    }, 'Price saved');

  const restock = (m) => {
    const qty = parseInt(window.prompt(`Add stock to ${m.name}. How many pieces?`), 10);
    if (qty > 0) run(() => api.post(`/medicines/${m.id}/stock`, { qty }), 'Stock updated');
  };

  const shown = meds.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Medicines</h2>
          <p className="muted">{canPrice ? 'Add medicines and set prices' : 'View only'}</p>
        </div>
        <input
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {msg && <p className="success">{msg}</p>}

      {canAdd && (
        <div className="card">
          <h3>Add medicine</h3>
          <form className="row" onSubmit={addMed}>
            <input placeholder="Name" value={form.name} required
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">No category</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" step="0.01" min="0" placeholder="Price" style={{ width: 100 }} required
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input type="number" min="0" placeholder="Stock" style={{ width: 100 }}
              value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
            <button className="btn">Add medicine</button>
          </form>
          <form className="row" style={{ marginTop: 10 }} onSubmit={addCat}>
            <input placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button className="btn ghost">Add category</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th>
              {canStock && <th></th>}
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.category || '-'}</td>
                <td>
                  {canPrice ? (
                    <div className="row">
                      <input
                        type="number" step="0.01" min="0" style={{ width: 90 }}
                        value={prices[m.id] ?? m.price}
                        onChange={(e) => setPrices({ ...prices, [m.id]: e.target.value })}
                      />
                      {prices[m.id] !== undefined && Number(prices[m.id]) !== Number(m.price) && (
                        <button className="btn" onClick={() => savePrice(m)}>Save</button>
                      )}
                    </div>
                  ) : (
                    money(m.price)
                  )}
                </td>
                <td>{m.stock_qty}</td>
                <td><StockTag qty={m.stock_qty} reorder={m.reorder_level} /></td>
                {canStock && (
                  <td><button className="btn ghost" onClick={() => restock(m)}>Add stock</button></td>
                )}
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan="6" className="muted">No medicines found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
