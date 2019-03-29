import { trackValue, ValueTracker } from './value';
import { EventReceiver } from './event-receiver';
import { EventInterest, noEventInterest } from './event-interest';
import { AfterEvent, afterEventBy, afterEventFrom, afterEventOf } from './after-event';
import { EventEmitter } from './event-emitter';
import { OnEvent__symbol } from './event-sender';
import { AfterEvent__symbol } from './event-keeper';
import { noop, passIf } from 'call-thru';
import Mock = jest.Mock;

describe('AfterEvent', () => {
  describe('by', () => {
    it('builds an `AfterEvent` registrar by arbitrary function', () => {

      let registeredReceiver: EventReceiver<[string]> = noop;
      const mockInterest: EventInterest = {
        off: jest.fn(),
      } as any;
      const mockRegister = jest.fn<EventInterest, [EventReceiver<[string]>]>(rcv => {
        registeredReceiver = rcv;
        return mockInterest;
      });
      const afterEvent = afterEventBy(mockRegister, ['initial']);
      const mockReceiver: Mock<void, [string]> = jest.fn();

      expect(afterEvent(mockReceiver)).toBe(mockInterest);
      expect(mockRegister).toHaveBeenCalledWith(registeredReceiver);
      expect(mockReceiver).toHaveBeenCalledWith('initial');

      registeredReceiver('event');
      expect(mockReceiver).toHaveBeenCalledWith('event');
    });
  });

  describe('from event keeper', () => {

    let keeper: ValueTracker<string>;
    let afterEvent: AfterEvent<[string]>;
    let mockReceiver: EventReceiver<[string]>;
    let interest: EventInterest;

    beforeEach(() => {
      keeper = trackValue('initial');
      afterEvent = afterEventFrom({
        [AfterEvent__symbol](receiver) {
          return keeper.read(receiver);
        }
      });
      mockReceiver = jest.fn();
      interest = afterEvent(mockReceiver);
    });

    it('sends the kept event upon receiver registration', () => {
      expect(mockReceiver).toHaveBeenCalledWith('initial');
    });
    it('has initial event as the kept one', () => {
      expect(afterEvent.kept).toEqual(['initial']);
    });
    it('sends events from the given keeper', () => {

      const event = 'other';

      keeper.it = event;
      expect(mockReceiver).toHaveBeenCalledWith(event);
      expect(afterEvent.kept).toEqual([event]);
    });
    it('does not send events once interest lost', () => {
      interest.off();

      keeper.it = 'other';
      expect(mockReceiver).not.toHaveBeenCalledWith('other');
      expect(afterEvent.kept).toEqual(['initial']);
    });
  });

  describe('from event keeper with registrar implementing `AfterEvent`', () => {
    it('returns the keeper\'s registrar', () => {

      const keeper = trackValue('initial');

      expect(afterEventFrom(keeper)).toBe(keeper[AfterEvent__symbol]);
    });
  });

  describe('from event sender', () => {

    let sender: EventEmitter<[string]>;
    let afterEvent: AfterEvent<[string]>;
    let mockReceiver: EventReceiver<[string]>;
    let interest: EventInterest;

    beforeEach(() => {
      sender = new EventEmitter();
      afterEvent = afterEventFrom(sender, ['initial']);
      mockReceiver = jest.fn();
      interest = afterEvent(mockReceiver);
    });

    it('sends the initial event upon receiver registration', () => {
      expect(mockReceiver).toHaveBeenCalledWith('initial');
    });
    it('has initial event as the kept one', () => {
      expect(afterEvent.kept).toEqual(['initial']);
    });
    it('sends events from the given sender', () => {

      const event = 'other';

      sender.send(event);
      expect(mockReceiver).toHaveBeenCalledWith(event);
      expect(afterEvent.kept).toEqual([event]);
    });
    it('does not send events once interest lost', () => {
      interest.off();

      sender.send('other');
      expect(mockReceiver).not.toHaveBeenCalledWith('other');
      expect(afterEvent.kept).toEqual(['initial']);
    });
  });

  describe('from event sender without initial value', () => {

    let sender: EventEmitter<[string]>;
    let afterEvent: AfterEvent<[string]>;

    beforeEach(() => {
      sender = new EventEmitter();
      afterEvent = afterEventFrom(sender);
    });

    it('throws an exception upon receiver registration', () => {
      expect(() => afterEvent(noop)).toThrow('No events to send');
    });
    it('throws an exception when requesting the last event', () => {
      expect(() => afterEvent.kept).toThrow('No events to send');
    });
  });

  describe('of event', () => {
    it('always sends the same event', () => {

      const event = ['foo', 'bar'];
      const mockReceiver1 = jest.fn();
      const mockReceiver2 = jest.fn();
      const afterEvent = afterEventOf(...event);

      afterEvent(mockReceiver1);
      afterEvent(mockReceiver2);

      expect(mockReceiver1).toHaveBeenCalledWith(...event);
      expect(mockReceiver2).toHaveBeenCalledWith(...event);
    });
  });

  describe('thru', () => {

    let initial: [string, string];
    let mockRegister: Mock;
    let mockInterest: {
      off: Mock<void, []> & EventInterest['off'],
      whenDone: Mock<void, [(reason?: any) => void]>,
    } & EventInterest;
    let registeredReceiver: (event1: string, event2: string) => void;
    let afterEvent: AfterEvent<[string, string]>;
    let mockReceiver: Mock<void, [string]>;

    beforeEach(() => {
      initial = ['init1', 'init2'];
      mockInterest = {
        off: jest.fn(),
        whenDone: jest.fn(),
      } as any;
      mockInterest.off.mockName('interest.off()');
      mockRegister = jest.fn((c: (event1: string, event2: string) => number) => {
        registeredReceiver = c;
        return mockInterest;
      });
      afterEvent = afterEventBy(mockRegister, initial);
      mockReceiver = jest.fn();
    });

    it('registers event receiver', () => {

      const transformed = afterEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      );

      transformed(mockReceiver);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('unregisters event receiver when interest lost', () => {

      const transforming = afterEventFrom(afterEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      ));

      const interest1 = transforming(mockReceiver);
      const interest2 = transforming(jest.fn());

      interest1.off();
      expect(mockInterest.off).not.toHaveBeenCalled();
      interest2.off();
      expect(mockInterest.off).toHaveBeenCalled();
    });
    it('transforms original event', () => {

      const transforming = afterEventFrom(afterEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      ));

      transforming(mockReceiver);

      registeredReceiver('a', 'bb');

      expect(mockReceiver).toHaveBeenCalledWith('init1, init2');
      expect(mockReceiver).toHaveBeenCalledWith('a, bb');
    });
    it('skips original event', () => {

      const transforming = afterEventFrom(afterEvent.thru(
          passIf((event1: string, event2: string) => event1 < event2),
          (event1: string, event2: string) => `${event1}, ${event2}`,
      ));

      transforming(mockReceiver);

      registeredReceiver('a', 'bb');
      expect(mockReceiver).toHaveBeenCalledWith('init1, init2');
      expect(mockReceiver).toHaveBeenCalledWith('a, bb');

      mockReceiver.mockClear();

      const mockReceiver2 = jest.fn();

      transforming(mockReceiver2);
      registeredReceiver('b', 'a');
      expect(mockReceiver2).toHaveBeenCalledWith('init1, init2');
      expect(mockReceiver2).toHaveBeenCalledTimes(1);
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('exhausts when original sender exhausts', () => {

      const mockDone = jest.fn();
      const transforming = afterEventFrom(afterEvent.thru(
          (event1: string, event2: string) => `${event1}, ${event2}`
      ));

      transforming(mockReceiver).whenDone(mockDone);

      const reason = 'some reason';

      mockInterest.whenDone.mock.calls[0][0](reason);
      expect(mockDone).toHaveBeenCalledWith(reason);
    });
  });

  describe('[OnEvent__symbol]', () => {
    it('refers to itself', () => {

      const afterEvent = afterEventBy(() => noEventInterest());

      expect(afterEvent[OnEvent__symbol]).toBe(afterEvent);
    });
  });

  describe('[AfterEvent__symbol]', () => {
    it('refers to itself', () => {

      const afterEvent = afterEventBy(() => noEventInterest());

      expect(afterEvent[AfterEvent__symbol]).toBe(afterEvent);
    });
  });
});
