import { authenticatedFetch } from './Auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Dashboard";

async function parseResponse(res) {
  try {
    const json = await res.json();
    return json && json.value ? json.value : json;
  } catch {
    return null;
  }
}

async function getModulesByUser(userId) {
  if (!userId) return { data: null, error: "Missing userId" };

  try {
    const data = await parseResponse(
      await authenticatedFetch(`${API_BASE_URL}/Module/byUser/${userId}`, {
        method: "GET",
        headers: { Accept: "*/*" },
      })
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getSummaryByModule(moduleName) {
  if (!moduleName) return { data: null, error: "Missing moduleName" };

  try {
    const data = await parseResponse(
      await authenticatedFetch(`${API_BASE_URL}/Summary/byModule/${moduleName}`, {
        method: "GET",
        headers: { Accept: "*/*" },
      })
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getForApprovalByModule(moduleName) {
  if (!moduleName) return { data: null, error: "Missing moduleName" };

  try {
    const data = await parseResponse(
      await authenticatedFetch(`${API_BASE_URL}/ForApproval/byModule/${moduleName}`, {
        method: "GET",
        headers: { Accept: "*/*" },
      })
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function getNeedsAttentionByModule(moduleName) {
  if (!moduleName) return { data: null, error: "Missing moduleName" };

  try {
    const data = await parseResponse(
      await authenticatedFetch(`${API_BASE_URL}/NeedsAttention/byModule/${moduleName}`, {
        method: "GET",
        headers: { Accept: "*/*" },
      })
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

const DashboardService = {
  getModulesByUser,
  getSummaryByModule,
  getForApprovalByModule,
  getNeedsAttentionByModule,
};

export default DashboardService;

export {
  getModulesByUser,
  getSummaryByModule,
  getForApprovalByModule,
  getNeedsAttentionByModule,
};