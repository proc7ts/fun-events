import { EventEmitter } from './event-emitter';
import { consumeNestedEvents } from './nested-events';
import { EventInterest } from './event-interest';
import Mock = jest.Mock;

describe('consumeNestedEvents', () => {

  let sender: EventEmitter<[EventEmitter<[string]>?]>;
  let nested1: EventEmitter<[string]>;
  let nested2: EventEmitter<[string]>;
  let consume: Mock<EventInterest | undefined, [EventEmitter<[string]>?]>;
  let receiver: Mock<void, [string]>;
  let interest: EventInterest;

  beforeEach(() => {
    sender = new EventEmitter();
    nested1 = new EventEmitter();
    nested2 = new EventEmitter();
    receiver = jest.fn();
    consume = jest.fn(nested => nested && nested.on(receiver));
    interest = consumeNestedEvents(sender, consume);
  });

  it('receives nested event', () => {
    sender.send(nested1);
    nested1.send('value');
    expect(receiver).toHaveBeenCalledWith('value');
  });
  it('receives latest event', () => {
    sender.send(nested1);

    nested1.send('value1');
    expect(receiver).toHaveBeenCalledWith('value1');

    nested1.send('value2');
    expect(receiver).toHaveBeenCalledWith('value2');
  });
  it('receives event from latest nested sender', () => {
    sender.send(nested1);
    sender.send(nested2);

    nested1.send('value1');
    nested2.send('value2');
    expect(receiver).not.toHaveBeenCalledWith('value1');
    expect(receiver).toHaveBeenCalledWith('value2');
  });
  it('does not receive event when not registered in nested', () => {
    sender.send(nested1);
    sender.send();

    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
  });
  it('does not receive events when interest is lost', () => {
    interest.off();

    sender.send(nested1);
    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
    expect(consume).not.toHaveBeenCalled();
  });
  it('stops consumption when sender events exhausted', () => {

    const mockDone = jest.fn();

    interest.whenDone(mockDone);

    const reason = 'some reason';

    sender.clear(reason);

    expect(mockDone).toHaveBeenCalledWith(reason);

    sender.send(nested1);
    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
    expect(consume).not.toHaveBeenCalled();
  });
  it('does not stop consumption when nested events exhausted', () => {

    const mockDone = jest.fn();

    interest.whenDone(mockDone);

    const reason = 'some reason';

    sender.send(nested1);
    nested1.send('value1');
    nested1.clear(reason);
    nested1.send('value2');

    expect(mockDone).not.toHaveBeenCalledWith(reason);

    sender.send(nested2);
    nested2.send('value3');

    expect(receiver).toHaveBeenCalledWith('value1');
    expect(receiver).not.toHaveBeenCalledWith('value2');
    expect(receiver).toHaveBeenCalledWith('value3');
  });
});
