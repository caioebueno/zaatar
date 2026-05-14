import type { IncomingMessage, ServerResponse } from "node:http";
import { setCorsHeaders } from "./cors.js";

export function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  setCorsHeaders(response);
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(payload));
}

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;

      if (rawBody.length > 1_000_000) {
        reject(new Error("PAYLOAD_TOO_LARGE"));
      }
    });

    request.on("end", () => {
      if (!rawBody.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });

    request.on("error", reject);
  });
}

export async function readRawBody(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;

    request.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalSize += buffer.length;

      if (totalSize > 10_000_000) {
        reject(new Error("PAYLOAD_TOO_LARGE"));
        return;
      }

      chunks.push(buffer);
    });

    request.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    request.on("error", reject);
  });
}

export async function readFormDataBody(
  request: IncomingMessage,
  contentType: string | undefined,
): Promise<FormData> {
  const rawBody = await readRawBody(request);
  const normalizedContentType = contentType?.trim() || "";

  if (!normalizedContentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new Error("INVALID_FORM_DATA");
  }

  const parsedRequest = new Request("http://localhost/upload", {
    method: "POST",
    headers: {
      "content-type": normalizedContentType,
    },
    body: new Uint8Array(rawBody),
  });

  try {
    return await parsedRequest.formData();
  } catch {
    throw new Error("INVALID_FORM_DATA");
  }
}
