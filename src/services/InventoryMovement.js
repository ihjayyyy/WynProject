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

export { getInventoryMovements };

const InventoryMovementService = {
  getInventoryMovements,
};

export default InventoryMovementService;