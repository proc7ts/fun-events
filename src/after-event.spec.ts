import { trackValue, ValueTracker } from './value';
import { EventReceiver } from './event-receiver';
import { EventInterest, noEventInterest } from './event-interest';
import { AfterEvent } from './after-event';
import { EventEmitter } from './event-emitter';
import { OnEvent__symbol } from './event-sender';
import { AfterEvent__symbol } from './event-keeper';
import { noop } from 'call-thru';
import Mock = jest.Mock;

describe('AfterEvent', () => {
  describe('by', () => {
    it('builds an `AfterEvent` registrar by arbitrary function', () => {

      let registeredReceiver: EventReceiver<[string]> = noop;
      const mockInterest = {
        off: jest.fn(),
      } as EventInterest;
      const mockRegister = jest.fn<EventInterest, [EventReceiver<[string]>]>(rcv => {
        registeredReceiver = rcv;
        return mockInterest;
      });
      const afterEvent = AfterEvent.by(mockRegister, ['initial']);
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
      afterEvent = AfterEvent.from({
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

      expect(AfterEvent.from(keeper)).toBe(keeper[AfterEvent__symbol]);
    });
  });

  describe('from event sender', () => {

    let sender: EventEmitter<[string]>;
    let afterEvent: AfterEvent<[string]>;
    let mockReceiver: EventReceiver<[string]>;
    let interest: EventInterest;

    beforeEach(() => {
      sender = new EventEmitter();
      afterEvent = AfterEvent.from(sender, ['initial']);
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
      afterEvent = AfterEvent.from(sender);
    });

    it('throws an exception upon receiver registration', () => {
      expect(() => afterEvent(noop)).toThrow('No events to send');
    });
    it('throws an exception when requesting the last event', () => {
      expect(() => afterEvent.kept).toThrow('No events to send');
    });
  });

  describe('[OnEvent__symbol]', () => {
    it('refers to itself', () => {

      const afterEvent = AfterEvent.by(() => noEventInterest());

      expect(afterEvent[OnEvent__symbol]).toBe(afterEvent);
    });
  });

  describe('[AfterEvent__symbol]', () => {
    it('refers to itself', () => {

      const afterEvent = AfterEvent.by(() => noEventInterest());

      expect(afterEvent[AfterEvent__symbol]).toBe(afterEvent);
    });
  });
});
