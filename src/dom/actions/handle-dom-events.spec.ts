import { EventNotifier, EventReceiver } from '../../base';
import { OnDomEvent, onDomEventBy } from '../on-dom-event';
import { captureDomEvents } from './capture-dom-events';
import { handleDomEvents } from './handle-dom-events';

describe('handleDomEvents', () => {

  let mockRegister: jest.Mock<void, [EventReceiver.Generic<[Event]>, (AddEventListenerOptions | boolean)?]>;
  let onDomEvent: OnDomEvent<Event>;
  let mockListener: jest.Mock<void, [Event]>;
  let events: EventNotifier<[Event]>;

  beforeEach(() => {
    events = new EventNotifier();
    mockRegister = jest.fn((listener, _opts?) => {
      events.on(listener);
    });
    onDomEvent = onDomEventBy<Event>((c, opts) => mockRegister(c, opts));
    mockListener = jest.fn();
  });

  describe('allow', () => {

    it('registers event listener', () => {
      onDomEvent.do(handleDomEvents()).to(mockListener);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('passivates event listener by default', () => {
      onDomEvent.do(handleDomEvents()).to(mockListener);
      expect(mockRegister).toHaveBeenCalledWith(expect.anything(), { passive: true });
    });
    it('respects capturing registration', () => {
      onDomEvent.do(handleDomEvents()).to(mockListener, false);
      expect(mockRegister).toHaveBeenCalledWith(expect.anything(), { passive: true, capture: false });
    });
    it('passivates event listener by default when options passed', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        capture: true,
      };

      onDomEvent.do(handleDomEvents()).to(mockListener, opts);
      expect(mockRegister).toHaveBeenCalledWith(expect.anything(), { ...opts, passive: true });
    });
    it('respects non-passive options', () => {

      const opts: AddEventListenerOptions = {
        once: true,
        passive: false,
      };

      onDomEvent.do(handleDomEvents()).to(mockListener, opts);
      expect(mockRegister).toHaveBeenCalledWith(expect.anything(), opts);
    });
    it('combines with `captureDomEvents`', () => {
      onDomEvent.do(captureDomEvents, handleDomEvents()).to(mockListener);
      expect(mockRegister).toHaveBeenCalledWith(expect.anything(), { capture: true, passive: true });
    });
  });

  describe('prevent', () => {
    it('registers event listener', () => {
      onDomEvent.do(handleDomEvents(false)).to(mockListener);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('prevents default', () => {
      onDomEvent.do(handleDomEvents(false)).to(mockListener);

      const event = new KeyboardEvent('click');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      events.send(event);

      expect(preventDefaultSpy).toHaveBeenCalledWith();
      expect(mockListener).toHaveBeenCalledWith(event);
    });
  });
});
