import axios from "axios";
const http = axios.create({ withCredentials: true });

export function buildAwardBody({ itemId, action, quoteId, note }) {
  const body = { itemId, action, note };
  if (action !== "decline" && quoteId) body.quoteId = quoteId;
  return body;
}
export async function getProcurement() { return (await http.get("/api/procurement")).data; }
export async function postAward(args) { return (await http.post("/api/award", buildAwardBody(args))).data; }
export async function login(email, password) { return (await http.post("/api/auth/login", { email, password })).data; }
export async function logout() { return (await http.post("/api/auth/logout")).data; }
