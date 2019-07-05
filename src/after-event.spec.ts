import { noop, passIf } from 'call-thru';
import {
  AfterEvent,
  afterEventBy,
  afterEventFrom,
  afterEventFromAll,
  afterEventOf,
  afterEventOr,
  afterNever
} from './after-event';
import { EventEmitter } from './event-emitter';
import { eventInterest, EventInterest, noEventInterest } from './event-interest';
import { AfterEvent__symbol } from './event-keeper';
import { EventReceiver } from './event-receiver';
import { OnEvent__symbol } from './event-sender';
import { trackValue, ValueTracker } from './value';
import Mock = jest.Mock;
import Mocked = jest.Mocked;

describe('AfterEvent', () => {
  describe('by', () => {
    it('builds an `AfterEvent` registrar by arbitrary function', () => {

      let registeredReceiver: EventReceiver<[string]> = noop;
      const mockInterest = eventInterest();
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

  describe('or', () => {

    let registeredReceiver: EventReceiver<[string]>;
    let mockInterest: EventInterest;
    let mockFallback: Mock<[string], []>;
    let mockRegister: Mock<EventInterest, [EventReceiver<[string]>]>;
    let afterEvent: AfterEvent<[string]>;
    let mockReceiver: Mock<void, [string]>;

    beforeEach(() => {
      registeredReceiver = noop;
      mockInterest = eventInterest();
      mockFallback = jest.fn(() => ['fallback']);
      mockRegister = jest.fn<EventInterest, [EventReceiver<[string]>]>(rcv => {
        registeredReceiver = rcv;
        return mockInterest;
      });
      afterEvent = afterEventOr(mockRegister, mockFallback);
      mockReceiver = jest.fn();
    });

    it('builds an `AfterEvent` registrar', () => {
      expect(afterEvent(mockReceiver)).toBe(mockInterest);
      expect(mockRegister).toHaveBeenCalledWith(registeredReceiver);
      expect(mockReceiver).toHaveBeenCalledWith('fallback');
      expect(mockReceiver).toHaveBeenCalledTimes(1);

      registeredReceiver('event');
      expect(mockReceiver).toHaveBeenCalledWith('event');
      expect(mockReceiver).toHaveBeenCalledTimes(2);
    });

    it('sends the event sent by registration function', () => {
      mockRegister.mockImplementation(rcv => {
        registeredReceiver = rcv;
        rcv('event');
        return mockInterest;
      });

      afterEvent(mockReceiver);

      expect(mockReceiver).toHaveBeenCalledWith('event');
      expect(mockReceiver).toHaveBeenCalledTimes(1);
    });

    describe('kept', () => {
      it('returns fallback without receivers', () => {
        expect(afterEvent.kept).toEqual(['fallback']);
        mockFallback.mockImplementation(() => ['other fallback']);
        expect(afterEvent.kept).toEqual(['other fallback']);
      });
      it('returns the last event sent while there are receivers', () => {
        afterEvent(mockReceiver);
        registeredReceiver('event');
        expect(afterEvent.kept).toEqual(['event']);
      });
      it('returns fallback when last receiver removed there are receivers', () => {
        mockRegister.mockImplementation(rcv => {
          registeredReceiver = rcv;
          return eventInterest();
        });

        const interest1 = afterEvent(mockReceiver);
        const interest2 = afterEvent(mockReceiver);

        registeredReceiver('event');
        expect(afterEvent.kept).toEqual(['event']);

        interest1.off();
        expect(afterEvent.kept).toEqual(['event']);

        interest2.off();
        expect(afterEvent.kept).toEqual(['fallback']);
      });
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

  describe('from all', () => {

    let source1: ValueTracker<string>;
    let source2: ValueTracker<number>;
    let fromAll: AfterEvent<[{ source1: [string], source2: [number] }]>;
    let mockReceiver: Mock<void, [{ source1: [string], source2: [number] }]>;
    let interest: EventInterest;

    beforeEach(() => {
      source1 = trackValue('init');
      source2 = trackValue(1);
      fromAll = afterEventFromAll({ source1, source2 });
      mockReceiver = jest.fn();
      interest = fromAll(mockReceiver);
    });

    it('sends initial event only once', () => {
      expect(mockReceiver).toHaveBeenCalledWith({ source1: ['init'], source2: [1] });
      expect(mockReceiver).toHaveBeenCalledTimes(1);
    });
    it('does not send anything without sources', () => {
      expect(afterEventFromAll({})).toBe(afterNever);
    });
    it('sends updates', () => {
      mockReceiver.mockClear();
      source1.it = 'update';
      expect(mockReceiver).toHaveBeenCalledWith({ source1: ['update'], source2: [1] });
      source2.it = 2;
      expect(mockReceiver).toHaveBeenCalledWith({ source1: ['update'], source2: [2] });
    });
    it('stops sending updates when interest is lost', () => {
      mockReceiver.mockClear();
      interest.off();
      source1.it = 'update';
      expect(mockReceiver).not.toHaveBeenCalled();
    });
    it('stops sending updates when interest is lost during registration', () => {
      mockReceiver.mockClear();
      interest.off();

      const reason = 'some reason';
      const stopper = afterEventBy<[string]>(() => {

        const stop = eventInterest();

        stop.off(reason);

        return stop;
      });
      const mockDone = jest.fn();

      fromAll = afterEventFromAll({ source1: stopper, source2 });
      interest = fromAll(mockReceiver).whenDone(mockDone);

      expect(mockReceiver).not.toHaveBeenCalled();
      expect(mockDone).toHaveBeenCalledWith(reason);
    });
  });

  describe('kept', () => {
    it('returns initial event', () => {
      expect(afterEventOf('abc').kept).toEqual(['abc']);
    });
    it('returns initial event without receivers', () => {

      const emitter = new EventEmitter<[string]>();
      const afterEvent = afterEventFrom(emitter, ['initial']);

      emitter.send('updated');

      expect(afterEvent.kept).toEqual(['initial']);
    });
    it('returns the last event sent', () => {

      const emitter = new EventEmitter<[string]>();
      const afterEvent = afterEventFrom(emitter, ['initial']);

      afterEvent(noop);
      emitter.send('updated');

      expect(afterEvent.kept).toEqual(['updated']);
    });
  });

  describe('share', () => {

    let initial: [string, string];
    let mockRegister: Mock;
    let mockInterest: Mocked<EventInterest>;
    let registeredReceiver: (event1: string, event2: string) => void;
    let afterEvent: AfterEvent<[string, string]>;
    let mockReceiver: Mock<void, [string, string]>;
    let mockReceiver2: Mock<void, [string, string]>;

    beforeEach(() => {
      initial = ['init1', 'init2'];
      mockInterest = {
        off: jest.fn(),
        whenDone: jest.fn(),
      } as any;
      mockInterest.off.mockName('interest.off()');
      mockRegister = jest.fn(receiver => {
        registeredReceiver = receiver;
        return mockInterest;
      });
      afterEvent = afterEventBy(mockRegister, initial);
      mockReceiver = jest.fn();
      mockReceiver2 = jest.fn();
    });

    it('sends initial event from the source', () => {

      const shared = afterEvent.share();

      shared(mockReceiver);
      shared(mockReceiver2);
      expect(mockReceiver).toHaveBeenCalledWith(...initial);
      expect(mockReceiver2).toHaveBeenCalledWith(...initial);
    });
    it('keeps initial event from the source', () => {

      const shared = afterEvent.share();

      expect(shared.kept).toEqual(initial);
    });
    it('sends events from the source', () => {

      const shared = afterEvent.share();

      shared(mockReceiver);
      shared(mockReceiver2);
      registeredReceiver('a', 'b');
      expect(mockReceiver).toHaveBeenCalledWith('a', 'b');
      expect(mockReceiver2).toHaveBeenCalledWith('a', 'b');
    });
  });

  describe('keep', () => {
    describe('dig', () => {

      let sender: ValueTracker<ValueTracker<string>>;
      let nested1: ValueTracker<string>;
      let nested2: ValueTracker<string>;
      let extract: Mock<ValueTracker<string>, [ValueTracker<string>]>;
      let result: AfterEvent<[string]>;
      let receiver: Mock<void, [string]>;

      beforeEach(() => {
        nested1 = trackValue('1');
        nested2 = trackValue('2');
        sender = trackValue(nested1);
        receiver = jest.fn();
        extract = jest.fn((nested) => nested);
        result = sender.read.keep.dig(extract);
        result(receiver);
      });

      it('returns `AfterEvent` registrar', () => {
        expect(result).toBeInstanceOf(AfterEvent);
      });
      it('receives nested events', () => {
        expect(receiver).toHaveBeenCalledWith('1');
        sender.it = nested2;
        expect(receiver).toHaveBeenCalledWith('2');
        nested2.it = '3';
        expect(receiver).toHaveBeenCalledWith('3');
      });
    });

    describe('thru', () => {

      let initial: [string, string];
      let mockRegister: Mock;
      let mockInterest: Mocked<EventInterest>;
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
        mockRegister = jest.fn(receiver => {
          registeredReceiver = receiver;
          return mockInterest;
        });
        afterEvent = afterEventBy(mockRegister, initial);
        mockReceiver = jest.fn();
      });

      it('registers event receiver', () => {

        const transforming = afterEvent.keep.thru(
            (event1: string, event2: string) => `${event1}, ${event2}`
        );

        transforming(mockReceiver);
        expect(mockRegister).toHaveBeenCalled();
      });
      it('unregisters event receiver when interest lost', () => {

        const transforming = afterEvent.keep.thru(
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

        const transforming = afterEvent.keep.thru(
            (event1: string, event2: string) => `${event1}, ${event2}`
        );

        transforming(mockReceiver);

        registeredReceiver('a', 'bb');

        expect(mockReceiver).toHaveBeenCalledWith('init1, init2');
        expect(mockReceiver).toHaveBeenCalledWith('a, bb');
      });
      it('skips original event', () => {

        const transforming = afterEvent.keep.thru(
            passIf<[string, string], string>((event1: string, event2: string) => event1 < event2),
            (event1: string, event2: string) => `${event1}, ${event2}`,
        );

        transforming(mockReceiver);

        registeredReceiver('a', 'bb');
        expect(mockReceiver).toHaveBeenCalledWith('init1, init2');
        expect(mockReceiver).toHaveBeenCalledWith('a, bb');

        mockReceiver.mockClear();
        expect(mockReceiver).not.toHaveBeenCalled();
      });
      it('exhausts when original sender exhausts', () => {

        const mockDone = jest.fn();
        const transforming = afterEvent.keep.thru(
            (event1: string, event2: string) => `${event1}, ${event2}`
        );

        transforming(mockReceiver).whenDone(mockDone);

        const reason = 'some reason';

        mockInterest.whenDone.mock.calls[0][0](reason);
        expect(mockDone).toHaveBeenCalledWith(reason);
      });
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

describe('afterNever', () => {
  it('returns no event interest', () => {
    expect(afterNever(noop)).toBe(noEventInterest());
  });
});
