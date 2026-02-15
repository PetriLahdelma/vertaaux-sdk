/**
 * vertaaux-sdk - Official VertaaUX SDK for Node.js
 *
 * A Stripe-style resource-based API client for UX auditing and remediation.
 *
 * @example
 * ```typescript
 * import { VertaaUX } from 'vertaaux-sdk';
 *
 * const client = new VertaaUX({ apiKey: process.env.VERTAAUX_API_KEY });
 * const audit = await client.audits.create({ url: 'https://example.com' });
 * ```
 *
 * @packageDocumentation
 */

// Main client export
export { VertaaUX } from './client';

// Configuration types
export type { VertaaUXConfig } from './types/config';

// Error classes
export {
  VertaaUXError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  APIError,
  IdempotencyError,
  ConnectionError,
  PermissionError,
  isVertaaUXError,
} from './errors';

// Pagination utilities
export {
  AutoPaginatingList,
  autoPaginate,
  type AutoPaginateConfig,
  type PageFetcher,
} from './pagination';

// API types
export type {
  // Audit types
  Audit,
  AuditStatus,
  AuditMode,
  AuditCreateParams,
  AuditListParams,
  AuditScores,
  Issue,
  IssueSeverity,
  IssueCategory,
  Finding,
  RuleOutput,
  EvidenceBundle,
  Inference,
  Recommendation,
  // Webhook types
  Webhook,
  WebhookCreateParams,
  WebhookListResponse,
  // Schedule types
  Schedule,
  ScheduleRun,
  ScheduleCreateParams,
  ScheduleUpdateParams,
  ScheduleListParams,
  ScheduleListResponse,
  ScheduleCreateResponse,
  // Quota types
  Quota,
  PlanTier,
  // Engine types
  Engine,
  EngineListResponse,
  // Patch types
  Patch,
  PatchConfidence,
  PatchConfidenceLabel,
  PatchClassification,
  PatchGenerateParams,
  PatchGenerateResponse,
  // Verification types
  VerificationResult,
  VerifyParams,
  VerifyResponse,
  VerifyPatchInput,
  Regression,
  ScoreDelta,
  // Pagination types
  Pagination,
  PaginatedResponse,
} from './types';
