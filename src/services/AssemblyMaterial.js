

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/AssemblyMaterial";

export const INITIAL_ASSEMBLY_MATERIAL = {
  material: {
    name: '',
    code: '',
    materialType: '',
    unitOfMeasure: '',
    purchaseUnitOfMeasure: '',
    purchasePrice: 0,
    sellingPrice: 0,
    isAssembly: true,
    referenceNumber: '',
  },
  assemblyMaterials: [],
  deletedAssemblyMaterials: [],
};

function toApiPayload(payload = {}) {
  return {
    material: {
      name: payload.material?.name || '',
      code: payload.material?.code || '',
      materialType: payload.material?.materialType || '',
      unitOfMeasure: payload.material?.unitOfMeasure || '',
      purchaseUnitOfMeasure: payload.material?.purchaseUnitOfMeasure || '',
      purchasePrice: Number(payload.material?.purchasePrice ?? 0) || 0,
      sellingPrice: Number(payload.material?.sellingPrice ?? 0) || 0,
      isAssembly: true,
      referenceNumber: payload.material?.referenceNumber || '',
    },
    assemblyMaterials: Array.isArray(payload.assemblyMaterials) ? payload.assemblyMaterials : [],
    deletedAssemblyMaterials: Array.isArray(payload.deletedAssemblyMaterials) ? payload.deletedAssemblyMaterials : [],
  };
}

function unwrapResponse(json) {
  return json && json.value !== undefined ? json.value : json;
}

async function createAssemblyMaterial(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/Assembly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toApiPayload(payload)),
    });
    const json = await res.json();
    return { data: unwrapResponse(json), error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getAssemblyMaterial(materialId) {
  try {
    const url = `${API_BASE_URL}/Material/${materialId}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: unwrapResponse(json), error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function updateAssemblyMaterial(materialId, payload) {
  try {
    const url = `${API_BASE_URL}/Assembly/${materialId}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toApiPayload(payload)),
    });
    const json = await res.json();
    return { data: unwrapResponse(json), error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}



const AssemblyMaterialService = {
  createAssemblyMaterial,
  getAssemblyMaterial,
  updateAssemblyMaterial,
  toApiPayload,
  unwrapResponse,
  INITIAL_ASSEMBLY_MATERIAL,
};

export default AssemblyMaterialService;
