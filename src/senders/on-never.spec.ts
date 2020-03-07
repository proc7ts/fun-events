import { noop } from 'call-thru';
import { onNever } from './on-never';

describe('onNever', () => {
  it('returns no-event supply', () => {
    expect(onNever(noop).isOff).toBe(true);
  });
});
