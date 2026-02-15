/**
 * Security scan tests for the VertaaUX SDK.
 *
 * Ensures that no hardcoded secrets, internal URLs, or private keys
 * are accidentally included in published SDK source files.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, resolve } from 'path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SRC_DIR = resolve(__dirname, '../src');

/**
 * Patterns that should NEVER appear in published SDK source code.
 */
const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'API key prefix (vx_live_*)', pattern: /vx_live_\w{8,}/ },
  { name: 'API key prefix (vx_test_*)', pattern: /vx_test_\w{8,}/ },
  { name: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private key block', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'Internal localhost URL', pattern: /https?:\/\/localhost:\d+/ },
  { name: 'Internal staging URL (staging.vertaaux.ai)', pattern: /staging\.vertaaux\.ai/ },
  { name: 'Internal staging URL (vertaa-staging.vercel.app)', pattern: /vertaa-staging\.vercel\.app/ },
  {
    name: 'Hardcoded Bearer token',
    pattern: /Bearer\s+[a-zA-Z0-9\-._~+/]{20,}=*/,
  },
  {
    name: 'Hardcoded password assignment',
    pattern: /password\s*[:=]\s*["'][^"']{4,}["']/,
  },
];

/**
 * Lines matching these patterns are considered false positives and ignored.
 * Each entry is tested against the full line text.
 */
const ALLOWLIST: RegExp[] = [
  // Header name references (not actual values)
  /X-API-Key/,
  // Template literals with interpolation (dynamic, not hardcoded)
  /Bearer\s+\$\{/,
  // Public production URL is fine
  /https:\/\/vertaaux\.ai(?!.*staging)/,
];

/**
 * Patterns that should not appear outside comments.
 * These get special handling: only flagged if on a non-comment line.
 */
const COMMENT_ONLY_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: 'Direct process.env reference (SDK should use config, not env vars)',
    pattern: /process\.env\.\w+/,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .ts files in a directory.
 */
function collectTsFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (extname(entry) === '.ts') {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Determine if a line is inside a block comment or is a line comment.
 */
function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('/**')
  );
}

/**
 * Check if a line matches any allowlist pattern.
 */
function isAllowlisted(line: string): boolean {
  return ALLOWLIST.some((pattern) => pattern.test(line));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('No Secrets in SDK Source', () => {
  const tsFiles = collectTsFiles(SRC_DIR);

  it('finds .ts source files to scan', () => {
    expect(tsFiles.length).toBeGreaterThan(0);
  });

  // -- Standard secret patterns --
  for (const { name, pattern } of SECRET_PATTERNS) {
    it(`no ${name} in any source file`, () => {
      const violations: string[] = [];

      for (const filePath of tsFiles) {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (pattern.test(line) && !isAllowlisted(line)) {
            const relative = filePath.replace(SRC_DIR + '/', '');
            violations.push(`${relative}:${i + 1}: ${line.trim()}`);
          }
        }
      }

      expect(
        violations,
        `Found ${name} in source files:\n${violations.join('\n')}`
      ).toHaveLength(0);
    });
  }

  // -- Comment-only patterns (process.env etc.) --
  for (const { name, pattern } of COMMENT_ONLY_PATTERNS) {
    it(`no ${name} outside comments`, () => {
      const violations: string[] = [];

      for (const filePath of tsFiles) {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (
            pattern.test(line) &&
            !isCommentLine(line) &&
            !isAllowlisted(line)
          ) {
            const relative = filePath.replace(SRC_DIR + '/', '');
            violations.push(`${relative}:${i + 1}: ${line.trim()}`);
          }
        }
      }

      expect(
        violations,
        `Found ${name} outside comments:\n${violations.join('\n')}`
      ).toHaveLength(0);
    });
  }

  // -- No hardcoded API keys at all (even short ones like vx_test_key) --
  it('no vx_live_ prefixed strings anywhere in source', () => {
    const violations: string[] = [];

    for (const filePath of tsFiles) {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (/vx_live_/.test(lines[i])) {
          const relative = filePath.replace(SRC_DIR + '/', '');
          violations.push(`${relative}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    }

    expect(
      violations,
      `Found vx_live_ prefixed strings:\n${violations.join('\n')}`
    ).toHaveLength(0);
  });
});

// ===========================================================================
// Package.json validation
// ===========================================================================

describe('Package publishing safety', () => {
  const pkgPath = resolve(__dirname, '../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  it('package.json has a "files" field that restricts published content', () => {
    expect(pkg.files).toBeDefined();
    expect(Array.isArray(pkg.files)).toBe(true);
  });

  it('"files" field includes "dist"', () => {
    expect(pkg.files).toContain('dist');
  });

  it('"files" field includes "README.md"', () => {
    expect(pkg.files).toContain('README.md');
  });

  it('"files" field does NOT include source directory', () => {
    expect(pkg.files).not.toContain('src');
    expect(pkg.files).not.toContain('src/');
  });

  it('"files" field does NOT include tests', () => {
    expect(pkg.files).not.toContain('tests');
    expect(pkg.files).not.toContain('tests/');
    expect(pkg.files).not.toContain('test');
    expect(pkg.files).not.toContain('test/');
  });

  it('"files" field does NOT include dot files', () => {
    const dotFiles = pkg.files.filter((f: string) => f.startsWith('.'));
    expect(
      dotFiles,
      `Dot files in "files" field: ${dotFiles.join(', ')}`
    ).toHaveLength(0);
  });

  it('"files" field does NOT include environment files', () => {
    expect(pkg.files).not.toContain('.env');
    expect(pkg.files).not.toContain('.env.local');
    expect(pkg.files).not.toContain('.env.production');
  });

  it('published files are limited to dist and README.md only', () => {
    expect(pkg.files).toEqual(['dist', 'README.md']);
  });
});
