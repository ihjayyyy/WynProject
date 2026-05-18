const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/Payment';

export async function getAllPayments() {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}
