import { handleOpenPdf } from "./Helper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/SalesBilling";

// GET /api/SalesBilling/{id} - fetch a single sales billing record by ID
async function getSalesBillingById(id) {
  if (!id) return { data: null, error: 'Missing id' };

  try {
    const url = `${API_BASE_URL}/${id}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await res.json();

    return {
      data: json && json.value ? json.value : {},
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

export const INITIAL_SALES_BILLING = {
  name: '',
  code: '',
  children: [],
  deletedChildren: [],
  projectId: 0,
  billingDate: '',
  dueDate: '',
  paymentDate: '',
  balance: 0,
  customerName: '',
  customerNumber: '',
  contactPerson: '',
  description: '',
  amount: 0,
  projectContractAmount: 0,
  status: '',
};

async function parseResponse(res) {
  try {
    const json = await res.json();
    return json && json.value ? json.value : json;
  } catch {
    return null;
  }
}

// PUT /api/SalesBilling/{id} - edit a sales billing record by ID
async function editSalesBilling(id, payload) {
  try {
    const data = await parseResponse(
      await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

async function printSalesBilling_byId(id) {
  if (!id) return { data: null, error: 'Missing id' };

  try {
    const url = `${API_BASE_URL}/pdf/${id}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });

    handleOpenPdf(res);
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

// PUT /api/SalesBilling/MarkAsBilled/{salesBillingId}
async function markAsBilled(salesBillingId) {
  if (!salesBillingId) {
    return { data: null, error: 'Missing salesBillingId' };
  }

  try {
    const url = `${API_BASE_URL}/MarkAsBilled/${salesBillingId}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return {
        data: null,
        error: `Failed to mark as billed: ${res.status}`,
      };
    }

    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

// PUT /api/SalesBilling/{salesBillingId}/cancel
async function cancelSalesBilling(salesBillingId) {
  if (!salesBillingId) {
    return { data: null, error: 'Missing salesBillingId' };
  }

  try {
    const url = `${API_BASE_URL}/${salesBillingId}/cancel`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return {
        data: null,
        error: `Failed to cancel sales billing: ${res.status}`,
      };
    }

    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

// PUT /api/SalesBilling/{salesBillingId}/close
async function closeSalesBilling(salesBillingId) {
  if (!salesBillingId) {
    return { data: null, error: 'Missing salesBillingId' };
  }

  try {
    const url = `${API_BASE_URL}/${salesBillingId}/close`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return {
        data: null,
        error: `Failed to close sales billing: ${res.status}`,
      };
    }

    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

async function createSalesBilling(payload) {
  try {
    const data = await parseResponse(
      await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

// GET /api/SalesBilling
async function getSalesBilling() {
  try {
    const data = await parseResponse(
      await fetch(API_BASE_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

// GET /api/SalesBilling/ByProjectId/{projectId}
async function getSalesBillingByProjectId(projectId) {
  if (!projectId) return { data: null, error: 'Missing projectId' };

  try {
    const data = await parseResponse(
      await fetch(`${API_BASE_URL}/ByProjectId/${projectId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

// GET /api/SalesBilling/BilledByCustomerId/{customerId}
async function getSalesBillingByCustomerId(customerId) {
  if (!customerId) return { data: null, error: 'Missing customerId' };

  try {
    const data = await parseResponse(
      await fetch(`${API_BASE_URL}/BilledByCustomerId/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

const SalesBillingService = {
  createSalesBilling,
  getSalesBilling,
  getSalesBillingById,
  getSalesBillingByProjectId,
  editSalesBilling,
  markAsBilled,
  cancelSalesBilling,
  closeSalesBilling,
  getSalesBillingByCustomerId,
  printSalesBilling_byId,
  INITIAL_SALES_BILLING,
};

export default SalesBillingService;