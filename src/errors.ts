/**
 * Typed error classes for the VertaaUX SDK.
 *
 * @module errors
 */

/**
 * Base error class for all SDK errors.
 *
 * @example
 * ```typescript
 * try {
 *   await client.audits.create({ url: 'https://example.com' });
 * } catch (error) {
 *   if (error instanceof VertaaUXError) {
 *     console.log(error.type, error.statusCode, error.requestId);
 *   }
 * }
 * ```
 */
export class VertaaUXError extends Error {
  readonly type: string;
  readonly code?: string;
  readonly statusCode?: number;
  readonly requestId?: string;

  constructor(
    message: string,
    type: string,
    options?: {
      code?: string;
      statusCode?: number;
      requestId?: string;
    }
  ) {
    super(message);
    this.name = 'VertaaUXError';
    this.type = type;
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.requestId = options?.requestId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when authentication fails (401).
 */
export class AuthenticationError extends VertaaUXError {
  constructor(message: string, requestId?: string) {
    super(message, 'authentication_error', {
      code: 'invalid_api_key',
      statusCode: 401,
      requestId,
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when rate limit is exceeded (429).
 */
export class RateLimitError extends VertaaUXError {
  readonly retryAfter?: number;

  constructor(
    message: string,
    options?: { retryAfter?: number; requestId?: string }
  ) {
    super(message, 'rate_limit_error', {
      code: 'rate_limit_exceeded',
      statusCode: 429,
      requestId: options?.requestId,
    });
    this.name = 'RateLimitError';
    this.retryAfter = options?.retryAfter;
  }
}

/**
 * Thrown when a requested resource is not found (404).
 */
export class NotFoundError extends VertaaUXError {
  readonly resource?: string;

  constructor(
    message: string,
    options?: { resource?: string; requestId?: string }
  ) {
    super(message, 'not_found_error', {
      code: 'not_found',
      statusCode: 404,
      requestId: options?.requestId,
    });
    this.name = 'NotFoundError';
    this.resource = options?.resource;
  }
}

/**
 * Thrown when request validation fails (400).
 */
export class ValidationError extends VertaaUXError {
  readonly param?: string;
  readonly errors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    options?: {
      param?: string;
      errors?: Array<{ field: string; message: string }>;
      requestId?: string;
    }
  ) {
    super(message, 'validation_error', {
      code: 'validation_error',
      statusCode: 400,
      requestId: options?.requestId,
    });
    this.name = 'ValidationError';
    this.param = options?.param;
    this.errors = options?.errors;
  }
}

/**
 * Thrown for general API errors (typically 5xx).
 */
export class APIError extends VertaaUXError {
  constructor(
    message: string,
    statusCode: number,
    options?: { code?: string; requestId?: string }
  ) {
    super(message, 'api_error', {
      code: options?.code ?? 'internal_error',
      statusCode,
      requestId: options?.requestId,
    });
    this.name = 'APIError';
  }
}

/**
 * Thrown when an idempotency key conflict occurs (409).
 */
export class IdempotencyError extends VertaaUXError {
  constructor(message: string, requestId?: string) {
    super(message, 'idempotency_error', {
      code: 'idempotency_key_conflict',
      statusCode: 409,
      requestId,
    });
    this.name = 'IdempotencyError';
  }
}

/**
 * Thrown when a network connection cannot be established.
 */
export class ConnectionError extends VertaaUXError {
  constructor(message: string) {
    super(message, 'connection_error', { code: 'connection_failed' });
    this.name = 'ConnectionError';
  }
}

/**
 * Thrown when permission is denied (403).
 */
export class PermissionError extends VertaaUXError {
  constructor(message: string, requestId?: string) {
    super(message, 'permission_error', {
      code: 'forbidden',
      statusCode: 403,
      requestId,
    });
    this.name = 'PermissionError';
  }
}

/**
 * Type guard to check if an error is a VertaaUX SDK error.
 */
export function isVertaaUXError(error: unknown): error is VertaaUXError {
  return (
    error instanceof VertaaUXError ||
    (error instanceof Error &&
      'type' in error &&
      typeof (error as VertaaUXError).type === 'string')
  );
}
