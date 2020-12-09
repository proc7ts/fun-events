import { neverSupply, Supply } from '@proc7ts/primitives';
import { letInEvents, onceEvent } from '../actions';
import { EventNotifier, EventReceiver } from '../base';
import { OnDomEvent, onDomEventBy } from './on-dom-event';
import Mock = jest.Mock;
import SpyInstance = jest.SpyInstance;

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

  describe('onceEvent', () => {

    let supply: Supply;
    let offSpy: SpyInstance;

    beforeEach(() => {
      mockRegister = jest.fn(receiver => {
        events.on(receiver);
        supply = receiver.supply;
        offSpy = jest.spyOn(supply, 'off');
      });
    });

    it('registers event receiver', () => {
      expect(onDomEvent.do(onceEvent).to(mockListener)).toBe(supply);
      expect(mockRegister).toHaveBeenCalled();
    });
    it('unregisters notified event receiver', () => {
      onDomEvent.do(onceEvent).to(mockListener);
      expect(offSpy).not.toHaveBeenCalled();

      const event = new KeyboardEvent('click');

      events.send(event);
      expect(mockListener).toHaveBeenCalledWith(event);
      expect(offSpy).toHaveBeenCalled();
    });
    it('unregisters immediately notified event receiver', () => {

      const event = new KeyboardEvent('click');

      mockRegister.mockImplementation(receiver => {
        events.on(receiver);
        supply = receiver.supply;
        offSpy = jest.spyOn(supply, 'off');
        events.send(event);
      });

      onDomEvent.do(onceEvent).to(mockListener);

      expect(offSpy).toHaveBeenCalled();
      expect(mockListener).toHaveBeenCalledWith(event);
    });
    it('never sends events if their supply is initially cut off', () => {

      const event = new KeyboardEvent('click');

      supply = neverSupply();
      onDomEvent.do(onceEvent).to({ supply, receive: (_context, e) => mockListener(e) });
      events.send(event);
      expect(mockListener).not.toHaveBeenCalled();
    });
    it('never sends events after their supply is cut off', () => {
      onDomEvent.do(onceEvent).to(mockListener).off();
      events.send(new KeyboardEvent('click'));
      expect(mockListener).not.toHaveBeenCalled();
    });
    it('sends only one event', () => {
      onDomEvent.do(onceEvent).to(mockListener);

      const event1 = new KeyboardEvent('keydown');

      events.send(event1);
      events.send(new KeyboardEvent('keyup'));
      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(mockListener).toHaveBeenLastCalledWith(event1);
    });
  });

  describe('letInEvents', () => {

    let supply: Supply;
    let offSpy: Mock;
    let requiredSupply: Supply;

    beforeEach(() => {
      mockRegister = jest.fn(receiver => {
        events.on(receiver);
        supply = receiver.supply;
        supply.whenOff(offSpy = jest.fn());
      });
      requiredSupply = new Supply();
    });

    it('sends original events', () => {

      const event1 = new KeyboardEvent('keydown');
      const event2 = new KeyboardEvent('keyup');

      onDomEvent.do(letInEvents(requiredSupply)).to(mockListener);
      events.send(event1);
      events.send(event2);

      expect(mockListener).toHaveBeenCalledWith(event1);
      expect(mockListener).toHaveBeenLastCalledWith(event2);
    });
    it('does not send any events if required supply is initially cut off', () => {

      const event = new KeyboardEvent('click');
      const whenOff = jest.fn();

      onDomEvent.do(letInEvents(neverSupply())).to(mockListener).whenOff(whenOff);
      events.send(event);
      expect(mockListener).not.toHaveBeenCalled();
      expect(whenOff).toHaveBeenCalled();
    });
    it('no longer sends events after original supply is cut off', () => {

      const event1 = new KeyboardEvent('keydown');
      const event2 = new KeyboardEvent('keyup');
      const whenOff = jest.fn();

      onDomEvent.do(letInEvents(requiredSupply)).to(mockListener).whenOff(whenOff);
      events.send(event1);
      supply.off('reason');
      events.send(event2);

      expect(mockListener).toHaveBeenLastCalledWith(event1);
      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(whenOff).toHaveBeenCalledWith('reason');
      expect(offSpy).toHaveBeenCalledWith('reason');
    });
    it('no longer sends events after required supply is cut off', () => {

      const event1 = new KeyboardEvent('keydown');
      const event2 = new KeyboardEvent('keyup');
      const whenOff = jest.fn();

      onDomEvent.do(letInEvents(requiredSupply)).to(mockListener).whenOff(whenOff);
      events.send(event1);
      requiredSupply.off('reason');
      events.send(event2);

      expect(mockListener).toHaveBeenLastCalledWith(event1);
      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(whenOff).toHaveBeenCalledWith('reason');
      expect(offSpy).toHaveBeenCalledWith('reason');
    });
  });

  describe('just', () => {
    it('builds `OnDomEvent`', () => {
      expect(onDomEvent.just()).toBeInstanceOf(OnDomEvent);
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
      expect(onDomEvent.last()).toBeInstanceOf(OnDomEvent);
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
