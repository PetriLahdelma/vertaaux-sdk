/**
 * Audits API resource.
 *
 * @module resources/audits
 */

import type { HttpClient } from '../http-client';
import type {
  Audit,
  AuditCreateParams,
  AuditListParams,
  PaginatedResponse,
} from '../types';
import { AutoPaginatingList, autoPaginate, type AutoPaginateConfig } from '../pagination';

/**
 * Options for creating an audit.
 */
export interface AuditCreateOptions {
  /**
   * Idempotency key for safe request retries.
   */
  idempotencyKey?: string;
}

/**
 * Audits API - Create and manage UX audits.
 *
 * @example
 * ```typescript
 * const audit = await client.audits.create({ url: 'https://example.com' });
 *
 * let result = await client.audits.retrieve(audit.job_id);
 * while (result.status === 'running' || result.status === 'queued') {
 *   await new Promise(resolve => setTimeout(resolve, 2000));
 *   result = await client.audits.retrieve(audit.job_id);
 * }
 *
 * if (result.status === 'completed') {
 *   console.log('Score:', result.scores?.overall);
 * }
 * ```
 */
export class AuditsAPI {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a new UX audit for a URL.
   */
  async create(
    params: AuditCreateParams,
    options?: AuditCreateOptions
  ): Promise<Audit> {
    return this.http.request<Audit>({
      method: 'POST',
      path: '/audit',
      body: params,
      idempotencyKey: options?.idempotencyKey,
    });
  }

  /**
   * Get audit status and results by job ID.
   */
  async retrieve(jobId: string): Promise<Audit> {
    return this.http.request<Audit>({
      method: 'GET',
      path: `/audit/${encodeURIComponent(jobId)}`,
    });
  }

  /**
   * List audits with pagination.
   */
  async list(params?: AuditListParams): Promise<PaginatedResponse<Audit>> {
    return this.http.request<PaginatedResponse<Audit>>({
      method: 'GET',
      path: '/audits',
      query: params as Record<string, string | number | undefined>,
    });
  }

  /**
   * Get a single audit by ID.
   */
  async get(id: string): Promise<Audit> {
    return this.http.request<Audit>({
      method: 'GET',
      path: `/audits/${encodeURIComponent(id)}`,
    });
  }

  /**
   * Create an audit with LLM-enhanced analysis.
   */
  async createWithLLM(params: AuditCreateParams): Promise<Audit> {
    return this.http.request<Audit>({
      method: 'POST',
      path: '/llm/audit',
      body: params,
    });
  }

  /**
   * List audits with automatic pagination.
   */
  listAutoPaginate(
    params?: Omit<AuditListParams, 'offset'>,
    config?: AutoPaginateConfig
  ): AutoPaginatingList<Audit> {
    return autoPaginate(
      async (offset, limit) => {
        return this.list({ ...params, offset, limit });
      },
      config
    );
  }
}
