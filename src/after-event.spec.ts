import { neverSupply, noop } from '@proc7ts/primitives';
import { AfterEvent, afterEventBy } from './after-event';
import { AfterEvent__symbol, EventNotifier, EventReceiver, OnEvent__symbol } from './base';
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
    afterEvent.to(mockReceiver);
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

    afterEvent.to(mockReceiver);

    expect(mockReceiver).toHaveBeenCalledWith('event');
    expect(mockReceiver).toHaveBeenCalledTimes(1);
  });
  it('does not send an event sent by registration function if receiver supply is cut off already', () => {
    mockRegister.mockImplementation(rcv => {
      emitter.on(rcv);
      emitter.send('event');
    });

    afterEvent.to({
      supply: neverSupply(),
      receive(_context, ...event) {
        mockReceiver(...event);
      },
    });

    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('sends recurrent event sent during registration to recurrent receiver', () => {

    const recurrentReceiver = jest.fn();

    afterEvent.to({
      receive(context, ...event) {
        context.onRecurrent(recurrentReceiver);
        mockReceiver(...event);
        emitter.send('recurrent');
      },
    });

    expect(mockReceiver).toHaveBeenCalledWith('fallback');
    expect(recurrentReceiver).toHaveBeenCalledWith('recurrent');
  });
});
