const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/PurchaseInvoice';

export const InitialData = {
  name: '',
  code: '',
  children: [],
  deletedChildren: [],
  invoiceDate: null,
  dueDate: null,
  terms: 0,
  supplierId: 0,
  supplierName: '',
  contactNumber: '',
  address: '',
  contactPerson: '',
  email: '',
  amount: 0,
  vatType: '',
  vat: 0,
  invoiceNumber: '',
  supplierInvoiceNumber: '',
  purchaseOrderNumber: '',
  deliveryNumber: '',
  status: 'Draft',
  paymentStatus: 'Unpaid',
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

async function GetInvoiceByStatus(status) {
  try {
    const res = await fetch(API_BASE_URL + '/status/' + status, {
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
    console.log(json);
    return { data: json && json.value ? json.value : {}, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function Create(payload) {
  try {
    console.log(payload);
    const res = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log(res);
    const json = await res.json();
    console.log(json);
    return { data: json, error: null };
  } catch (error) {
    console.log(error);
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
    console.log(json);
    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function GetInvoicedBySupplier(supplierId) {
  if (!supplierId && supplierId !== 0)
    return { data: null, error: 'Missing supplierId' };
  try {
    const url = `${API_BASE_URL}/InvoicedBySupplier/${supplierId}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json && json.value ? json.value : [], error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function SubmitForApproval(id) {
  return SetStatus('Submit', id);
}

async function ConfirmInvoice(id) {
  return SetStatus('Invoice', id);
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
  GetInvoiceByStatus,
  GetInvoicedBySupplier,
  Get,
  Create,
  Update,
  SetStatus,
  SubmitForApproval,
  ConfirmInvoice,
  Approve,
  Reject,
};

export default {
  GetAll,
  GetInvoiceByStatus,
  GetInvoicedBySupplier,
  Get,
  Create,
  Update,
  SetStatus,
  SubmitForApproval,
  ConfirmInvoice,
  Approve,
  Reject,
};
