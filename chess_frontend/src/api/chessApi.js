/**
 * Backend base URL.
 *
 * Prefer REACT_APP_API_BASE, then REACT_APP_BACKEND_URL, falling back to localhost for dev.
 * This keeps the frontend portable across environments while matching the required local setup.
 */
const RAW_BASE_URL = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

/**
 * Parse backend error response into a readable message.
 * Backend may return:
 * - { detail: "..." } for HTTPException
 * - { detail: [ { msg, ... } ] } for FastAPI validation errors
 */
function parseErrorPayload(payload) {
  if (!payload) return null;

  if (typeof payload === 'string') return payload;

  const detail = payload.detail;
  if (!detail) return null;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    // FastAPI validation error list
    const msgs = detail
      .map((d) => d?.msg)
      .filter(Boolean);
    if (msgs.length > 0) return msgs.join('; ');
  }

  return null;
}

async function request(path, { method = 'GET', body } = {}) {
  const resp = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = resp.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await resp.json().catch(() => null) : await resp.text().catch(() => null);

  if (!resp.ok) {
    const message = parseErrorPayload(payload) || `Request failed with status ${resp.status}`;
    const err = new Error(message);
    err.status = resp.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

// PUBLIC_INTERFACE
export async function getState() {
  /** Fetch current board state and current turn. */
  return request('/state');
}

// PUBLIC_INTERFACE
export async function getHistory() {
  /** Fetch chronological move history. */
  return request('/history');
}

// PUBLIC_INTERFACE
export async function postMove(move) {
  /** Submit a move: {from: "e2", to: "e4", promotion?: "q"}. */
  return request('/move', { method: 'POST', body: move });
}

// PUBLIC_INTERFACE
export async function restartGame() {
  /** Restart the game to initial position. */
  return request('/restart', { method: 'POST' });
}
