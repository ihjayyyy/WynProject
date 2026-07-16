import { handleOpenPdf } from "./Helper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Project";

async function convertProposal(proposalId) {
    try {
        const url = `${API_BASE_URL}/ConvertProposal/${proposalId}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { Accept: '*/*' },
        });

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

async function printCompletion_byId(id) {
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

async function startProject(projectId) {
    try {
        const url = `${API_BASE_URL}/${projectId}/start`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { Accept: '*/*' },
        });

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

async function completeProject(projectId) {
    try {
        const url = `${API_BASE_URL}/${projectId}/complete`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { Accept: '*/*' },
        });

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

// NEW METHODS

async function cancelProject(projectId) {
    try {
        const url = `${API_BASE_URL}/${projectId}/cancel`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { Accept: '*/*' },
        });

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

async function closeProject(projectId) {
    try {
        const url = `${API_BASE_URL}/${projectId}/close`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { Accept: '*/*' },
        });

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

async function getProjectsByStatus(status) {
    try {
        const url = `${API_BASE_URL}/ByStatus/${encodeURIComponent(status)}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { Accept: '*/*' },
        });

        const json = await res.json();
        return {
            data: json && json.value ? json.value : json,
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: error?.message || error,
        };
    }
}

export {
    convertProposal,
    getProjectById,
    getProjects,
    getProjectsByStatus,
    updateProject,
    printCompletion_byId,
    startProject,
    completeProject,
    cancelProject,
    closeProject,
};
