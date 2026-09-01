import { authenticatedFetch } from './Auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Warehouse";

export const INITIAL_WAREHOUSE = {
	name: '',
	code: '',
	location: '',
};

function getResponseError(res, json) {
	if (res.ok) return null;
	return json?.message || json?.error || `Request failed with status ${res.status}`;
}

async function getWarehouses() {
	try {
		const res = await authenticatedFetch(API_BASE_URL, {
			method: 'GET',
			headers: { Accept: '*/*' },
		});
		const json = await res.json();
		const error = getResponseError(res, json);
		if (error) return { data: null, error };
		return { data: json && json.value ? json.value : json, error: null };
	} catch (error) {
		return { data: null, error: error?.message || error };
	}
}

async function createWarehouse(payload) {
	try {
		const res = await authenticatedFetch(API_BASE_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		const json = await res.json();
		const error = getResponseError(res, json);
		if (error) return { data: null, error };
		return { data: json, error: null };
	} catch (error) {
		return { data: null, error: error?.message || error };
	}
}

async function updateWarehouse(id, payload) {
	try {
		const url = `${API_BASE_URL}/${id}`;
		const res = await authenticatedFetch(url, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		const json = await res.json();
		const error = getResponseError(res, json);
		if (error) return { data: null, error };
		return { data: json, error: null };
	} catch (error) {
		return { data: null, error: error?.message || error };
	}
}

export { getWarehouses, createWarehouse, updateWarehouse };
const warehouseService = { getWarehouses, createWarehouse, updateWarehouse };

export default warehouseService;
