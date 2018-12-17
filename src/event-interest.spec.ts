import { EventInterest } from './event-interest';
import { noop } from 'call-thru';

describe('EventInterest', () => {
  describe('none', () => {
    it('is no-op', () => {
      expect(EventInterest.none.off).toBe(noop);
    });
  });
});
