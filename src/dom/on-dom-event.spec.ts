import { EventInterest } from '../event-interest';
import { EventReceiver } from '../event-receiver';
import { OnDomEvent, onDomEventBy } from './on-dom-event';
import Mock = jest.Mock;
import Mocked = jest.Mocked;

describe('OnDomEvent', () => {

  let mockRegister: Mock<EventInterest, [EventReceiver<[Event]>, (AddEventListenerOptions | boolean)?]>;
  let onDomEvent: OnDomEvent<Event>;
  let mockListener: Mock<void, [Event]>;
  let mockInterest: Mocked<EventInterest>;
  let registeredListener: (event: Event) => void;

  beforeEach(() => {
    mockInterest = {
      off: jest.fn(),
    } as any;
    mockRegister = jest.fn((listener, _opts?) => {
      registeredListener = listener;
      return mockInterest;
    });
    onDomEvent = onDomEventBy<Event>((c, opts) => mockRegister(c, opts));
    mockListener = jest.fn();
  });

  describe('capture', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.capture).toBeInstanceOf(OnDomEvent);
    });
    it('registers event listener', () => {
      expect(onDomEvent.capture(mockListener)).toBe(mockInterest);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('captures events by default', () => {
      onDomEvent.capture(mockListener);
      expect(mockRegister).toHaveBeenCalledWith(registeredListener, true);
    });
    it('respects non-capturing registration', () => {
      onDomEvent.capture(mockListener, false);
      expect(mockRegister).toHaveBeenCalledWith(registeredListener, false);
    });
    it('captures events by default when options passed', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        passive: true,
      };

      onDomEvent.capture(mockListener, opts);
      expect(mockRegister).toHaveBeenCalledWith(registeredListener, { ...opts, capture: true });
    });
    it('respects non-capturing options', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        capture: false,
      };

      onDomEvent.capture(mockListener, opts);
      expect(mockRegister).toHaveBeenCalledWith(registeredListener, opts);
    });
  });

  describe('passive', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.passive).toBeInstanceOf(OnDomEvent);
    });
    it('registers event listener', () => {
      expect(onDomEvent.passive(mockListener)).toBe(mockInterest);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('passivates event listener by default', () => {
      onDomEvent.passive(mockListener);
      expect(mockRegister).toHaveBeenCalledWith(registeredListener, { passive: true });
    });
    it('respects capturing registration', () => {
      onDomEvent.passive(mockListener, false);
      expect(mockRegister).toHaveBeenCalledWith(registeredListener, { passive: true, capture: false });
    });
    it('passivates event listener by default when options passed', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        capture: true,
      };

      onDomEvent.passive(mockListener, opts);
      expect(mockRegister).toHaveBeenCalledWith(registeredListener, { ...opts, passive: true });
    });
    it('respects non-passive options', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        passive: false,
      };

      onDomEvent.passive(mockListener, opts);
      expect(mockRegister).toHaveBeenCalledWith(registeredListener, opts);
    });
    it('combines with `capture`', () => {
      onDomEvent.capture.passive(mockListener);
      expect(mockRegister).toHaveBeenCalledWith(registeredListener, { capture: true, passive: true });
    });
  });

  describe('instead', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.instead).toBeInstanceOf(OnDomEvent);
    });
    it('registers event listener', () => {
      expect(onDomEvent.instead(mockListener)).toBe(mockInterest);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('prevents default', () => {
      onDomEvent.instead(mockListener);

      const event = new KeyboardEvent('click');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      registeredListener(event);

      expect(preventDefaultSpy).toHaveBeenCalledWith();
      expect(mockListener).toHaveBeenCalledWith(event);
    });
  });

  describe('just', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.just).toBeInstanceOf(OnDomEvent);
    });
    it('registers event listener', () => {
      expect(onDomEvent.just(mockListener)).toBe(mockInterest);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('prevents default', () => {
      onDomEvent.just(mockListener);

      const event = new KeyboardEvent('click');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      registeredListener(event);

      expect(stopPropagationSpy).toHaveBeenCalledWith();
      expect(mockListener).toHaveBeenCalledWith(event);
    });
  });

  describe('last', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.last).toBeInstanceOf(OnDomEvent);
    });
    it('registers event listener', () => {
      expect(onDomEvent.last(mockListener)).toBe(mockInterest);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('prevents default', () => {
      onDomEvent.last(mockListener);

      const event = new KeyboardEvent('click');
      const stopImmediatePropagationSpy = jest.spyOn(event, 'stopImmediatePropagation');

      registeredListener(event);

      expect(stopImmediatePropagationSpy).toHaveBeenCalledWith();
      expect(mockListener).toHaveBeenCalledWith(event);
    });
  });
});
