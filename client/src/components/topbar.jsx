import { useNavigate } from 'react-router-dom';
import { LogOut, Pill } from 'lucide-react';
import { useAuth } from '../context/auth-context';

const ROLES = { super_admin: 'Super Admin', admin: 'Pharmacy Admin', user: 'Cashier' };

export default function Topbar() {
  const { user, logout, pharmacies, pharmacyId, switchPharmacy } = useAuth();
  const navigate = useNavigate();
  const isSuper = user.role === 'super_admin';

  return (
    <header className="topbar">
      <div className="brand">
        <Pill size={22} /> NovaPharm
      </div>

      {isSuper ? (
        <select
          className="ph-select"
          value={pharmacyId || ''}
          onChange={(e) => switchPharmacy(e.target.value)}
        >
          {pharmacies.length === 0 && <option value="">No pharmacies yet</option>}
          {pharmacies.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : (
        <span className="ph-name">{user.pharmacyName}</span>
      )}

      <div className="spacer" />

      <div className="who">
        <strong>{user.name}</strong>
        <span>{ROLES[user.role]}</span>
      </div>

      <button
        className="btn ghost light"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        <LogOut size={16} /> Log out
      </button>
    </header>
  );
}
