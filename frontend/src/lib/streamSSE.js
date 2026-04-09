/**
 * Parse an SSE stream from a fetch Response into an async generator of events.
 */
export async function* streamSSE(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines
      const parts = buffer.split("\n\n");
      buffer = parts.pop(); // Keep incomplete last part in buffer

      for (const part of parts) {
        if (!part.trim()) continue;
        // Parse "event: message\ndata: {...}"
        const lines = part.split("\n");
        let data = null;
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            data = line.slice(6);
          }
        }
        if (data) {
          try {
            yield JSON.parse(data);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
