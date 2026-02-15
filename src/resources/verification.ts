/**
 * Verification API resource.
 *
 * @module resources/verification
 */

import type { HttpClient } from '../http-client';
import type { VerifyParams, VerifyResponse } from '../types';

/**
 * Verification API - Verify patch effectiveness.
 *
 * @example
 * ```typescript
 * const result = await client.verification.run({
 *   patch: { search: '...', replace: '...', issue_id: 'iss_456' },
 *   url: 'https://example.com',
 *   selector: 'button.submit',
 * });
 * ```
 */
export class VerificationAPI {
  constructor(private readonly http: HttpClient) {}

  async run(params: VerifyParams): Promise<VerifyResponse> {
    return this.http.request<VerifyResponse>({
      method: 'POST',
      path: '/verify',
      body: params,
    });
  }
}
