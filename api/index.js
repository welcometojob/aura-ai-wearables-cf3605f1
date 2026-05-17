import server from "../dist/server/server.js";

export const config = { runtime: "nodejs" };

export default async function handler(request) {
  return server.fetch(request);
}