import { eventSupply, noEventSupply } from './event-supply';
import { sendEventsTo } from './send-events-to';

describe('sendEventsTo', () => {
  it('sends events to receiver', () => {

    const receiver = jest.fn();
    const sender = sendEventsTo(receiver);

    sender('event1', 1);
    sender('event2', 2);
    sender('event3', 3);
    expect(receiver).toHaveBeenCalledWith('event1', 1);
    expect(receiver).toHaveBeenCalledWith('event2', 2);
    expect(receiver).toHaveBeenCalledWith('event3', 3);
    expect(receiver).toHaveBeenCalledTimes(3);
  });
  it('stops sending events when receiver supply is cut off', () => {

    const receive = jest.fn();
    const supply = eventSupply();
    const sender = sendEventsTo({ supply, receive });

    sender('event1', 1);
    sender('event2', 2);
    supply.off();
    sender('event3', 3);
    expect(receive).toHaveBeenCalledWith(expect.anything(), 'event1', 1);
    expect(receive).toHaveBeenCalledWith(expect.anything(), 'event2', 2);
    expect(receive).not.toHaveBeenCalledWith(expect.anything(), 'event3', 3);
    expect(receive).toHaveBeenCalledTimes(2);
  });
  it('does not send any events when receiver supply is initially cut off', () => {

    const receive = jest.fn();
    const supply = noEventSupply();
    const sender = sendEventsTo({ supply, receive });

    sender('event1', 1);
    sender('event2', 2);
    supply.off();
    sender('event3', 3);
    expect(receive).not.toHaveBeenCalled();
  });
});
