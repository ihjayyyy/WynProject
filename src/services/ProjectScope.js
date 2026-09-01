import { authenticatedFetch } from './Auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/ProjectScope";

async function getByProjectId(projectId) {
    try {
        const url = `${API_BASE_URL}/ByProjectId/${projectId}`;
        const res = await authenticatedFetch(url, {
            method: 'GET',
            headers: { Accept: '*/*' },
        });
        const json = await res.json();
        return { data: json && json.value ? json.value : json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function createProjectScope(payload) {
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

async function updateProjectScope(id, payload) {
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

export { getByProjectId, createProjectScope, updateProjectScope };
export default { getByProjectId, createProjectScope, updateProjectScope };
