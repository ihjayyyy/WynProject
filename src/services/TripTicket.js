const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/TripTicket";

export const INITIAL_TRIP_TICKET = {
  name: '',
  code: '',
  projectId: 0,
  materialId: 0,
  tripMeter: 0,
  hoursUsed: 0,
  date: '',
  vehiclePlateNumber: '',
  gasSlipNumber: '',
  tripCost: 0,
};

async function parseResponse(res) {
  try {
    const json = await res.json();
    return json && json.value ? json.value : json;
  } catch {
    return null;
  }
}

async function getTripTicketByProjectId(projectId) {
  if (!projectId) return { data: null, error: 'Missing projectId' };

  try {
    const url = `${API_BASE_URL}/ByProjectId/${projectId}`;
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

async function createTripTicket(payload) {
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

async function updateTripTicket(id, payload) {
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

async function deleteTripTicket(id) {
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

export { getTripTicketByProjectId, createTripTicket, updateTripTicket, deleteTripTicket };

const TripTicketService = {
  getTripTicketByProjectId,
  createTripTicket,
  updateTripTicket,
  deleteTripTicket,
  INITIAL_TRIP_TICKET,
};

export default TripTicketService;
