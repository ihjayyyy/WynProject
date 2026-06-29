const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/ProjectBOM";

async function parseResponse(res) {
  try {
    const json = await res.json();
    return json && json.value ? json.value : json;
  } catch {
    return null;
  }
}

async function getProjectBOMByProjectId(projectId) {
  if (!projectId) return { data: null, error: 'Missing projectId' };

  try {
    const data = await parseResponse(
      await fetch(`${API_BASE_URL}/ByProjectId/${projectId}`, {
        method: 'GET',
        headers: { Accept: '*/*' },
      })
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export { getProjectBOMByProjectId };

const ProjectBOMService = {
  getProjectBOMByProjectId,
};

export default ProjectBOMService;