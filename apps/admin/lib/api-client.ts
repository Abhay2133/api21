export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

let inMemoryCsrfToken: string | null = null;

export function setApiCsrfToken(token: string | null) {
  inMemoryCsrfToken = token;
}

export function getCsrfToken(): string | null {
  if (inMemoryCsrfToken) return inMemoryCsrfToken;
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

class ApiClient {
  private get baseUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // Double submit CSRF protection: attach X-CSRF-Token for mutating methods
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Always send cookies cross-domain
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        const errorMsg = data?.message || `Request failed with status ${res.status}`;
        throw new Error(errorMsg);
      }

      // If response delivers a csrfToken, automatically capture it
      if (data?.data?.csrfToken) {
        setApiCsrfToken(data.data.csrfToken);
      }

      return data;
    } catch (err: any) {
      throw err;
    }
  }

  get<T = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  delete<T = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
