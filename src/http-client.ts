/**
 * HTTP client for making authenticated API requests.
 * @internal
 */

import type { VertaaUXConfig, RequestOptions } from './types/config';
import {
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  APIError,
  IdempotencyError,
  ConnectionError,
  PermissionError,
  VertaaUXError,
} from './errors';

const DEFAULTS = {
  baseUrl: 'https://vertaaux.ai/api/v1',
  timeout: 30000,
  maxRetries: 2,
  baseDelayMs: 300,
  maxDelayMs: 30000,
} as const;

/**
 * Low-level HTTP client that handles authentication, request building,
 * response parsing, and automatic retries with exponential backoff.
 *
 * @internal
 */
export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: VertaaUXConfig) {
    if (!config.apiKey) {
      throw new Error('VertaaUX: apiKey is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULTS.baseUrl;
    this.timeout = config.timeout ?? DEFAULTS.timeout;
    this.maxRetries = config.maxRetries ?? DEFAULTS.maxRetries;
    this.fetchFn = config.fetch ?? fetch;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    return this.requestWithRetry<T>(options);
  }

  private async requestWithRetry<T>(options: RequestOptions): Promise<T> {
    const maxRetries = this.maxRetries;
    const baseDelay = DEFAULTS.baseDelayMs;
    const maxDelay = DEFAULTS.maxDelayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.executeRequest(options);

        if (response.ok) {
          return this.parseResponse<T>(response);
        }

        const isRetryable = response.status === 429 || response.status >= 500;
        const hasRetriesLeft = attempt < maxRetries;

        if (isRetryable && hasRetriesLeft) {
          const delay = this.calculateDelay(response, attempt, baseDelay, maxDelay);
          await this.sleep(delay);
          continue;
        }

        return this.handleErrorResponse(response);
      } catch (error) {
        if (error instanceof VertaaUXError) {
          throw error;
        }

        if (this.isNetworkError(error) && attempt < maxRetries) {
          const delay = this.calculateDelay(null, attempt, baseDelay, maxDelay);
          await this.sleep(delay);
          continue;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw new ConnectionError(`Request timeout after ${this.timeout}ms`);
        }

        if (this.isNetworkError(error)) {
          throw new ConnectionError(
            error instanceof Error ? error.message : 'Network request failed'
          );
        }

        throw error;
      }
    }

    throw new ConnectionError('Max retries exceeded');
  }

  private async executeRequest(options: RequestOptions): Promise<Response> {
    const url = this.buildUrl(options.path, options.query);
    const headers = this.buildHeaders(options.idempotencyKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const errorBody = await this.safeParseJson(response);
    const message = this.extractErrorMessage(errorBody, response.statusText);
    const requestId = this.extractRequestId(response, errorBody);

    throw this.createTypedError(response, errorBody, message, requestId);
  }

  private calculateDelay(
    response: Response | null,
    attempt: number,
    baseDelay: number,
    maxDelay: number
  ): number {
    if (response) {
      const retryAfterMs = this.parseRetryAfterMs(response);
      if (retryAfterMs !== null) {
        return Math.min(retryAfterMs, maxDelay);
      }
    }

    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 100;
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  private parseRetryAfterMs(response: Response): number | null {
    const header = response.headers.get('Retry-After');
    if (!header) return null;

    const asSeconds = parseInt(header, 10);
    if (!Number.isNaN(asSeconds)) {
      return asSeconds * 1000;
    }

    const asDate = Date.parse(header);
    if (!Number.isNaN(asDate)) {
      return Math.max(asDate - Date.now(), 0);
    }

    return null;
  }

  private parseRetryAfterSeconds(response: Response): number | undefined {
    const header = response.headers.get('Retry-After');
    if (!header) return undefined;

    const parsed = parseInt(header, 10);
    if (!isNaN(parsed)) return parsed;

    const asDate = Date.parse(header);
    if (!Number.isNaN(asDate)) {
      return Math.max(Math.ceil((asDate - Date.now()) / 1000), 0);
    }

    return undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError) {
      const message = error.message.toLowerCase();
      return (
        message.includes('fetch') ||
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('socket') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
      );
    }
    return false;
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(path, this.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private buildHeaders(idempotencyKey?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return headers;
  }

  private async safeParseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  private extractErrorMessage(body: unknown, fallback: string): string {
    if (body && typeof body === 'object' && body !== null) {
      const obj = body as Record<string, unknown>;
      if (typeof obj.message === 'string') return obj.message;
      if (typeof obj.error === 'string') return obj.error;
    }
    return fallback;
  }

  private extractRequestId(response: Response, body: unknown): string | undefined {
    const headerRequestId = response.headers.get('x-request-id');
    if (headerRequestId) return headerRequestId;

    if (body && typeof body === 'object' && body !== null) {
      const obj = body as Record<string, unknown>;
      if (typeof obj.request_id === 'string') return obj.request_id;
    }

    return undefined;
  }

  private createTypedError(
    response: Response,
    body: unknown,
    message: string,
    requestId?: string
  ): Error {
    const status = response.status;
    const bodyObj = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

    switch (status) {
      case 401:
        return new AuthenticationError(message, requestId);

      case 403:
        return new PermissionError(message, requestId);

      case 404: {
        const errorCode = typeof bodyObj.error === 'string' ? bodyObj.error : '';
        let resource: string | undefined;
        if (errorCode.includes('job')) resource = 'audit';
        else if (errorCode.includes('webhook')) resource = 'webhook';
        else if (errorCode.includes('schedule')) resource = 'schedule';
        return new NotFoundError(message, { resource, requestId });
      }

      case 409:
        return new IdempotencyError(message, requestId);

      case 429: {
        const retryAfter = this.parseRetryAfterSeconds(response);
        return new RateLimitError(message, { retryAfter, requestId });
      }

      case 400: {
        const errors = this.extractValidationErrors(bodyObj);
        const param = typeof bodyObj.param === 'string' ? bodyObj.param : undefined;
        return new ValidationError(message, { param, errors, requestId });
      }

      default: {
        const code = typeof bodyObj.error === 'string' ? bodyObj.error : undefined;
        return new APIError(message, status, { code, requestId });
      }
    }
  }

  private extractValidationErrors(
    body: Record<string, unknown>
  ): Array<{ field: string; message: string }> | undefined {
    if (body.details && typeof body.details === 'object') {
      const details = body.details as Record<string, unknown>;
      if (Array.isArray(details.validation_errors)) {
        return details.validation_errors.map((e: unknown) => {
          const err = e as Record<string, unknown>;
          return {
            field: typeof err.field === 'string' ? err.field : 'unknown',
            message: typeof err.message === 'string' ? err.message : 'Validation failed',
          };
        });
      }
    }

    if (Array.isArray(body.details)) {
      return body.details.map((e: unknown) => {
        const err = e as Record<string, unknown>;
        const path = Array.isArray(err.path) ? err.path.join('.') : 'unknown';
        return {
          field: path,
          message: typeof err.message === 'string' ? err.message : 'Validation failed',
        };
      });
    }

    return undefined;
  }

  get config() {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
    };
  }
}
