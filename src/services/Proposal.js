const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Proposal";

export const INITIAL_PROPOSAL = {
    id: 0,
    name: '',
    code: '',
    customerCode: '',
    customerName: '',
    contactNumber: '',
    address: '',
    contactPerson: '',
    email: '',
    location: '',
    forecastedStartDate: null,
    forecastedEndDate: null,
    expirationDate: null,
    customerReferenceNumber: '',
    margin: 0,
    laborPercentage: 0,
    inquiryId: null,
    description: '',
    proposalTotal: 0,
    laborCostTotal: 0,
    materialCostTotal: 0,
    miscellaneousTitle: '',
    miscellaneousDescription: '',
    scopeOfWorkDescription: '',
    warrantyDescription: '',
    modeOfPaymentDescription: '',
    workDurationDescription: '',
    attachmentUrl: '',
    children: [],
    deletedChildren: [],
};

async function getProposals() {
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

async function getProposalById(id) {
    if (!id) return { data: null, error: 'Missing id' };
    try {
        const url = `${API_BASE_URL}/ByProposalId/${id}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { Accept: '*/*' },
        });
        const json = await res.json();
        return { data: json && json.value ? json.value : json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function getProposalPDFById(id) {
    if (!id) return { data: null, error: 'Missing id' };
    try {
        const url = `${API_BASE_URL}/pdf/${id}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { Accept: '*/*' },
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


async function createProposal(payload) {
    try {
        const res = await fetch(`${API_BASE_URL}/Create`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payload),
        });

        const json = await res.json();
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function updateProposal(id, payload) {
    try {
        const url = `${API_BASE_URL}/Update/${id}`;
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

async function submitProposal(id) {
    try {
        const url = `${API_BASE_URL}/Submit/${id}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function approveProposal(id) {
    try {
        const url = `${API_BASE_URL}/Approve/${id}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function rejectProposal(id) {
    try {
        const url = `${API_BASE_URL}/Reject/${id}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function winProposal(id) {
    try {
        const url = `${API_BASE_URL}/Win/${id}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

async function loseProposal(id) {
    try {
        const url = `${API_BASE_URL}/Lose/${id}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}
export { 
    getProposals, 
    getProposalById, 
    createProposal, 
    updateProposal, 
    submitProposal, 
    approveProposal, 
    rejectProposal,
    getProposalPDFById,
    winProposal,
    loseProposal
};

export default { 
    getProposals, 
    getProposalById, 
    createProposal, 
    updateProposal, 
    submitProposal, 
    approveProposal, 
    rejectProposal,
    getProposalPDFById,
    winProposal,
    loseProposal
};
