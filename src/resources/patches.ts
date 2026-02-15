/**
 * Patches API resource.
 *
 * @module resources/patches
 */

import type { HttpClient } from '../http-client';
import type { PatchGenerateParams, PatchGenerateResponse } from '../types';

/**
 * Patches API - Generate remediation patches.
 *
 * @example
 * ```typescript
 * const result = await client.patches.generate({
 *   job_id: 'audit_123',
 *   issue_id: 'iss_456',
 *   file_content: '<button>Click me</button>',
 * });
 * ```
 */
export class PatchesAPI {
  constructor(private readonly http: HttpClient) {}

  async generate(params: PatchGenerateParams): Promise<PatchGenerateResponse> {
    return this.http.request<PatchGenerateResponse>({
      method: 'POST',
      path: '/patch',
      body: params,
    });
  }
}
