import { authenticatedFetch } from './Auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Material";

export const INITIAL_MATERIAL = {
  name: '',
  code: '',
  materialType: '',
  unitOfMeasure: '',
  purchaseUnitOfMeasure: '',
  purchasePrice: 0,
  sellingPrice: 0,
  unitCost: 0,
  isAssembly: false,
  referenceNumber: '0',
  stockLevel: 0,
};

function unwrapResponse(json) {
  return json && json.value !== undefined ? json.value : json;
}

function normalizeMaterial(item) {
  if (!item || typeof item !== 'object') return item;
  const purchasePrice = Number(item.purchasePrice ?? item.unitCost ?? 0) || 0;
  return {
    ...item,
    purchasePrice,
    sellingPrice: Number(item.sellingPrice ?? 0) || 0,
    unitCost: Number(item.unitCost ?? purchasePrice) || 0,
    referenceNumber: item.referenceNumber ?? '0',
    stockLevel: Number(item.stockLevel ?? item.initialQuantity ?? 0) || 0,
  };
}

function toApiPayload(payload = {}, { includeCreateOnlyFields = false } = {}) {
  const basePayload = {
    name: payload.name || '',
    code: payload.code || '',
    materialType: payload.materialType || '',
    unitOfMeasure: payload.unitOfMeasure || payload.uom || '',
    purchaseUnitOfMeasure: payload.purchaseUnitOfMeasure || payload.defaultPurchaseUOM || '',
    purchasePrice: Number(payload.purchasePrice ?? payload.unitCost ?? 0) || 0,
    sellingPrice: Number(payload.sellingPrice ?? 0) || 0,
    isAssembly: Boolean(payload.isAssembly),
    referenceNumber: payload.referenceNumber ?? '0',
    stockLevel: Number(payload.stockLevel ?? payload.initialQuantity ?? 0) || 0,
  };

  if (!includeCreateOnlyFields) return basePayload;

  return {
    ...basePayload,
    rackId: Number(payload.rackId) || 0,
    initialQuantity: Number(payload.initialQuantity) || 0,
  };
}

async function getMaterials() {
  try {
    const res = await authenticatedFetch(API_BASE_URL, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    const data = unwrapResponse(json);
    const list = Array.isArray(data) ? data.map(normalizeMaterial) : [];
    return { data: list, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getMaterial(id) {
  try {
    const url = `${API_BASE_URL}/${id}`;
    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    const data = unwrapResponse(json);
    return { data: normalizeMaterial(data), error: null };
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
    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    const data = unwrapResponse(json);
    const list = Array.isArray(data) ? data.map(normalizeMaterial) : [];
    return { data: list, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function createMaterial(payload) {
  try {
    const res = await authenticatedFetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toApiPayload(payload, { includeCreateOnlyFields: true })),
    });
    const json = await res.json();
    return { data: unwrapResponse(json), error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function updateMaterial(id, payload) {
  try {
    const url = `${API_BASE_URL}/${id}`;
    const res = await authenticatedFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toApiPayload(payload)),
    });
    const json = await res.json();
    return { data: unwrapResponse(json), error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}
async function deleteMaterial(id) {
  try {
    const url = `${API_BASE_URL}/${id}`;
    const res = await authenticatedFetch(url, {
      method: 'DELETE',
      headers: {
        Accept: '*/*',
      },
    });

    const json = await res.json();
    return { data: unwrapResponse(json), error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export { getMaterials, getMaterial, byTypeMaterials, createMaterial, updateMaterial, deleteMaterial };
