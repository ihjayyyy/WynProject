import { handleOpenPdf } from "./Helper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Transfer";

export const INITIAL_MATERIAL_TRANSFER = {
  name: '',
  code: '',
  children: [],
  deletedChildren: [],
  transferFrom: 0,
  transferFromType: '',
  transferTo: 0,
  transferToType: '',
  date: '',
  description: '',
};

async function getMaterialTransfers() {
  try {
    let url = API_BASE_URL +'/list';
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

async function getMaterialTransfer(id) {
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

async function createMaterialTransfer(payload) {
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

async function updateMaterialTransfer(id, payload) {
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

async function transferMaterialTransfer(id) {
  try {
    const url = `${API_BASE_URL}/transferred/${id}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function receiveMaterialTransfer(id, payload) {
  try {
    const url = `${API_BASE_URL}/receive/${id}`;
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

async function getReceivedMaterialTransfers() {
  try {
    const url = `${API_BASE_URL}/received`;
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

async function getTransferredMaterialTransfers() {
  try {
    const url = `${API_BASE_URL}/transferred`;
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

async function getDocumentPDFById(transferId) {
    console.log(transferId);
  if (!transferId) return { data: null, error: 'Missing id' };
  try {
    const url = `${API_BASE_URL}/pdf/${transferId}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: '*/*' },
    });
    handleOpenPdf(res);
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export {
  getMaterialTransfers,
  getMaterialTransfer,
  getReceivedMaterialTransfers,
  getTransferredMaterialTransfers,
  createMaterialTransfer,
  updateMaterialTransfer,
  transferMaterialTransfer,
  receiveMaterialTransfer,
  getDocumentPDFById
};

export default {
  getMaterialTransfers,
  getMaterialTransfer,
  getReceivedMaterialTransfers,
  getTransferredMaterialTransfers,
  createMaterialTransfer,
  updateMaterialTransfer,
  transferMaterialTransfer,
  receiveMaterialTransfer,
  getDocumentPDFById
};
