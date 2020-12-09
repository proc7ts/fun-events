import { EventNotifier, EventReceiver } from '../../base';
import { OnDomEvent, onDomEventBy } from '../on-dom-event';
import { stopDomEvents } from './stop-dom-events';

describe('stopDomEvents', () => {

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
    onDomEvent.do(stopDomEvents)(mockListener);
    expect(mockRegister).toHaveBeenCalled();
  });
  it('prevents default', () => {
    onDomEvent.do(stopDomEvents)(mockListener);

    const event = new KeyboardEvent('click');
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

    events.send(event);

    expect(stopPropagationSpy).toHaveBeenCalledWith();
    expect(mockListener).toHaveBeenCalledWith(event);
  });
});
