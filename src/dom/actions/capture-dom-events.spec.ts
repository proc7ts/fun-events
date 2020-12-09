import { EventNotifier, EventReceiver } from '../../base';
import { OnDomEvent, onDomEventBy } from '../on-dom-event';
import { captureDomEvents } from './capture-dom-events';

describe('captureDomEvents', () => {

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

  it('registers event listener', () => {
    onDomEvent.do(captureDomEvents).to(mockListener);
    expect(mockRegister).toHaveBeenCalled();
  });
  it('captures events by default', () => {
    onDomEvent.do(captureDomEvents).to(mockListener);
    expect(mockRegister).toHaveBeenCalledWith(expect.anything(), true);
  });
  it('respects non-capturing registration', () => {
    onDomEvent.do(captureDomEvents).to(mockListener, false);
    expect(mockRegister).toHaveBeenCalledWith(expect.anything(), false);
  });
  it('captures events by default when options passed', () => {

    const opts: AddEventListenerOptions = {
      once: true,
      passive: true,
    };

    onDomEvent.do(captureDomEvents).to(mockListener, opts);
    expect(mockRegister).toHaveBeenCalledWith(expect.anything(), { ...opts, capture: true });
  });
  it('respects non-capturing options', () => {

    const opts: AddEventListenerOptions = {
      once: true,
      capture: false,
    };

    onDomEvent.do(captureDomEvents).to(mockListener, opts);
    expect(mockRegister).toHaveBeenCalledWith(expect.anything(), opts);
  });
});
