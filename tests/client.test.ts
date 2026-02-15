/**
 * Comprehensive test suite for the VertaaUX SDK.
 *
 * Covers: client initialization, error classes, HTTP error mapping,
 * retry logic, and pagination.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  VertaaUX,
  VertaaUXError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  APIError,
  IdempotencyError,
  ConnectionError,
  PermissionError,
  isVertaaUXError,
  AutoPaginatingList,
  autoPaginate,
} from '../src';
import { HttpClient } from '../src/http-client';
import type { PaginatedResponse } from '../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a mock Response object that behaves like a real fetch Response.
 */
function mockResponse(
  status: number,
  body?: unknown,
  headers?: Record<string, string>
): Response {
  const headersObj = new Headers(headers);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: statusTextFor(status),
    headers: headersObj,
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone: () => mockResponse(status, body, headers),
  } as unknown as Response;
}

function statusTextFor(status: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return map[status] ?? 'Unknown';
}

/**
 * Build an HttpClient with a mocked fetch for testing.
 */
function createMockClient(
  mockFetch: ReturnType<typeof vi.fn>,
  overrides?: { maxRetries?: number; timeout?: number; baseUrl?: string }
) {
  return new HttpClient({
    apiKey: 'test_key_123',
    fetch: mockFetch as unknown as typeof fetch,
    maxRetries: overrides?.maxRetries ?? 0,
    timeout: overrides?.timeout ?? 30000,
    baseUrl: overrides?.baseUrl,
  });
}

// ===========================================================================
// 1. Client Initialization
// ===========================================================================

describe('VertaaUX Client Initialization', () => {
  it('creates a client when apiKey is provided', () => {
    const client = new VertaaUX({ apiKey: 'vx_test_key' });
    expect(client).toBeInstanceOf(VertaaUX);
  });

  it('throws when apiKey is empty string', () => {
    expect(() => new VertaaUX({ apiKey: '' })).toThrow('apiKey is required');
  });

  it('exposes all resource instances', () => {
    const client = new VertaaUX({ apiKey: 'vx_test_key' });
    expect(client.audits).toBeDefined();
    expect(client.webhooks).toBeDefined();
    expect(client.schedules).toBeDefined();
    expect(client.quota).toBeDefined();
    expect(client.engines).toBeDefined();
    expect(client.patches).toBeDefined();
    expect(client.verification).toBeDefined();
  });

  it('accepts custom baseUrl', () => {
    const mockFetch = vi.fn().mockResolvedValue(mockResponse(200, { ok: true }));
    const client = new HttpClient({
      apiKey: 'vx_test_key',
      baseUrl: 'https://custom.api.com/v2',
      fetch: mockFetch as unknown as typeof fetch,
    });
    expect(client.config.baseUrl).toBe('https://custom.api.com/v2');
  });

  it('accepts custom timeout', () => {
    const client = new HttpClient({
      apiKey: 'vx_test_key',
      timeout: 5000,
      fetch: vi.fn() as unknown as typeof fetch,
    });
    expect(client.config.timeout).toBe(5000);
  });

  it('accepts custom maxRetries', () => {
    const client = new HttpClient({
      apiKey: 'vx_test_key',
      maxRetries: 5,
      fetch: vi.fn() as unknown as typeof fetch,
    });
    expect(client.config.maxRetries).toBe(5);
  });

  it('uses default baseUrl when not provided', () => {
    const client = new HttpClient({
      apiKey: 'vx_test_key',
      fetch: vi.fn() as unknown as typeof fetch,
    });
    expect(client.config.baseUrl).toBe('https://vertaaux.ai/api/v1');
  });

  it('uses default timeout when not provided', () => {
    const client = new HttpClient({
      apiKey: 'vx_test_key',
      fetch: vi.fn() as unknown as typeof fetch,
    });
    expect(client.config.timeout).toBe(30000);
  });

  it('uses default maxRetries when not provided', () => {
    const client = new HttpClient({
      apiKey: 'vx_test_key',
      fetch: vi.fn() as unknown as typeof fetch,
    });
    expect(client.config.maxRetries).toBe(2);
  });

  it('accepts a custom fetch implementation', async () => {
    const customFetch = vi.fn().mockResolvedValue(
      mockResponse(200, { custom: true })
    );
    const client = createMockClient(customFetch);
    const result = await client.request({ method: 'GET', path: '/test' });
    expect(customFetch).toHaveBeenCalledOnce();
    expect(result).toEqual({ custom: true });
  });
});

// ===========================================================================
// 2. Error Classes
// ===========================================================================

describe('Error Classes', () => {
  describe('VertaaUXError (base)', () => {
    it('has correct name and type', () => {
      const error = new VertaaUXError('test', 'test_error');
      expect(error.name).toBe('VertaaUXError');
      expect(error.type).toBe('test_error');
      expect(error.message).toBe('test');
    });

    it('carries optional code, statusCode, requestId', () => {
      const error = new VertaaUXError('msg', 'type', {
        code: 'some_code',
        statusCode: 418,
        requestId: 'req_123',
      });
      expect(error.code).toBe('some_code');
      expect(error.statusCode).toBe(418);
      expect(error.requestId).toBe('req_123');
    });

    it('is an instance of Error', () => {
      const error = new VertaaUXError('msg', 'type');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('AuthenticationError', () => {
    it('has correct name, type, statusCode, and code', () => {
      const error = new AuthenticationError('Invalid key');
      expect(error.name).toBe('AuthenticationError');
      expect(error.type).toBe('authentication_error');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('invalid_api_key');
    });

    it('is an instance of VertaaUXError', () => {
      expect(new AuthenticationError('msg')).toBeInstanceOf(VertaaUXError);
    });

    it('carries requestId', () => {
      const error = new AuthenticationError('msg', 'req_abc');
      expect(error.requestId).toBe('req_abc');
    });
  });

  describe('RateLimitError', () => {
    it('has correct name, type, statusCode, and code', () => {
      const error = new RateLimitError('Too fast');
      expect(error.name).toBe('RateLimitError');
      expect(error.type).toBe('rate_limit_error');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('rate_limit_exceeded');
    });

    it('carries retryAfter', () => {
      const error = new RateLimitError('Rate limited', { retryAfter: 30 });
      expect(error.retryAfter).toBe(30);
    });

    it('retryAfter is undefined when not provided', () => {
      const error = new RateLimitError('Rate limited');
      expect(error.retryAfter).toBeUndefined();
    });

    it('is an instance of VertaaUXError', () => {
      expect(new RateLimitError('msg')).toBeInstanceOf(VertaaUXError);
    });
  });

  describe('NotFoundError', () => {
    it('has correct name, type, statusCode, and code', () => {
      const error = new NotFoundError('Not found');
      expect(error.name).toBe('NotFoundError');
      expect(error.type).toBe('not_found_error');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('not_found');
    });

    it('carries resource name', () => {
      const error = new NotFoundError('msg', { resource: 'audit' });
      expect(error.resource).toBe('audit');
    });

    it('is an instance of VertaaUXError', () => {
      expect(new NotFoundError('msg')).toBeInstanceOf(VertaaUXError);
    });
  });

  describe('ValidationError', () => {
    it('has correct name, type, statusCode, and code', () => {
      const error = new ValidationError('Bad input');
      expect(error.name).toBe('ValidationError');
      expect(error.type).toBe('validation_error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('validation_error');
    });

    it('carries param and errors array', () => {
      const errors = [{ field: 'url', message: 'required' }];
      const error = new ValidationError('msg', { param: 'url', errors });
      expect(error.param).toBe('url');
      expect(error.errors).toEqual(errors);
    });

    it('is an instance of VertaaUXError', () => {
      expect(new ValidationError('msg')).toBeInstanceOf(VertaaUXError);
    });
  });

  describe('APIError', () => {
    it('has correct name, type, and carries statusCode', () => {
      const error = new APIError('Server error', 500);
      expect(error.name).toBe('APIError');
      expect(error.type).toBe('api_error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('internal_error');
    });

    it('accepts custom code', () => {
      const error = new APIError('msg', 502, { code: 'bad_gateway' });
      expect(error.code).toBe('bad_gateway');
      expect(error.statusCode).toBe(502);
    });

    it('is an instance of VertaaUXError', () => {
      expect(new APIError('msg', 500)).toBeInstanceOf(VertaaUXError);
    });
  });

  describe('IdempotencyError', () => {
    it('has correct name, type, statusCode, and code', () => {
      const error = new IdempotencyError('Conflict');
      expect(error.name).toBe('IdempotencyError');
      expect(error.type).toBe('idempotency_error');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('idempotency_key_conflict');
    });

    it('is an instance of VertaaUXError', () => {
      expect(new IdempotencyError('msg')).toBeInstanceOf(VertaaUXError);
    });
  });

  describe('ConnectionError', () => {
    it('has correct name, type, and code', () => {
      const error = new ConnectionError('Connection refused');
      expect(error.name).toBe('ConnectionError');
      expect(error.type).toBe('connection_error');
      expect(error.code).toBe('connection_failed');
    });

    it('has no statusCode', () => {
      const error = new ConnectionError('msg');
      expect(error.statusCode).toBeUndefined();
    });

    it('is an instance of VertaaUXError', () => {
      expect(new ConnectionError('msg')).toBeInstanceOf(VertaaUXError);
    });
  });

  describe('PermissionError', () => {
    it('has correct name, type, statusCode, and code', () => {
      const error = new PermissionError('Forbidden');
      expect(error.name).toBe('PermissionError');
      expect(error.type).toBe('permission_error');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('forbidden');
    });

    it('is an instance of VertaaUXError', () => {
      expect(new PermissionError('msg')).toBeInstanceOf(VertaaUXError);
    });
  });

  describe('isVertaaUXError type guard', () => {
    it('returns true for VertaaUXError instances', () => {
      expect(isVertaaUXError(new VertaaUXError('msg', 'type'))).toBe(true);
    });

    it('returns true for all SDK error subclasses', () => {
      expect(isVertaaUXError(new AuthenticationError('msg'))).toBe(true);
      expect(isVertaaUXError(new RateLimitError('msg'))).toBe(true);
      expect(isVertaaUXError(new NotFoundError('msg'))).toBe(true);
      expect(isVertaaUXError(new ValidationError('msg'))).toBe(true);
      expect(isVertaaUXError(new APIError('msg', 500))).toBe(true);
      expect(isVertaaUXError(new IdempotencyError('msg'))).toBe(true);
      expect(isVertaaUXError(new ConnectionError('msg'))).toBe(true);
      expect(isVertaaUXError(new PermissionError('msg'))).toBe(true);
    });

    it('returns false for plain Error', () => {
      expect(isVertaaUXError(new Error('msg'))).toBe(false);
    });

    it('returns false for null/undefined/string', () => {
      expect(isVertaaUXError(null)).toBe(false);
      expect(isVertaaUXError(undefined)).toBe(false);
      expect(isVertaaUXError('error string')).toBe(false);
    });

    it('returns false for non-error objects', () => {
      expect(isVertaaUXError({ message: 'fake', type: 'fake' })).toBe(false);
    });
  });
});

// ===========================================================================
// 3. HTTP Client Error Mapping
// ===========================================================================

describe('HTTP Client Error Mapping', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: HttpClient;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = createMockClient(mockFetch);
  });

  it('401 maps to AuthenticationError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(401, { message: 'Invalid API key' })
    );
    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(AuthenticationError);
  });

  it('403 maps to PermissionError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(403, { message: 'Access denied' })
    );
    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(PermissionError);
  });

  it('404 maps to NotFoundError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(404, { message: 'Audit not found', error: 'job_not_found' })
    );
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.resource).toBe('audit');
  });

  it('404 for webhook maps resource to webhook', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(404, { message: 'Not found', error: 'webhook_not_found' })
    );
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.resource).toBe('webhook');
  });

  it('404 for schedule maps resource to schedule', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(404, { message: 'Not found', error: 'schedule_not_found' })
    );
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.resource).toBe('schedule');
  });

  it('409 maps to IdempotencyError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(409, { message: 'Key conflict' })
    );
    await expect(
      client.request({ method: 'POST', path: '/test' })
    ).rejects.toThrow(IdempotencyError);
  });

  it('429 maps to RateLimitError with retryAfter from header', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(429, { message: 'Rate limited' }, { 'Retry-After': '60' })
    );
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.retryAfter).toBe(60);
  });

  it('429 maps to RateLimitError without retryAfter when header missing', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(429, { message: 'Rate limited' })
    );
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.retryAfter).toBeUndefined();
  });

  it('400 maps to ValidationError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(400, {
        message: 'Invalid params',
        param: 'url',
        details: {
          validation_errors: [
            { field: 'url', message: 'must be a valid URL' },
          ],
        },
      })
    );
    const error = await client
      .request({ method: 'POST', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.param).toBe('url');
    expect(error.errors).toEqual([
      { field: 'url', message: 'must be a valid URL' },
    ]);
  });

  it('400 with array-style details extracts validation errors', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(400, {
        message: 'Validation failed',
        details: [
          { path: ['body', 'url'], message: 'Required' },
        ],
      })
    );
    const error = await client
      .request({ method: 'POST', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.errors).toEqual([
      { field: 'body.url', message: 'Required' },
    ]);
  });

  it('500 maps to APIError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(500, { message: 'Internal error', error: 'server_crash' })
    );
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(APIError);
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('server_crash');
  });

  it('502 maps to APIError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(502, { message: 'Bad gateway' })
    );
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(APIError);
    expect(error.statusCode).toBe(502);
  });

  it('extracts requestId from x-request-id header', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        401,
        { message: 'Unauthorized' },
        { 'x-request-id': 'req_header_123' }
      )
    );
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error.requestId).toBe('req_header_123');
  });

  it('extracts requestId from body when header is absent', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(401, { message: 'Unauthorized', request_id: 'req_body_456' })
    );
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error.requestId).toBe('req_body_456');
  });

  it('falls back to statusText when body has no message', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(500, {}));
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(APIError);
    expect(error.message).toBe('Internal Server Error');
  });

  it('handles non-JSON error bodies gracefully', async () => {
    const badResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers(),
      json: async () => {
        throw new Error('Not JSON');
      },
      text: async () => 'Internal Server Error',
    } as unknown as Response;
    mockFetch.mockResolvedValueOnce(badResponse);
    const error = await client
      .request({ method: 'GET', path: '/test' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(APIError);
  });
});

// ===========================================================================
// 4. HTTP Client Request Building
// ===========================================================================

describe('HTTP Client Request Building', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: HttpClient;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(mockResponse(200, { ok: true }));
    client = createMockClient(mockFetch);
  });

  it('sends X-API-Key header', async () => {
    await client.request({ method: 'GET', path: '/test' });
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers['X-API-Key']).toBe('test_key_123');
  });

  it('sends Content-Type: application/json', async () => {
    await client.request({ method: 'GET', path: '/test' });
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers['Content-Type']).toBe('application/json');
  });

  it('sends Idempotency-Key header when provided', async () => {
    await client.request({
      method: 'POST',
      path: '/test',
      idempotencyKey: 'idem_key_abc',
    });
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers['Idempotency-Key']).toBe('idem_key_abc');
  });

  it('does not send Idempotency-Key when not provided', async () => {
    await client.request({ method: 'GET', path: '/test' });
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers['Idempotency-Key']).toBeUndefined();
  });

  it('builds URL from baseUrl and path', async () => {
    await client.request({ method: 'GET', path: '/audits' });
    const url = mockFetch.mock.calls[0][0];
    expect(url).toBe('https://vertaaux.ai/api/v1/audits');
  });

  it('builds URL correctly with relative path (no leading slash)', async () => {
    const customClient = createMockClient(mockFetch, {
      baseUrl: 'https://vertaaux.ai/api/v1/',
    });
    await customClient.request({ method: 'GET', path: 'audits' });
    const url = mockFetch.mock.calls[0][0];
    // Relative resolution against trailing-slash base
    expect(url).toBe('https://vertaaux.ai/api/v1/audits');
  });

  it('appends query parameters to URL', async () => {
    await client.request({
      method: 'GET',
      path: '/audits',
      query: { limit: 10, status: 'completed' },
    });
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('limit=10');
    expect(url).toContain('status=completed');
  });

  it('omits undefined query parameters', async () => {
    await client.request({
      method: 'GET',
      path: '/audits',
      query: { limit: 10, status: undefined },
    });
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain('limit=10');
    expect(url).not.toContain('status');
  });

  it('serializes body as JSON for POST requests', async () => {
    const body = { url: 'https://example.com', mode: 'deep' };
    await client.request({ method: 'POST', path: '/audit', body });
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].body).toBe(JSON.stringify(body));
  });

  it('does not include body for GET requests', async () => {
    await client.request({ method: 'GET', path: '/test' });
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].body).toBeUndefined();
  });

  it('parses 200 JSON response', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(200, { job_id: 'j_123', status: 'queued' })
    );
    const result = await client.request({ method: 'GET', path: '/test' });
    expect(result).toEqual({ job_id: 'j_123', status: 'queued' });
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(204));
    const result = await client.request({ method: 'DELETE', path: '/test' });
    expect(result).toBeUndefined();
  });
});

// ===========================================================================
// 5. HTTP Client Retry Logic
// ===========================================================================

describe('HTTP Client Retry Logic', () => {
  it('retries on 429 up to maxRetries then throws RateLimitError', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(429, { message: 'Rate limited' }, { 'Retry-After': '0' })
    );
    const client = createMockClient(mockFetch, { maxRetries: 2 });

    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(RateLimitError);

    // Initial attempt + 2 retries = 3 calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('retries on 500 up to maxRetries then throws APIError', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(500, { message: 'Server error' })
    );
    const client = createMockClient(mockFetch, { maxRetries: 2 });

    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(APIError);

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('retries on 503 up to maxRetries then throws APIError', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(503, { message: 'Service unavailable' })
    );
    const client = createMockClient(mockFetch, { maxRetries: 1 });

    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(APIError);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry on 400 (client error)', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(400, { message: 'Bad request' })
    );
    const client = createMockClient(mockFetch, { maxRetries: 2 });

    await expect(
      client.request({ method: 'POST', path: '/test' })
    ).rejects.toThrow(ValidationError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 401', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(401, { message: 'Unauthorized' })
    );
    const client = createMockClient(mockFetch, { maxRetries: 2 });

    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(AuthenticationError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 403', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(403, { message: 'Forbidden' })
    );
    const client = createMockClient(mockFetch, { maxRetries: 2 });

    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(PermissionError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(404, { message: 'Not found' })
    );
    const client = createMockClient(mockFetch, { maxRetries: 2 });

    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(NotFoundError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 409', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(409, { message: 'Conflict' })
    );
    const client = createMockClient(mockFetch, { maxRetries: 2 });

    await expect(
      client.request({ method: 'POST', path: '/test' })
    ).rejects.toThrow(IdempotencyError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('succeeds on retry after transient 500', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(500, { message: 'Error' }))
      .mockResolvedValueOnce(mockResponse(200, { status: 'ok' }));
    const client = createMockClient(mockFetch, { maxRetries: 2 });

    const result = await client.request({ method: 'GET', path: '/test' });
    expect(result).toEqual({ status: 'ok' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('succeeds on retry after transient 429', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        mockResponse(429, { message: 'Rate limited' }, { 'Retry-After': '0' })
      )
      .mockResolvedValueOnce(mockResponse(200, { status: 'ok' }));
    const client = createMockClient(mockFetch, { maxRetries: 1 });

    const result = await client.request({ method: 'GET', path: '/test' });
    expect(result).toEqual({ status: 'ok' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on network errors (TypeError with fetch keyword)', async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(mockResponse(200, { ok: true }));
    const client = createMockClient(mockFetch, { maxRetries: 1 });

    const result = await client.request({ method: 'GET', path: '/test' });
    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws ConnectionError after exhausting retries on network errors', async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValue(new TypeError('fetch failed'));
    const client = createMockClient(mockFetch, { maxRetries: 1 });

    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(ConnectionError);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry when maxRetries is 0', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(500, { message: 'Server error' })
    );
    const client = createMockClient(mockFetch, { maxRetries: 0 });

    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(APIError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws ConnectionError on abort (timeout)', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(
      Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      })
    );
    const client = createMockClient(mockFetch, { maxRetries: 0, timeout: 100 });

    await expect(
      client.request({ method: 'GET', path: '/test' })
    ).rejects.toThrow(ConnectionError);
  });
});

// ===========================================================================
// 6. Pagination - AutoPaginatingList
// ===========================================================================

describe('AutoPaginatingList', () => {
  /**
   * Helper: create a page fetcher that serves items from a flat array,
   * simulating a paginated API.
   */
  function createPageFetcher<T>(
    allItems: T[],
    pageSize: number = 2
  ): (offset: number, limit: number) => Promise<PaginatedResponse<T>> {
    return async (offset: number, limit: number) => {
      const effectiveLimit = Math.min(limit, pageSize);
      const data = allItems.slice(offset, offset + effectiveLimit);
      return {
        data,
        pagination: {
          total: allItems.length,
          limit: effectiveLimit,
          offset,
          has_more: offset + effectiveLimit < allItems.length,
        },
      };
    };
  }

  describe('async iteration', () => {
    it('iterates across multiple pages', async () => {
      const items = [1, 2, 3, 4, 5];
      const fetcher = createPageFetcher(items, 2);
      const list = new AutoPaginatingList(fetcher, { limit: 2 });

      const collected: number[] = [];
      for await (const item of list) {
        collected.push(item);
      }

      expect(collected).toEqual([1, 2, 3, 4, 5]);
    });

    it('handles a single page of results', async () => {
      const items = [1, 2];
      const fetcher = createPageFetcher(items, 10);
      const list = new AutoPaginatingList(fetcher, { limit: 10 });

      const collected: number[] = [];
      for await (const item of list) {
        collected.push(item);
      }

      expect(collected).toEqual([1, 2]);
    });

    it('handles empty results', async () => {
      const fetcher = createPageFetcher([], 10);
      const list = new AutoPaginatingList(fetcher, { limit: 10 });

      const collected: number[] = [];
      for await (const item of list) {
        collected.push(item);
      }

      expect(collected).toEqual([]);
    });

    it('respects maxItems config during iteration', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const fetcher = createPageFetcher(items, 3);
      const list = new AutoPaginatingList(fetcher, { limit: 3, maxItems: 5 });

      const collected: number[] = [];
      for await (const item of list) {
        collected.push(item);
      }

      expect(collected).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('toArray', () => {
    it('collects all items into an array', async () => {
      const items = ['a', 'b', 'c', 'd'];
      const fetcher = createPageFetcher(items, 2);
      const list = new AutoPaginatingList(fetcher, { limit: 2 });

      const result = await list.toArray({ maxItems: 100 });
      expect(result).toEqual(['a', 'b', 'c', 'd']);
    });

    it('respects maxItems limit', async () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const fetcher = createPageFetcher(items, 2);
      const list = new AutoPaginatingList(fetcher, { limit: 2 });

      const result = await list.toArray({ maxItems: 3 });
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('warns when maxItems is reached', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const items = [1, 2, 3, 4, 5];
      const fetcher = createPageFetcher(items, 2);
      const list = new AutoPaginatingList(fetcher, { limit: 2 });

      await list.toArray({ maxItems: 3 });
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy.mock.calls[0][0]).toContain('maxItems');
      warnSpy.mockRestore();
    });

    it('does not warn when all items fit within maxItems', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const items = [1, 2, 3];
      const fetcher = createPageFetcher(items, 10);
      const list = new AutoPaginatingList(fetcher, { limit: 10 });

      await list.toArray({ maxItems: 100 });
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('take', () => {
    it('returns exactly N items', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8];
      const fetcher = createPageFetcher(items, 3);
      const list = new AutoPaginatingList(fetcher, { limit: 3 });

      const result = await list.take(4);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('returns fewer items when total is less than N', async () => {
      const items = [1, 2];
      const fetcher = createPageFetcher(items, 10);
      const list = new AutoPaginatingList(fetcher, { limit: 10 });

      const result = await list.take(5);
      expect(result).toEqual([1, 2]);
    });

    it('returns empty array when taking 0', async () => {
      const items = [1, 2, 3];
      const fetcher = createPageFetcher(items, 10);
      const list = new AutoPaginatingList(fetcher, { limit: 10 });

      const result = await list.take(0);
      expect(result).toEqual([]);
    });
  });

  describe('find', () => {
    it('returns the first matching item', async () => {
      const items = [
        { id: 1, name: 'alpha' },
        { id: 2, name: 'beta' },
        { id: 3, name: 'gamma' },
      ];
      const fetcher = createPageFetcher(items, 2);
      const list = new AutoPaginatingList(fetcher, { limit: 2 });

      const result = await list.find((item) => item.name === 'beta');
      expect(result).toEqual({ id: 2, name: 'beta' });
    });

    it('returns undefined when no match found', async () => {
      const items = [
        { id: 1, name: 'alpha' },
        { id: 2, name: 'beta' },
      ];
      const fetcher = createPageFetcher(items, 10);
      const list = new AutoPaginatingList(fetcher, { limit: 10 });

      const result = await list.find((item) => item.name === 'delta');
      expect(result).toBeUndefined();
    });
  });

  describe('some and every', () => {
    it('some returns true when at least one item matches', async () => {
      const items = [1, 2, 3, 4];
      const fetcher = createPageFetcher(items, 2);
      const list = new AutoPaginatingList(fetcher, { limit: 2 });

      expect(await list.some((x) => x === 3)).toBe(true);
    });

    it('some returns false when no items match', async () => {
      const items = [1, 2, 3];
      const fetcher = createPageFetcher(items, 10);
      const list = new AutoPaginatingList(fetcher, { limit: 10 });

      expect(await list.some((x) => x === 99)).toBe(false);
    });

    it('every returns true when all items match', async () => {
      const items = [2, 4, 6];
      const fetcher = createPageFetcher(items, 2);
      const list = new AutoPaginatingList(fetcher, { limit: 2 });

      expect(await list.every((x) => x % 2 === 0)).toBe(true);
    });

    it('every returns false when some items do not match', async () => {
      const items = [2, 3, 6];
      const fetcher = createPageFetcher(items, 10);
      const list = new AutoPaginatingList(fetcher, { limit: 10 });

      expect(await list.every((x) => x % 2 === 0)).toBe(false);
    });
  });

  describe('filter', () => {
    it('yields only items matching predicate', async () => {
      const items = [1, 2, 3, 4, 5, 6];
      const fetcher = createPageFetcher(items, 3);
      const list = new AutoPaginatingList(fetcher, { limit: 3 });

      const evens = list.filter((x) => x % 2 === 0);
      const result = await evens.toArray({ maxItems: 100 });
      expect(result).toEqual([2, 4, 6]);
    });

    it('returns empty when no items match', async () => {
      const items = [1, 3, 5];
      const fetcher = createPageFetcher(items, 10);
      const list = new AutoPaginatingList(fetcher, { limit: 10 });

      const evens = list.filter((x) => x % 2 === 0);
      const result = await evens.toArray({ maxItems: 100 });
      expect(result).toEqual([]);
    });
  });

  describe('map', () => {
    it('transforms each item', async () => {
      const items = [1, 2, 3];
      const fetcher = createPageFetcher(items, 2);
      const list = new AutoPaginatingList(fetcher, { limit: 2 });

      const doubled = list.map((x) => x * 2);
      const result = await doubled.toArray({ maxItems: 100 });
      expect(result).toEqual([2, 4, 6]);
    });

    it('maps to a different type', async () => {
      const items = [{ name: 'a' }, { name: 'b' }];
      const fetcher = createPageFetcher(items, 10);
      const list = new AutoPaginatingList(fetcher, { limit: 10 });

      const names = list.map((item) => item.name);
      const result = await names.toArray({ maxItems: 100 });
      expect(result).toEqual(['a', 'b']);
    });
  });

  describe('autoPaginate helper', () => {
    it('creates an AutoPaginatingList instance', () => {
      const fetcher = createPageFetcher([1, 2, 3]);
      const list = autoPaginate(fetcher);
      expect(list).toBeInstanceOf(AutoPaginatingList);
    });

    it('passes config through', async () => {
      const items = [1, 2, 3, 4, 5];
      const fetcher = createPageFetcher(items, 2);
      const list = autoPaginate(fetcher, { limit: 2, maxItems: 3 });

      const collected: number[] = [];
      for await (const item of list) {
        collected.push(item);
      }
      expect(collected).toEqual([1, 2, 3]);
    });
  });

  describe('page limit capping', () => {
    it('caps limit at 100 even when larger value is configured', async () => {
      const fetchSpy = vi.fn(async (offset: number, limit: number) => ({
        data: [1],
        pagination: { total: 1, limit, offset, has_more: false },
      }));

      const list = new AutoPaginatingList(fetchSpy, { limit: 200 });
      await list.toArray({ maxItems: 100 });

      // The fetcher should be called with limit=100, not 200
      expect(fetchSpy.mock.calls[0][1]).toBe(100);
    });

    it('defaults limit to 50 when not specified', async () => {
      const fetchSpy = vi.fn(async (offset: number, limit: number) => ({
        data: [],
        pagination: { total: 0, limit, offset, has_more: false },
      }));

      const list = new AutoPaginatingList(fetchSpy);
      await list.toArray({ maxItems: 100 });

      expect(fetchSpy.mock.calls[0][1]).toBe(50);
    });
  });
});
