/**
 * Contract version tracking for the VertaaUX SDK.
 *
 * This file records which version of the API spec the SDK was last synced with.
 * CI can compare this hash against the live spec to detect drift.
 *
 * @module contract-version
 */

/** Date when SDK types were last synced with the OpenAPI spec. */
export const CONTRACT_SPEC_VERSION = '2026-02-15';

/** SHA-256 hash of docs/vertaaux-api.yaml at time of last sync. */
export const CONTRACT_SPEC_HASH =
  'sha256:9dc67b161cdedd24d9ce20de5fac9162294fa537964f3f2ab4c04f54a0e57870';
