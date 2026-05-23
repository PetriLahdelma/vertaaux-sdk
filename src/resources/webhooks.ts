/**
 * Webhooks API resource.
 *
 * @module resources/webhooks
 */

import type { HttpClient } from '../http-client';
import type { Webhook, WebhookCreateParams, WebhookListResponse } from '../types';
import type { CallOptions } from '../types/config';

/**
 * Webhooks API - Manage webhook subscriptions.
 *
 * @example
 * ```typescript
 * const webhook = await client.webhooks.create({
 *   url: 'https://api.example.com/webhooks/vertaaux',
 *   secret: 'wh_sec_your_secret_here',
 * });
 * ```
 */
export class WebhooksAPI {
  constructor(private readonly http: HttpClient) {}

  async create(
    params: WebhookCreateParams,
    options?: CallOptions
  ): Promise<Webhook> {
    return this.http.request<Webhook>({
      method: 'POST',
      path: '/webhooks',
      body: params,
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  }

  async list(options?: CallOptions): Promise<WebhookListResponse> {
    return this.http.request<WebhookListResponse>({
      method: 'GET',
      path: '/webhooks',
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  }

  async delete(webhookId: string, options?: CallOptions): Promise<void> {
    await this.http.request<void>({
      method: 'DELETE',
      path: `/webhooks/${encodeURIComponent(webhookId)}`,
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });
  }
}
