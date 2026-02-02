/**
 * Client-side API helper functions for making authenticated requests
 * All functions ensure cookies are sent with same-origin requests
 */

/**
 * Make a GET request to an API endpoint
 *
 * @param path - API endpoint path (e.g., '/api/workouts')
 * @param init - Optional fetch init options
 * @returns Parsed JSON response
 * @throws Error if response is not ok
 */
export async function apiGet<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...init,
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Make a POST request to an API endpoint
 *
 * @param path - API endpoint path
 * @param body - Request body (will be JSON stringified)
 * @param init - Optional fetch init options
 * @returns Parsed JSON response
 * @throws Error if response is not ok
 */
export async function apiPost<T>(
  path: string,
  body: any,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    body: JSON.stringify(body),
    ...init,
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Make a PATCH request to an API endpoint
 *
 * @param path - API endpoint path
 * @param body - Request body (will be JSON stringified)
 * @param init - Optional fetch init options
 * @returns Parsed JSON response
 * @throws Error if response is not ok
 */
export async function apiPatch<T>(
  path: string,
  body: any,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    body: JSON.stringify(body),
    ...init,
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Make a PUT request to an API endpoint
 *
 * @param path - API endpoint path
 * @param body - Request body (will be JSON stringified)
 * @param init - Optional fetch init options
 * @returns Parsed JSON response
 * @throws Error if response is not ok
 */
export async function apiPut<T>(
  path: string,
  body: any,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    body: JSON.stringify(body),
    ...init,
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Make a DELETE request to an API endpoint
 *
 * @param path - API endpoint path
 * @param init - Optional fetch init options
 * @returns Parsed JSON response
 * @throws Error if response is not ok
 */
export async function apiDelete<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    method: 'DELETE',
    credentials: 'same-origin',
    ...init,
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return res.json();
}
