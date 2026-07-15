import { handleOpenPdf } from "./Helper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Barcode";

function unwrapResponse(json) {
  return json && json.value !== undefined ? json.value : json;
}

function parseFilenameFromDisposition(contentDisposition) {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] || null;
}

function triggerBlobDownload(blob, filename) {
  const fileUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = filename || 'barcodes.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
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

async function getBarcodes() {
  try {
    const res = await fetch(API_BASE_URL, {
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

async function printBarcodes(selectedBarcodes = []) {
  try {
    const ids = Array.isArray(selectedBarcodes)
      ? selectedBarcodes.map((item) => item?.id).filter((id) => id !== undefined && id !== null)
      : [];

    if (ids.length === 0) {
      return {
        data: null,
        error: 'No barcode IDs selected for printing.',
      };
    }

    // const params = new URLSearchParams();
    // ids.forEach((id) => params.append('ids', String(id)));

    const endpoint = `${API_BASE_URL}/PrintBarcodes`;
    const getOptions = {
      method: "POST",
      headers: {
        Accept: "application/pdf, application/json, */*",
      },
      body: JSON.stringify(ids),
    };
    let res = await fetch(endpoint, getOptions);

    if (!res.ok && res.status === 415) {
      res = await fetch(endpoint, {
        ...getOptions,
        headers: {
          ...getOptions.headers,
          "Content-Type": "application/json",
        },
      });
    }
    handleOpenPdf(res);

    if (!res.ok) {
      const errorText = await res.text();
      if (
        res.status === 400 &&
        errorText.includes('A non-empty request body is required') &&
        errorText.includes('ids field is required')
      ) {
        throw new Error(
          'API requires GET request body with ids, which browsers do not support. Backend should allow POST with body or GET query binding for ids.'
        );
      }
      throw new Error(errorText || `Barcode print failed with status ${res.status}`);
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isJson = contentType.includes('application/json') || contentType.includes('text/json');

    if (isJson) {
      const json = await res.json();

      return {
        data: unwrapResponse(json),
        error: null,
      };
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get('content-disposition');
    const filename = parseFilenameFromDisposition(contentDisposition) || 'barcodes.pdf';
    triggerBlobDownload(blob, filename);

    return {
      data: {
        downloaded: true,
        fileName: filename,
        selectionApplied: true,
      },
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
  getBarcodes,
  printBarcodes,
  unwrapResponse,
};

export default BarcodeService;