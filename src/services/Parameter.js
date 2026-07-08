const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Parameter";

// No initial object since parameters are dynamic per module

async function getParameter(moduleName) {
  try {
    const url = `${API_BASE_URL}/get/${moduleName}`;
    const res = await fetch(url, {
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
    const res = await fetch(url, {
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

export { getParameter, getParameterByName };
export default { getParameter, getParameterByName };
