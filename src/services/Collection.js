import { handleOpenPdf } from "./Helper";

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

async function cancelCollection(salesCollectionId) {
  try {
    const url = `${API_BASE_URL}/${salesCollectionId}/cancel`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { Accept: '*/*' },
    });

    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function closeCollection(salesCollectionId) {
  try {
    const url = `${API_BASE_URL}/${salesCollectionId}/close`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { Accept: '*/*' },
    });

    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}
async function printSalesCollection_byId(id) {
  if (!id) return { data: null, error: 'Missing id' };

  try {
    const url = `${API_BASE_URL}/pdf/${id}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });

    handleOpenPdf(res);
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

async function getCollectionsByBillingId(billingId) {
  if (!billingId) {
    return { data: null, error: 'Missing billingId' };
  }

  try {
    const url = `${API_BASE_URL}/ByBilling/${billingId}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await res.json();

    return {
      data: json && json.value ? json.value : json,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

export {
  getCollections,
  getCollectionById,
  getCollectionsByBillingId,
  createCollection,
  updateCollection,
  cancelCollection,
  closeCollection,
  printSalesCollection_byId,
};

export default {
  getCollections,
  getCollectionById,
  getCollectionsByBillingId,
  createCollection,
  updateCollection,
  cancelCollection,
  closeCollection,
  INITIAL_COLLECTION,
  printSalesCollection_byId,
};