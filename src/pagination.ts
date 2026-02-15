/**
 * Auto-pagination utilities for the VertaaUX SDK.
 *
 * @module pagination
 */

import type { PaginatedResponse } from './types';

/**
 * Configuration for auto-paginating list operations.
 */
export interface AutoPaginateConfig {
  /** Items per page (1-100). @default 50 */
  limit?: number;
  /** Maximum total items to fetch across all pages. */
  maxItems?: number;
}

/**
 * Type for a function that fetches a single page of results.
 */
export type PageFetcher<T> = (
  offset: number,
  limit: number
) => Promise<PaginatedResponse<T>>;

/**
 * Async iterable that automatically paginates through API results.
 */
export class AutoPaginatingList<T> implements AsyncIterable<T> {
  private readonly fetchPage: PageFetcher<T>;
  private readonly config: AutoPaginateConfig;

  constructor(fetchPage: PageFetcher<T>, config: AutoPaginateConfig = {}) {
    this.fetchPage = fetchPage;
    this.config = config;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, undefined> {
    const limit = Math.min(this.config.limit ?? 50, 100);
    const maxItems = this.config.maxItems;
    let offset = 0;
    let fetched = 0;

    while (true) {
      const page = await this.fetchPage(offset, limit);

      for (const item of page.data) {
        if (maxItems !== undefined && fetched >= maxItems) {
          return;
        }
        yield item;
        fetched++;
      }

      if (!page.pagination.has_more || page.data.length === 0) {
        return;
      }

      offset += limit;
    }
  }

  async toArray(options: { maxItems: number }): Promise<T[]> {
    const { maxItems } = options;
    const results: T[] = [];
    let count = 0;
    let limitReached = false;

    for await (const item of this) {
      if (count >= maxItems) {
        limitReached = true;
        break;
      }
      results.push(item);
      count++;
    }

    if (limitReached) {
      console.warn(
        `AutoPaginatingList.toArray(): Stopped at maxItems limit (${maxItems}). ` +
          'Use for-await loop for larger datasets or increase maxItems.'
      );
    }

    return results;
  }

  async take(count: number): Promise<T[]> {
    const results: T[] = [];
    let n = 0;

    for await (const item of this) {
      if (n >= count) break;
      results.push(item);
      n++;
    }

    return results;
  }

  async find(predicate: (item: T) => boolean): Promise<T | undefined> {
    for await (const item of this) {
      if (predicate(item)) {
        return item;
      }
    }
    return undefined;
  }

  async some(predicate: (item: T) => boolean): Promise<boolean> {
    for await (const item of this) {
      if (predicate(item)) {
        return true;
      }
    }
    return false;
  }

  async every(predicate: (item: T) => boolean): Promise<boolean> {
    for await (const item of this) {
      if (!predicate(item)) {
        return false;
      }
    }
    return true;
  }

  filter(predicate: (item: T) => boolean): AsyncFilteredList<T> {
    return new AsyncFilteredList(this, predicate);
  }

  map<U>(mapper: (item: T) => U): AsyncMappedList<T, U> {
    return new AsyncMappedList(this, mapper);
  }
}

/** @internal */
export class AsyncFilteredList<T> implements AsyncIterable<T> {
  constructor(
    private readonly source: AsyncIterable<T>,
    private readonly predicate: (item: T) => boolean
  ) {}

  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, undefined> {
    for await (const item of this.source) {
      if (this.predicate(item)) {
        yield item;
      }
    }
  }

  async toArray(options: { maxItems: number }): Promise<T[]> {
    const results: T[] = [];
    let count = 0;
    for await (const item of this) {
      if (count >= options.maxItems) break;
      results.push(item);
      count++;
    }
    return results;
  }
}

/** @internal */
export class AsyncMappedList<T, U> implements AsyncIterable<U> {
  constructor(
    private readonly source: AsyncIterable<T>,
    private readonly mapper: (item: T) => U
  ) {}

  async *[Symbol.asyncIterator](): AsyncGenerator<U, void, undefined> {
    for await (const item of this.source) {
      yield this.mapper(item);
    }
  }

  async toArray(options: { maxItems: number }): Promise<U[]> {
    const results: U[] = [];
    let count = 0;
    for await (const item of this) {
      if (count >= options.maxItems) break;
      results.push(item);
      count++;
    }
    return results;
  }
}

/**
 * Create an auto-paginating list from a page fetcher function.
 */
export function autoPaginate<T>(
  fetchPage: PageFetcher<T>,
  config?: AutoPaginateConfig
): AutoPaginatingList<T> {
  return new AutoPaginatingList(fetchPage, config);
}
