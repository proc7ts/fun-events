import { EventNotifier } from '../event-notifier';
import { EventReceiver } from '../event-receiver';
import { OnDomEvent, onDomEventBy } from './on-dom-event';
import Mock = jest.Mock;

describe('OnDomEvent', () => {

  let mockRegister: Mock<void, [EventReceiver.Generic<[Event]>, (AddEventListenerOptions | boolean)?]>;
  let onDomEvent: OnDomEvent<Event>;
  let mockListener: Mock<void, [Event]>;
  let events: EventNotifier<[Event]>;

  beforeEach(() => {
    events = new EventNotifier();
    mockRegister = jest.fn((listener, _opts?) => {
      events.on(listener);
    });
    onDomEvent = onDomEventBy<Event>((c, opts) => mockRegister(c, opts));
    mockListener = jest.fn();
  });

  describe('capture', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.capture).toBeInstanceOf(OnDomEvent);
    });
    it('registers event listener', () => {
      onDomEvent.capture(mockListener);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('captures events by default', () => {
      onDomEvent.capture(mockListener);
      expect(mockRegister).toHaveBeenCalledWith(jasmine.anything(), true);
    });
    it('respects non-capturing registration', () => {
      onDomEvent.capture(mockListener, false);
      expect(mockRegister).toHaveBeenCalledWith(jasmine.anything(), false);
    });
    it('captures events by default when options passed', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        passive: true,
      };

      onDomEvent.capture(mockListener, opts);
      expect(mockRegister).toHaveBeenCalledWith(jasmine.anything(), { ...opts, capture: true });
    });
    it('respects non-capturing options', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        capture: false,
      };

      onDomEvent.capture(mockListener, opts);
      expect(mockRegister).toHaveBeenCalledWith(jasmine.anything(), opts);
    });
  });

  describe('passive', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.passive).toBeInstanceOf(OnDomEvent);
    });
    it('registers event listener', () => {
      onDomEvent.passive(mockListener);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('passivates event listener by default', () => {
      onDomEvent.passive(mockListener);
      expect(mockRegister).toHaveBeenCalledWith(expect.anything(), { passive: true });
    });
    it('respects capturing registration', () => {
      onDomEvent.passive(mockListener, false);
      expect(mockRegister).toHaveBeenCalledWith(expect.anything(), { passive: true, capture: false });
    });
    it('passivates event listener by default when options passed', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        capture: true,
      };

      onDomEvent.passive(mockListener, opts);
      expect(mockRegister).toHaveBeenCalledWith(expect.anything(), { ...opts, passive: true });
    });
    it('respects non-passive options', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        passive: false,
      };

      onDomEvent.passive(mockListener, opts);
      expect(mockRegister).toHaveBeenCalledWith(expect.anything(), opts);
    });
    it('combines with `capture`', () => {
      onDomEvent.capture.passive(mockListener);
      expect(mockRegister).toHaveBeenCalledWith(expect.anything(), { capture: true, passive: true });
    });
  });

  describe('instead', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.instead).toBeInstanceOf(OnDomEvent);
    });
    it('registers event listener', () => {
      onDomEvent.instead(mockListener);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('prevents default', () => {
      onDomEvent.instead(mockListener);

      const event = new KeyboardEvent('click');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      events.send(event);

      expect(preventDefaultSpy).toHaveBeenCalledWith();
      expect(mockListener).toHaveBeenCalledWith(event);
    });
  });

  describe('just', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.just).toBeInstanceOf(OnDomEvent);
    });
    it('registers event listener', () => {
      onDomEvent.just(mockListener);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('prevents default', () => {
      onDomEvent.just(mockListener);

      const event = new KeyboardEvent('click');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      events.send(event);

      expect(stopPropagationSpy).toHaveBeenCalledWith();
      expect(mockListener).toHaveBeenCalledWith(event);
    });
  });

  describe('last', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.last).toBeInstanceOf(OnDomEvent);
    });
    it('registers event listener', () => {
      onDomEvent.last(mockListener);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('prevents default', () => {
      onDomEvent.last(mockListener);

      const event = new KeyboardEvent('click');
      const stopImmediatePropagationSpy = jest.spyOn(event, 'stopImmediatePropagation');

      events.send(event);

      expect(stopImmediatePropagationSpy).toHaveBeenCalledWith();
      expect(mockListener).toHaveBeenCalledWith(event);
    });
  });
});
