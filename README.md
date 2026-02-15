# VertaaUX SDK

Official TypeScript SDK for [VertaaUX.ai](https://vertaaux.ai) -- AI-powered UX and accessibility auditing.

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

const client = new VertaaUX({ apiKey: process.env.VERTAAUX_API_KEY! });

// Create an audit
const audit = await client.audits.create({
  url: 'https://example.com',
  mode: 'standard',
});

// Poll for results
let result = await client.audits.retrieve(audit.job_id);
while (result.status === 'queued' || result.status === 'running') {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  result = await client.audits.retrieve(audit.job_id);
}

if (result.status === 'completed') {
  console.log('Overall score:', result.scores?.overall);
  console.log('Issues found:', result.issues?.length);
}
```

## Configuration

```typescript
const client = new VertaaUX({
  apiKey: 'vx_test_your_api_key',  // Required. Get yours at https://vertaaux.ai/dashboard/api-keys
  baseUrl: 'https://...',      // Optional. Defaults to https://vertaaux.ai/api/v1
  timeout: 30000,              // Optional. Request timeout in ms (default: 30000)
  maxRetries: 2,               // Optional. Auto-retry on 429/5xx (default: 2)
  fetch: customFetch,          // Optional. Custom fetch implementation
});
```

## Resources

The SDK uses a Stripe-style resource architecture. All resources are accessed as properties on the client instance.

| Resource | Methods | Description |
|----------|---------|-------------|
| `client.audits` | `create`, `retrieve`, `get`, `list`, `createWithLLM`, `listAutoPaginate` | Create, retrieve, and list UX audits |
| `client.webhooks` | `create`, `list`, `delete` | Manage webhook subscriptions for audit events |
| `client.schedules` | `create`, `retrieve`, `list`, `update`, `delete` | Create and manage scheduled recurring audits |
| `client.quota` | `retrieve` | Check API usage and plan limits |
| `client.engines` | `list` | List available audit engine versions |
| `client.patches` | `generate` | Generate remediation patches for issues |
| `client.verification` | `run` | Verify patch effectiveness before applying |

## Auto-Pagination

List endpoints support automatic pagination via `listAutoPaginate()`:

```typescript
// Iterate with for-await
for await (const audit of client.audits.listAutoPaginate({ status: 'completed' })) {
  console.log(audit.job_id, audit.scores?.overall);
}

// Collect into an array
const audits = await client.audits
  .listAutoPaginate({ status: 'completed' })
  .toArray({ maxItems: 100 });
```

## Error Handling

All errors extend `VertaaUXError` and include `type`, `statusCode`, and `requestId` properties.

```typescript
import {
  VertaaUX,
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
} from 'vertaaux-sdk';

try {
  const audit = await client.audits.create({ url: 'https://example.com' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // 401 - Invalid or missing API key
  } else if (error instanceof PermissionError) {
    // 403 - Insufficient permissions
  } else if (error instanceof NotFoundError) {
    // 404 - Resource not found
  } else if (error instanceof ValidationError) {
    // 400 - Invalid request parameters
    console.error(error.param, error.errors);
  } else if (error instanceof RateLimitError) {
    // 429 - Rate limit exceeded
    console.error('Retry after:', error.retryAfter, 'seconds');
  } else if (error instanceof IdempotencyError) {
    // 409 - Idempotency key conflict
  } else if (error instanceof ConnectionError) {
    // Network or timeout error
  } else if (error instanceof APIError) {
    // 5xx - Server error
  }

  // Type guard for any VertaaUX error
  if (isVertaaUXError(error)) {
    console.error(error.type, error.statusCode, error.requestId);
  }
}
```

| Error Class | Status | When |
|-------------|--------|------|
| `AuthenticationError` | 401 | Invalid or missing API key |
| `PermissionError` | 403 | Insufficient permissions for the resource |
| `NotFoundError` | 404 | Audit, webhook, or schedule not found |
| `ValidationError` | 400 | Invalid request parameters |
| `RateLimitError` | 429 | Too many requests (includes `retryAfter`) |
| `IdempotencyError` | 409 | Idempotency key conflict |
| `ConnectionError` | -- | Network failure or request timeout |
| `APIError` | 5xx | Internal server error |
| `VertaaUXError` | -- | Base class for all SDK errors |

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

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install SDK
        run: npm install vertaaux-sdk

      - name: Run VertaaUX Audit
        uses: actions/github-script@v7
        env:
          VERTAAUX_API_KEY: ${{ secrets.VERTAAUX_API_KEY }}
        with:
          script: |
            const { VertaaUX } = require('vertaaux-sdk');
            const client = new VertaaUX({ apiKey: process.env.VERTAAUX_API_KEY });

            const audit = await client.audits.create({
              url: 'https://your-preview-url.com',
              mode: 'standard',
            });

            let result = await client.audits.retrieve(audit.job_id);
            while (result.status === 'queued' || result.status === 'running') {
              await new Promise(r => setTimeout(r, 3000));
              result = await client.audits.retrieve(audit.job_id);
            }

            if (result.status === 'failed') {
              core.setFailed(`Audit failed: ${result.error}`);
              return;
            }

            const score = result.scores?.overall ?? 0;
            console.log(`Score: ${score}/100`);

            if (score < 80) {
              core.setFailed(`Accessibility score ${score} is below threshold 80`);
            }
```

## TypeScript

Full type definitions are included. All API types are exported from the package root:

```typescript
import type {
  Audit,
  AuditCreateParams,
  AuditScores,
  Issue,
  Finding,
  Webhook,
  Schedule,
  Quota,
  Engine,
  Patch,
  VerificationResult,
} from 'vertaaux-sdk';
```

## Examples

See [`/examples`](./examples) for complete integration patterns:

- [`basic-audit.ts`](./examples/basic-audit.ts) -- Simple audit with polling
- [`ci-integration.ts`](./examples/ci-integration.ts) -- CI/CD pipeline with score thresholds
- [`batch-audit.ts`](./examples/batch-audit.ts) -- Audit multiple URLs in parallel

## License

MIT (c) [Petri Lahdelma](https://github.com/PetriLahdelma)
