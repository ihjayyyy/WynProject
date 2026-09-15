import { authenticatedFetch } from './Auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/InventoryMovement";

async function parseResponse(res) {
  try {
    const json = await res.json();
    return json && json.value ? json.value : json;
  } catch {
    return null;
  }
}

async function getInventoryMovements() {
  try {
    const data = await parseResponse(
      await authenticatedFetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          Accept: '*/*',
        },
      })
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getInventoryMovementsFilteredByMaterial(materialId, fromDate, toDate) {
  try {
    const params = new URLSearchParams();
    if (materialId !== undefined && materialId !== null) {
      params.append('materialId', materialId);
    }
    if (fromDate) {
      params.append('fromDate', fromDate);
    }
    if (toDate) {
      params.append('toDate', toDate);
    }

    const data = await parseResponse(
      await authenticatedFetch(`${API_BASE_URL}/FilteredByMaterial?${params.toString()}`, {
        method: 'GET',
        headers: {
          Accept: '*/*',
        },
      })
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export { getInventoryMovements, getInventoryMovementsFilteredByMaterial };

const InventoryMovementService = {
  getInventoryMovements,
  getInventoryMovementsFilteredByMaterial,
};

export default InventoryMovementService;