import API from "./api";

export const fetchChildren = () =>
  API.get("/parent/children").then(r => r.data);

export const fetchChildDash = (id) =>
  API.get(`/parent/dashboard/${id}`).then(r => r.data);

export const linkChild = (childId) =>
  API.post("/parent/link", { childId }).then((r) => r.data);

export const updateControls = (childId, body) =>
  API.put(`/parent/controls/${childId}`, body).then((r) => r.data);