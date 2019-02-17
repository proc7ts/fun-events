import { eventInterest, EventInterest, noEventInterest } from './event-interest';
import { noop } from 'call-thru';
import Mock = jest.Mock;

describe('EventInterest', () => {
  describe('noEventInterest', () => {
    it('is no-op', () => {
      expect(noEventInterest().off).toBe(noop);
    });
  });
  describe('eventInterest', () => {

    let off: Mock<void, []>;
    let interest: EventInterest;

    beforeEach(() => {
      off = jest.fn();
      interest = eventInterest(off);
    });

    it('calls off function', () => {
      interest.off();
      expect(off).toHaveBeenCalledWith();
      expect(off.mock.instances[0]).toBe(interest);
    });
  });
});
