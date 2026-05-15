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
    const res = await fetch(API_BASE_URL, {
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
    const res = await fetch(API_BASE_URL, {
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

    const res = await fetch(url, {
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

    const res = await fetch(url, {
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

async function getDocumentPDFById(projectId) {
    console.log(projectId);
  if (!projectId) return { data: null, error: 'Missing id' };
  try {
    const url = `${API_BASE_URL}/pdf/${projectId}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    handleOpenPdf(res);
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export {
  getInquiries,
  createInquiry,
  updateInquiry,
  acknowledgeInquiry,
  getDocumentPDFById,
};

export default {
  getInquiries,
  createInquiry,
  updateInquiry,
  acknowledgeInquiry,
  getDocumentPDFById,
};