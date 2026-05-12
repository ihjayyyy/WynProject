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
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    return { success: true, error: null };
  } catch (storageError) {
    console.warn('Unable to persist auth data:', storageError);
    return { success: false, error: storageError };
  }
}

export function getAuthData() {
  try {
    const authData = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return authData ? JSON.parse(authData) : null;
  } catch (error) {
    console.warn('Unable to retrieve auth data:', error);
    return null;
  }
}

export function clearAuthData() {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return { success: true, error: null };
  } catch (error) {
    console.warn('Unable to clear auth data:', error);
    return { success: false, error };
  }
}

export default { login, storeAuthData, getAuthData, clearAuthData };
