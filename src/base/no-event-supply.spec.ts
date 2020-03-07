import { eventSupply } from './event-supply';
import { noEventSupply } from './no-event-supply';

describe('noEventSupply', () => {
  it('is no-op', () => {
    expect(noEventSupply().off()).toBe(noEventSupply());
  });
  it('is cut off', () => {
    expect(noEventSupply().isOff).toBe(true);
  });

  describe('whenOff', () => {
    it('calls back immediately', () => {

      const whenOff = jest.fn();

      expect(noEventSupply().whenOff(whenOff)).toBe(noEventSupply());
      expect(whenOff).toHaveBeenCalledWith();
    });
  });

  describe('cuts', () => {
    it('cuts off dependent supply immediately', () => {

      const supply = eventSupply();
      const whenOff = jest.fn();

      supply.whenOff(whenOff);
      expect(noEventSupply().cuts(supply)).toBe(noEventSupply());
      expect(supply.isOff).toBe(true);
      expect(whenOff).toHaveBeenCalledWith(undefined);
    });
  });

  describe('needs', () => {
    it('does not cut off required supply', () => {

      const supply = eventSupply();

      expect(noEventSupply().needs(supply)).toBe(noEventSupply());
      expect(supply.isOff).toBe(false);
    });
  });
});
