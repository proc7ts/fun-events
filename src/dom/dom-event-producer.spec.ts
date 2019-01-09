import { EventInterest } from '../event-interest';
import { DomEventProducer } from './dom-event-producer';
import Mock = jest.Mock;
import Mocked = jest.Mocked;

describe('DomEventProducer', () => {

  let registerSpy: Mock;
  let producer: DomEventProducer<Event>;
  let listenerSpy: Mock<(event: Event) => void>;
  let interestSpy: Mocked<EventInterest>;
  let registeredListener: (event: Event) => void;

  beforeEach(() => {
    interestSpy = {
      off: jest.fn()
    };
    registerSpy = jest.fn((c: (event: Event) => void) => {
      registeredListener = c;
      return interestSpy;
    });
    producer = DomEventProducer.of<Event>((c, opts) => registerSpy(c, opts));
    listenerSpy = jest.fn();
  });

  describe('capture', () => {
    it('builds `DomEventProducer`', () => {
      expect(producer.capture).toBeInstanceOf(DomEventProducer);
    });
    it('registers event listener', () => {
      expect(producer.capture(listenerSpy)).toBe(interestSpy);
      expect(registerSpy).toHaveBeenCalled();
    });
    it('captures events by default', () => {
      producer.capture(listenerSpy);
      expect(registerSpy).toHaveBeenCalledWith(registeredListener, true);
    });
    it('respects non-capturing registration', () => {
      producer.capture(listenerSpy, false);
      expect(registerSpy).toHaveBeenCalledWith(registeredListener, false);
    });
    it('captures events by default when options passed', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        passive: true,
      };

      producer.capture(listenerSpy, opts);
      expect(registerSpy).toHaveBeenCalledWith(registeredListener, { ...opts, capture: true });
    });
    it('captures non-capturing options', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        capture: false,
      };

      producer.capture(listenerSpy, opts);
      expect(registerSpy).toHaveBeenCalledWith(registeredListener, opts);
    });
  });
});
