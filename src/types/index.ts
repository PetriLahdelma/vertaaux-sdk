/**
 * API types for the VertaaUX SDK.
 *
 * @module types
 */

// Re-export config types
export type { VertaaUXConfig, RequestOptions } from './config';

// =============================================================================
// Audit Types
// =============================================================================

/**
 * Audit job status.
 */
export type AuditStatus = 'queued' | 'running' | 'completed' | 'failed';

/**
 * Audit depth mode.
 */
export type AuditMode = 'basic' | 'standard' | 'deep';

/**
 * Issue severity levels.
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Issue category domains.
 */
export type IssueCategory =
  | 'accessibility'
  | 'ux'
  | 'information_architecture'
  | 'performance';

/**
 * Audit scores for each category.
 */
export interface AuditScores {
  overall?: number;
  ux?: number;
  accessibility?: number;
  information_architecture?: number;
  performance?: number;
}

/**
 * Individual issue found during audit.
 */
export interface Issue {
  /** Unique issue identifier */
  id: string;
  /** Issue severity level */
  severity: IssueSeverity;
  /** Issue category domain */
  category: IssueCategory;
  /** Description of the issue */
  description: string;
  /** Recommendation for fixing the issue */
  recommendation: string;
  /** WCAG reference if accessibility issue */
  wcag_reference?: string;
  /** CSS selector for affected element */
  selector?: string;
  /** HTML snippet of the element */
  element?: string;
}

/**
 * Rule output from audit engine.
 */
export interface RuleOutput {
  /** Whether the rule passed */
  passed: boolean;
  /** Severity if failed */
  severity: IssueSeverity;
  /** Category of the rule */
  category: string;
  /** WCAG criteria references */
  wcag_criteria?: string[];
}

/**
 * Evidence bundle for a finding.
 */
export interface EvidenceBundle {
  /** Screenshot URL or base64 data */
  screenshot?: string;
  /** DOM snapshot */
  dom_snapshot?: string;
  /** CSS selector */
  selector?: string;
  /** Raw element HTML */
  element_html?: string;
  /** Performance trace URL */
  trace_url?: string;
  /** HAR file URL */
  har_url?: string;
  /** Computed CSS styles */
  computed_styles?: Record<string, string>;
}

/**
 * LLM inference for a finding.
 */
export interface Inference {
  /** Confidence score 0-100 */
  confidence: number;
  /** Reasoning explanation */
  reasoning: string;
  /** Model used for inference */
  model?: string;
}

/**
 * Recommendation for fixing a finding.
 */
export interface Recommendation {
  /** Summary of the fix */
  summary: string;
  /** Detailed steps to fix */
  detailed_steps?: string[];
  /** Code suggestion */
  code_suggestion?: string;
  /** Reference links */
  references?: string[];
}

/**
 * Complete finding with evidence and recommendations.
 */
export interface Finding {
  /** Stable finding ID */
  id: string;
  /** Rule that generated this finding */
  rule_id: string;
  /** Raw rule output */
  rule_output: RuleOutput;
  /** Evidence bundle */
  evidence: EvidenceBundle;
  /** LLM inference if available */
  inference?: Inference;
  /** Remediation recommendation */
  recommendation?: Recommendation;
  /** URL where finding was detected */
  url: string;
}

/**
 * Audit job response from API.
 */
export interface Audit {
  /** Unique job identifier */
  job_id: string;
  /** Current status */
  status: AuditStatus;
  /** URL being audited */
  url?: string;
  /** Audit mode */
  mode?: AuditMode;
  /** Job creation timestamp (ISO 8601) */
  created_at?: string;
  /** When analysis began */
  started_at?: string;
  /** When analysis completed */
  completed_at?: string;
  /** When analysis failed */
  failed_at?: string;
  /** Completion percentage 0-100 */
  progress?: number;
  /** Version of ruleset used */
  ruleset_version?: string;
  /** Audit scores (present if completed) */
  scores?: AuditScores;
  /** Legacy issues array (present if completed) */
  issues?: Issue[];
  /** New findings array with evidence (present if completed) */
  findings?: Finding[];
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Error message (present if failed) */
  error?: string;
  /** Engine version used */
  engine_version?: string;
  /** Whether this is a sandbox audit */
  sandbox?: boolean;
}

/**
 * Parameters for creating an audit.
 */
export interface AuditCreateParams {
  /** URL to audit (http/https) */
  url: string;
  /** Audit depth mode */
  mode?: AuditMode;
  /** Custom metadata to attach to audit */
  metadata?: Record<string, unknown>;
  /** Fail if overall score below this threshold */
  fail_on_score?: number;
  /** Fail if score drops by this amount from baseline */
  fail_on_drop?: number;
  /** Request timeout in ms */
  timeout?: number;
  /** Custom user agent */
  user_agent?: string;
  /** Specific engine version to use */
  engine_version?: string;
}

/**
 * Parameters for listing audits.
 */
export interface AuditListParams {
  /** Maximum results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Filter by status */
  status?: AuditStatus;
}

// =============================================================================
// Webhook Types
// =============================================================================

/**
 * Webhook subscription response.
 */
export interface Webhook {
  /** Webhook ID */
  id: string;
  /** Registered endpoint URL */
  url: string;
  /** Registration timestamp (ISO 8601) */
  created_at: string;
}

/**
 * Parameters for creating a webhook.
 */
export interface WebhookCreateParams {
  /** HTTPS endpoint URL for webhook delivery */
  url: string;
  /** Secret for HMAC-SHA256 signature verification */
  secret: string;
}

/**
 * Webhook list response.
 */
export interface WebhookListResponse {
  webhooks: Webhook[];
}

// =============================================================================
// Schedule Types
// =============================================================================

/**
 * Schedule run record.
 */
export interface ScheduleRun {
  /** Run ID */
  id: string;
  /** Run status */
  status: AuditStatus;
  /** Overall score */
  score?: number;
  /** Score change from previous run */
  score_delta?: number;
  /** Run start time (ISO 8601) */
  started_at: string;
  /** Run completion time (ISO 8601) */
  completed_at?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Scheduled audit configuration.
 */
export interface Schedule {
  /** Schedule ID */
  id: string;
  /** URL to audit */
  url: string;
  /** Audit mode */
  mode: AuditMode;
  /** Cron expression */
  cron_expression: string;
  /** Human-readable name */
  name: string;
  /** Whether schedule is active */
  enabled: boolean;
  /** Alert on audit failure */
  alert_on_fail: boolean;
  /** Alert on score drop */
  alert_on_score_drop: boolean;
  /** Score threshold for alerts */
  score_threshold?: number;
  /** Webhook URL for notifications */
  webhook_url?: string;
  /** Email recipients for alerts */
  email_recipients?: string;
  /** Last run timestamp (ISO 8601) */
  last_run_at?: string | null;
  /** Next scheduled run (ISO 8601) */
  next_run_at?: string | null;
  /** Creation timestamp (ISO 8601) */
  created_at: string;
  /** Recent runs */
  recent_runs?: ScheduleRun[];
}

/**
 * Parameters for creating a schedule.
 */
export interface ScheduleCreateParams {
  /** URL to audit */
  url: string;
  /** Audit mode */
  mode?: AuditMode;
  /** Cron expression (e.g., '0 9 * * 1' for Mondays at 9am) */
  cron_expression: string;
  /** Human-readable name */
  name: string;
  /** Whether schedule is active */
  enabled?: boolean;
  /** Alert on audit failure */
  alert_on_fail?: boolean;
  /** Alert on score drop */
  alert_on_score_drop?: boolean;
  /** Score threshold for alerts */
  score_threshold?: number;
  /** Webhook URL for notifications */
  webhook_url?: string;
  /** Comma-separated email recipients */
  email_recipients?: string;
  /** Organization ID if applicable */
  organization_id?: string;
}

/**
 * Parameters for updating a schedule.
 */
export interface ScheduleUpdateParams {
  /** URL to audit */
  url?: string;
  /** Audit mode */
  mode?: AuditMode;
  /** Cron expression */
  cron_expression?: string;
  /** Human-readable name */
  name?: string;
  /** Whether schedule is active */
  enabled?: boolean;
  /** Alert on audit failure */
  alert_on_fail?: boolean;
  /** Alert on score drop */
  alert_on_score_drop?: boolean;
  /** Score threshold for alerts */
  score_threshold?: number;
  /** Webhook URL for notifications */
  webhook_url?: string;
  /** Email recipients for alerts */
  email_recipients?: string;
}

/**
 * Parameters for listing schedules.
 */
export interface ScheduleListParams {
  /** Filter by organization */
  organization_id?: string;
  /** Filter by enabled status */
  enabled?: boolean;
}

/**
 * Schedule list response.
 */
export interface ScheduleListResponse {
  schedules: Schedule[];
}

/**
 * Schedule create response.
 */
export interface ScheduleCreateResponse {
  schedule: Schedule;
}

// =============================================================================
// Quota Types
// =============================================================================

/**
 * User plan tier.
 */
export type PlanTier = 'free' | 'pro' | 'agency' | 'enterprise';

/**
 * Quota and usage information.
 */
export interface Quota {
  /** Current subscription plan */
  plan: PlanTier;
  /** Total credits in current period */
  credits_total: number;
  /** Credits consumed */
  credits_used: number;
  /** Credits remaining */
  credits_remaining: number;
  /** When quota resets (ISO 8601) */
  reset_date: string;
}

// =============================================================================
// Engine Types
// =============================================================================

/**
 * Audit engine version.
 */
export interface Engine {
  /** Engine version identifier */
  version: string;
  /** Engine status */
  status: 'stable' | 'supported' | 'deprecated';
  /** Whether this is the default engine */
  default: boolean;
  /** Whether engine is deprecated */
  deprecated: boolean;
  /** Sunset date if applicable (ISO 8601) */
  sunset_at: string | null;
  /** Notes about this engine */
  notes: string;
}

/**
 * Engine list response.
 */
export interface EngineListResponse {
  engines: Engine[];
}

// =============================================================================
// Patch Types
// =============================================================================

/**
 * Patch confidence level.
 */
export type PatchConfidenceLabel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Patch classification.
 */
export type PatchClassification =
  | 'safe-apply'
  | 'needs-review'
  | 'manual-required';

/**
 * Patch confidence information.
 */
export interface PatchConfidence {
  /** Confidence label */
  label: PatchConfidenceLabel;
  /** Confidence percentage 0-100 */
  percentage: number;
}

/**
 * Generated patch for an issue.
 */
export interface Patch {
  /** Code to search for (original) */
  search: string;
  /** Code to replace with (fixed) */
  replace: string;
  /** Patch confidence */
  confidence: PatchConfidence;
  /** Patch classification */
  classification: PatchClassification;
  /** Explanation of the fix */
  explanation: string;
}

/**
 * Parameters for generating a patch.
 */
export interface PatchGenerateParams {
  /** Audit job ID */
  job_id: string;
  /** Issue ID to fix */
  issue_id: string;
  /** File path (optional) */
  file_path?: string;
  /** Source code content */
  file_content?: string;
}

/**
 * Patch generation response.
 */
export interface PatchGenerateResponse {
  success: boolean;
  patch?: Patch;
  error?: {
    code: string;
    message: string;
  };
  timing_ms: number;
}

// =============================================================================
// Verification Types
// =============================================================================

/**
 * Regression found during verification.
 */
export interface Regression {
  /** Rule ID that regressed */
  rule_id: string;
  /** Impact level */
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  /** Description of the regression */
  description: string;
  /** Affected nodes count */
  nodes: number;
}

/**
 * Score delta from verification.
 */
export interface ScoreDelta {
  /** Score before patch */
  before: number;
  /** Score after patch */
  after: number;
  /** Score change (positive is improvement) */
  delta: number;
}

/**
 * Verification result.
 */
export interface VerificationResult {
  /** Whether the target issue was fixed */
  issue_fixed: boolean;
  /** Any regressions introduced */
  regressions: Regression[];
  /** Score comparison */
  score_delta: ScoreDelta;
  /** Component that was audited */
  component_audited: boolean;
  /** Verification duration in ms */
  duration_ms: number;
  /** Error message if verification had issues */
  error?: string;
}

/**
 * Patch input for verification.
 */
export interface VerifyPatchInput {
  /** Code to search for */
  search: string;
  /** Code to replace with */
  replace: string;
  /** Issue ID being fixed */
  issue_id: string;
  /** File path */
  file_path?: string;
}

/**
 * Parameters for running verification.
 */
export interface VerifyParams {
  /** Patch to verify */
  patch: VerifyPatchInput;
  /** URL to test against */
  url: string;
  /** Selector for the element being fixed */
  selector: string;
  /** Original rule ID */
  rule_id?: string;
  /** Verification timeout in ms */
  timeout_ms?: number;
}

/**
 * Verification response.
 */
export interface VerifyResponse {
  success: boolean;
  verification?: VerificationResult;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// =============================================================================
// Pagination Types
// =============================================================================

/**
 * Pagination metadata.
 */
export interface Pagination {
  /** Total number of items */
  total: number;
  /** Items per page */
  limit: number;
  /** Current offset */
  offset: number;
  /** Whether there are more items */
  has_more: boolean;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  /** Data items */
  data: T[];
  /** Pagination metadata */
  pagination: Pagination;
}
