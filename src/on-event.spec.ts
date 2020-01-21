import { noop, passIf } from 'call-thru';
import { EventEmitter } from './event-emitter';
import { AfterEvent__symbol } from './event-keeper';
import { EventNotifier } from './event-notifier';
import { EventReceiver } from './event-receiver';
import { EventSender, OnEvent__symbol } from './event-sender';
import { eventSupply, EventSupply, noEventSupply } from './event-supply';
import { OnEvent, onEventBy, onNever, onSupplied } from './on-event';
import { trackValue } from './value';
import Mock = jest.Mock;
import SpyInstance = jest.SpyInstance;

describe('OnEvent', () => {
  describe('[OnEvent__symbol]', () => {
    it('refers to itself', () => {

      const onEvent = onEventBy(() => noEventSupply());

      expect(onEvent[OnEvent__symbol]).toBe(onEvent);
    });
  });

  describe('once', () => {

    let mockRegister: Mock<void, [EventReceiver.Generic<[string]>]>;
    let onEvent: OnEvent<[string]>;
    let supply: EventSupply;
    let offSpy: SpyInstance;
    let emitter: EventNotifier<[string]>;
    let mockReceiver: Mock<void, [string]>;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
        supply = receiver.supply;
        offSpy = jest.spyOn(supply, 'off');
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
    });

    it('registers event receiver', () => {
      expect(onEvent.once(mockReceiver)).toBe(supply);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('unregisters notified event receiver', () => {
      onEvent.once(mockReceiver);
      expect(offSpy).not.toHaveBeenCalled();

      emitter.send('event');
      expect(mockReceiver).toHaveBeenCalledWith('event');
      expect(offSpy).toHaveBeenCalled();
    });
    it('unregisters immediately notified event receiver', () => {
      mockRegister.mockImplementation(receiver => {
        emitter.on(receiver);
        supply = receiver.supply;
        offSpy = jest.spyOn(supply, 'off');
        emitter.send('event');
      });

      onEvent.once(mockReceiver);

      expect(offSpy).toHaveBeenCalled();
      expect(mockReceiver).toHaveBeenCalledWith('event');
    });
    it('never sends events if their supply is initially cut off', () => {
      supply = noEventSupply();
      onEvent.once({ supply, receive: (_context, ...event) => mockReceiver(...event) });
      emitter.send('event');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('never sends events after their supply is cut off', () => {
      onEvent.once(mockReceiver).off();
      emitter.send('event');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('sends only one event', () => {
      onEvent.once(mockReceiver);
      emitter.send('event1');
      emitter.send('event2');
      expect(mockReceiver).toHaveBeenCalledTimes(1);
      expect(mockReceiver).toHaveBeenLastCalledWith('event1');
    });
  });

  describe('tillOff', () => {

    let mockRegister: Mock<void, [EventReceiver.Generic<[string]>]>;
    let onEvent: OnEvent<[string]>;
    let supply: EventSupply;
    let offSpy: SpyInstance;
    let emitter: EventNotifier<[string]>;
    let mockReceiver: Mock<void, [string]>;
    let requiredSupply: EventSupply;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
        supply = receiver.supply;
        offSpy = jest.spyOn(supply, 'off');
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
      requiredSupply = eventSupply();
    });

    it('sends original events', () => {
      onEvent.tillOff(requiredSupply)(mockReceiver);
      emitter.send('event1');
      emitter.send('event2');

      expect(mockReceiver).toHaveBeenCalledWith('event1');
      expect(mockReceiver).toHaveBeenLastCalledWith('event2');
    });
    it('does not send any events if required supply is initially cut off', () => {

      const whenOff = jest.fn();

      onEvent.tillOff(noEventSupply())(mockReceiver).whenOff(whenOff);
      emitter.send('event1');
      expect(mockReceiver).not.toHaveBeenCalled();
      expect(whenOff).toHaveBeenCalled();
    });
    it('no longer sends events after original supply is cut off', () => {

      const whenOff = jest.fn();

      onEvent.tillOff(requiredSupply)(mockReceiver).whenOff(whenOff);
      emitter.send('event1');
      supply.off('reason');
      emitter.send('event2');

      expect(mockReceiver).toHaveBeenLastCalledWith('event1');
      expect(mockReceiver).not.toHaveBeenCalledWith('event2');
      expect(whenOff).toHaveBeenCalledWith('reason');
      expect(offSpy).toHaveBeenCalledWith('reason');
    });
    it('no longer sends events after required supply is cut off', () => {

      const whenOff = jest.fn();

      onEvent.tillOff(requiredSupply)(mockReceiver).whenOff(whenOff);
      emitter.send('event1');
      requiredSupply.off('reason');
      emitter.send('event2');

      expect(mockReceiver).toHaveBeenLastCalledWith('event1');
      expect(mockReceiver).not.toHaveBeenCalledWith('event2');
      expect(whenOff).toHaveBeenCalledWith('reason');
      expect(offSpy).toHaveBeenCalledWith('reason');
    });
  });

  describe('dig', () => {

    let sender: EventEmitter<[EventNotifier<[string]>?]>;
    let nested1: EventNotifier<[string]>;
    let nested2: EventNotifier<[string]>;
    let extract: Mock<EventSender<[string]> | undefined, [EventNotifier<[string]>?]>;
    let result: OnEvent<[string]>;
    let receiver: Mock<void, [string]>;
    let supply: EventSupply;

    beforeEach(() => {
      sender = new EventEmitter();
      nested1 = new EventNotifier();
      nested2 = new EventNotifier();
      receiver = jest.fn();
      extract = jest.fn((nested?: EventNotifier<[string]>) => nested);
      result = sender.on.dig(extract);
      supply = result(receiver);
    });

    it('receives nested event', () => {
      sender.send(nested1);
      nested1.send('value');
      expect(receiver).toHaveBeenCalledWith('value');
    });
    it('receives latest event', () => {
      sender.send(nested1);

      nested1.send('value1');
      expect(receiver).toHaveBeenCalledWith('value1');

      nested1.send('value2');
      expect(receiver).toHaveBeenCalledWith('value2');
    });
    it('receives event from latest nested sender', () => {
      sender.send(nested1);
      sender.send(nested2);

      nested1.send('value1');
      nested2.send('value2');
      expect(receiver).not.toHaveBeenCalledWith('value1');
      expect(receiver).toHaveBeenCalledWith('value2');
    });
    it('does not receive event when not registered in nested', () => {
      sender.send(nested1);
      sender.send();

      nested1.send('value');
      expect(receiver).not.toHaveBeenCalled();
    });
    it('does not receive events once their supply is cut offlost', () => {
      supply.off();

      sender.send(nested1);
      nested1.send('value');
      expect(receiver).not.toHaveBeenCalled();
      expect(extract).not.toHaveBeenCalled();
    });
    it('cuts off events supply once original events supply does', () => {

      const mockOff = jest.fn();

      supply.whenOff(mockOff);

      const reason = 'some reason';

      sender.done(reason);

      expect(mockOff).toHaveBeenCalledWith(reason);

      sender.send(nested1);
      nested1.send('value');
      expect(receiver).not.toHaveBeenCalled();
      expect(extract).not.toHaveBeenCalled();
      expect(sender.size).toBe(0);
    });
    it('does not cut off events supply when nested events supply cut off', () => {

      const mockOff = jest.fn();

      supply.whenOff(mockOff);

      const reason = 'some reason';

      sender.send(nested1);
      nested1.send('value1');
      nested1.done(reason);
      nested1.send('value2');

      expect(mockOff).not.toHaveBeenCalledWith(reason);

      sender.send(nested2);
      nested2.send('value3');

      expect(receiver).toHaveBeenCalledWith('value1');
      expect(receiver).not.toHaveBeenCalledWith('value2');
      expect(receiver).toHaveBeenCalledWith('value3');
    });
  });

  describe('consume', () => {

    let sender: EventEmitter<[EventNotifier<[string]>?]>;
    let nested1: EventNotifier<[string]>;
    let nested2: EventNotifier<[string]>;
    let consume: Mock<EventSupply | undefined, [EventNotifier<[string]>?]>;
    let receiver: Mock<void, [string]>;
    let supply: EventSupply;

    beforeEach(() => {
      sender = new EventEmitter();
      nested1 = new EventNotifier();
      nested2 = new EventNotifier();
      receiver = jest.fn();
      consume = jest.fn((nested?: EventNotifier<[string]>) => nested && nested.on(receiver));
      supply = sender.on.consume(consume);
    });

    it('receives nested event', () => {
      sender.send(nested1);
      nested1.send('value');
      expect(receiver).toHaveBeenCalledWith('value');
    });
    it('receives latest event', () => {
      sender.send(nested1);

      nested1.send('value1');
      expect(receiver).toHaveBeenCalledWith('value1');

      nested1.send('value2');
      expect(receiver).toHaveBeenCalledWith('value2');
    });
    it('receives event from latest nested sender', () => {
      sender.send(nested1);
      sender.send(nested2);

      nested1.send('value1');
      nested2.send('value2');
      expect(receiver).not.toHaveBeenCalledWith('value1');
      expect(receiver).toHaveBeenCalledWith('value2');
    });
    it('does not receive event when not registered in nested', () => {
      sender.send(nested1);
      sender.send();

      nested1.send('value');
      expect(receiver).not.toHaveBeenCalled();
    });
    it('does not receive events once their supply is cut off', () => {
      supply.off();

      sender.send(nested1);
      nested1.send('value');
      expect(receiver).not.toHaveBeenCalled();
      expect(consume).not.toHaveBeenCalled();
      expect(sender.size).toBe(0);
    });
    it('stops consumption when original events supply is cut off', () => {

      const mockOff = jest.fn();

      supply.whenOff(mockOff);

      const reason = 'some reason';

      sender.done(reason);

      expect(mockOff).toHaveBeenCalledWith(reason);

      sender.send(nested1);
      nested1.send('value');
      expect(receiver).not.toHaveBeenCalled();
      expect(consume).not.toHaveBeenCalled();
    });
    it('does not stop consumption when nested events supply is cut off', () => {

      const mockOff = jest.fn();

      supply.whenOff(mockOff);

      const reason = 'some reason';

      sender.send(nested1);
      nested1.send('value1');
      nested1.done(reason);
      nested1.send('value2');

      expect(mockOff).not.toHaveBeenCalledWith(reason);

      sender.send(nested2);
      nested2.send('value3');

      expect(receiver).toHaveBeenCalledWith('value1');
      expect(receiver).not.toHaveBeenCalledWith('value2');
      expect(receiver).toHaveBeenCalledWith('value3');
    });
  });

  describe('share', () => {

    let mockRegister: Mock<void, [EventReceiver.Generic<[string, string]>]>;
    let offSpy: SpyInstance;
    let emitter: EventNotifier<[string, string]>;
    let onEvent: OnEvent<[string, string]>;
    let mockReceiver: Mock<void, [string, string]>;
    let mockReceiver2: Mock<void, [string, string]>;

    beforeEach(() => {
      emitter = new EventNotifier();
      mockRegister = jest.fn(receiver => {
        emitter.on(receiver);
        offSpy = jest.spyOn(receiver.supply, 'off');
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
      mockReceiver2 = jest.fn();
    });

    it('sends events from the source', () => {

      const shared = onEvent.share();

      shared(mockReceiver);
      shared(mockReceiver2);
      emitter.send('a', 'b');
      expect(mockReceiver).toHaveBeenCalledWith('a', 'b');
      expect(mockReceiver2).toHaveBeenCalledWith('a', 'b');
    });
    it('registers exactly one source receiver', () => {

      const shared = onEvent.share();

      shared(mockReceiver);
      shared(mockReceiver2);

      expect(mockRegister).toHaveBeenCalledTimes(1);
    });
    it('cuts off events supply from the source when all event supplies do', () => {

      const shared = onEvent.share();
      const supply1 = shared(mockReceiver);
      const supply2 = shared(mockReceiver2);

      supply1.off('reason1');
      expect(offSpy).not.toHaveBeenCalled();
      supply2.off('reason2');
      expect(offSpy).toHaveBeenCalledWith('reason2');
    });
    it('replicates events sent during registration', () => {
      mockRegister.mockImplementation(receiver => {
        emitter.on(receiver);
        emitter.send('init1', '1');
        emitter.send('init2', '2');
      });

      const shared = onEvent.share();

      shared(mockReceiver);
      shared(mockReceiver2);

      expect(mockReceiver).toHaveBeenCalledWith('init1', '1');
      expect(mockReceiver).toHaveBeenCalledWith('init2', '2');
      expect(mockReceiver).toHaveReturnedTimes(2);
      expect(mockReceiver2).toHaveBeenCalledWith('init1', '1');
      expect(mockReceiver2).toHaveBeenCalledWith('init2', '2');
      expect(mockReceiver2).toHaveReturnedTimes(2);
    });
    it('replicates events sent during registration to receivers registered after all event supplies cut off', () => {

      mockRegister.mockImplementation(receiver => {

        const receiverEmitter = new EventNotifier<[string, string]>();

        receiverEmitter.on(receiver);
        receiverEmitter.send('init1', '1');
        receiverEmitter.send('init2', '2');

        offSpy = jest.spyOn(receiver.supply, 'off');
      });

      const shared = onEvent.share();
      const supply1 = shared(mockReceiver);
      const supply2 = shared(mockReceiver2);

      supply1.off();
      supply2.off();
      expect(offSpy).toHaveBeenCalled();
      mockReceiver.mockClear();
      mockReceiver2.mockClear();

      shared(mockReceiver);
      shared(mockReceiver2);
      expect(mockReceiver).toHaveBeenCalledWith('init1', '1');
      expect(mockReceiver).toHaveBeenCalledWith('init2', '2');
      expect(mockReceiver).toHaveReturnedTimes(2);
      expect(mockReceiver2).toHaveBeenCalledWith('init1', '1');
      expect(mockReceiver2).toHaveBeenCalledWith('init2', '2');
      expect(mockReceiver2).toHaveReturnedTimes(2);
    });
    it('stops events replication of events sent during registration after new event received', () => {
      mockRegister.mockImplementation(receiver => {
        emitter.on(receiver);
        emitter.send('init1', '1');
        emitter.send('init2', '2');
      });

      const shared = onEvent.share();

      shared(mockReceiver);
      emitter.send('update1', '11');
      shared(mockReceiver2);
      emitter.send('update2', '12');

      expect(mockReceiver).toHaveBeenCalledWith('init1', '1');
      expect(mockReceiver).toHaveBeenCalledWith('init2', '2');
      expect(mockReceiver).toHaveBeenCalledWith('update1', '11');
      expect(mockReceiver).toHaveBeenCalledWith('update2', '12');
      expect(mockReceiver).toHaveReturnedTimes(4);
      expect(mockReceiver2).toHaveBeenCalledWith('update2', '12');
      expect(mockReceiver2).toHaveReturnedTimes(1);
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

      transforming(mockReceiver);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('unregisters event receiver once events supply cut off', () => {

      const transforming = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`,
      );

      const supply1 = transforming(mockReceiver);
      const supply2 = transforming(noop);

      supply1.off();
      expect(offSpy).not.toHaveBeenCalled();
      supply2.off();
      expect(offSpy).toHaveBeenCalled();
    });
    it('transforms original event', () => {

      const transforming = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`,
      );

      transforming(mockReceiver);

      emitter.send('a', 'bb');

      expect(mockReceiver).toHaveBeenCalledWith('a, bb');
    });
    it('skips original event', () => {

      const transforming = onEvent.thru(
          passIf<[string, string], string>((event1: string, event2: string) => event1 < event2),
          (event1: string, event2: string) => `${event1}, ${event2}`,
      );

      transforming(mockReceiver);

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

      transforming(mockReceiver).whenOff(mockOff);

      const reason = 'some reason';

      emitter.done(reason);
      expect(mockOff).toHaveBeenCalledWith(reason);
    });
  });
});

describe('onNever', () => {
  it('returns no-event supply', () => {
    expect(onNever(noop).isOff).toBe(true);
  });
});

describe('onSupplied', () => {
  describe('from event sender', () => {

    let sender: EventNotifier<[string]>;
    let onEvent: OnEvent<[string]>;
    let mockReceiver: EventReceiver<[string]>;
    let supply: EventSupply;

    beforeEach(() => {
      sender = new EventNotifier();
      onEvent = onSupplied({
        [OnEvent__symbol](receiver) {
          return sender.on(receiver);
        },
      });
      mockReceiver = jest.fn();
      supply = onEvent(mockReceiver);
    });

    it('reports events sent by the given sender', () => {

      const event = 'event';

      sender.send(event);
      expect(mockReceiver).toHaveBeenCalledWith(event);
    });
    it('does not send events once their supply is cut off', () => {
      supply.off();

      sender.send('event');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
  });

  describe('from event sender with registrar implementing `OnEvent`', () => {
    it('returns the sender\'s registrar', () => {

      const sender = new EventEmitter<[string]>();

      expect(onSupplied(sender)).toBe(sender[OnEvent__symbol]);
    });
  });

  describe('from event keeper', () => {
    it('returns the keeper\'s registrar', () => {

      const tracker = trackValue(1);
      const keeper = {
        [AfterEvent__symbol]: tracker.read,
      };

      expect(onSupplied(keeper)).toBe(keeper[AfterEvent__symbol]);
    });
  });
});
