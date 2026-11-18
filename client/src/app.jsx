import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import ProtectedRoute from './components/protected-route';
import Layout from './components/layout';
import Placeholder from './components/placeholder';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Medicines from './pages/medicines';

const guard = (perm, el) => <ProtectedRoute permission={perm}>{el}</ProtectedRoute>;
const soon = (title) => <Placeholder title={title} />;

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
          <Route path="pos" element={guard('sales.create', soon('POS'))} />
          <Route path="sales" element={guard('sales.view', soon('Sales records'))} />
          <Route path="users" element={guard('users.manage', soon('Users'))} />
          <Route path="pharmacies" element={guard('pharmacies.manage', soon('Pharmacies'))} />
          <Route path="audit" element={guard('users.manage', soon('Audit log'))} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
            }
