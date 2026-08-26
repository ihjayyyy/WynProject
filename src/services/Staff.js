const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Staff";

export const INITIAL_STAFF = {
  name: '',
  code: '',
  job: '',
  department: '',
  ratePerHour: 0,
  email: '',
};

async function getStaffs() {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function createStaff(payload) {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function updateStaff(id, payload) {
  try {
    const url = `${API_BASE_URL}/${id}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export { getStaffs, createStaff, updateStaff };
export default { getStaffs, createStaff, updateStaff, INITIAL_STAFF };