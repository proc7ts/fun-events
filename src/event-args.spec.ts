import { EventArgs } from './event-args';

describe('EventArgs', () => {
  describe('is', () => {
    it('detects event args', () => {
      expect(EventArgs.is({ [EventArgs.args]: [1, 2, 3] })).toBe(true);
    });
    it('rejects non-objects', () => {
      expect(EventArgs.is(1)).toBe(false);
    });
    it('rejects non-event args', () => {
      expect(EventArgs.is({ foo: 'bar' })).toBe(false);
    });
  });
  describe('of', () => {
    it('extracts event args', () => {

      const args: EventArgs<[number, number, boolean, string]> = {
        [EventArgs.args]: [1, 2, false, 'ok'],
      };

      expect(EventArgs.of(args)).toEqual(args[EventArgs.args]);
    });
    it('constructs event args', () => {

      const args = [1, 2, false, 'ok'];

      expect(EventArgs.of(args)).toEqual([args]);
    });
  });
});
