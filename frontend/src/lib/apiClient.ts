import { ApiError, ProblemDetails } from '../types/auth';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

function buildUrl(path: string): string {
  if (!apiBaseUrl) {
    return path;
  }

  return `${apiBaseUrl}${path}`;
}

async function parseApiError(response: Response): Promise<ApiError> {
  let problem: ProblemDetails | undefined;

  try {
    const body = (await response.json()) as ProblemDetails;
    problem = body;
  } catch {
    // Keep default message if no problem details were returned.
  }

  const message =
    problem?.detail ??
    problem?.title ??
    `Request failed with status ${response.status}.`;

  return {
    message,
    status: response.status,
    problem,
  };
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<TRequest, TResponse>(
  path: string,
  body: TRequest
): Promise<TResponse> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return {} as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export async function apiPostNoBody<TResponse>(
  path: string
): Promise<TResponse> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return {} as TResponse;
  }

  return response.json() as Promise<TResponse>;
}
