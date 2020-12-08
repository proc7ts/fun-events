import { nextArgs, nextSkip } from '@proc7ts/call-thru';
import { asis, neverSupply, noop } from '@proc7ts/primitives';
import { EventNotifier, EventReceiver, OnEvent__symbol } from './base';
import { OnEvent, onEventBy } from './on-event';
import Mock = jest.Mock;
import SpyInstance = jest.SpyInstance;

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

  describe('thru', () => {

    let mockRegister: Mock<void, [EventReceiver.Generic<[string, string]>]>;
    let offSpy: SpyInstance;
    let emitter: EventNotifier<[string, string]>;
    let onEvent: OnEvent<[string, string]>;
    let mockReceiver: Mock<void, [string]>;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
        offSpy = jest.spyOn(receiver.supply, 'off');
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
    });

    it('registers event receiver', () => {

      const transforming = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`,
      );

      transforming.to(mockReceiver);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('unregisters event receiver once events supply cut off', () => {

      const transforming = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`,
      );

      const supply1 = transforming.to(mockReceiver);
      const supply2 = transforming.to(noop);

      supply1.off();
      expect(offSpy).not.toHaveBeenCalled();
      supply2.off();
      expect(offSpy).toHaveBeenCalled();
    });
    it('transforms original event', () => {

      const transforming = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`,
      );

      transforming.to(mockReceiver);

      emitter.send('a', 'bb');

      expect(mockReceiver).toHaveBeenCalledWith('a, bb');
    });
    it('skips original event', () => {

      const transforming = onEvent.thru(
          (event1: string, event2: string) => event1 < event2 ? nextArgs(event1, event2) : nextSkip,
          (event1: string, event2: string) => `${event1}, ${event2}`,
      );

      transforming.to(mockReceiver);

      emitter.send('a', 'bb');
      expect(mockReceiver).toHaveBeenCalledWith('a, bb');

      mockReceiver.mockClear();
      emitter.send('b', 'a');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('cuts off transformed events supply once original events supply cut off', () => {

      const mockOff = jest.fn();
      const transforming = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`,
      );

      transforming.to(mockReceiver).whenOff(mockOff);

      const reason = 'some reason';

      emitter.supply.off(reason);
      expect(mockOff).toHaveBeenCalledWith(reason);
    });
  });
});
