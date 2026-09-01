const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/Auth';
const AUTH_STORAGE_KEY = 'AUTH';

export async function login(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export function storeAuthData(authData) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    console.log('Auth data stored successfully:', authData);
    return { success: true, error: null };
  } catch (storageError) {
    console.warn('Unable to persist auth data:', storageError);
    return { success: false, error: storageError };
  }
}

export function getAuthData() {
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.warn('Unable to retrieve auth data:', error);
    return null;
  }
}

export function authenticatedFetch(input, init = {}) {
  const authData = getAuthData();
  const token = authData?.token || authData?.accessToken;
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}

export function clearAuthData() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { success: true, error: null };
  } catch (error) {
    console.warn('Unable to clear auth data:', error);
    return { success: false, error };
  }
}

const authService = { login, storeAuthData, getAuthData, authenticatedFetch, clearAuthData };

export default authService;
