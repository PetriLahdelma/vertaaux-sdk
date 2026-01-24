import type {
  VertaaUXConfig,
  Audit,
  AuditCreateOptions,
  AuditListOptions,
  AuditListResponse,
} from './types';
import {
  VertaaUXError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from './errors';

const DEFAULT_BASE_URL = 'https://api.vertaaux.ai/v1';

export class VertaaUX {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: VertaaUXConfig) {
    if (!config.apiKey) {
      throw new ValidationError('API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  /**
   * Audit operations
   */
  audits = {
    /**
     * Create a new audit job
     */
    create: async (options: AuditCreateOptions): Promise<Audit> => {
      if (!options.url) {
        throw new ValidationError('URL is required');
      }
      return this.request<Audit>('POST', '/audits', options);
    },

    /**
     * Get an audit by ID
     */
    get: async (id: string): Promise<Audit> => {
      if (!id) {
        throw new ValidationError('Audit ID is required');
      }
      return this.request<Audit>('GET', `/audits/${encodeURIComponent(id)}`);
    },

    /**
     * List audits with pagination
     */
    list: async (options?: AuditListOptions): Promise<AuditListResponse> => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.cursor) params.set('cursor', options.cursor);
      if (options?.status) params.set('status', options.status);

      const query = params.toString();
      const path = query ? `/audits?${query}` : '/audits';
      return this.request<AuditListResponse>('GET', path);
    },

    /**
     * Wait for an audit to complete
     */
    waitForCompletion: async (
      id: string,
      options?: { timeout?: number; pollInterval?: number }
    ): Promise<Audit> => {
      const timeout = options?.timeout ?? 300000; // 5 minutes
      const pollInterval = options?.pollInterval ?? 2000; // 2 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const audit = await this.audits.get(id);

        if (audit.status === 'completed' || audit.status === 'failed') {
          return audit;
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      throw new VertaaUXError(`Audit ${id} timed out after ${timeout}ms`);
    },
  };

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'vertaaux-sdk/1.0.0',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let message = `Request failed with status ${response.status}`;
    let errorBody: { error?: string; message?: string } | null = null;

    try {
      errorBody = await response.json();
      message = errorBody?.error || errorBody?.message || message;
    } catch {
      // Ignore JSON parse errors
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message);
      case 429: {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          message,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }
      case 400:
        throw new ValidationError(message);
      default:
        throw new VertaaUXError(message, response.status);
    }
  }
}
