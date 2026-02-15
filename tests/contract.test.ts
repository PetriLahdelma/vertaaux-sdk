/**
 * Contract tests for the VertaaUX SDK.
 *
 * Validates that SDK type definitions and resource methods stay in sync
 * with the VertaaUX OpenAPI specification. Uses a vendored YAML snapshot
 * approach so tests can run in CI without hitting the live API.
 *
 * - Enum consistency tests run unconditionally (no fixture needed).
 * - Schema-to-type and resource method coverage tests require the vendored
 *   spec at tests/fixtures/vertaaux-api.yaml and skip gracefully if absent.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// SDK type imports  (TypeScript compilation is the primary contract check)
// ---------------------------------------------------------------------------
import type {
  AuditCreateParams,
  Audit,
  AuditStatus,
  AuditMode,
  Quota,
  WebhookCreateParams,
  Webhook,
  Issue,
  IssueSeverity,
  IssueCategory,
  Schedule,
  Engine,
  Patch,
  PatchConfidenceLabel,
  PatchClassification,
  VerificationResult,
  PlanTier,
} from '../src/types';

// Resource classes — imported to verify method existence at runtime
import { AuditsAPI } from '../src/resources/audits';
import { WebhooksAPI } from '../src/resources/webhooks';
import { SchedulesAPI } from '../src/resources/schedules';
import { QuotaAPI } from '../src/resources/quota';
import { EnginesAPI } from '../src/resources/engines';
import { PatchesAPI } from '../src/resources/patches';
import { VerificationAPI } from '../src/resources/verification';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const FIXTURE_PATH = resolve(__dirname, 'fixtures/vertaaux-api.yaml');
const FIXTURE_EXISTS = existsSync(FIXTURE_PATH);

/**
 * Lazily load and parse the OpenAPI spec YAML.
 * Returns null if the fixture does not exist.
 */
function loadSpec(): Record<string, unknown> | null {
  if (!FIXTURE_EXISTS) return null;
  // Dynamic import so yaml is only required when fixture exists
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parse } = require('yaml') as typeof import('yaml');
  const raw = readFileSync(FIXTURE_PATH, 'utf-8');
  return parse(raw) as Record<string, unknown>;
}

// ===========================================================================
// 1. Enum Consistency (always runs — no fixture required)
// ===========================================================================

describe('Enum Consistency', () => {
  // -- AuditMode --
  describe('AuditMode', () => {
    it('includes basic, standard, deep', () => {
      const valid: AuditMode[] = ['basic', 'standard', 'deep'];
      expect(valid).toHaveLength(3);
      // TypeScript compilation guarantees the union — this confirms values
      valid.forEach((v) => expect(typeof v).toBe('string'));
    });

    it('rejects invalid values at type level (compile-time check)', () => {
      // @ts-expect-error — intentionally invalid value
      const _invalid: AuditMode = 'ultra';
      // Runtime assertion so the variable is used
      expect(_invalid).toBe('ultra');
    });
  });

  // -- AuditStatus --
  describe('AuditStatus', () => {
    it('includes queued, running, completed, failed', () => {
      const valid: AuditStatus[] = ['queued', 'running', 'completed', 'failed'];
      expect(valid).toHaveLength(4);
      valid.forEach((v) => expect(typeof v).toBe('string'));
    });

    it('rejects invalid values at type level', () => {
      // @ts-expect-error — intentionally invalid value
      const _invalid: AuditStatus = 'pending';
      expect(_invalid).toBe('pending');
    });
  });

  // -- IssueSeverity --
  describe('IssueSeverity', () => {
    it('includes error, warning, info', () => {
      const valid: IssueSeverity[] = ['error', 'warning', 'info'];
      expect(valid).toHaveLength(3);
      valid.forEach((v) => expect(typeof v).toBe('string'));
    });

    it('rejects invalid values at type level', () => {
      // @ts-expect-error — intentionally invalid value
      const _invalid: IssueSeverity = 'critical';
      expect(_invalid).toBe('critical');
    });
  });

  // -- IssueCategory --
  describe('IssueCategory', () => {
    it('includes accessibility, ux, information_architecture, performance', () => {
      const valid: IssueCategory[] = [
        'accessibility',
        'ux',
        'information_architecture',
        'performance',
      ];
      expect(valid).toHaveLength(4);
      valid.forEach((v) => expect(typeof v).toBe('string'));
    });

    it('rejects invalid values at type level', () => {
      // @ts-expect-error — intentionally invalid value
      const _invalid: IssueCategory = 'seo';
      expect(_invalid).toBe('seo');
    });
  });

  // -- PlanTier --
  describe('PlanTier', () => {
    it('includes free, pro, agency, enterprise', () => {
      const valid: PlanTier[] = ['free', 'pro', 'agency', 'enterprise'];
      expect(valid).toHaveLength(4);
      valid.forEach((v) => expect(typeof v).toBe('string'));
    });

    it('rejects invalid values at type level', () => {
      // @ts-expect-error — intentionally invalid value
      const _invalid: PlanTier = 'starter';
      expect(_invalid).toBe('starter');
    });
  });

  // -- PatchConfidenceLabel --
  describe('PatchConfidenceLabel', () => {
    it('includes HIGH, MEDIUM, LOW', () => {
      const valid: PatchConfidenceLabel[] = ['HIGH', 'MEDIUM', 'LOW'];
      expect(valid).toHaveLength(3);
      valid.forEach((v) => expect(typeof v).toBe('string'));
    });

    it('rejects invalid values at type level', () => {
      // @ts-expect-error — intentionally invalid value
      const _invalid: PatchConfidenceLabel = 'NONE';
      expect(_invalid).toBe('NONE');
    });
  });

  // -- PatchClassification --
  describe('PatchClassification', () => {
    it('includes safe-apply, needs-review, manual-required', () => {
      const valid: PatchClassification[] = [
        'safe-apply',
        'needs-review',
        'manual-required',
      ];
      expect(valid).toHaveLength(3);
      valid.forEach((v) => expect(typeof v).toBe('string'));
    });

    it('rejects invalid values at type level', () => {
      // @ts-expect-error — intentionally invalid value
      const _invalid: PatchClassification = 'auto-apply';
      expect(_invalid).toBe('auto-apply');
    });
  });
});

// ===========================================================================
// 2. Schema-to-Type Mapping (compile-time + property key checks)
// ===========================================================================

describe('Schema-to-Type Mapping', () => {
  /**
   * Helper: create an object that satisfies the given type and return its keys.
   * TypeScript will catch any property mismatch at compile time.
   */

  it('AuditCreateParams has url, mode, metadata', () => {
    const params: AuditCreateParams = {
      url: 'https://example.com',
      mode: 'deep',
      metadata: { env: 'test' },
    };
    expect(params).toHaveProperty('url');
    expect(params).toHaveProperty('mode');
    expect(params).toHaveProperty('metadata');
  });

  it('Audit has job_id, status, scores, issues, and more', () => {
    const audit: Audit = {
      job_id: 'j_123',
      status: 'completed',
      created_at: '2025-01-01T00:00:00Z',
      progress: 100,
      ruleset_version: '1.0',
      scores: { overall: 85 },
      issues: [],
    };
    expect(audit).toHaveProperty('job_id');
    expect(audit).toHaveProperty('status');
    expect(audit).toHaveProperty('scores');
    expect(audit).toHaveProperty('issues');
    expect(audit).toHaveProperty('created_at');
    expect(audit).toHaveProperty('progress');
    expect(audit).toHaveProperty('ruleset_version');
  });

  it('Quota has plan, credits_total, credits_used, credits_remaining, reset_date', () => {
    const quota: Quota = {
      plan: 'pro',
      credits_total: 1000,
      credits_used: 150,
      credits_remaining: 850,
      reset_date: '2025-02-01T00:00:00Z',
    };
    expect(quota).toHaveProperty('plan');
    expect(quota).toHaveProperty('credits_total');
    expect(quota).toHaveProperty('credits_used');
    expect(quota).toHaveProperty('credits_remaining');
    expect(quota).toHaveProperty('reset_date');
  });

  it('WebhookCreateParams has url, secret', () => {
    const params: WebhookCreateParams = {
      url: 'https://example.com/hook',
      secret: 'wh_secret',
    };
    expect(params).toHaveProperty('url');
    expect(params).toHaveProperty('secret');
  });

  it('Webhook has id, url, created_at', () => {
    const webhook: Webhook = {
      id: 'wh_123',
      url: 'https://example.com/hook',
      created_at: '2025-01-01T00:00:00Z',
    };
    expect(webhook).toHaveProperty('id');
    expect(webhook).toHaveProperty('url');
    expect(webhook).toHaveProperty('created_at');
  });

  it('Issue has id, severity, category, description, recommendation', () => {
    const issue: Issue = {
      id: 'iss_123',
      severity: 'error',
      category: 'accessibility',
      description: 'Missing alt text',
      recommendation: 'Add descriptive alt text',
    };
    expect(issue).toHaveProperty('id');
    expect(issue).toHaveProperty('severity');
    expect(issue).toHaveProperty('category');
    expect(issue).toHaveProperty('description');
    expect(issue).toHaveProperty('recommendation');
  });

  it('Schedule has id, url, mode, cron_expression, name, enabled', () => {
    const schedule: Schedule = {
      id: 'sched_123',
      url: 'https://example.com',
      mode: 'standard',
      cron_expression: '0 9 * * 1',
      name: 'Weekly Audit',
      enabled: true,
      alert_on_fail: false,
      alert_on_score_drop: false,
      created_at: '2025-01-01T00:00:00Z',
    };
    expect(schedule).toHaveProperty('id');
    expect(schedule).toHaveProperty('url');
    expect(schedule).toHaveProperty('mode');
    expect(schedule).toHaveProperty('cron_expression');
    expect(schedule).toHaveProperty('name');
    expect(schedule).toHaveProperty('enabled');
  });

  it('Engine has version, status, default, deprecated', () => {
    const engine: Engine = {
      version: '2.0.0',
      status: 'stable',
      default: true,
      deprecated: false,
      sunset_at: null,
      notes: 'Current production engine',
    };
    expect(engine).toHaveProperty('version');
    expect(engine).toHaveProperty('status');
    expect(engine).toHaveProperty('default');
    expect(engine).toHaveProperty('deprecated');
  });

  it('Patch has search, replace, confidence, classification, explanation', () => {
    const patch: Patch = {
      search: '<img>',
      replace: '<img alt="photo">',
      confidence: { label: 'HIGH', percentage: 95 },
      classification: 'safe-apply',
      explanation: 'Added alt attribute',
    };
    expect(patch).toHaveProperty('search');
    expect(patch).toHaveProperty('replace');
    expect(patch).toHaveProperty('confidence');
    expect(patch).toHaveProperty('classification');
    expect(patch).toHaveProperty('explanation');
  });

  it('VerificationResult has issue_fixed, regressions, score_delta, component_audited, duration_ms', () => {
    const result: VerificationResult = {
      issue_fixed: true,
      regressions: [],
      score_delta: { before: 70, after: 85, delta: 15 },
      component_audited: true,
      duration_ms: 3200,
    };
    expect(result).toHaveProperty('issue_fixed');
    expect(result).toHaveProperty('regressions');
    expect(result).toHaveProperty('score_delta');
    expect(result).toHaveProperty('component_audited');
    expect(result).toHaveProperty('duration_ms');
  });
});

// ===========================================================================
// 3. Resource Method Coverage
// ===========================================================================

describe('Resource Method Coverage', () => {
  it('AuditsAPI has create, retrieve, list methods', () => {
    expect(typeof AuditsAPI.prototype.create).toBe('function');
    expect(typeof AuditsAPI.prototype.retrieve).toBe('function');
    expect(typeof AuditsAPI.prototype.list).toBe('function');
  });

  it('WebhooksAPI has create, list, delete methods', () => {
    expect(typeof WebhooksAPI.prototype.create).toBe('function');
    expect(typeof WebhooksAPI.prototype.list).toBe('function');
    expect(typeof WebhooksAPI.prototype.delete).toBe('function');
  });

  it('SchedulesAPI has create, retrieve, list, update, delete methods', () => {
    expect(typeof SchedulesAPI.prototype.create).toBe('function');
    expect(typeof SchedulesAPI.prototype.retrieve).toBe('function');
    expect(typeof SchedulesAPI.prototype.list).toBe('function');
    expect(typeof SchedulesAPI.prototype.update).toBe('function');
    expect(typeof SchedulesAPI.prototype.delete).toBe('function');
  });

  it('QuotaAPI has retrieve method', () => {
    expect(typeof QuotaAPI.prototype.retrieve).toBe('function');
  });

  it('EnginesAPI has list method', () => {
    expect(typeof EnginesAPI.prototype.list).toBe('function');
  });

  it('PatchesAPI has generate method', () => {
    expect(typeof PatchesAPI.prototype.generate).toBe('function');
  });

  it('VerificationAPI has run method', () => {
    expect(typeof VerificationAPI.prototype.run).toBe('function');
  });
});

// ===========================================================================
// 4. OpenAPI Spec Validation (skipped when fixture is absent)
// ===========================================================================

describe.skipIf(!FIXTURE_EXISTS)(
  'OpenAPI Spec Validation (vendored fixture)',
  () => {
    let spec: Record<string, unknown>;

    beforeAll(() => {
      const loaded = loadSpec();
      if (!loaded) throw new Error('Fixture unexpectedly missing');
      spec = loaded;
    });

    it('spec is a valid OpenAPI 3.x document', () => {
      expect(spec).toHaveProperty('openapi');
      expect(String(spec.openapi).startsWith('3.')).toBe(true);
    });

    it('spec contains expected schema definitions', () => {
      const schemas = (spec.components as Record<string, unknown>)
        ?.schemas as Record<string, unknown> | undefined;
      expect(schemas).toBeDefined();

      const expectedSchemas = [
        'AuditRequest',
        'AuditStatusResponse',
        'QuotaResponse',
        'WebhookRequest',
        'WebhookResponse',
        'Issue',
      ];

      for (const name of expectedSchemas) {
        expect(schemas).toHaveProperty(name);
      }
    });

    it('spec paths cover all SDK resource operations', () => {
      const paths = spec.paths as Record<string, unknown>;
      expect(paths).toBeDefined();

      const expectedPaths = [
        '/audit',
        '/audits',
        '/webhooks',
        '/schedules',
        '/quota',
        '/engines',
        '/patch',
        '/verify',
      ];

      for (const path of expectedPaths) {
        expect(paths).toHaveProperty(path);
      }
    });

    it('AuditRequest schema properties match AuditCreateParams', () => {
      const schemas = (spec.components as Record<string, unknown>)
        ?.schemas as Record<string, Record<string, unknown>>;
      const auditRequest = schemas?.AuditRequest;
      expect(auditRequest).toBeDefined();

      const specProps = Object.keys(
        (auditRequest.properties as Record<string, unknown>) ?? {}
      );
      // SDK AuditCreateParams must include at least: url, mode, metadata
      expect(specProps).toEqual(expect.arrayContaining(['url', 'mode', 'metadata']));
    });

    it('AuditStatusResponse schema properties match Audit type', () => {
      const schemas = (spec.components as Record<string, unknown>)
        ?.schemas as Record<string, Record<string, unknown>>;
      const auditResponse = schemas?.AuditStatusResponse;
      expect(auditResponse).toBeDefined();

      const specProps = Object.keys(
        (auditResponse.properties as Record<string, unknown>) ?? {}
      );
      expect(specProps).toEqual(
        expect.arrayContaining(['job_id', 'status', 'scores', 'issues'])
      );
    });

    it('QuotaResponse schema properties match Quota type', () => {
      const schemas = (spec.components as Record<string, unknown>)
        ?.schemas as Record<string, Record<string, unknown>>;
      const quotaResponse = schemas?.QuotaResponse;
      expect(quotaResponse).toBeDefined();

      const specProps = Object.keys(
        (quotaResponse.properties as Record<string, unknown>) ?? {}
      );
      expect(specProps).toEqual(
        expect.arrayContaining([
          'plan',
          'credits_total',
          'credits_used',
          'credits_remaining',
        ])
      );
    });
  }
);
