import { authenticatedFetch } from './Auth';
import { handleOpenPdf } from './Helper';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/MaterialInventory';

export const INITIAL_MATERIAL_INVENTORY = {
  name: '',
  code: '',
  rackId: 0,
  materialId: 0,
  quantity: 0,
  stockLevel: 0,
};

async function getMaterialInventories(filters) {
  try {
    let url = API_BASE_URL + '/ByType';
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
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getMaterialInventory(id) {
  try {
    const url = `${API_BASE_URL}/${id}`;
    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

// ✅ NEW FUNCTION
async function getMaterialInventoryByMaterialId(materialId) {
  try {
    const url = `${API_BASE_URL}/ByMaterialId/${materialId}`;
    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getMaterialInventoryReportByMaterialId(materialId) {
  try {
    const url = `${API_BASE_URL}/GenerateReport/${materialId}`;
    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    const data = json && json.value ? json.value : json;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function createMaterialInventory(payload) {
  try {
    const res = await authenticatedFetch(API_BASE_URL, {
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

async function updateMaterialInventory(id, payload) {
  try {
    const url = `${API_BASE_URL}/${id}`;
    const res = await authenticatedFetch(url, {
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

async function generateMaterialInventoryReport() {
  try {
    const url = `${API_BASE_URL}/GenerateReport`;

    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const json = await res.json();

    return {
      data: json?.value || [],
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}
async function printMaterialReport_byId() {
  try {
    const url = `${API_BASE_URL}/GenerateReport/pdf`;
    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    handleOpenPdf(res);
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getRacksByMaterialId(materialId) {
  try {
    const url = `${API_BASE_URL}/Racks/ByMaterialId/${materialId}`;

    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
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

async function updateMaterialInventoryQuantity(id, quantityChange) {
  try {
    const url = `${API_BASE_URL}/UpdateQuantity/${id}`;

    const res = await authenticatedFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantityChange,
      }),
    });

    const json = await res.json();

    return {
      data: json,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

async function setDefaultMaterialInventory(inventoryId) {
  try {
    const url = `${API_BASE_URL}/SetDefault/${inventoryId}`;

    const res = await authenticatedFetch(url, {
      method: 'PUT',
      headers: {
        Accept: '*/*',
      },
    });

    let data = null;

    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }

    return {
      data,
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
  getMaterialInventories,
  getMaterialInventory,
  getMaterialInventoryByMaterialId,
  getMaterialInventoryReportByMaterialId,
  getRacksByMaterialId,
  createMaterialInventory,
  updateMaterialInventory,
  updateMaterialInventoryQuantity,
  setDefaultMaterialInventory,
  generateMaterialInventoryReport,
  printMaterialReport_byId,
};

const MaterialInventoryService = {
  getMaterialInventories,
  getMaterialInventory,
  getMaterialInventoryByMaterialId,
  getMaterialInventoryReportByMaterialId,
  getRacksByMaterialId,
  createMaterialInventory,
  updateMaterialInventory,
  updateMaterialInventoryQuantity,
  setDefaultMaterialInventory,
  generateMaterialInventoryReport,
  printMaterialReport_byId,
};

export default MaterialInventoryService;
