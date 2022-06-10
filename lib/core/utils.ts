import fromPairs from 'lodash/fromPairs';
import toPairs from 'lodash/toPairs';

export function isObjectLike(a: unknown): a is Record<string, unknown> {
  return typeof a === 'object';
}

export function clean<T extends Record<string, unknown>>(x: T): T {
  return fromPairs(
    toPairs(x).filter(([_, v]) => v !== undefined && v !== null),
  ) as T;
}
