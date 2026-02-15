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

  async create(params: ScheduleCreateParams): Promise<ScheduleCreateResponse> {
    return this.http.request<ScheduleCreateResponse>({
      method: 'POST',
      path: '/schedules',
      body: params,
    });
  }

  async retrieve(scheduleId: string): Promise<Schedule> {
    return this.http.request<Schedule>({
      method: 'GET',
      path: `/schedules/${encodeURIComponent(scheduleId)}`,
    });
  }

  async list(params?: ScheduleListParams): Promise<ScheduleListResponse> {
    return this.http.request<ScheduleListResponse>({
      method: 'GET',
      path: '/schedules',
      query: params as Record<string, string | boolean | undefined>,
    });
  }

  async update(
    scheduleId: string,
    params: ScheduleUpdateParams
  ): Promise<Schedule> {
    return this.http.request<Schedule>({
      method: 'PATCH',
      path: `/schedules/${encodeURIComponent(scheduleId)}`,
      body: params,
    });
  }

  async delete(scheduleId: string): Promise<void> {
    await this.http.request<void>({
      method: 'DELETE',
      path: `/schedules/${encodeURIComponent(scheduleId)}`,
    });
  }
}
