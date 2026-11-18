
const BASE = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'
).replace(/\/+$/, '');

const TOKEN_KEY = 'np_token';
const PHARMACY_KEY = 'np_pharmacy';

export const getToken = () =>
  localStorage.getItem(TOKEN_KEY);

export const getPharmacy = () =>
  localStorage.getItem(PHARMACY_KEY);

export const setPharmacy = (id) =>
  localStorage.setItem(PHARMACY_KEY, String(id));

export const setToken = (token) =>
  localStorage.setItem(TOKEN_KEY, token);

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PHARMACY_KEY);
};

async function request(method, path, body) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const pharmacy = getPharmacy();

  if (pharmacy) {
    headers['x-pharmacy-id'] = pharmacy;
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined
      ? JSON.stringify(body)
      : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && token) {
    clearSession();
    localStorage.removeItem('np_user');
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  get: (path) => request('GET', path),

  post: (path, body) => request('POST', path, body),

  patch: (path, body) => request('PATCH', path, body),
};
