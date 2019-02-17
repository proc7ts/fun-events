import { eventInterest, EventInterest, noEventInterest } from './event-interest';
import { noop } from 'call-thru';
import Mock = jest.Mock;

describe('EventInterest', () => {
  describe('noEventInterest', () => {
    it('is no-op', () => {
      expect(noEventInterest().off).toBe(noop);
    });
    it('is lost', () => {
      expect(noEventInterest().lost).toBe(true);
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
    it('calls off function at most once', () => {
      interest.off();
      interest.off();
      expect(off).toHaveBeenCalledTimes(1);
    });
    it('is present initially', () => {
      expect(interest.lost).toBe(false);
    });
    it('is lost on calling `off()`', () => {
      interest.off();
      expect(interest.lost).toBe(true);
    });
  });
});
