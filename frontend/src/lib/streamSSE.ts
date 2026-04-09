export async function* streamSSE<T = Record<string, unknown>>(
  response: Response
): AsyncGenerator<T> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part.split("\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            if (data === "[DONE]") return;
            try {
              yield JSON.parse(data) as T;
            } catch {
              // skip unparseable lines
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
