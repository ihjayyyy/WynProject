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

export { getParameter };
export default { getParameter };
