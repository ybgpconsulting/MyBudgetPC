const API_BASE = import.meta.env?.VITE_API_URL || '';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('my_budget_pc_token', token);
    } else {
      localStorage.removeItem('my_budget_pc_token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    const stored = localStorage.getItem('my_budget_pc_token');
    if (stored) this.token = stored;
    return this.token;
  }

  private async request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth && this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new Error('The service is unavailable. Check your connection and try again.');
    }

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let data: { error?: string; details?: unknown } | T;
    try {
      data = contentType.includes('application/json') ? JSON.parse(text) : ({} as T);
    } catch {
      data = {} as T;
    }
    if (!res.ok) {
      if (res.status === 401) {
        this.setToken(null);
        throw new Error('Your session has expired. Please sign in again.');
      }
      if (res.status === 403) throw new Error('You do not have permission for this action.');
      if (res.status === 404) throw new Error('The requested resource was not found.');
      if (res.status === 409) throw new Error((data as { error?: string }).error || 'That item was just changed by another staff member.');
      if (res.status === 422) throw new Error('The submitted data could not be processed.');
      if (res.status === 429) throw new Error('Too many requests. Please try again shortly.');
      if (res.status === 503) throw new Error('The inventory service is temporarily unavailable.');
      throw new Error((data as { error?: string }).error || `Request failed: ${res.status}`);
    }
    if (!contentType.includes('application/json')) throw new Error('The service returned an invalid response.');
    return data as T;
  }

  get<T>(path: string, auth = true) { return this.request<T>('GET', path, undefined, auth); }
  post<T>(path: string, body?: unknown, auth = true) { return this.request<T>('POST', path, body, auth); }
  patch<T>(path: string, body?: unknown, auth = true) { return this.request<T>('PATCH', path, body, auth); }
  del<T>(path: string, auth = true) { return this.request<T>('DELETE', path, undefined, auth); }

  async uploadImage(file: File) {
    const form = new FormData();
    form.append('image', file);
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/uploads/image`, {
        method: 'POST',
        headers: this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {},
        body: form,
      });
    } catch {
      throw new Error('The upload service is unavailable. Try again.');
    }
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let data: { error?: string; url?: string; filename?: string; size?: number } = {};
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Upload service returned an invalid response.');
      }
    }
    if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);
    if (!data.url) throw new Error('Upload service returned no image URL.');
    return data as { url: string; filename: string; size: number };
  }
}

export const api = new ApiClient();
