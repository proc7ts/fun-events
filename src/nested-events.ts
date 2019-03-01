import { EventProducer } from './event-producer';
import { eventInterest, EventInterest, noEventInterest } from './event-interest';
import { EventSource, onEventKey } from './event-source';

/**
 * Created an event producer consuming events originated from event source nested inside original events.
 *
 * The event consumer registered in the returned producer is expected to register in nested event producer and return
 * corresponding event interest. This interest will be lost on new event. An `undefined` may be returned instead to
 * indicate that no nested events expected.
 *
 * @param source Original event source.
 *
 * @returns An event producer that allows to consume nested events.
 */
export function consumeNestedEvents<E extends any[]>(
    source: EventSource<E>):
    EventProducer<E, EventInterest | undefined> {
  return EventProducer.of(consumer => {

    let consumerInterest = noEventInterest();

    const result = source[onEventKey]((...event: E) => {
      consumerInterest.off();
      consumerInterest = consumer(...event) || noEventInterest();
    });

    return eventInterest(() => {
      consumerInterest.off();
      result.off();
    });
  });
}
