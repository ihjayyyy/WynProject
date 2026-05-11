const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/Auth';

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

export default { login };
