const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/Role';

export async function getAllRoles() {
  try {
    const res = await fetch(`${API_BASE_URL}`, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });

    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}
