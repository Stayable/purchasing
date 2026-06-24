import axios from "axios";
const http = axios.create({ withCredentials: true });

export function buildAwardBody({ itemId, action, quoteId, note }) {
  const body = { itemId, action, note };
  if (action !== "decline" && quoteId) body.quoteId = quoteId;
  return body;
}
export const __http = http;   // exported for tests
export async function getProcurement() { return (await http.get("/api/procurement")).data; }
export async function getCommunications(itemId) {
  const params = itemId ? { itemId } : {};
  return (await http.get("/api/communications", { params })).data;
}
export async function getMessageBody(messageId, mailbox) {
  return (await http.get("/api/communications", { params: { messageId, mailbox } })).data;
}
export async function postAward(args) { return (await http.post("/api/award", buildAwardBody(args))).data; }
export async function login(email, password) { return (await http.post("/api/auth/login", { email, password })).data; }
export async function logout() { return (await http.post("/api/auth/logout")).data; }
