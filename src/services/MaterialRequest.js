import { handleOpenPdf } from "./Helper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/MaterialRequest";

export const INITIAL_MATERIAL_REQUEST = {
    name: '',
    code: '',
    materialId: 0,
    projectId: 0,
    qty: 0,
    projectQty: 0,
    requestedQty: 0,
    balance: 0,
    reasonOrProject: '',
    requestedBy: '',
    deadline: '',
    requestDate: '',
    status: '',
    responseBy: '',
    responseDate: '',
};

async function getMaterialRequests() {
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

async function createMaterialRequest(payload) {
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

async function getMaterialRequestsByProjectId(projectId) {
    try {
        const url = `${API_BASE_URL}/GetByProjectId/${projectId}`;
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

async function updateMaterialRequest(id, payload) {
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

async function getDocumentPDFById(projectId) {
    console.log(projectId);
  if (!projectId) return { data: null, error: 'Missing id' };
  try {
    const url = `${API_BASE_URL}/pdf/${projectId}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    handleOpenPdf(res);
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getDocumentPDFByRivNumber(item) {
    console.log(item);
  if (!item.projectId) return { data: null, error: 'Missing id' };
  if (!item.rivNumber) return { data: null, error: 'Missing RIV Number' };
  try {
    const url = `${API_BASE_URL}/pdf/${item.projectId}/${item.rivNumber}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    handleOpenPdf(res);
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export { getMaterialRequests, createMaterialRequest, updateMaterialRequest, getMaterialRequestsByProjectId, getDocumentPDFById, getDocumentPDFByRivNumber };
export default { getMaterialRequests, createMaterialRequest, updateMaterialRequest, getMaterialRequestsByProjectId, getDocumentPDFById, getDocumentPDFByRivNumber };