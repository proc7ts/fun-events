import { EventProducer } from './event-producer';
import { EventSource, onEventKey } from './event-source';

/**
 * Builds a producer of event originated from the given `source`.
 *
 * @param source A source of events to produce.
 */
export function produceEvents<E extends any[], R>(source: EventSource<E, R>): EventProducer<E, R> {
  return EventProducer.of(consumer => source[onEventKey](consumer));
}
