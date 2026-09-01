import { authenticatedFetch } from './Auth';
import { handleOpenPdf } from "./Helper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Inquiry";

export const INITIAL_INQUIRY = {
  name: '',
  code: '',
  companyName: '',
  contactNumber: '',
  address: '',
  contactPerson: '',
  email: '',
  attention: '',
  preparedBy: '',
  notedBy: '',
  reference: '',
  date: '',
  details: '',
};

async function getInquiries() {
  try {
    const res = await authenticatedFetch(API_BASE_URL, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });

    const json = await res.json();
    return { data: json && json.value ? json.value : json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function createInquiry(payload) {
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

async function updateInquiry(id, payload) {
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

async function acknowledgeInquiry(inquiryId) {
  try {
    const url = `${API_BASE_URL}/Acknowledge/${inquiryId}`;

    const res = await authenticatedFetch(url, {
      method: 'PUT',
      headers: {
        Accept: '*/*',
      },
    });

    let json = null;

    try {
      json = await res.json();
    } catch {
      json = null;
    }

    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function cancelInquiry(inquiryId) {
  try {
    const url = `${API_BASE_URL}/Cancel/${inquiryId}`;

    const res = await authenticatedFetch(url, {
      method: 'PUT',
      headers: {
        Accept: '*/*',
      },
    });

    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function closeInquiry(inquiryId) {
  try {
    const url = `${API_BASE_URL}/Close/${inquiryId}`;

    const res = await authenticatedFetch(url, {
      method: 'PUT',
      headers: {
        Accept: '*/*',
      },
    });

    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function printInquirySlip_byId(id) {
  if (!id) return { data: null, error: 'Missing id' };

  try {
    const url = `${API_BASE_URL}/pdf/${id}`;

    const res = await authenticatedFetch(url, {
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
export {
  getInquiries,
  createInquiry,
  updateInquiry,
  acknowledgeInquiry,
  cancelInquiry,
  closeInquiry,
  printInquirySlip_byId,
};

const InquiryService = {
  getInquiries,
  createInquiry,
  updateInquiry,
  acknowledgeInquiry,
  cancelInquiry,
  closeInquiry,
  printInquirySlip_byId,
};

export default InquiryService;