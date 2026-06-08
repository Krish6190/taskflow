/**
 * API client
 *
 * SECURITY RULES enforced here:
 * 1. Never log request bodies, tokens, or response data to the console.
 * 2. On error, log only the error *type/code* — never the server response body.
 * 3. JWT is read from localStorage but never printed anywhere.
 * 4. All errors thrown are sanitized before reaching console.error.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function getToken() {
  try {
    return localStorage.getItem('tf_token');
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    localStorage.setItem('tf_token', token);
  } catch {
    // Storage unavailable — silently ignore
  }
}

function clearToken() {
  try {
    localStorage.removeItem('tf_token');
  } catch {
    // ignore
  }
}

/**
 * Core fetch wrapper.
 * Throws a plain Error with a user-safe message on failure.
 * Never logs response data or tokens.
 */
async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
  } catch (networkErr) {
    // Network failure — log only the type, not any data
    console.error(`[api] Network error on ${method} ${path}:`, networkErr.constructor.name);
    throw new Error('Network error. Please check your connection.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
    console.error(`[api] Non-JSON response: ${response.status} on ${method} ${path}`);
    throw new Error(`Server error (${response.status})`);
  }

  if (!response.ok) {
    // Log only the status code — never the body (may contain user data)
    console.error(`[api] ${response.status} on ${method} ${path}`);

    if (response.status === 401) {
      clearToken();
      // Trigger re-auth via event rather than leaking info
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    // Throw a user-safe message from the server, or a generic fallback
    const msg = data?.message || `Request failed (${response.status})`;
    const err = new Error(msg);
    err.status = response.status;
    err.validationErrors = data?.errors || null;
    throw err;
  }

  return data;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function register(name, email, password) {
  const data = await request('POST', '/auth/register', { name, email, password }, false);
  if (data.data?.token) setToken(data.data.token);
  return data;
}

export async function login(email, password) {
  const data = await request('POST', '/auth/login', { email, password }, false);
  if (data.data?.token) setToken(data.data.token);
  return data;
}

export async function getMe() {
  return request('GET', '/auth/me');
}

export function logout() {
  clearToken();
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

export async function fetchTasks(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return request('GET', `/tasks${qs ? `?${qs}` : ''}`);
}

export async function fetchTask(id) {
  return request('GET', `/tasks/${id}`);
}

export async function createTask(payload) {
  return request('POST', '/tasks', payload);
}

export async function updateTask(id, payload) {
  return request('PATCH', `/tasks/${id}`, payload);
}

export async function deleteTask(id) {
  return request('DELETE', `/tasks/${id}`);
}

// ─── Admin: Users ────────────────────────────────────────────────────────────

export async function fetchUsers() {
  return request('GET', '/users');
}

export async function updateUserRole(id, role) {
  return request('PATCH', `/users/${id}/role`, { role });
}

export async function deactivateUser(id) {
  return request('PATCH', `/users/${id}/deactivate`);
}
