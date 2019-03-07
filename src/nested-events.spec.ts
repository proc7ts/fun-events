import { EventEmitter } from './event-emitter';
import { consumeNestedEvents } from './nested-events';
import { EventInterest } from './event-interest';
import Mock = jest.Mock;

describe('consumeNestedEvents', () => {

  let sender: EventEmitter<[EventEmitter<[string]>?]>;
  let nested1: EventEmitter<[string]>;
  let nested2: EventEmitter<[string]>;
  let consumer: Mock<EventInterest | undefined, [EventEmitter<[string]>?]>;
  let receiver: Mock<void, [string]>;
  let interest: EventInterest;

  beforeEach(() => {
    sender = new EventEmitter();
    nested1 = new EventEmitter();
    nested2 = new EventEmitter();
    receiver = jest.fn();
    consumer = jest.fn(nested => nested && nested.on(receiver));
    interest = consumeNestedEvents(sender)(consumer);
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
  it('does not receive events after interest is lost', () => {
    interest.off();

    sender.send(nested1);
    nested1.send('value');
    expect(receiver).not.toHaveBeenCalled();
    expect(consumer).not.toHaveBeenCalled();
  });
});
