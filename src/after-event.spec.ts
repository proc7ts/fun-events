import { nextArgs, nextSkip } from '@proc7ts/call-thru';
import { neverSupply, noop } from '@proc7ts/primitives';
import { AfterEvent, afterEventBy } from './after-event';
import { AfterEvent__symbol, EventNotifier, EventReceiver, OnEvent__symbol } from './base';
import Mock = jest.Mock;

describe('AfterEvent', () => {
  describe('keep', () => {
    describe('thru', () => {

      let mockRegister: Mock<void, [EventReceiver.Generic<[string, string]>]>;
      let mockOff: Mock<void, [any?]>;
      let emitter: EventNotifier<[string, string]>;
      let afterEvent: AfterEvent<[string, string]>;
      let mockReceiver: Mock<void, [string]>;

      beforeEach(() => {
        emitter = new EventNotifier();
        mockOff = jest.fn();
        mockRegister = jest.fn(receiver => {
          emitter.on(receiver);
          receiver.supply.whenOff(mockOff);
        });
        afterEvent = afterEventBy(mockRegister, () => ['init1', 'init2']);
        mockReceiver = jest.fn();
      });

      it('registers event receiver', () => {

        const transforming: AfterEvent<[string]> = afterEvent.keepThru(
            (event1: string, event2: string) => `${event1}, ${event2}`,
        );

        transforming.to(mockReceiver);
        expect(mockRegister).toHaveBeenCalled();
      });
      it('unregisters event receiver when supply is cut off', () => {

        const transforming = afterEvent.keepThru(
            (event1: string, event2: string) => `${event1}, ${event2}`,
        );

        const supply1 = transforming.to(mockReceiver);
        const supply2 = transforming.to(jest.fn());

        supply1.off();
        expect(mockOff).not.toHaveBeenCalled();
        supply2.off();
        expect(mockOff).toHaveBeenCalled();
      });
      it('transforms original event', () => {

        const transforming = afterEvent.keepThru(
            (event1: string, event2: string) => `${event1}, ${event2}`,
        );

        transforming.to(mockReceiver);

        emitter.send('a', 'bb');

        expect(mockReceiver).toHaveBeenCalledWith('init1, init2');
        expect(mockReceiver).toHaveBeenCalledWith('a, bb');
      });
      it('skips original event', () => {

        const transforming = afterEvent.keepThru(
            (event1: string, event2: string) => event1 < event2 ? nextArgs(event1, event2) : nextSkip,
            (event1: string, event2: string) => `${event1}, ${event2}`,
        );

        transforming.to(mockReceiver);

        emitter.send('a', 'bb');
        expect(mockReceiver).toHaveBeenCalledWith('init1, init2');
        expect(mockReceiver).toHaveBeenCalledWith('a, bb');

        mockReceiver.mockClear();
        expect(mockReceiver).not.toHaveBeenCalled();
      });
      it('cuts off events supply when original sender cuts it off', () => {

        const mockOff2 = jest.fn();
        const transforming = afterEvent.keepThru(
            (event1: string, event2: string) => `${event1}, ${event2}`,
        );

        transforming.to(mockReceiver).whenOff(mockOff2);

        const reason = 'some reason';

        emitter.supply.off(reason);
        expect(mockOff2).toHaveBeenCalledWith(reason);
      });
    });
  });

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
