# Changelog

All notable changes to `@vertaaux/sdk` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-05-23

### Added

- **`CallOptions` per-request parameter on every resource method.** New optional final argument accepts `{ signal?: AbortSignal; timeoutMs?: number }`. Callers can now cancel an in-flight request via `signal` or override the global timeout per call via `timeoutMs`. Additive: existing call sites continue to compile and behave identically.
- **`Error#cause` on wrapped errors.** `ConnectionError` thrown from a max-retries failure now carries the last network `TypeError` via `err.cause`. `ConnectionError` thrown from a per-request timeout carries the original `AbortError` via `err.cause`. Inspect with `err.cause instanceof TypeError` or `err.cause instanceof Error`.

### Changed

- **Default request timeout bumped from 30 s to 120 s.** Existing callers that pass an explicit `config.timeout` are unaffected. The previous 30 s default forced consumers running the typical audit poll loop (20-90 s) to either bump `config.timeout` upfront or thread per-request overrides everywhere. The new default matches the audit lifecycle. Per-request overrides via `CallOptions.timeoutMs` work in both directions.

### Migration notes

- `CallOptions` is purely additive. No changes required to existing code.
- If you previously relied on the 30 s default to abort long-running calls, set `config.timeout: 30000` explicitly when constructing the client to preserve the old behavior.
- `err.cause` is now populated on `ConnectionError`. Code that did `console.error(err)` will see the underlying error in the chain output. Avoid logging `err.cause` raw to external systems in production if the underlying message could leak internal infrastructure details (the SDK does not redact for you).

## [2.0.0] - 2026-03-23

Initial public release.

### Added

- Stripe-style resource API: `client.audits`, `client.webhooks`, `client.schedules`, `client.quota`, `client.engines`, `client.patches`, `client.verification`.
- Typed error hierarchy: `VertaaUXError` base, `AuthenticationError`, `RateLimitError`, `NotFoundError`, `ValidationError`, `APIError`, `IdempotencyError`, `ConnectionError`, `PermissionError`.
- `isVertaaUXError` type guard.
- Automatic retries with exponential backoff + jitter on 429 and 5xx responses; honors `Retry-After`.
- Auto-pagination via `client.audits.listAutoPaginate(...)`.
- Dual CJS + ESM build via `tsup`.
- Full TypeScript types.
