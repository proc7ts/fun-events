import { describe, expect, it } from '@jest/globals';
import { AfterEvent } from '../after-event';
import { trackValue, ValueTracker } from '../value';
import { afterThe } from './after-the';
import { afterValue } from './after-value';

describe('afterValue', () => {
  it('returns an `AfterEvent` keeper of the given value', async () => {

    const result: AfterEvent<[number]> = afterValue(13);

    expect(await result).toBe(13);
  });
  it('returns the value itself if it is an `AfterEvent` keeper already', () => {

    const value = afterThe(13);

    expect(afterValue(value)).toBe(value);
  });
  it('returns an `AfterEvent` keeper of the given `EventKeeper`', async () => {

    const value = trackValue(13);
    const result: AfterEvent<[ValueTracker<number>]> = afterValue(value);

    expect(await result).toBe(value);
  });
});
