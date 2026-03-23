const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Material";

export const INITIAL_MATERIAL = {
  name: '',
  code: '',
  materialType: '',
  unitOfMeasure: '',
  purchaseUnitOfMeasure: '',
  unitCost: 0,
  isAssembly: false,
};

async function getMaterials() {
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

async function getMaterial(id) {
  try {
    const url = `${API_BASE_URL}/${id}`;
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

async function byTypeMaterials(filters) {
  try {
    let url = `${API_BASE_URL}/Bytype`;
    if (filters && Object.keys(filters).length) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.append(k, String(v));
      });
      url = `${url}?${params.toString()}`;
    }
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

async function createMaterial(payload) {
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

async function updateMaterial(id, payload) {
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

export { getMaterials, getMaterial, byTypeMaterials, createMaterial, updateMaterial };
export default { getMaterials, getMaterial, byTypeMaterials, createMaterial, updateMaterial };
