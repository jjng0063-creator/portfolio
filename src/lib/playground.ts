/** Local demonstration only. Never sends a request or stores the visitor's input. */
export function simulateRequest(text: string, response: Record<string, unknown>) {
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return { status: 200, body: response };
  } catch {
    return { status: 400, body: { error: 'Request body must be a valid JSON object.' } };
  }
}
