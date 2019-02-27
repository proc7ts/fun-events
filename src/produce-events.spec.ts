import { EventEmitter } from './event-emitter';
import { produceEvents } from './produce-events';
import { EventProducer } from './event-producer';
import { EventConsumer } from './event-consumer';
import { EventInterest } from './event-interest';

describe('produceEvents', () => {

  let source: EventEmitter<[string]>;
  let producer: EventProducer<[string]>;
  let consumer: EventConsumer<[string]>;
  let interest: EventInterest;

  beforeEach(() => {
    source = new EventEmitter();
    producer = produceEvents(source);
    consumer = jest.fn();
    interest = producer(consumer);
  });

  it('produces events from the given source', () => {

    const event = 'event';

    source.notify(event);
    expect(consumer).toHaveBeenCalledWith(event);
  });
  it('does not produce events once interest lost', () => {
    interest.off();

    source.notify('event');
    expect(consumer).not.toHaveBeenCalled();
  });
});
