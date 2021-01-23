import { valueProvider } from '@proc7ts/primitives';
import { afterNever } from '../keepers';
import { onNever } from '../senders';
import { AfterEvent__symbol, isEventKeeper } from './event-keeper';
import { OnEvent__symbol } from './event-sender';

describe('isEventKeeper', () => {
  it('returns `false` for `null`', () => {
    expect(isEventKeeper(null)).toBe(false);
  });
  it('returns `false` for numbers', () => {
    expect(isEventKeeper(12)).toBe(false);
  });
  it('returns `false` for strings', () => {
    expect(isEventKeeper('123')).toBe(false);
  });
  it('returns `false` for object', () => {
    expect(isEventKeeper({ foo: 'bar' })).toBe(false);
  });
  it('returns `false` for function', () => {
    expect(isEventKeeper(valueProvider(123))).toBe(false);
  });
  it('returns `false` if `[AfterEvent__symbol]` property is not a method', () => {
    expect(isEventKeeper({ [AfterEvent__symbol]: true })).toBe(false);
  });
  it('returns `true` for `AfterEvent` instance', () => {
    expect(isEventKeeper(afterNever)).toBe(true);
  });
  it('returns `false` for `OnEvent` instance', () => {
    expect(isEventKeeper(onNever)).toBe(false);
  });
  it('returns `true` for object with `[AfterEvent__symbol]` method', () => {
    expect(isEventKeeper({ [AfterEvent__symbol]: afterNever })).toBe(true);
  });
  it('returns `false` for object with `[OnEvent__symbol]` method', () => {
    expect(isEventKeeper({ [OnEvent__symbol]: onNever })).toBe(false);
  });
});
