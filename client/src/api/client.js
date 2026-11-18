const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'np_token';
const PHARMACY_KEY = 'np_pharmacy';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getPharmacy = () => localStorage.getItem(PHARMACY_KEY);
export const setPharmacy = (id) => localStorage.setItem(PHARMACY_KEY, id);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PHARMACY_KEY);
};

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Super admin: pharmacy-ga la doortay (switcher)
  const ph = getPharmacy();
  if (ph) headers['x-pharmacy-id'] = ph;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    clearSession();
    window.location.href = '/login';
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
};
