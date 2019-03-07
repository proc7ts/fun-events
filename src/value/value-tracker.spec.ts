import { ValueTracker } from './value-tracker';
import { EventInterest } from '../event-interest';
import { trackValue } from './tracked-value';
import { OnEvent__symbol } from '../event-sender';
import { AfterEvent__symbol } from '../event-keeper';
import { EventEmitter } from '../event-emitter';
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

  describe('[OnEvent__symbol]', () => {
    it('refers to `on`', () => {
      expect(v1[OnEvent__symbol]).toBe(v1.on);
    });
  });

  describe('[AfterEvent__symbol]', () => {
    it('refers to `read`', () => {
      expect(v1[AfterEvent__symbol]).toBe(v1.read);
    });
  });

  describe('read', () => {

    let mockReceiver: Mock<void, [string]>;
    let interest: EventInterest;

    beforeEach(() => {
      mockReceiver = jest.fn();
      interest = v1.read(mockReceiver);
    });

    it('sends initial value', () => {
      expect(mockReceiver).toHaveBeenCalledWith('old');
    });
    it('sends an updated value', () => {
      v1.it = 'new';
      expect(mockReceiver).toHaveBeenCalledWith('new');
    });
    it('does not send values after interest is off', () => {
      mockReceiver.mockReset();
      interest.off();
      v1.it = 'new';
      expect(mockReceiver).not.toHaveBeenCalled();
    });
  });

  describe('by value keeper', () => {

    let mockReceiver: Mock<void, [string | undefined, string | undefined]>;

    beforeEach(() => {
      mockReceiver = jest.fn();
      v2.on(mockReceiver);
      v2.by(v1);
    });

    it('mirrors another value', () => {
      expect(v2.it).toBe('old');
      expect(mockReceiver).toHaveBeenCalledWith('old', undefined);
    });
    it('reflects changes of another value', () => {
      v1.it = 'new';
      expect(v2.it).toBe('new');
      expect(mockReceiver).toHaveBeenCalledWith('new', 'old');
    });
    it('rebinds to another tracker', () => {

      const v3 = trackValue('another');

      v2.by(v3);
      expect(v2.it).toBe(v3.it);
      expect(mockReceiver).toHaveBeenCalledWith(v3.it, 'old');
    });
    it('ignores changes in previous tracker', () => {

      const v3 = trackValue('another');

      v2.by(v3);
      v1.it = 'value';
      expect(v2.it).toBe(v3.it);
    });
    it('is unbound with `off()`', () => {
      v2.off();

      const listener = jest.fn();

      v2.on(listener);
      v1.it = 'new';
      expect(v2.it).toBe('old');
      expect(listener).not.toBeCalled();
    });
  });

  describe('by nested value keeper', () => {

    let sender: EventEmitter<[ValueTracker<string>]>;

    beforeEach(() => {
      sender = new EventEmitter();
      v1.by(sender, src => src);
    });

    it('binds to sent value', () => {

      const v3 = trackValue('3');

      sender.send(v3);
      expect(v1.it).toBe('3');

      v3.it = '4';
      expect(v1.it).toBe('4');
    });
    it('rebinds to sent value', () => {

      const v3 = trackValue('3');
      const v4 = trackValue('4');

      sender.send(v3);
      expect(v1.it).toBe('3');

      sender.send(v4);
      v3.it = '5';
      expect(v1.it).toBe('4');
    });
    it('is unbound with `off()`', () => {

      const v3 = trackValue('3');

      v1.off();

      const listener = jest.fn();

      v1.on(listener);
      sender.send(v3);
      expect(v1.it).toBe('old');
      expect(listener).not.toBeCalled();
    });
  });
});
