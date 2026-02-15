/**
 * Engines API resource.
 *
 * @module resources/engines
 */

import type { HttpClient } from '../http-client';
import type { EngineListResponse } from '../types';

/**
 * Engines API - List available audit engines.
 *
 * @example
 * ```typescript
 * const { engines } = await client.engines.list();
 * const defaultEngine = engines.find(e => e.default);
 * ```
 */
export class EnginesAPI {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<EngineListResponse> {
    return this.http.request<EngineListResponse>({
      method: 'GET',
      path: '/engines',
    });
  }
}
