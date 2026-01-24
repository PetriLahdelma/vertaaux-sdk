/**
 * Base error class for VertaaUX SDK errors
 */
export class VertaaUXError extends Error {
  /** HTTP status code (if applicable) */
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'VertaaUXError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, VertaaUXError.prototype);
  }
}

/**
 * Thrown when authentication fails (invalid or missing API key)
 */
export class AuthenticationError extends VertaaUXError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends VertaaUXError {
  /** Seconds until rate limit resets */
  retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Thrown when request validation fails
 */
export class ValidationError extends VertaaUXError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
