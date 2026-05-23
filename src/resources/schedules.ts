/**
 * Schedules API resource.
 *
 * @module resources/schedules
 */

import type { HttpClient } from '../http-client';
import type {
  Schedule,
  ScheduleCreateParams,
  ScheduleUpdateParams,
  ScheduleListParams,
  ScheduleListResponse,
  ScheduleCreateResponse,
} from '../types';
import type { CallOptions } from '../types/config';

/**
 * Schedules API - Create and manage scheduled audits.
 *
 * @example
 * ```typescript
 * const { schedule } = await client.schedules.create({
 *   url: 'https://example.com',
 *   name: 'Weekly Audit',
 *   cron_expression: '0 9 * * 1',
 * });
 * ```
 */
export class SchedulesAPI {
  constructor(private readonly http: HttpClient) {}

  async create(
    params: ScheduleCreateParams,
    options?: CallOptions
  ): Promise<ScheduleCreateResponse> {
    return this.http.request<ScheduleCreateResponse>({
      method: 'POST',
      path: '/schedules',
      body: params,
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  }

  async retrieve(scheduleId: string, options?: CallOptions): Promise<Schedule> {
    return this.http.request<Schedule>({
      method: 'GET',
      path: `/schedules/${encodeURIComponent(scheduleId)}`,
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  }

  async list(
    params?: ScheduleListParams,
    options?: CallOptions
  ): Promise<ScheduleListResponse> {
    return this.http.request<ScheduleListResponse>({
      method: 'GET',
      path: '/schedules',
      query: params as Record<string, string | boolean | undefined>,
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  }

  async update(
    scheduleId: string,
    params: ScheduleUpdateParams,
    options?: CallOptions
  ): Promise<Schedule> {
    return this.http.request<Schedule>({
      method: 'PATCH',
      path: `/schedules/${encodeURIComponent(scheduleId)}`,
      body: params,
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  }

  async delete(scheduleId: string, options?: CallOptions): Promise<void> {
    await this.http.request<void>({
      method: 'DELETE',
      path: `/schedules/${encodeURIComponent(scheduleId)}`,
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  }
}
