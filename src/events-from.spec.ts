import { EventEmitter } from './event-emitter';
import { eventsFrom, latestEventsFrom } from './events-from';
import { EventProducer } from './event-producer';
import { EventConsumer } from './event-consumer';
import { EventInterest } from './event-interest';
import { trackValue, ValueTracker } from './value';
import Mock = jest.Mock;

describe('eventsFrom', () => {

  let source: EventEmitter<[string]>;
  let producer: EventProducer<[string]>;
  let consumer: EventConsumer<[string]>;
  let interest: EventInterest;

  beforeEach(() => {
    source = new EventEmitter();
    producer = eventsFrom(source);
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

describe('latestEventsFrom', () => {

  let source: ValueTracker<string>;
  let producer: EventProducer<[string]>;
  let consumer: Mock & EventConsumer<[string]>;
  let interest: EventInterest;

  beforeEach(() => {
    source = trackValue('initial');
    producer = latestEventsFrom(source);
    consumer = jest.fn();
    interest = producer(consumer);
  });

  it('produces cached event upon consumer registration', () => {
    expect(consumer).toHaveBeenCalledWith('initial');
  });
  it('produces events from the given source', () => {

    const event = 'other';

    source.it = event;
    expect(consumer).toHaveBeenCalledWith(event);
  });
  it('does not produce events once interest lost', () => {
    interest.off();

    source.it = 'other';
    expect(consumer).not.toHaveBeenCalledWith('other');
  });

});
