import { DomEventDispatcher } from './dom-event-dispatcher';
import Mock = jest.Mock;

describe('DomEventDispatcher', () => {

  let targetSpy: {
    addEventListener: Mock<void, [string, EventListener]> & EventTarget['addEventListener'];
    removeEventListener: Mock<void, [EventListener]> & EventTarget['removeEventListener'];
    dispatchEvent: Mock<void, [Event]> & EventTarget['dispatchEvent'];
  };
  let registeredListener: EventListener;

  beforeEach(() => {
    targetSpy = {
      addEventListener: jest.fn((_type: string, listener: EventListener) => {
        registeredListener = listener;
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  });

  let dispatcher: DomEventDispatcher;

  beforeEach(() => {
    dispatcher = new DomEventDispatcher(targetSpy);
  });

  let listenerSpy: Mock<(event: Event) => void>;

  beforeEach(() => {
    listenerSpy = jest.fn();
  });

  describe('on', () => {
    it('registers listener', () => {
      dispatcher.on('click')(listenerSpy);
      expect(targetSpy.addEventListener).toHaveBeenCalledWith('click', registeredListener, undefined);
    });
    it('registers capturing listener', () => {
      dispatcher.on('click').capture(listenerSpy);
      expect(targetSpy.addEventListener).toHaveBeenCalledWith('click', registeredListener, true);
    });
    it('unregisters listener', () => {

      const supply = dispatcher.on('click').capture(listenerSpy);

      supply.off();

      expect(targetSpy.removeEventListener).toHaveBeenCalledWith('click', registeredListener);
    });
  });

  describe('dispatch', () => {
    it('dispatches event', () => {
      targetSpy.dispatchEvent.mockImplementation(() => true);

      const event = new KeyboardEvent('click');

      expect(dispatcher.dispatch(event)).toBe(true);
    });
    it('notifies registered listener', () => {
      dispatcher.on('click').capture(listenerSpy);

      const event = new KeyboardEvent('click');

      registeredListener(event);

      expect(listenerSpy).toHaveBeenCalledWith(event);
    });
  });
});
