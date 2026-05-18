import type { ServerResponse } from "node:http";

export function setCorsHeaders(response: ServerResponse) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-business-id");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
}
