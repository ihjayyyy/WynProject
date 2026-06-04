const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Report";

async function parseResponse(res) {
  try {
    const json = await res.json();
    return json && json.value ? json.value : json;
  } catch {
    return null;
  }
}

async function getReports({
  modules = "all",
  dateFrom,
  dateTo,
  status,
  supplierId,
  rackId,
} = {}) {
  try {
    const params = new URLSearchParams();

    if (modules) params.append("modules", modules);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    if (status) params.append("status", status);
    if (supplierId) params.append("supplierId", supplierId);
    if (rackId) params.append("rackId", rackId);

    const url = `${API_BASE_URL}/modules?${params.toString()}`;

    const data = await parseResponse(
      await fetch(url, {
        method: "GET",
        headers: {
          Accept: "*/*",
        },
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

export { getReports };

const ReportService = {
  getReports,
};

export default ReportService;