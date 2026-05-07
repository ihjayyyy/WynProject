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
    return { data: json && json.value ? json.value : {}, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/SalesBilling";

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
    return { data: null, error: error?.message || error };
  }
}

async function getSalesBillingPDFById(id) {
  if (!id) return { data: null, error: 'Missing id' };
  try {
    const url = `${API_BASE_URL}/pdf/${id}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    handleOpenPdf(res);
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

  const handleOpenPdf = async (data) => {
    try {
              var blob = await data.blob();
              console.log(blob)
       const fileType = blob.type;
       console.log(data)
      if (!fileType || !fileType.includes("pdf")) {
        throw new Error("The file received is not a PDF.");
      }
      // Create a Blob URL

      const fileURL = URL.createObjectURL(blob, { type: fileType });

      // Open PDF in a new browser tab
      window.open(fileURL, "_blank", "noopener,noreferrer");

      // Optional: Revoke the object URL after some time to free memory
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch (error) {
      console.error("Error fetching PDF:", error);
      alert("Failed to load PDF. Please try again.");
    }
  }

// PUT /api/SalesBilling/MarkAsBilled/{salesBillingId} - mark a sales billing as billed
async function markAsBilled(salesBillingId) {
  if (!salesBillingId) return { data: null, error: 'Missing salesBillingId' };
  try {
    const url = `${API_BASE_URL}/MarkAsBilled/${salesBillingId}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      return { data: null, error: `Failed to mark as billed: ${res.status}` };
    }
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
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
    return { data: null, error: error?.message || error };
  }
}

// GET /api/SalesBilling - fetch all sales billing records
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
    return { data: null, error: error?.message || error };
  }
}

// GET /api/SalesBilling/ByProjectId/{projectId} - fetch sales billings by project ID
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
    return { data: null, error: error?.message || error };
  }
}

// GET /api/SalesBilling/BilledByCustomerId/{customerId} - fetch sales billings by customer ID
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
    return { data: null, error: error?.message || error };
  }
}



const SalesBillingService = {
  createSalesBilling,
  getSalesBilling,
  getSalesBillingById,
  getSalesBillingByProjectId,
  editSalesBilling,
  markAsBilled,
  getSalesBillingByCustomerId,
  getSalesBillingPDFById,
  INITIAL_SALES_BILLING,
};

export default SalesBillingService;
