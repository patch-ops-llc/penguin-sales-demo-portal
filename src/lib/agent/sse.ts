/** Reads a vendor's server-sent event stream as `{ event, data }` records. */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string | null; data: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const record = parseRecord(chunk);
        if (record) yield record;
        boundary = buffer.indexOf("\n\n");
      }
    }
    const last = parseRecord(buffer);
    if (last) yield last;
  } finally {
    reader.releaseLock();
  }
}

function parseRecord(chunk: string): { event: string | null; data: string } | null {
  let event: string | null = null;
  const data: string[] = [];
  for (const raw of chunk.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  if (data.length === 0) return null;
  return { event, data: data.join("\n") };
}

/** Formats one record for our own outgoing stream to the browser. */
export function sseRecord(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** Vendor error text is kept short and never allowed to carry anything that looks like a key. */
export function safeErrorText(text: string): string {
  return text
    .replace(/\b(sk|key|xai|oa)[-_][A-Za-z0-9_-]{12,}\b/g, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .slice(0, 240);
}
