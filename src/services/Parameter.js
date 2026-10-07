import { authenticatedFetch } from './Auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Parameter";

// No initial object since parameters are dynamic per module

async function getParameter(moduleName) {
  try {
    const url = `${API_BASE_URL}/get/${moduleName}`;
    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getParameterByName(moduleName, paramName) {
  try {
    const url = `${API_BASE_URL}/get/${moduleName}/${paramName}`;
    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    const inner = json && json.value ? json.value : null;
    console.log(`getParameterByName(${moduleName}, ${paramName}) =>`, inner);
    return { data: inner ? inner.value : null, error: json?.error || null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}
async function getAllParameters() {
  try {
    const res = await authenticatedFetch(API_BASE_URL, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function updateParameter(id, { name, code, value, module }) {
  try {
    const url = `${API_BASE_URL}/${id}`;
    const res = await authenticatedFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
      body: JSON.stringify({ name, code, value, module }),
    });
    if (!res.ok) {
      throw new Error(`Update failed with status ${res.status}`);
    }
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export { getParameter, getParameterByName, getAllParameters, updateParameter };
export default { getParameter, getParameterByName, getAllParameters, updateParameter };
