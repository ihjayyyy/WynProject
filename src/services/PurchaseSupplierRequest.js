import { authenticatedFetch } from './Auth';
import { handleOpenPdf } from './Helper';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL + '/SupplierPurchaseRequest';

export const InitialData = {
  name: '',
  code: '',
  children: [
    // {
    //   "id": 0,
    //   "parentId": 0,
    //   "materialId": 0,
    //   "code": "",
    //   "name": "",
    //   "uom": "",
    //   "quantity": 0,
    //   "remarks": ""
    // }
  ],
  deletedChildren: [],
  requestDate: null,
  supplierId: 0,
  supplierCode: '',
  supplierName: '',
  contactNumber: '',
  address: '',
  contactPerson: '',
  email: '',
  supplierReferenceNo: '',
  projectID: 0,
  jobOrder: '',
  requestedBy: '',
  requestNumber: '',
};

function toApiChild(c) {
  return {
    id: c.id || 0,
    parentId: c.parentId || 0,
    materialId: c.materialId,
    code: c.code || '',
    name: c.name || '',
    uom: c.uom || '',
    quantity: Number(c.quantity || 0),
    remarks: c.remarks || '',
  };
}

async function GetAll() {
  try {
    const res = await authenticatedFetch(API_BASE_URL, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function GetRequestsByStatus(status) {
  try {
    const res = await authenticatedFetch(API_BASE_URL + '/status/' + status, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function GetRequestsBySupplier(id) {
  try {
    const res = await authenticatedFetch(API_BASE_URL + '/supplier/' + id, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function Get(id) {
  if (!id) return { data: null, error: 'Missing id' };
  try {
    const url = `${API_BASE_URL}/${id}`;
    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : {}, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function Create(payload) {
  try {
    const body = {
      ...payload,
      children: (payload.children || []).map(toApiChild),
      deletedChildren: (payload.deletedChildren || []).map(toApiChild),
    };

    const res = await authenticatedFetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    return { data: json, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: error?.message || error };
  }
}

async function Update(id, payload) {
  try {
    const body = {
      ...payload,
      children: (payload.children || []).map(toApiChild),
      deletedChildren: (payload.deletedChildren || []).map(toApiChild),
    };

    const url = `${API_BASE_URL}/${id}`;
    const res = await authenticatedFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function SubmitForApproval(id) {
  return SetStatus('Submit', id);
}

async function Approve(id) {
  return SetStatus('Approve', id);
}
async function Reject(id) {
  return SetStatus('Reject', id);
}
async function SetStatus(status, id) {
  try {
    const url = `${API_BASE_URL}/${status}/${id}`;
    const res = await authenticatedFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function printPSR_byId(requestId) {
  console.log(requestId);
  if (!requestId) return { data: null, error: 'Missing id' };
  try {
    const url = `${API_BASE_URL}/pdf/${requestId}`;
    const res = await authenticatedFetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    handleOpenPdf(res);
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export {
  GetAll,
  GetRequestsByStatus,
  GetRequestsBySupplier,
  Get,
  Create,
  Update,
  SetStatus,
  SubmitForApproval,
  Approve,
  Reject,
  printPSR_byId,
};

export default {
  GetAll,
  GetRequestsByStatus,
  GetRequestsBySupplier,
  Get,
  Create,
  Update,
  SetStatus,
  SubmitForApproval,
  Approve,
  Reject,
  printPSR_byId,
};
