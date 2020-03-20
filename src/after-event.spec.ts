import { nextArgs, nextSkip, noop } from '@proc7ts/call-thru';
import { AfterEvent, afterEventBy } from './after-event';
import {
  AfterEvent__symbol,
  EventNotifier,
  EventReceiver,
  eventSupply,
  EventSupply,
  noEventSupply,
  OnEvent__symbol,
} from './base';
import Mock = jest.Mock;

describe('AfterEvent', () => {
  describe('once', () => {

    let mockRegister: Mock<void, [EventReceiver.Generic<[string]>]>;
    let afterEvent: AfterEvent<[string]>;
    let supply: EventSupply;
    let offSpy: Mock;
    let emitter: EventNotifier<[string]>;
    let mockReceiver: Mock<void, [string]>;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        supply = receiver.supply;
        supply.whenOff(offSpy = jest.fn());
        emitter.on(receiver);
        emitter.send('init');
      });
      afterEvent = afterEventBy(mockRegister);
      mockReceiver = jest.fn();
    });

    it('registers event receiver', () => {
      afterEvent.once(mockReceiver);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('sends initial event', () => {
      afterEvent.once(mockReceiver);
      expect(mockReceiver).toHaveBeenCalledWith('init');
    });
    it('cuts off supply after event received', () => {

      const returnedSupply = afterEvent.once(mockReceiver);

      expect(mockRegister).toHaveBeenCalled();
      expect(returnedSupply.isOff).toBe(true);
      expect(supply.isOff).toBe(true);
    });
    it('unregisters notified event receiver', () => {
      afterEvent.once(mockReceiver);
      expect(offSpy).toHaveBeenCalled();
    });
    it('never sends events if their supply is initially cut off', () => {
      supply = noEventSupply();
      afterEvent.once({ supply, receive: (_context, ...event) => mockReceiver(...event) });
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('sends only one event', () => {
      afterEvent.once(mockReceiver);
      emitter.send('event1');
      emitter.send('event2');
      expect(mockReceiver).toHaveBeenCalledTimes(1);
      expect(mockReceiver).toHaveBeenLastCalledWith('init');
    });
  });

  describe('tillOff', () => {

    let mockRegister: Mock<void, [EventReceiver.Generic<[string]>]>;
    let afterEvent: AfterEvent<[string]>;
    let supply: EventSupply;
    let offSpy: Mock;
    let emitter: EventNotifier<[string]>;
    let mockReceiver: Mock<void, [string]>;
    let requiredSupply: EventSupply;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        supply = receiver.supply;
        supply.whenOff(offSpy = jest.fn());
        emitter.on(receiver);
        emitter.send('init');
      });
      afterEvent = afterEventBy(mockRegister);
      mockReceiver = jest.fn();
      requiredSupply = eventSupply();
    });

    it('sends original events', () => {
      afterEvent.tillOff(requiredSupply).to(mockReceiver);
      emitter.send('event1');
      emitter.send('event2');

      expect(mockReceiver).toHaveBeenCalledWith('init');
      expect(mockReceiver).toHaveBeenCalledWith('event1');
      expect(mockReceiver).toHaveBeenLastCalledWith('event2');
    });
    it('does not send any events if required supply is initially cut off', () => {

      const whenOff = jest.fn();

      afterEvent.tillOff(noEventSupply()).to(mockReceiver).whenOff(whenOff);
      emitter.send('event1');
      expect(mockReceiver).not.toHaveBeenCalled();
      expect(whenOff).toHaveBeenCalled();
    });
    it('no longer sends events after original supply is cut off', () => {

      const whenOff = jest.fn();

      afterEvent.tillOff(requiredSupply).to(mockReceiver).whenOff(whenOff);
      emitter.send('event1');
      supply.off('reason');
      emitter.send('event2');

      expect(mockReceiver).toHaveBeenCalledWith('init');
      expect(mockReceiver).toHaveBeenLastCalledWith('event1');
      expect(mockReceiver).not.toHaveBeenCalledWith('event2');
      expect(whenOff).toHaveBeenCalledWith('reason');
      expect(offSpy).toHaveBeenCalledWith('reason');
    });
    it('no longer sends events after required supply is cut off', () => {

      const whenOff = jest.fn();

      afterEvent.tillOff(requiredSupply).to(mockReceiver).whenOff(whenOff);
      emitter.send('event1');
      requiredSupply.off('reason');
      emitter.send('event2');

      expect(mockReceiver).toHaveBeenCalledWith('init');
      expect(mockReceiver).toHaveBeenLastCalledWith('event1');
      expect(mockReceiver).not.toHaveBeenCalledWith('event2');
      expect(whenOff).toHaveBeenCalledWith('reason');
      expect(offSpy).toHaveBeenCalledWith('reason');
    });
  });

  describe('share', () => {

    let fallback: [string, string];
    let mockRegister: Mock<void, [EventReceiver.Generic<[string, string]>]>;
    let emitter: EventNotifier<[string, string]>;
    let afterEvent: AfterEvent<[string, string]>;
    let mockReceiver: Mock<void, [string, string]>;
    let mockReceiver2: Mock<void, [string, string]>;

    beforeEach(() => {
      fallback = ['init1', 'init2'];
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
      });
      afterEvent = afterEventBy(mockRegister, () => fallback);
      mockReceiver = jest.fn();
      mockReceiver2 = jest.fn();
    });

    it('sends fallback event from the source', () => {

      const shared = afterEvent.share();

      shared.to(mockReceiver);
      shared.to(mockReceiver2);
      expect(mockReceiver).toHaveBeenCalledWith(...fallback);
      expect(mockReceiver2).toHaveBeenCalledWith(...fallback);
    });
    it('keeps initial event from the source', () => {

      const shared = afterEvent.share();

      shared.once((...received) => expect(received).toEqual(fallback));
    });
    it('sends events from the source', () => {

      const shared = afterEvent.share();

      shared.to(mockReceiver);
      shared.to(mockReceiver2);
      emitter.send('a', 'b');
      expect(mockReceiver).toHaveBeenCalledWith('a', 'b');
      expect(mockReceiver2).toHaveBeenCalledWith('a', 'b');
    });
  });

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

        emitter.done(reason);
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
      supply: noEventSupply(),
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
