# VertaaUX SDK

Official TypeScript SDK for [VertaaUX.ai](https://vertaaux.ai) — AI-powered UX and accessibility auditing.

[![npm version](https://img.shields.io/npm/v/vertaaux-sdk.svg)](https://www.npmjs.com/package/vertaaux-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install vertaaux-sdk
```

## Quick Start

```typescript
import { VertaaUX } from 'vertaaux-sdk';

const client = new VertaaUX({ apiKey: process.env.VERTAAUX_API_KEY });

// Run an accessibility audit
const audit = await client.audits.create({
  url: 'https://example.com',
  checks: ['wcag-aa', 'color-contrast', 'keyboard-nav'],
});

console.log(audit.summary);
// → { score: 87, issues: 12, critical: 2 }
```

## Features

- **Accessibility audits** — WCAG 2.1 AA/AAA compliance checks
- **AI-powered analysis** — LLM-assisted issue explanations and fix suggestions
- **Async pipelines** — Queue audits and poll for results
- **CI integration** — Fail builds on accessibility regressions

## API Reference

### `new VertaaUX(config)`

Create a client instance.

```typescript
const client = new VertaaUX({
  apiKey: 'your-api-key',    // Required
  baseUrl: 'https://...',    // Optional, defaults to production API
});
```

### `client.audits.create(options)`

Creates a new audit job.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | Yes | URL to audit |
| `checks` | `string[]` | No | Specific checks to run |
| `viewport` | `{ width, height }` | No | Browser viewport size |
| `waitForSelector` | `string` | No | Wait for element before auditing |

Returns: `Promise<Audit>`

```typescript
const audit = await client.audits.create({
  url: 'https://example.com',
  checks: ['wcag-aa', 'color-contrast'],
  viewport: { width: 1280, height: 720 },
});
```

### `client.audits.get(id)`

Retrieves an audit by ID.

```typescript
const audit = await client.audits.get('audit_abc123');

if (audit.status === 'completed') {
  console.log(audit.issues);
}
```

### `client.audits.list(options)`

Lists audits with pagination.

```typescript
const { data, hasMore } = await client.audits.list({ limit: 10 });
```

## CI Integration

### GitHub Actions

```yaml
name: Accessibility Check

on: [pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Preview
        id: deploy
        run: # your deploy step

      - name: Run VertaaUX Audit
        run: npx vertaaux-sdk audit --url ${{ steps.deploy.outputs.url }} --fail-on critical
        env:
          VERTAAUX_API_KEY: ${{ secrets.VERTAAUX_API_KEY }}
```

### CLI Usage

```bash
# Run audit and output JSON
npx vertaaux-sdk audit --url https://example.com --output json

# Fail if critical issues found
npx vertaaux-sdk audit --url https://example.com --fail-on critical

# Fail if score below threshold
npx vertaaux-sdk audit --url https://example.com --min-score 80
```

## Examples

See [`/examples`](./examples) for complete integration patterns:

- [`basic-audit.ts`](./examples/basic-audit.ts) — Simple audit workflow
- [`ci-integration.ts`](./examples/ci-integration.ts) — CI/CD pipeline integration
- [`batch-audit.ts`](./examples/batch-audit.ts) — Audit multiple URLs

## Error Handling

```typescript
import { VertaaUX, AuthenticationError, RateLimitError } from 'vertaaux-sdk';

try {
  const audit = await client.audits.create({ url: 'https://example.com' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, retry after:', error.retryAfter);
  }
}
```

## TypeScript

Full type definitions included. Key types:

```typescript
import type { Audit, AuditIssue, AuditCreateOptions } from 'vertaaux-sdk';
```

## License

MIT © [Petri Lahdelma](https://github.com/PetriLahdelma)
