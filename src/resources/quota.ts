/**
 * Quota API resource.
 *
 * @module resources/quota
 */

import type { HttpClient } from '../http-client';
import type { Quota } from '../types';

/**
 * Quota API - Check usage and limits.
 *
 * @example
 * ```typescript
 * const quota = await client.quota.retrieve();
 * console.log(`Used: ${quota.credits_used}/${quota.credits_total}`);
 * ```
 */
export class QuotaAPI {
  constructor(private readonly http: HttpClient) {}

  async retrieve(): Promise<Quota> {
    return this.http.request<Quota>({
      method: 'GET',
      path: '/quota',
    });
  }
}
