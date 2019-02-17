import { EventInterest } from '../event-interest';
import { DomEventProducer } from './dom-event-producer';
import Mock = jest.Mock;

describe('DomEventProducer', () => {

  let registerSpy: Mock;
  let producer: DomEventProducer<Event>;
  let listenerSpy: Mock<(event: Event) => void>;
  let interestSpy: {
    off: Mock<void, []> & EventInterest['off'],
  } & EventInterest;
  let registeredListener: (event: Event) => void;

  beforeEach(() => {
    interestSpy = {
      off: jest.fn()
    } as any;
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
    it('respects non-capturing options', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        capture: false,
      };

      producer.capture(listenerSpy, opts);
      expect(registerSpy).toHaveBeenCalledWith(registeredListener, opts);
    });
  });

  describe('passive', () => {
    it('builds `DomEventProducer`', () => {
      expect(producer.passive).toBeInstanceOf(DomEventProducer);
    });
    it('registers event listener', () => {
      expect(producer.passive(listenerSpy)).toBe(interestSpy);
      expect(registerSpy).toHaveBeenCalled();
    });
    it('passivates event listener by default', () => {
      producer.passive(listenerSpy);
      expect(registerSpy).toHaveBeenCalledWith(registeredListener, { passive: true });
    });
    it('respects capturing registration', () => {
      producer.passive(listenerSpy, false);
      expect(registerSpy).toHaveBeenCalledWith(registeredListener, { passive: true, capture: false });
    });
    it('passivates event listener by default when options passed', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        capture: true,
      };

      producer.passive(listenerSpy, opts);
      expect(registerSpy).toHaveBeenCalledWith(registeredListener, { ...opts, passive: true });
    });
    it('respects non-passive options', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        passive: false,
      };

      producer.passive(listenerSpy, opts);
      expect(registerSpy).toHaveBeenCalledWith(registeredListener, opts);
    });
    it('combines with `capture`', () => {
      producer.capture.passive(listenerSpy);
      expect(registerSpy).toHaveBeenCalledWith(registeredListener, { capture: true, passive: true });
    });
  });

  describe('instead', () => {
    it('builds `DomEventProducer`', () => {
      expect(producer.instead).toBeInstanceOf(DomEventProducer);
    });
    it('registers event listener', () => {
      expect(producer.instead(listenerSpy)).toBe(interestSpy);
      expect(registerSpy).toHaveBeenCalled();
    });
    it('prevents default', () => {
      producer.instead(listenerSpy);

      const event = new KeyboardEvent('click');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      registeredListener(event);

      expect(preventDefaultSpy).toHaveBeenCalledWith();
      expect(listenerSpy).toHaveBeenCalledWith(event);
    });
  });

  describe('just', () => {
    it('builds `DomEventProducer`', () => {
      expect(producer.just).toBeInstanceOf(DomEventProducer);
    });
    it('registers event listener', () => {
      expect(producer.just(listenerSpy)).toBe(interestSpy);
      expect(registerSpy).toHaveBeenCalled();
    });
    it('prevents default', () => {
      producer.just(listenerSpy);

      const event = new KeyboardEvent('click');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      registeredListener(event);

      expect(stopPropagationSpy).toHaveBeenCalledWith();
      expect(listenerSpy).toHaveBeenCalledWith(event);
    });
  });

  describe('last', () => {
    it('builds `DomEventProducer`', () => {
      expect(producer.last).toBeInstanceOf(DomEventProducer);
    });
    it('registers event listener', () => {
      expect(producer.last(listenerSpy)).toBe(interestSpy);
      expect(registerSpy).toHaveBeenCalled();
    });
    it('prevents default', () => {
      producer.last(listenerSpy);

      const event = new KeyboardEvent('click');
      const stopImmediatePropagationSpy = jest.spyOn(event, 'stopImmediatePropagation');

      registeredListener(event);

      expect(stopImmediatePropagationSpy).toHaveBeenCalledWith();
      expect(listenerSpy).toHaveBeenCalledWith(event);
    });
  });
});
