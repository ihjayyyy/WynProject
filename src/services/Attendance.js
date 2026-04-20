const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/Attendance";

export const INITIAL_ATTENDANCE = {
  name: '',
  code: '',
  staffId: 0,
  projectId: 0,
  date: '',
  clockIn: '',
  clockOut: '',
  hours: 0,
  totalCost: 0,
  overtimeApproved: false,
  overtimeHours: 0,
  deductLunchBreak: false,
};

async function parseResponse(res) {
  try {
    const json = await res.json();
    return json && json.value ? json.value : json;
  } catch {
    return null;
  }
}

async function getAttendanceByProjectId(projectId, startDate, endDate) {
  if (!projectId) return { data: null, error: 'Missing projectId' };

  try {
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString();
    const url = `${API_BASE_URL}/ByProjectId/${projectId}${query ? `?${query}` : ''}`;
    const data = await parseResponse(
      await fetch(url, {
        method: 'GET',
        headers: { Accept: '*/*' },
      })
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

async function createAttendance(payload) {
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

async function updateAttendance(id, payload) {
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

async function deleteAttendance(id) {
  if (!id) return { data: null, error: 'Missing id' };

  try {
    const data = await parseResponse(
      await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { Accept: '*/*' },
      })
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export { getAttendanceByProjectId, createAttendance, updateAttendance, deleteAttendance };

const AttendanceService = {
  getAttendanceByProjectId,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  INITIAL_ATTENDANCE,
};

export default AttendanceService;
