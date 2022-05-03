import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { asis, noop } from '@proc7ts/primitives';
import { Mock } from 'jest-mock';
import { EventNotifier, EventReceiver, OnEvent__symbol } from './base';
import { isOnEvent, OnEvent, onEventBy } from './on-event';
import { EventEmitter } from './senders';

describe('OnEvent', () => {
  describe('[OnEvent__symbol]', () => {
    it('refers to itself', () => {

      const onEvent = onEventBy(({ supply }) => supply.off());

      expect(onEvent[OnEvent__symbol]()).toBe(onEvent);
    });
  });

  describe('then', () => {

    let emitter: EventNotifier<[string]>;
    let mockRegister: Mock<(receiver: EventReceiver.Generic<[string]>) => void>;
    let onEvent: OnEvent<[string]>;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
      });
      onEvent = onEventBy(mockRegister);
    });

    it('resolves to next event', async () => {

      const next = onEvent.then();

      emitter.send('event');
      expect(await next).toBe('event');
    });
    it('resolves to immediately available event', async () => {
      mockRegister.mockImplementation(receiver => {
        emitter.on(receiver);
        emitter.send('immediate');
      });

      expect(await onEvent).toBe('immediate');
    });
    it('executes resolution callback', async () => {

      const next = onEvent.then(event => `${event}!`);

      emitter.send('next event');
      expect(await next).toBe('next event!');
    });
    it('rejects when resolution callback fails', async () => {

      const error = new Error('test');
      const next = onEvent.then(() => {
        throw error;
      });

      emitter.send('next event');
      expect(await next.catch(asis)).toBe(error);
    });
    it('rejects when supply is cut off', async () => {

      const reason = 'reason';

      emitter.supply.off(reason);

      expect(await onEvent.then().catch(asis)).toBe(reason);
    });
    it('resolves to cut off callback result when supply is cut off', async () => {

      const reason = 'reason';

      emitter.supply.off(reason);

      expect(await onEvent.then(noop, asis)).toBe(reason);
    });
    it('rejects when cut off callback fails', async () => {
      emitter.supply.off('reason');

      const error = new Error('test');

      expect(await onEvent.then(noop, () => {
        throw error;
      }).catch(asis)).toBe(error);
    });
  });
});

describe('onEventBy', () => {

  it('cuts off event supply on receiver registration failure', async () => {

    const error = new Error('!!!');
    const onEvent = onEventBy(() => {
      throw error;
    });

    expect(await onEvent(noop).whenDone().catch(asis)).toBe(error);
  });

});

describe('isOnEvent', () => {

  it('returns `true` for `onEventBy()` result', () => {
    expect(isOnEvent(onEventBy(noop))).toBe(true);
  });
  it('returns `false` for incompatible `OnEvent` implementation', () => {

    const onEvent = onEventBy(noop);

    onEvent.then = noop as any;

    expect(isOnEvent(onEvent)).toBe(false);
  });
  it('returns `false` for arbitrary event sender', () => {
    expect(isOnEvent(new EventEmitter())).toBe(false);
  });
  it('returns `false` for `null`', () => {
    expect(isOnEvent(null)).toBe(false);
  });

});
