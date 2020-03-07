import { noop } from 'call-thru';
import { eventSupply, EventSupply, eventSupplyOf } from './event-supply';
import { noEventSupply } from './no-event-supply';
import Mock = jest.Mock;

describe('EventSupply', () => {
  describe('noEventSupply', () => {
    it('is no-op', () => {
      expect(noEventSupply().off()).toBe(noEventSupply());
    });
    it('is cut off', () => {
      expect(noEventSupply().isOff).toBe(true);
    });
    it('calls `whenOff` callback immediately', () => {

      const mockWhenDone = jest.fn();

      noEventSupply().whenOff(mockWhenDone);
      expect(mockWhenDone).toHaveBeenCalledWith();
    });
  });

  describe('eventSupplyOf', () => {
    it('of `EventSupply` is the supply itself', () => {

      const supply = eventSupply();

      expect(eventSupplyOf(supply)).toBe(supply);
    });
  });

  describe('eventSupply', () => {

    let mockOff: Mock<void, []>;
    let supply: EventSupply;

    beforeEach(() => {
      mockOff = jest.fn();
      supply = eventSupply(mockOff);
    });

    it('calls `off` function', () => {

      const reason = 'some reason';

      expect(supply.off(reason)).toBe(supply);
      expect(mockOff).toHaveBeenCalledWith(reason);
    });

    describe('isOff', () => {
      it('is set to `false` initially', () => {
        expect(supply.isOff).toBe(false);
      });
      it('is set to `true` when supply is cut off', () => {
        supply.off();
        expect(supply.isOff).toBe(true);
      });
    });

    describe('whenOff', () => {
      it('returns `this` instance', () => {
        expect(supply.whenOff(noop)).toBe(supply);
      });
      it('calls registered callback', () => {

        const mockCallback = jest.fn();
        const reason = 'reason';

        supply.whenOff(mockCallback);
        supply.off(reason);
        expect(mockCallback).toHaveBeenCalledWith(reason);
      });
      it('calls registered callback only once', () => {

        const mockCallback = jest.fn();
        const reason1 = 'reason1';
        const reason2 = 'reason2';

        supply.whenOff(mockCallback);
        supply.off(reason1);
        supply.off(reason2);
        expect(mockCallback).toHaveBeenCalledWith(reason1);
        expect(mockCallback).not.toHaveBeenCalledWith(reason2);
        expect(mockCallback).toHaveBeenCalledTimes(1);
      });
      it('calls registered callback when supply is cut off', () => {

        const mockCallback = jest.fn();

        supply.whenOff(mockCallback);
        supply.off();
        expect(mockCallback).toHaveBeenCalledWith(undefined);
      });
      it('calls registered callback immediately if supply is cut off already', () => {

        const reason = 'reason';

        supply.off(reason);

        const mockCallback = jest.fn();

        supply.whenOff(mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(reason);
      });
    });

    describe('needs', () => {
      it('is cut off when required supply is cut off', () => {

        const mockCallback = jest.fn();
        const mockOtherOff = jest.fn();
        const anotherSupply = eventSupply(mockOtherOff);

        expect(supply.needs(anotherSupply)).toBe(supply);
        supply.whenOff(mockCallback);

        const reason = 'some reason';

        anotherSupply.off(reason);
        expect(mockCallback).toHaveBeenCalledWith(reason);
      });
    });
  });
});
