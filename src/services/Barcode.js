const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Barcode";

function unwrapResponse(json) {
  return json && json.value !== undefined ? json.value : json;
}

async function getByBarcodeWithMaterial(barcode) {
  try {
    const url = `${API_BASE_URL}/ByBarcodeWithMaterial/${encodeURIComponent(barcode)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    });

    const json = await res.json();

    return {
      data: unwrapResponse(json),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error?.message || error,
    };
  }
}

const BarcodeService = {
  getByBarcodeWithMaterial,
  unwrapResponse,
};

export default BarcodeService;