/**
 * Main VertaaUX client with Stripe-style resource architecture.
 */

import { HttpClient } from './http-client';
import type { VertaaUXConfig } from './types/config';
import {
  AuditsAPI,
  WebhooksAPI,
  SchedulesAPI,
  QuotaAPI,
  EnginesAPI,
  PatchesAPI,
  VerificationAPI,
} from './resources';

/**
 * The main VertaaUX API client.
 *
 * @example
 * ```typescript
 * import { VertaaUX } from 'vertaaux-sdk';
 *
 * const client = new VertaaUX({
 *   apiKey: process.env.VERTAAUX_API_KEY!,
 * });
 *
 * const audit = await client.audits.create({ url: 'https://example.com' });
 * ```
 */
export class VertaaUX {
  private readonly httpClient: HttpClient;

  /** Audits API - Create, retrieve, and list UX audits. */
  readonly audits: AuditsAPI;

  /** Webhooks API - Manage webhook subscriptions for audit events. */
  readonly webhooks: WebhooksAPI;

  /** Schedules API - Create and manage scheduled recurring audits. */
  readonly schedules: SchedulesAPI;

  /** Quota API - Check API usage and limits. */
  readonly quota: QuotaAPI;

  /** Engines API - List available audit engines. */
  readonly engines: EnginesAPI;

  /** Patches API - Generate remediation patches for issues. */
  readonly patches: PatchesAPI;

  /** Verification API - Verify remediation effectiveness. */
  readonly verification: VerificationAPI;

  constructor(config: VertaaUXConfig) {
    this.httpClient = new HttpClient(config);

    this.audits = new AuditsAPI(this.httpClient);
    this.webhooks = new WebhooksAPI(this.httpClient);
    this.schedules = new SchedulesAPI(this.httpClient);
    this.quota = new QuotaAPI(this.httpClient);
    this.engines = new EnginesAPI(this.httpClient);
    this.patches = new PatchesAPI(this.httpClient);
    this.verification = new VerificationAPI(this.httpClient);
  }
}
