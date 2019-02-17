import { ValueTracker } from './value-tracker';
import { EventInterest } from '../event-interest';
import { trackValue } from './tracked-value';
import { onEventKey } from '../event-source';
import { afterEventKey } from '../cached-event-source';
import Mock = jest.Mock;

describe('ValueTracker', () => {

  let v1: ValueTracker<string>;
  let v2: ValueTracker<string | undefined>;

  beforeEach(() => {
    v1 = trackValue('old');
    v2 = trackValue();
  });

  it('is initialized', () => {
    expect(v2.it).toBeUndefined();
    expect(v1.it).toBe('old');
  });
  it('does not report unchanged value', () => {

    const listener = jest.fn();

    v1.on(listener);
    v1.it = v1.it;

    expect(listener).not.toHaveBeenCalled();
  });
  describe('[onEventKey]', () => {
    it('refers to `on`', () => {
      expect(v1[onEventKey]).toBe(v1.on);
    });
  });
  describe('[afterEventKey]', () => {
    it('refers to `each`', () => {
      expect(v1[afterEventKey]).toBe(v1.each);
    });
  });
  describe('each', () => {

    let consumer: Mock;
    let interest: EventInterest;

    beforeEach(() => {
      consumer = jest.fn();
      interest = v1.each(consumer);
    });

    it('notifies on initial value', () => {
      expect(consumer).toHaveBeenCalledWith('old');
    });
    it('notifies on updated value', () => {
      v1.it = 'new';
      expect(consumer).toHaveBeenCalledWith('new');
    });
    it('does not notify after interest is off', () => {
      consumer.mockReset();
      interest.off();
      v1.it = 'new';
      expect(consumer).not.toHaveBeenCalled();
    });
  });
  describe('by', () => {

    let consumer: Mock;

    beforeEach(() => {
      consumer = jest.fn();
      v2.on(consumer);
      v2.by(v1);
    });

    it('mirrors another value', () => {
      expect(v2.it).toBe('old');
      expect(consumer).toHaveBeenCalledWith('old', undefined);
    });
    it('reflects changes of another value', () => {
      v1.it = 'new';
      expect(v2.it).toBe('new');
      expect(consumer).toHaveBeenCalledWith('new', 'old');
    });
    it('rebinds to another source', () => {

      const v3 = trackValue('another');

      v2.by(v3);
      expect(v2.it).toBe(v3.it);
      expect(consumer).toHaveBeenCalledWith(v3.it, 'old');
    });
    it('ignores changes in previous source', () => {

      const v3 = trackValue('another');

      v2.by(v3);
      v1.it = 'value';
      expect(v2.it).toBe(v3.it);
    });
  });
  describe('off', () => {
    beforeEach(() => {

      v2.by(v1);
    });

    it('unbinds from the source', () => {
      v2.off();

      const listener = jest.fn();

      v2.on(listener);
      v1.it = 'new';
      expect(v2.it).toBe('old');
      expect(listener).not.toBeUndefined();
    });
  });
});
