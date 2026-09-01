import { authenticatedFetch } from './Auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Customer";

export const INITIAL_CUSTOMER = {
    name: '',
    code: '',
    customerName: '',
    contactNumber: '',
    address: '',
    companyName: '',
    email: '',
    vatType: '',
};

async function getCustomers() {
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

async function createCustomer(payload) {
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

async function updateCustomer(id, payload) {
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

export { getCustomers, createCustomer, updateCustomer };
export default { getCustomers, createCustomer, updateCustomer };
