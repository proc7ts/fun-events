import { OnEvent, onEventBy, onEventFrom, onNever } from './on-event';
import { EventInterest, noEventInterest } from './event-interest';
import { OnEvent__symbol } from './event-sender';
import { passIf } from 'call-thru';
import { EventEmitter } from './event-emitter';
import { EventReceiver } from './event-receiver';
import Mock = jest.Mock;

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

  describe('[OnEvent__symbol]', () => {
    it('refers to itself', () => {

      const onEvent = onEventBy(() => noEventInterest());

      expect(onEvent[OnEvent__symbol]).toBe(onEvent);
    });
  });

  describe('once', () => {

    let mockRegister: Mock;
    let onEvent: OnEvent<[string]>;
    let interestSpy: {
      off: Mock<void, []> & EventInterest['off'],
    } & EventInterest;
    let registeredReceiver: (event: string) => void;
    let mockReceiver: Mock<void, [string]>;

    beforeEach(() => {
      interestSpy = {
        off: jest.fn()
      } as any;
      mockRegister = jest.fn((c: (event: string) => string) => {
        registeredReceiver = c;
        return interestSpy;
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
    });

    it('registers event receiver', () => {
      expect(onEvent.once(mockReceiver)).toBe(interestSpy);
      expect(mockRegister).toHaveBeenCalledWith(registeredReceiver);
    });
    it('unregisters notified event receiver', () => {
      onEvent.once(mockReceiver);
      expect(interestSpy.off).not.toHaveBeenCalled();

      registeredReceiver('event');
      expect(mockReceiver).toHaveBeenCalledWith('event');
      expect(interestSpy.off).toHaveBeenCalled();
    });
    it('unregisters immediately notified event receiver', () => {
      mockRegister.mockImplementation(c => {
        registeredReceiver = c;
        c('event');
        return interestSpy;
      });

      onEvent.once(mockReceiver);

      expect(interestSpy.off).toHaveBeenCalled();
      expect(mockReceiver).toHaveBeenCalledWith('event');
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
    });
    it('stops consumption when sender events exhausted', () => {

      const mockDone = jest.fn();

      interest.whenDone(mockDone);

      const reason = 'some reason';

      sender.clear(reason);

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
      nested1.clear(reason);
      nested1.send('value2');

      expect(mockDone).not.toHaveBeenCalledWith(reason);

      sender.send(nested2);
      nested2.send('value3');

      expect(receiver).toHaveBeenCalledWith('value1');
      expect(receiver).not.toHaveBeenCalledWith('value2');
      expect(receiver).toHaveBeenCalledWith('value3');
    });
  });

  describe('thru', () => {

    let mockRegister: Mock;
    let mockInterest: {
      off: Mock<void, []> & EventInterest['off'],
      whenDone: Mock<void, [(reason?: any) => void]>,
    } & EventInterest;
    let registeredReceiver: (event1: string, event2: string) => void;
    let onEvent: OnEvent<[string, string]>;
    let mockReceiver: Mock<void, [string]>;

    beforeEach(() => {
      mockInterest = {
        off: jest.fn(),
        whenDone: jest.fn(),
      } as any;
      mockInterest.off.mockName('interest.off()');
      mockRegister = jest.fn((c: (event1: string, event2: string) => number) => {
        registeredReceiver = c;
        return mockInterest;
      });
      onEvent = onEventBy(mockRegister);
      mockReceiver = jest.fn();
    });

    it('registers event receiver', () => {
      onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      )(mockReceiver);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('unregisters event receiver when interest lost', () => {

      const thru = onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      );

      const interest1 = thru(mockReceiver);
      const interest2 = thru(jest.fn());

      interest1.off();
      expect(mockInterest.off).not.toHaveBeenCalled();
      interest2.off();
      expect(mockInterest.off).toHaveBeenCalled();
    });
    it('transforms original event', () => {
      onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      )(mockReceiver);

      registeredReceiver('a', 'bb');

      expect(mockReceiver).toHaveBeenCalledWith(`a, bb`);
    });
    it('skips original event', () => {
      onEvent.thru(
          passIf((event1: string, event2: string) => event1 < event2),
          (event1: string, event2: string) => `${event1}, ${event2}`,
      )(mockReceiver);

      registeredReceiver('a', 'bb');
      expect(mockReceiver).toHaveBeenCalledWith(`a, bb`);

      mockReceiver.mockClear();
      registeredReceiver('b', 'a');
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('exhausts when original sender exhausts', () => {

      const mockDone = jest.fn();

      onEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      )(mockReceiver).whenDone(mockDone);

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
