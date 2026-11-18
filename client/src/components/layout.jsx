import { Outlet } from 'react-router-dom';
import Topbar from './topbar';
import Sidebar from './sidebar';
import { useAuth } from '../context/auth-context';

export default function Layout() {
  const { ready, pharmacyId } = useAuth();
  return (
    <div className="app">
      <Topbar />
      <div className="body">
        <Sidebar />
        <main className="main">
          {/* key = pharmacyId: marka pharmacy la beddelo, bogga dib ayuu u soo qaadaa xogta */}
          {ready ? <Outlet key={pharmacyId} /> : <p className="muted">Loading...</p>}
        </main>
      </div>
    </div>
  );
          }
