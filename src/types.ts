/**
 * SDK configuration options
 */
export interface VertaaUXConfig {
  /** Your VertaaUX API key */
  apiKey: string;
  /** API base URL (defaults to production) */
  baseUrl?: string;
}

/**
 * Audit status
 */
export type AuditStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Issue severity levels
 */
export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

/**
 * Audit summary statistics
 */
export interface AuditSummary {
  /** Overall accessibility score (0-100) */
  score: number;
  /** Total number of issues found */
  issues: number;
  /** Number of critical issues */
  critical: number;
  /** Number of serious issues */
  serious: number;
  /** Number of moderate issues */
  moderate: number;
  /** Number of minor issues */
  minor: number;
}

/**
 * Individual accessibility issue
 */
export interface AuditIssue {
  /** Unique issue identifier */
  id: string;
  /** Issue severity */
  severity: IssueSeverity;
  /** WCAG rule or check that failed */
  rule: string;
  /** Human-readable description */
  description: string;
  /** CSS selector of affected element */
  selector?: string;
  /** HTML snippet of affected element */
  html?: string;
  /** AI-generated fix suggestion */
  aiSuggestion?: string;
  /** WCAG success criterion reference */
  wcagReference?: string;
}

/**
 * Audit result
 */
export interface Audit {
  /** Unique audit identifier */
  id: string;
  /** URL that was audited */
  url: string;
  /** Current audit status */
  status: AuditStatus;
  /** Summary statistics (available when completed) */
  summary?: AuditSummary;
  /** List of issues found (available when completed) */
  issues?: AuditIssue[];
  /** Error message (available when failed) */
  error?: string;
  /** ISO timestamp when audit was created */
  createdAt: string;
  /** ISO timestamp when audit completed */
  completedAt?: string;
}

/**
 * Options for creating an audit
 */
export interface AuditCreateOptions {
  /** URL to audit */
  url: string;
  /** Specific checks to run (defaults to all) */
  checks?: string[];
  /** Browser viewport size */
  viewport?: {
    width: number;
    height: number;
  };
  /** Wait for this selector before auditing */
  waitForSelector?: string;
  /** Authentication headers to include */
  headers?: Record<string, string>;
  /** Webhook URL for completion notification */
  webhookUrl?: string;
}

/**
 * Options for listing audits
 */
export interface AuditListOptions {
  /** Maximum number of results (default: 20, max: 100) */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
  /** Filter by status */
  status?: AuditStatus;
}

/**
 * Paginated audit list response
 */
export interface AuditListResponse {
  /** List of audits */
  data: Audit[];
  /** Whether more results are available */
  hasMore: boolean;
  /** Cursor for next page */
  nextCursor?: string;
}
