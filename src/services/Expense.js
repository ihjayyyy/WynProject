const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Expenses";

export const INITIAL_EXPENSE = {
  name: '',
  code: '',
  projectId: 0,
  scopeId: 0,
  amount: 0,
  referenceNumber: 0,
  description: '',
  desciption: '',
};

async function parseResponse(res) {
  try {
    const json = await res.json();
    return json && json.value ? json.value : json;
  } catch {
    return null;
  }
}

async function getExpensesByProjectId(projectId) {
  if (!projectId) return { data: null, error: 'Missing projectId' };

  try {
    const data = await parseResponse(
      await fetch(`${API_BASE_URL}/ByProjectId/${projectId}`, {
        method: 'GET',
        headers: { Accept: '*/*' },
      })
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function createExpense(payload) {
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

async function updateExpense(id, payload) {
  if (!id) return { data: null, error: 'Missing id' };

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

export { getExpensesByProjectId, createExpense, updateExpense };

const ExpenseService = {
  getExpensesByProjectId,
  createExpense,
  updateExpense,
  INITIAL_EXPENSE,
};

export default ExpenseService;
