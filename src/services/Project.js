const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Project";

async function convertProposal(proposalId) {
    try {
        const url = `${API_BASE_URL}/ConvertProposal/${proposalId}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { Accept: '*/*' },
        });

        // Try to parse JSON if any; fallback to null for empty responses
        let json = null;
        try {
            json = await res.json();
        } catch (e) {
            json = null;
        }

        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function getProjectById(id) {
    try {
        const url = `${API_BASE_URL}/${id}`;
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

async function getProjects() {
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

async function updateProject(id, payload) {
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

async function getCompletionPDFById(id) {
  if (!id) return { data: null, error: 'Missing id' };
  try {
    const url = `${API_BASE_URL}/pdf/${id}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    handleOpenPdf(res);
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}
  const handleOpenPdf = async (data) => {
    try {
              var blob = await data.blob();
              console.log(blob)
       const fileType = blob.type;
       console.log(data)
      if (!fileType || !fileType.includes("pdf")) {
        throw new Error("The file received is not a PDF.");
      }
      // Create a Blob URL

      const fileURL = URL.createObjectURL(blob, { type: fileType });

      // Open PDF in a new browser tab
      window.open(fileURL, "_blank", "noopener,noreferrer");

      // Optional: Revoke the object URL after some time to free memory
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch (error) {
      console.error("Error fetching PDF:", error);
      alert("Failed to load PDF. Please try again.");
    }
  }

export { convertProposal, getProjectById, getProjects, updateProject, getCompletionPDFById };
export default { convertProposal, getProjectById, getProjects, updateProject, getCompletionPDFById };
