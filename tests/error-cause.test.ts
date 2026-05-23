/**
 * Error#cause chain regression tests (PORT-03 / D-12).
 *
 * Verifies that the ConnectionError wrap sites in src/http-client.ts thread
 * the original underlying error via the ES2022 `Error#cause` field, and
 * that the typed-error instanceof chain still resolves through the wrap.
 */

import { describe, it, expect, vi } from 'vitest';

import { ConnectionError, VertaaUXError } from '../src';
import { HttpClient } from '../src/http-client';

describe('Error#cause chain', () => {
  it('ConnectionError from max-retries carries last network error via .cause', async () => {
    const networkError = new TypeError('fetch failed: ECONNREFUSED');
    const mockFetch = vi.fn().mockRejectedValue(networkError);
    const client = new HttpClient({
      apiKey: 'test',
      fetch: mockFetch as unknown as typeof fetch,
      maxRetries: 2,
    });

    let caught: unknown;
    try {
      await client.request({ method: 'GET', path: '/test' });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ConnectionError);
    expect(caught).toBeInstanceOf(VertaaUXError);
    expect((caught as Error).cause).toBeInstanceOf(TypeError);
  });

  it('ConnectionError from timeout carries original AbortError via .cause', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const mockFetch = vi.fn().mockRejectedValueOnce(abortError);
    const client = new HttpClient({
      apiKey: 'test',
      fetch: mockFetch as unknown as typeof fetch,
      maxRetries: 0,
      timeout: 100,
    });

    let caught: unknown;
    try {
      await client.request({ method: 'GET', path: '/test' });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(ConnectionError);
    expect((caught as Error).cause).toBe(abortError);
    expect(((caught as Error).cause as Error).name).toBe('AbortError');
  });

  it('instanceof chain: VertaaUXError + ConnectionError + cause TypeError', async () => {
    const networkError = new TypeError('fetch failed');
    const mockFetch = vi.fn().mockRejectedValue(networkError);
    const client = new HttpClient({
      apiKey: 'test',
      fetch: mockFetch as unknown as typeof fetch,
      maxRetries: 0,
    });

    let caught: unknown;
    try {
      await client.request({ method: 'GET', path: '/test' });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(VertaaUXError);
    expect(caught).toBeInstanceOf(ConnectionError);
    expect((caught as Error).cause).toBeInstanceOf(TypeError);
  });
});
