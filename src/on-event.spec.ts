import { asis, neverSupply, noop } from '@proc7ts/primitives';
import { EventNotifier, EventReceiver, OnEvent__symbol } from './base';
import { OnEvent, onEventBy } from './on-event';
import Mock = jest.Mock;

describe('OnEvent', () => {
  describe('[OnEvent__symbol]', () => {
    it('refers to itself', () => {

      const onEvent = onEventBy(neverSupply);

      expect(onEvent[OnEvent__symbol]()).toBe(onEvent);
    });
  });

  describe('then', () => {

    let emitter: EventNotifier<[string]>;
    let mockRegister: Mock<void, [EventReceiver.Generic<[string]>]>;
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
