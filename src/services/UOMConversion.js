import { authenticatedFetch } from './Auth';
// src/services/UOMConversion.js
// Service for handling Unit of Measure Conversion API requests

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/UOMConversion";

export const INITIAL_UOM_CONVERSION = {
  name: '',
  code: '',
  convertFrom: '',
  convertTo: '',
  conversionFactor: 0,
};

async function parseResponse(res) {
  try {
    const json = await res.json();
    return json && json.value ? json.value : json;
  } catch {
    return null;
  }
}

async function getUOMConversions() {
  try {
    const data = await parseResponse(
      await authenticatedFetch(`${API_BASE_URL}`, {
        method: 'GET',
        headers: { Accept: '*/*' },
      })
    );
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function createUOMConversion(payload) {
  try {
    const data = await parseResponse(
      await authenticatedFetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function updateUOMConversion(id, payload) {
  if (!id) return { data: null, error: 'Missing id' };

  try {
    const data = await parseResponse(
      await authenticatedFetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function deleteUOMConversion(id) {
  if (!id) return { data: null, error: 'Missing id' };

  try {
    const data = await parseResponse(
      await authenticatedFetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { Accept: '*/*' },
      })
    );
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export {
  getUOMConversions,
  createUOMConversion,
  updateUOMConversion,
  deleteUOMConversion,
};
