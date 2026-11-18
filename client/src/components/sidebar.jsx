import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Pill, ShoppingCart, Receipt, Users, Building2, ScrollText } from 'lucide-react';
import { useAuth } from '../context/auth-context';

// perm = permission loo baahan yahay (null = qof walba)
const ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, perm: null },
  { to: '/medicines', label: 'Medicines', icon: Pill, perm: 'medicines.view' },
  { to: '/pos', label: 'POS', icon: ShoppingCart, perm: 'sales.create' },
  { to: '/sales', label: 'Sales records', icon: Receipt, perm: 'sales.view' },
  { to: '/users', label: 'Users', icon: Users, perm: 'users.manage' },
  { to: '/pharmacies', label: 'Pharmacies', icon: Building2, perm: 'pharmacies.manage' },
  { to: '/audit', label: 'Audit log', icon: ScrollText, perm: 'users.manage' },
];

export default function Sidebar() {
  const { can } = useAuth();
  return (
    <nav className="sidebar">
      {ITEMS.filter((i) => !i.perm || can(i.perm)).map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.to === '/'}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <i.icon size={18} /> {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
