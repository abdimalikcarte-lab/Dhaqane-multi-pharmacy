import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, clearSession, getPharmacy, setPharmacy } from '../api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('np_user'));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? readUser() : null));
  const [loading, setLoading] = useState(!!getToken());
  const [ready, setReady] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmacyId, setPharmacyId] = useState(getPharmacy());

  // Super admin: soo qaado pharmacy-yada oo dooro mid
  const loadPharmacies = useCallback(async () => {
    const list = await api.get('/pharmacies');
    setPharmacies(list);
    const pick = list.find((p) => String(p.id) === getPharmacy()) || list[0];
    if (pick) {
      setPharmacy(pick.id);
      setPharmacyId(String(pick.id));
    }
    return list;
  }, []);

  const start = useCallback(
    async (u) => {
      if (u.role === 'super_admin') await loadPharmacies();
      setReady(true);
    },
    [loadPharmacies]
  );

  function logout() {
    clearSession();
    localStorage.removeItem('np_user');
    setUser(null);
    setReady(false);
    setPharmacies([]);
    setPharmacyId(null);
  }

  useEffect(() => {
    const u = readUser();
    if (!getToken() || !u) {
      if (getToken()) logout();
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(() => start(u))
      .catch(() => logout())
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  async function login(email, password) {
    clearSession();
    localStorage.removeItem('np_user');
    const d = await api.post('/auth/login', { email, password });
    setToken(d.token);
    localStorage.setItem('np_user', JSON.stringify(d.user));
    setUser(d.user);
    await start(d.user);
  }

  function switchPharmacy(id) {
    setPharmacy(id);
    setPharmacyId(String(id));
  }

  const can = (perm) => !!user?.permissions?.includes(perm);

  return (
    <AuthContext.Provider
      value={{ user, loading, ready, login, logout, can, pharmacies, pharmacyId, switchPharmacy, loadPharmacies }}
    >
      {children}
    </AuthContext.Provider>
  );
    }
