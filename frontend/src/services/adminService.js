import api from "../utils/api";

export const fetchBuildings = () => api.get("/admin/buildings").then((r) => r.data);

export const createBuilding = (buildingName, blockId) =>
  api.post("/admin/buildings", { buildingName, blockId }).then((r) => r.data);

export const updateBuilding = (id, buildingName, blockId) =>
  api.put(`/admin/buildings/${id}`, { buildingName, blockId }).then((r) => r.data);

export const deleteBuilding = (id) =>
  api.delete(`/admin/buildings/${id}`).then((r) => r.data);

export const addFloor = (buildingId, floorLevel, totalSpaces) =>
  api.post(`/admin/buildings/${buildingId}/floors`, { floorLevel, totalSpaces }).then((r) => r.data);

export const deleteFloor = (buildingId, floorId) =>
  api.delete(`/admin/buildings/${buildingId}/floors/${floorId}`).then((r) => r.data);

export const fetchSpaces = (buildingName, floorLevel) =>
  api
    .get(`/admin/spaces?buildingName=${encodeURIComponent(buildingName)}&floorLevel=${encodeURIComponent(floorLevel)}`)
    .then((r) => r.data);

export const fetchBlocks = () => api.get("/blocks").then((r) => r.data);

export const createBlock = (payload) => api.post("/blocks", payload).then((r) => r.data);

export const deleteBlock = (id) => api.delete(`/blocks/${id}`).then((r) => r.data);

export const regenerateBlockQR = (id) =>
  api.post(`/blocks/${id}/regenerate-qr`).then((r) => r.data);

export const createBlockAdmin = (payload) =>
  api.post("/blocks/block-admins", payload).then((r) => r.data);
