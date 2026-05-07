const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/SalesCollection";

export const INITIAL_COLLECTION = {
  name: '',
  code: '',
  children: [],
  deletedChildren: [],
  customerId: 0,
  description: '',
  receiptNumber: '',
  date: '',
  checkNumber: '',
  amount: 0,
  totalAmountReceived: 0,
  totalAmountPaid: 0,
  withholdingTaxPercent: 0,
  totalWithholdingTax: 0,
};

async function getCollections() {
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

async function getCollectionById(id) {
  if (!id) return { data: null, error: 'Missing id' };
  try {
    const url = `${API_BASE_URL}/${id}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function createCollection(payload) {
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

async function updateCollection(id, payload) {
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

export { getCollections, getCollectionById, createCollection, updateCollection };
export default {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  INITIAL_COLLECTION,
};
