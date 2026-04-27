const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/ProjectMaterial";

/**
 * Update the completed quantity for a project material.
 * @param {number} materialId - The ID of the material to update.
 * @param {number} completedQuantity - The completed quantity to set.
 * @returns {Promise<{data: any, error: string|null}>}
 */
async function updateCompletedQuantity(materialId, completedQuantity) {
    try {
        const url = `${API_BASE_URL}/UpdateCompletedQuantity/${materialId}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completedQuantity }),
        });
        const json = await res.json();
        return { data: json, error: null };
    } catch (error) {
        return { data: null, error: error?.message || error };
    }
}

export { updateCompletedQuantity };
export default { updateCompletedQuantity };