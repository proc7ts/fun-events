import { asis, noop } from '@proc7ts/primitives';
import { neverSupply, Supply } from '@proc7ts/supply';
import { AfterEvent, afterEventBy, isAfterEvent } from './after-event';
import { AfterEvent__symbol, EventNotifier, EventReceiver, OnEvent__symbol } from './base';
import { onEventBy } from './on-event';
import Mock = jest.Mock;

describe('AfterEvent', () => {
  describe('[OnEvent__symbol]', () => {
    it('refers to itself', () => {

      const afterEvent = afterEventBy(noop);

      expect(afterEvent[OnEvent__symbol]()).toBe(afterEvent);
    });
  });

  describe('[AfterEvent__symbol]', () => {
    it('refers to itself', () => {

      const afterEvent = afterEventBy(noop);

      expect(afterEvent[AfterEvent__symbol]()).toBe(afterEvent);
    });
  });
});

describe('afterEventBy', () => {

  let emitter: EventNotifier<[string]>;
  let mockFallback: Mock<[string], []>;
  let mockRegister: Mock<void, [EventReceiver.Generic<[string]>]>;
  let afterEvent: AfterEvent<[string]>;
  let mockReceiver: Mock<void, [string]>;

  beforeEach(() => {
    emitter = new EventNotifier();
    mockFallback = jest.fn(() => ['fallback']);
    mockRegister = jest.fn(rcv => {
      emitter.on(rcv);
    });
    afterEvent = afterEventBy(mockRegister, mockFallback);
    mockReceiver = jest.fn();
  });

  it('builds an `AfterEvent` keeper', () => {
    afterEvent(mockReceiver);
    expect(mockRegister).toHaveBeenCalled();
    expect(mockReceiver).toHaveBeenCalledWith('fallback');
    expect(mockReceiver).toHaveBeenCalledTimes(1);

    emitter.send('event');
    expect(mockReceiver).toHaveBeenCalledWith('event');
    expect(mockReceiver).toHaveBeenCalledTimes(2);
  });
  it('sends an event sent by registration function', () => {
    mockRegister.mockImplementation(rcv => {
      emitter.on(rcv);
      emitter.send('event');
    });

    afterEvent(mockReceiver);

    expect(mockReceiver).toHaveBeenCalledWith('event');
    expect(mockReceiver).toHaveBeenCalledTimes(1);
  });
  it('does not send an event sent by registration function if receiver supply is cut off already', () => {
    mockRegister.mockImplementation(rcv => {
      emitter.on(rcv);
      emitter.send('event');
    });

    afterEvent({
      supply: neverSupply(),
      receive(_context, ...event) {
        mockReceiver(...event);
      },
    });

    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('sends recurrent event sent during registration to recurrent receiver', () => {

    const recurrentReceiver = jest.fn();

    afterEvent({
      receive(context, ...event) {
        context.onRecurrent(recurrentReceiver);
        mockReceiver(...event);
        emitter.send('recurrent');
      },
    });

    expect(mockReceiver).toHaveBeenCalledWith('fallback');
    expect(recurrentReceiver).toHaveBeenCalledWith('recurrent');
  });
  it('cuts off event supply on receiver registration failure', async () => {

    const error = new Error('!!!');
    const onEvent = afterEventBy(() => {
      throw error;
    });

    expect(await onEvent({ supply: new Supply(noop), receive: noop }).whenDone().catch(asis)).toBe(error);
  });
});

describe('isAfterEvent', () => {

  it('returns `true` for `afterEventBy()` result', () => {
    expect(isAfterEvent(afterEventBy(noop))).toBe(true);
  });
  it('returns `false` for incompatible `AfterEvent` implementation', () => {

    const afterEvent = afterEventBy(noop);

    afterEvent[AfterEvent__symbol] = noop as any;

    expect(isAfterEvent(afterEvent)).toBe(false);
  });
  it('returns `false` for `onEventBy()` result', () => {
    expect(isAfterEvent(onEventBy(noop))).toBe(false);
  });

});
