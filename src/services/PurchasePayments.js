import { authenticatedFetch } from './Auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/Payment';

export async function getAllPayments() {
  try {
    const res = await authenticatedFetch(API_BASE_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export async function createPayment(payload) {
  try {
    const res = await authenticatedFetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    const data = json && json.value ? json.value : json;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export async function getPaymentById(id) {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    const data = json && json.value ? json.value : json;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export async function updatePayment(id, payload) {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/${id}`, {
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

export async function submitPayment(paymentId) {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/${paymentId}/submit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    const data = json && json.value ? json.value : json;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export async function cancelPayment(paymentId) {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/${paymentId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    const data = json && json.value ? json.value : json;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export async function archivePayment(paymentId) {
  try {
    const res = await authenticatedFetch(`${API_BASE_URL}/${paymentId}/archive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    const data = json && json.value ? json.value : json;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

const PurchasePaymentService = {
  getAllPayments,
  createPayment,
  getPaymentById,
  updatePayment,
  submitPayment,
  cancelPayment,
  archivePayment,
};
export default PurchasePaymentService;
