import { authenticatedFetch } from './Auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/Role';

export async function getAllRoles() {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}`, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export async function getRoleByRoleId(role_id) {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/${role_id}`, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export async function createRole(payload) {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: json?.message || `Request failed (${res.status})` };
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export async function updateRole(role_id, payload) {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/${role_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { data: null, error: json?.message || `Request failed (${res.status})` };
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}