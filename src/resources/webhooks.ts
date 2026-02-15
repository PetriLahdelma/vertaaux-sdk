/**
 * Webhooks API resource.
 *
 * @module resources/webhooks
 */

import type { HttpClient } from '../http-client';
import type { Webhook, WebhookCreateParams, WebhookListResponse } from '../types';

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

  async create(params: WebhookCreateParams): Promise<Webhook> {
    return this.http.request<Webhook>({
      method: 'POST',
      path: '/webhooks',
      body: params,
    });
  }

  async list(): Promise<WebhookListResponse> {
    return this.http.request<WebhookListResponse>({
      method: 'GET',
      path: '/webhooks',
    });
  }

  async delete(webhookId: string): Promise<void> {
    await this.http.request<void>({
      method: 'DELETE',
      path: `/webhooks/${encodeURIComponent(webhookId)}`,
    });
  }
}
