/**
 * Configuration options for the VertaaUX client.
 */
export interface VertaaUXConfig {
  /**
   * Your VertaaUX API key.
   * Obtain from https://vertaaux.ai/dashboard/api-keys
   */
  apiKey: string;

  /**
   * Base URL for API requests.
   * @default "https://vertaaux.ai/api/v1"
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;

  /**
   * Maximum number of automatic retries for failed requests.
   * Only retries on 429 and 5xx errors.
   * @default 2
   */
  maxRetries?: number;

  /**
   * Custom fetch implementation for testing or special environments.
   * Must be compatible with the standard Fetch API.
   */
  fetch?: typeof fetch;
}

/**
 * Options for making HTTP requests.
 * @internal
 */
export interface RequestOptions {
  /**
   * HTTP method for the request.
   */
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';

  /**
   * API endpoint path (e.g., "/audits" or "/audit/job123").
   */
  path: string;

  /**
   * Request body for POST/PATCH requests.
   */
  body?: unknown;

  /**
   * Query parameters to append to the URL.
   */
  query?: Record<string, string | number | boolean | undefined>;

  /**
   * Idempotency key for safe request retries.
   * Recommended for POST requests that create resources.
   */
  idempotencyKey?: string;
}
