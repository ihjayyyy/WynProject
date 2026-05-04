const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/ProjectFinance";

export const INITIAL_PROJECT_FINANCE = {
    name: '',
    code: '',
    projectId: 0,
    downPayment: 0,
    retentionFee: 0,
    recoupmentPercentage: 0,
    recoupmentBalance: 0,
    totalBilledAmount: 0,
    lastBillingDate: '',
    hasDownpayment:false,
    // projectCompletion removed as per backend update
};

async function getProjectFinances() {
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

async function getProjectFinanceByProjectId(id) {
    try {
        const url = `${API_BASE_URL}/ByProjectId/${id}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { Accept: '*/*' },
        });
        const json = await res.json();
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function createProjectFinance(payload) {
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

async function updateProjectFinance(id, payload) {
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

async function generateProgressBilling(projectId) {
    try {
        const url = `${API_BASE_URL}/GenerateProgressBilling/${projectId}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { Accept: '*/*' },
        });
        const json = await res.json();
        console.log(json)
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function generateDownpaymentBilling(projectId) {
    try {
        console.log('Generating downpayment billing for projectId:', projectId);
        const url = `${API_BASE_URL}/GenerateDownpaymentBilling/${projectId}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { Accept: '*/*' },
        });
        const json = await res.json();
        console.log(json)
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

export { getProjectFinances, getProjectFinanceByProjectId, createProjectFinance, updateProjectFinance, generateProgressBilling, generateDownpaymentBilling };
const ProjectFinanceService = { getProjectFinances, getProjectFinanceByProjectId, createProjectFinance, updateProjectFinance, generateProgressBilling, generateDownpaymentBilling };
export default ProjectFinanceService;