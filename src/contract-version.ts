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

/** SHA-256 hash of the live OpenAPI spec at time of last sync. */
export const CONTRACT_SPEC_HASH =
  'sha256:582164db236a6c2c27e56110ccee03c3216e93e6a91caec7f7fba04e2cdef1ce';
