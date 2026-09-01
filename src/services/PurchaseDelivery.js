import { authenticatedFetch } from './Auth';
import { handleOpenPdf } from "./Helper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/PurchaseDelivery";

 export  const InitialData = {
        "name": "",
        "code": "",
        "children": [
        ],
        "deletedChildren": [
        ],
        "deliveryDate": new Date(),
        "supplierId": 0,
        "code": "",
        "name": "",
        "receivedBy": "",
        "supplierDRNumber": "",
        "status": "",
        "orderId": 0,
        "orderNumber": "",
        "requestNumber":"",
    };

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

async function GetDRsByStatus(status) {
    try {
        const res = await authenticatedFetch(API_BASE_URL + "/status/" + status, {
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
        console.log(json)
        return { data: json && json.value ? json.value : {} , error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function Create(payload) {
    try {
        const requestBody = JSON.stringify(payload);
        console.log('PurchaseDelivery Create payload:', requestBody);
        const res = await authenticatedFetch(`${API_BASE_URL}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: requestBody,
        });
        console.log(res)
        const json = await res.json();
                console.log(json)
        return { data: json, error: null };
    } catch (error) {
        console.log(error)
        return { data: null, error: error?.message || error };
    }
}



async function Update(id, payload) {
    try {
        const url = `${API_BASE_URL}/${id}`;
        const requestBody = JSON.stringify(payload);
        console.log('PurchaseDelivery Update payload:', requestBody);
        const res = await authenticatedFetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
        });
        const json = await res.json();
        console.log(json)
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}
async function SubmitForApproval(id) {
    return SetStatus('Submit',id)
}

async function ConfirmDelivery(id) {
    return SetStatus('Deliver',id)
}

async function Approve(id) {
    return SetStatus('Approve',id)
}
async function Reject(id) {
    return SetStatus('Reject',id)
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

async function printDelivery_byId(projectId) {
    console.log(projectId);
  if (!projectId) return { data: null, error: 'Missing id' };
  try {
    const url = `${API_BASE_URL}/pdf/${projectId}`;
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
    GetDRsByStatus,
    Get,
    Create,
    Update,
    SetStatus,
    SubmitForApproval,
    ConfirmDelivery,
    Approve,
    Reject,
    printDelivery_byId,
}

export default{
    GetAll,
    GetDRsByStatus,
    Get,
    Create,
    Update,
    SetStatus,
    SubmitForApproval,
    ConfirmDelivery,
    Approve,
    Reject,
    printDelivery_byId,
}
