import { noop } from '@proc7ts/primitives';
import { onNever } from './on-never';

describe('onNever', () => {
  it('returns no-event supply', () => {
    expect(onNever.to(noop).isOff).toBe(true);
  });
});
