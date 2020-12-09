import { onceEvent } from '../actions';
import { captureDomEvents } from './actions';
import { DomEventDispatcher } from './dom-event-dispatcher';
import Mock = jest.Mock;

describe('DomEventDispatcher', () => {

  let mockTarget: jest.Mocked<Pick<EventTarget, 'addEventListener' | 'removeEventListener' | 'dispatchEvent'>>;
  let registeredListener: EventListener;

  beforeEach(() => {
    mockTarget = {
      addEventListener: jest.fn((_type: string, listener) => {
        registeredListener = listener as EventListener;
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  });

  let dispatcher: DomEventDispatcher;

  beforeEach(() => {
    dispatcher = new DomEventDispatcher(mockTarget);
  });

  let mockListener: Mock<(event: Event) => void>;

  beforeEach(() => {
    mockListener = jest.fn();
  });

  describe('on', () => {
    it('registers listener', () => {
      dispatcher.on('click')(mockListener);
      expect(mockTarget.addEventListener).toHaveBeenCalledWith('click', registeredListener, undefined);
    });
    it('registers capturing listener', () => {
      dispatcher.on('click').do(captureDomEvents)(mockListener);
      expect(mockTarget.addEventListener).toHaveBeenCalledWith('click', registeredListener, true);
    });
    it('unregisters listener', () => {

      const supply = dispatcher.on('click').do(captureDomEvents)(mockListener);

      supply.off();

      expect(mockTarget.removeEventListener).toHaveBeenCalledWith('click', registeredListener);
    });

    describe('once', () => {
      it('registers listener', () => {
        dispatcher.on('click').do(onceEvent)(mockListener);
        expect(mockTarget.addEventListener).toHaveBeenCalledWith('click', registeredListener, undefined);
      });
      it('registers capturing listener', () => {
        dispatcher.on('click').do(captureDomEvents, onceEvent)(mockListener);
        expect(mockTarget.addEventListener).toHaveBeenCalledWith('click', registeredListener, true);
      });
      it('unregisters listener', () => {

        const supply = dispatcher.on('click').do(captureDomEvents, onceEvent)(mockListener);

        supply.off();

        expect(mockTarget.removeEventListener).toHaveBeenCalledWith('click', registeredListener);
      });
      it('unregisters listener after receiving event', () => {

        const supply = dispatcher.on('click').do(captureDomEvents, onceEvent)(mockListener);

        registeredListener(new KeyboardEvent('click'));

        expect(supply.isOff).toBe(true);
        expect(mockTarget.removeEventListener).toHaveBeenCalledWith('click', registeredListener);
      });
    });
  });

  describe('dispatch', () => {
    it('dispatches event', () => {
      mockTarget.dispatchEvent.mockImplementation(() => true);

      const event = new KeyboardEvent('click');

      expect(dispatcher.dispatch(event)).toBe(true);
    });
    it('notifies registered listener', () => {
      dispatcher.on('click').do(captureDomEvents)(mockListener);

      const event = new KeyboardEvent('click');

      registeredListener(event);

      expect(mockListener).toHaveBeenCalledWith(event);
    });
  });

  describe('done', () => {
    it('unregisters event listener', () => {

      const supply = dispatcher.on('click')(mockListener);
      const reason = 'test reason';

      dispatcher.supply.off(reason);
      expect(mockTarget.removeEventListener).toHaveBeenCalled();

      const whenOff = jest.fn();

      supply.whenOff(whenOff);
      expect(whenOff).toHaveBeenCalledWith(reason);
    });
    it('rejects new listeners', () => {

      const reason = 'test reason';

      dispatcher.supply.off(reason);

      const supply = dispatcher.on('click')(mockListener);

      expect(mockTarget.addEventListener).not.toHaveBeenCalled();

      const whenOff = jest.fn();

      supply.whenOff(whenOff);
      expect(whenOff).toHaveBeenCalledWith(reason);
    });
    it('rejects event dispatching', () => {
      dispatcher.supply.off();
      expect(dispatcher.dispatch(new KeyboardEvent('click'))).toBe(false);
      expect(mockTarget.dispatchEvent).not.toHaveBeenCalled();
    });
  });
});
