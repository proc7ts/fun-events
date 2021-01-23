import { valueProvider } from '@proc7ts/primitives';
import { onNever } from '../senders';
import { isEventSender, OnEvent__symbol } from './event-sender';

describe('isEventSender', () => {
  it('returns `false` for `null`', () => {
    expect(isEventSender(null)).toBe(false);
  });
  it('returns `false` for numbers', () => {
    expect(isEventSender(12)).toBe(false);
  });
  it('returns `false` for strings', () => {
    expect(isEventSender('123')).toBe(false);
  });
  it('returns `false` for object', () => {
    expect(isEventSender({ foo: 'bar' })).toBe(false);
  });
  it('returns `false` for function', () => {
    expect(isEventSender(valueProvider(123))).toBe(false);
  });
  it('returns `false` if `[OnEvent__symbol]` property is not a method', () => {
    expect(isEventSender({ [OnEvent__symbol]: true })).toBe(false);
  });
  it('returns `true` for `OnEvent` instance', () => {
    expect(isEventSender(onNever)).toBe(true);
  });
  it('returns `true` for object with `[OnEvent__symbol]` method', () => {
    expect(isEventSender({ [OnEvent__symbol]: onNever })).toBe(true);
  });
});
