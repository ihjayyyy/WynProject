const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/PurchaseOrder";

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
        "orderNumber": "",
        "requestNumber":"",
    };

async function GetAll() {
    try {
        const res = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: { Accept: '*/*' },
        });
        const json = await res.json();
        return { data: json && json.value, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function GetOrdersByStatus(status) {
    try {
        const res = await fetch(API_BASE_URL + "/status/" + status, {
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
        const res = await fetch(url, {
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
         console.log(payload)
        const res = await fetch(`${API_BASE_URL}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payload),
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
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
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

async function Approve(id) {
    return SetStatus('Approve',id)
}
async function Reject(id) {
    return SetStatus('Reject',id)
}
async function SetStatus(status, id) {
    try {
        const url = `${API_BASE_URL}/${status}/${id}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}
export {
    GetAll,
    GetOrdersByStatus,
    Get,
    Create,
    Update,
    SetStatus,
    SubmitForApproval,
    Approve,
    Reject,
}

export default{
    GetAll,
    GetOrdersByStatus,
    Get,
    Create,
    Update,
    SetStatus,
    SubmitForApproval,
    Approve,
    Reject
}
