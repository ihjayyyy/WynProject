import { authenticatedFetch } from './Auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/UnitOfMeasure";

export const INITIAL_UNIT_OF_MEASURE = {
  name: '',
  code: '',
};

async function parseResponse(res) {
  try {
    const json = await res.json();
    return json && json.value ? json.value : json;
  } catch {
    return null;
  }
}

async function getUnitsOfMeasure() {
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

async function createUnitOfMeasure(payload) {
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

async function updateUnitOfMeasure(id, payload) {
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

async function deleteUnitOfMeasure(id) {
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

export { getUnitsOfMeasure, createUnitOfMeasure, updateUnitOfMeasure, deleteUnitOfMeasure };

const UnitOfMeasureService = {
  getUnitsOfMeasure,
  createUnitOfMeasure,
  updateUnitOfMeasure,
  deleteUnitOfMeasure,
  INITIAL_UNIT_OF_MEASURE,
};

export default UnitOfMeasureService;
