import { EventEmitter } from './event-emitter';
import { consumeNestedEvents } from './nested-events';
import { EventProducer } from './event-producer';
import { EventInterest } from './event-interest';
import Mock = jest.Mock;

describe('consumeNestedEvents', () => {

  let source: EventEmitter<[EventEmitter<[string]>?]>;
  let nested1: EventEmitter<[string]>;
  let nested2: EventEmitter<[string]>;
  let consuming: EventProducer<[EventEmitter<[string]>?], EventInterest | undefined>;
  let mapper: Mock;
  let consumer: Mock<void, [string]>;
  let interest: EventInterest;

  beforeEach(() => {
    source = new EventEmitter();
    nested1 = new EventEmitter();
    nested2 = new EventEmitter();
    consuming = consumeNestedEvents(source);
    consumer = jest.fn();
    mapper = jest.fn(nested => nested && nested.on(consumer));
    interest = consuming(mapper);
  });

  it('consumes nested event', () => {
    source.notify(nested1);
    nested1.notify('value');
    expect(consumer).toHaveBeenCalledWith('value');
  });
  it('consumes latest event', () => {
    source.notify(nested1);

    nested1.notify('value1');
    expect(consumer).toHaveBeenCalledWith('value1');

    nested1.notify('value2');
    expect(consumer).toHaveBeenCalledWith('value2');
  });
  it('consumes event from latest nested source', () => {
    source.notify(nested1);
    source.notify(nested2);

    nested1.notify('value1');
    nested2.notify('value2');
    expect(consumer).not.toHaveBeenCalledWith('value1');
    expect(consumer).toHaveBeenCalledWith('value2');
  });
  it('does not consume event when not registered in nested', () => {
    source.notify(nested1);
    source.notify();

    nested1.notify('value');
    expect(consumer).not.toHaveBeenCalled();
  });
  it('does not consume events after interest is lost', () => {
    interest.off();

    source.notify(nested1);
    nested1.notify('value');
    expect(consumer).not.toHaveBeenCalled();
    expect(mapper).not.toHaveBeenCalled();
  });
});
