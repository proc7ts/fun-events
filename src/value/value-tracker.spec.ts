import { noop } from 'call-thru';
import { EventEmitter } from '../event-emitter';
import { EventInterest } from '../event-interest';
import { AfterEvent__symbol, EventKeeper } from '../event-keeper';
import { EventSender, OnEvent__symbol } from '../event-sender';
import { trackValue } from './track-value';
import { ValueTracker } from './value-tracker';
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
    // noinspection SillyAssignmentJS
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

  describe('recurrent update', () => {
    it('is supported', () => {
      v1.read(function (value) {
        v1.it = value + '!';
        this.afterRecurrent(noop);
      });
      v1.it = 'new';
      expect(v1.it).toBe('new!');
    });
    it('is supported for initial value', () => {
      v1.read.once(function (value) {
        this.afterRecurrent(noop);
        v1.it = value + '!';
      });
      expect(v1.it).toBe('old!');
    });
  });

  describe('by value sender', () => {

    let src: EventEmitter<[string]>;
    let mockReceiver: Mock<void, [string | undefined, string | undefined]>;

    beforeEach(() => {
      src = new EventEmitter();
      mockReceiver = jest.fn();
      v1.on(mockReceiver);
      v1.by(src);
    });

    it('reflects old value until the new one received', () => {
      expect(v1.it).toBe('old');
    });
    it('reflects the received receive', () => {
      src.send('new');
      expect(v1.it).toBe('new');
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
      expect(v2.off()).toBe(v2);

      const listener = jest.fn();

      v2.on(listener);
      v1.it = 'new';
      expect(v2.it).toBe('old');
      expect(listener).not.toBeCalled();
    });
    it('is unbound when events exhausted', () => {
      v1.done();

      const listener = jest.fn();

      v2.on(listener);
      v1.it = 'new';
      expect(v2.it).toBe('old');
      expect(listener).not.toBeCalled();
    });
  });

  describe('by nested value sender or keeper', () => {

    let sender: EventEmitter<[EventKeeper<[string]> | EventSender<[string]>  | undefined]>;

    beforeEach(() => {
      sender = new EventEmitter();
      v1.by(sender, src => src);
    });

    it('binds to value sent by extracted keeper', () => {

      const v3 = trackValue('3');

      sender.send(v3);
      expect(v1.it).toBe('3');

      v3.it = '4';
      expect(v1.it).toBe('4');
    });
    it('rebinds to value sent by extracted keeper', () => {

      const v3 = trackValue('3');
      const v4 = trackValue('4');

      sender.send(v3);
      expect(v1.it).toBe('3');

      sender.send(v4);
      v3.it = '5';
      expect(v1.it).toBe('4');
    });
    it('suspends value reception when `undefined` sender extracted', () => {
      sender.send(undefined);
      expect(v1.it).toBe('old');
    });
    it('binds to value sent by extracted sender', () => {

      const v3 = new EventEmitter<[string]>();

      sender.send(v3);
      expect(v1.it).toBe('old');

      v3.send('new');
      expect(v1.it).toBe('new');
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
