import { passIf } from 'call-thru';
import { EventEmitter } from './event-emitter';
import { EventInterest, noEventInterest } from './event-interest';
import { AfterEvent__symbol } from './event-keeper';
import { EventReceiver } from './event-receiver';
import { EventSender, OnEvent__symbol } from './event-sender';
import { OnEvent, onEventBy, onEventFrom, onNever } from './on-event';
import { trackValue } from './value';
import Mock = jest.Mock;
import Mocked = jest.Mocked;

describe('OnEvent', () => {
  describe('from event sender', () => {

    let sender: EventEmitter<[string]>;
    let onEvent: OnEvent<[string]>;
    let mockReceiver: EventReceiver<[string]>;
    let interest: EventInterest;

    beforeEach(() => {
      sender = new EventEmitter();
      onEvent = onEventFrom({
        [OnEvent__symbol](receiver) {
          return sender.on(receiver);
        }
      });
      mockReceiver = jest.fn();
      interest = onEvent(mockReceiver);
    });

    it('reports events sent by the given sender', () => {

      const event = 'event';

      sender.send(event);
      expect(mockReceiver).toHaveBeenCalledWith(event);
    });
    it('does not send events once interest lost', () => {
      interest.off();

      sender.send('event');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
  });

  describe('from event sender with registrar implementing `OnEvent`', () => {
    it('returns the sender\'s registrar', () => {

      const sender = new EventEmitter<[string]>();

      expect(onEventFrom(sender)).toBe(sender[OnEvent__symbol]);
    });
  });

  describe('from event keeper', () => {
    it('returns the keeper\'s registrar', () => {

      const tracker = trackValue(1);
      const keeper = {
        [AfterEvent__symbol]: tracker.read,
      };

      expect(onEventFrom(keeper)).toBe(keeper[AfterEvent__symbol]);
    });
  });

  describe('[OnEvent__symbol]', () => {
    it('refers to itself', () => {

      const onEvent = onEventBy(() => noEventInterest());

      expect(onEvent[OnEvent__symbol]).toBe(onEvent);
    });
  });

  describe('once', () => {

    let mockRegister: Mock;
    let onEvent: OnEvent<[string]>;
    let mockInterest: Mocked<EventInterest>;
    let registeredReceiver: (event: string) => void;
    let mockReceiver: Mock<void, [string]>;

    beforeEach(() => {
      mockInterest = {
        off: jest.fn()
      } as any;
      mockRegister = jest.fn((c: (event: string) => string) => {
        registeredReceiver = c;
        return mockInterest;
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
    });

    it('registers event receiver', () => {
      expect(onEvent.once(mockReceiver)).toBe(mockInterest);
      expect(mockRegister).toHaveBeenCalledWith(registeredReceiver);
    });
    it('unregisters notified event receiver', () => {
      onEvent.once(mockReceiver);
      expect(mockInterest.off).not.toHaveBeenCalled();

      registeredReceiver('event');
      expect(mockReceiver).toHaveBeenCalledWith('event');
      expect(mockInterest.off).toHaveBeenCalled();
    });
    it('unregisters immediately notified event receiver', () => {
      mockRegister.mockImplementation(c => {
        registeredReceiver = c;
        c('event');
        return mockInterest;
      });

      onEvent.once(mockReceiver);

      expect(mockInterest.off).toHaveBeenCalled();
      expect(mockReceiver).toHaveBeenCalledWith('event');
    });
  });

  describe('dig', () => {

    let sender: EventEmitter<[EventEmitter<[string]>?]>;
    let nested1: EventEmitter<[string]>;
    let nested2: EventEmitter<[string]>;
    let extract: Mock<EventSender<[string]> | undefined, [EventEmitter<[string]>?]>;
    let result: OnEvent<[string]>;
    let receiver: Mock<void, [string]>;
    let interest: EventInterest;

    beforeEach(() => {
      sender = new EventEmitter();
      nested1 = new EventEmitter();
      nested2 = new EventEmitter();
      receiver = jest.fn();
      extract = jest.fn(nested => nested);
      result = sender.on.dig(extract);
      interest = result(receiver);
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
    it('does not receive events when interest is lost', () => {
      interest.off();

      sender.send(nested1);
      nested1.send('value');
      expect(receiver).not.toHaveBeenCalled();
      expect(extract).not.toHaveBeenCalled();
    });
    it('exhausts once sender events exhausted', () => {

      const mockDone = jest.fn();

      interest.whenDone(mockDone);

      const reason = 'some reason';

      sender.done(reason);

      expect(mockDone).toHaveBeenCalledWith(reason);

      sender.send(nested1);
      nested1.send('value');
      expect(receiver).not.toHaveBeenCalled();
      expect(extract).not.toHaveBeenCalled();
      expect(sender.size).toBe(0);
    });
    it('does not exhaust when nested events exhausted', () => {

      const mockDone = jest.fn();

      interest.whenDone(mockDone);

      const reason = 'some reason';

      sender.send(nested1);
      nested1.send('value1');
      nested1.done(reason);
      nested1.send('value2');

      expect(mockDone).not.toHaveBeenCalledWith(reason);

      sender.send(nested2);
      nested2.send('value3');

      expect(receiver).toHaveBeenCalledWith('value1');
      expect(receiver).not.toHaveBeenCalledWith('value2');
      expect(receiver).toHaveBeenCalledWith('value3');
    });
  });

  describe('consume', () => {

    let sender: EventEmitter<[EventEmitter<[string]>?]>;
    let nested1: EventEmitter<[string]>;
    let nested2: EventEmitter<[string]>;
    let consume: Mock<EventInterest | undefined, [EventEmitter<[string]>?]>;
    let receiver: Mock<void, [string]>;
    let interest: EventInterest;

    beforeEach(() => {
      sender = new EventEmitter();
      nested1 = new EventEmitter();
      nested2 = new EventEmitter();
      receiver = jest.fn();
      consume = jest.fn(nested => nested && nested.on(receiver));
      interest = sender.on.consume(consume);
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
    it('does not receive events when interest is lost', () => {
      interest.off();

      sender.send(nested1);
      nested1.send('value');
      expect(receiver).not.toHaveBeenCalled();
      expect(consume).not.toHaveBeenCalled();
      expect(sender.size).toBe(0);
    });
    it('stops consumption when sender events exhausted', () => {

      const mockDone = jest.fn();

      interest.whenDone(mockDone);

      const reason = 'some reason';

      sender.done(reason);

      expect(mockDone).toHaveBeenCalledWith(reason);

      sender.send(nested1);
      nested1.send('value');
      expect(receiver).not.toHaveBeenCalled();
      expect(consume).not.toHaveBeenCalled();
    });
    it('does not stop consumption when nested events exhausted', () => {

      const mockDone = jest.fn();

      interest.whenDone(mockDone);

      const reason = 'some reason';

      sender.send(nested1);
      nested1.send('value1');
      nested1.done(reason);
      nested1.send('value2');

      expect(mockDone).not.toHaveBeenCalledWith(reason);

      sender.send(nested2);
      nested2.send('value3');

      expect(receiver).toHaveBeenCalledWith('value1');
      expect(receiver).not.toHaveBeenCalledWith('value2');
      expect(receiver).toHaveBeenCalledWith('value3');
    });
  });

  describe('share', () => {

    let mockRegister: Mock<EventInterest, [EventReceiver<[string, string]>]>;
    let mockInterest: Mocked<EventInterest>;
    let registeredReceiver: (event1: string, event2: string) => void;
    let onEvent: OnEvent<[string, string]>;
    let mockReceiver: Mock<void, [string, string]>;
    let mockReceiver2: Mock<void, [string, string]>;

    beforeEach(() => {
      mockInterest = {
        off: jest.fn(),
        whenDone: jest.fn(),
      } as any;
      mockInterest.off.mockName('interest.off()');
      mockRegister = jest.fn(receiver => {
        registeredReceiver = receiver;
        return mockInterest;
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
      mockReceiver2 = jest.fn();
    });

    it('sends events from the source', () => {

      const shared = onEvent.share();

      shared(mockReceiver);
      shared(mockReceiver2);
      registeredReceiver('a', 'b');
      expect(mockReceiver).toHaveBeenCalledWith('a', 'b');
      expect(mockReceiver2).toHaveBeenCalledWith('a', 'b');
    });
    it('registers exactly one source receiver', () => {

      const shared = onEvent.share();

      shared(mockReceiver);
      shared(mockReceiver2);

      expect(mockRegister).toHaveBeenCalledTimes(1);
    });
    it('loses interest to the source when all receivers lose their interests', () => {

      const shared = onEvent.share();
      const interest1 = shared(mockReceiver);
      const interest2 = shared(mockReceiver2);

      interest1.off('reason1');
      expect(mockInterest.off).not.toHaveBeenCalled();
      interest2.off('reason2');
      expect(mockInterest.off).toHaveBeenCalledWith('reason2');
    });
    it('replicates events sent during registration', () => {

      mockRegister.mockImplementation(receiver => {
        registeredReceiver = receiver;
        receiver('init1', '1');
        receiver('init2', '2');
        return mockInterest;
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
    it('replicates events sent during registration to receivers registered after all interests are lost', () => {

      mockRegister.mockImplementation(receiver => {
        registeredReceiver = receiver;
        receiver('init1', '1');
        receiver('init2', '2');
        return mockInterest;
      });

      const shared = onEvent.share();
      const interest1 = shared(mockReceiver);
      const interest2 = shared(mockReceiver2);

      interest1.off();
      interest2.off();
      expect(mockInterest.off).toHaveBeenCalled();
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
        registeredReceiver = receiver;
        receiver('init1', '1');
        receiver('init2', '2');
        return mockInterest;
      });

      const shared = onEvent.share();

      shared(mockReceiver);
      registeredReceiver('update1', '11');
      shared(mockReceiver2);
      registeredReceiver('update2', '12');

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

    let mockRegister: Mock<EventInterest, [EventReceiver<[string, string]>]>;
    let mockInterest: Mocked<EventInterest>;
    let registeredReceiver: (event1: string, event2: string) => void;
    let onEvent: OnEvent<[string, string]>;
    let mockReceiver: Mock<void, [string]>;

    beforeEach(() => {
      mockInterest = {
        off: jest.fn(),
        whenDone: jest.fn(),
      } as any;
      mockInterest.off.mockName('interest.off()');
      mockRegister = jest.fn(receiver => {
        registeredReceiver = receiver;
        return mockInterest;
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
    });

    it('registers event receiver', () => {

      const transforming = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      );

      transforming(mockReceiver);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('unregisters event receiver when interest lost', () => {

      const transforming = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      );

      const interest1 = transforming(mockReceiver);
      const interest2 = transforming(jest.fn());

      interest1.off();
      expect(mockInterest.off).not.toHaveBeenCalled();
      interest2.off();
      expect(mockInterest.off).toHaveBeenCalled();
    });
    it('transforms original event', () => {

      const transforming = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      );

      transforming(mockReceiver);

      registeredReceiver('a', 'bb');

      expect(mockReceiver).toHaveBeenCalledWith('a, bb');
    });
    it('skips original event', () => {

      const transforming = onEvent.thru(
          passIf<[string, string], string>((event1: string, event2: string) => event1 < event2),
          (event1: string, event2: string) => `${event1}, ${event2}`,
      );

      transforming(mockReceiver);

      registeredReceiver('a', 'bb');
      expect(mockReceiver).toHaveBeenCalledWith('a, bb');

      mockReceiver.mockClear();
      registeredReceiver('b', 'a');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('exhausts when original sender exhausts', () => {

      const mockDone = jest.fn();
      const transforming = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      );

      transforming(mockReceiver).whenDone(mockDone);

      const reason = 'some reason';

      mockInterest.whenDone.mock.calls[0][0](reason);
      expect(mockDone).toHaveBeenCalledWith(reason);
    });
  });
});

describe('onNever', () => {

  let onEvent: OnEvent<[string]>;
  let mockReceiver: Mock<void, [string]>;
  let interest: EventInterest;

  beforeEach(() => {
    onEvent = onNever;
    mockReceiver = jest.fn();
    interest = onEvent(mockReceiver);
  });

  it('returns no event interest', () => {
    expect(interest).toBeInstanceOf(noEventInterest().constructor);
  });
});
