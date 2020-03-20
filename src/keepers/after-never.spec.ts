import { noop } from '@proc7ts/call-thru';
import { afterNever } from './after-never';

describe('afterNever', () => {
  it('returns a no-event supply', () => {
    expect(afterNever.to(noop).isOff).toBe(true);
  });
});
