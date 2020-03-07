import { noop } from 'call-thru';
import { afterNever } from './after-never';

describe('afterNever', () => {
  it('returns a no-event supply', () => {
    expect(afterNever(noop).isOff).toBe(true);
  });
});
