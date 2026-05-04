const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/ProjectStaff";

export const INITIAL_PROJECT_STAFF = {
  name: '',
  code: '',
  projectId: 0,
  scopeId: 0,
  staffId: 0,
  job: '',
  expenses: 0,
};

async function getProjectStaffs() {
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

async function getProjectStaffsByProjectId(projectId) {
  try {
    const url = `${API_BASE_URL}/ByProjectId/${projectId}`;
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

async function createProjectStaff(payload) {
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

async function updateProjectStaff(id, payload) {
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

async function deleteProjectStaff(id) {
  try {
    const url = `${API_BASE_URL}/${id}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Accept: '*/*' },
    });
    const json = await res.json();
    return { data: json, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export { getProjectStaffs, getProjectStaffsByProjectId, createProjectStaff, updateProjectStaff, deleteProjectStaff };
const ProjectStaffService = { getProjectStaffs, getProjectStaffsByProjectId, createProjectStaff, updateProjectStaff, deleteProjectStaff, INITIAL_PROJECT_STAFF };

export default ProjectStaffService;
