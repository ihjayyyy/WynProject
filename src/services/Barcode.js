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
      ? selectedBarcodes
          .map((item) => Number(item?.id))
          .filter((id) => Number.isInteger(id) && id > 0)
      : [];

    if (ids.length === 0) {
      return {
        data: null,
        error: 'No barcode IDs selected for printing.',
      };
    }

    const endpoint = `${API_BASE_URL}/PrintBarcodes`;
    const requestOptions = {
      method: "POST",
      headers: {
        Accept: "application/pdf, application/json, */*",
        "Content-Type": "application/json",
      },
    };

    // Prefer raw array for endpoints binding directly to Int32[], then fallback to named object.
    const payloadCandidates = [ids, { ids }];
    let res = null;

    for (const payload of payloadCandidates) {
      res = await fetch(endpoint, {
        ...requestOptions,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        break;
      }

      // If backend rejects media type or shape, try the fallback payload format.
      const errorText = await res.clone().text();
      const shouldTryFallback =
        res.status === 415 ||
        (res.status === 400 &&
          (errorText.includes('ids field is required') ||
            errorText.includes('could not be converted to System.Int32[]') ||
            errorText.includes('could not be converted to System.Int32')));

      if (!shouldTryFallback) {
        break;
      }
    }

    if (!res.ok) {
      const errorText = await res.text();
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

async function getBarcodeWithProject(barcode, projectId) {
  try {
    const url = `${API_BASE_URL}/GetBarcodeWithProject/${encodeURIComponent(barcode)}/${projectId}`;

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
  getBarcodeWithProject,
  getBarcodes,
  printBarcodes,
  unwrapResponse,
};

export default BarcodeService;