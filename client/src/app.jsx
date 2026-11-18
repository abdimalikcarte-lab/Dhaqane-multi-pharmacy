import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import ProtectedRoute from './components/protected-route';
import Layout from './components/layout';
import Placeholder from './components/placeholder';
import Login from './pages/login';

// Bogag cusub marka la dhiso, Placeholder ku beddel bogga dhabta ah
const guard = (perm, title) => (
  <ProtectedRoute permission={perm}>
    <Placeholder title={title} />
  </ProtectedRoute>
);

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
          <Route index element={<Placeholder title="Dashboard" />} />
          <Route path="medicines" element={guard('medicines.view', 'Medicines')} />
          <Route path="pos" element={guard('sales.create', 'POS')} />
          <Route path="sales" element={guard('sales.view', 'Sales records')} />
          <Route path="users" element={guard('users.manage', 'Users')} />
          <Route path="pharmacies" element={guard('pharmacies.manage', 'Pharmacies')} />
          <Route path="audit" element={guard('users.manage', 'Audit log')} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
