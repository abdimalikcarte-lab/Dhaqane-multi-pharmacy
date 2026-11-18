import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import ProtectedRoute from './components/protected-route';
import Layout from './components/layout';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Medicines from './pages/medicines';
import Pos from './pages/pos';
import Sales from './pages/sales';
import Users from './pages/users';
import Pharmacies from './pages/pharmacies';
import Audit from './pages/audit';

const guard = (perm, el) => <ProtectedRoute permission={perm}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="medicines" element={guard('medicines.view', <Medicines />)} />
          <Route path="pos" element={guard('sales.create', <Pos />)} />
          <Route path="sales" element={guard('sales.view', <Sales />)} />
          <Route path="users" element={guard('users.manage', <Users />)} />
          <Route path="pharmacies" element={guard('pharmacies.manage', <Pharmacies />)} />
          <Route path="audit" element={guard('users.manage', <Audit />)} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
            }
