import { EventProducer } from './event-producer';
import { EventSource, onEventKey } from './event-source';
import { afterEventKey, CachedEventSource } from './cached-event-source';

/**
 * Builds a producer of events originated from the given event `source`.
 *
 * @param source A source of events to produce.
 *
 * @returns Event producer instance.
 */
export function eventsFrom<E extends any[], R>(source: EventSource<E, R>): EventProducer<E, R> {
  return EventProducer.of(consumer => source[onEventKey](consumer));
}

/**
 * Builds a producer of latest events originated from the given cached event `source`.
 *
 * @param source A cached source of events to produce.
 *
 * @returns Event producer instance.
 */
export function latestEventsFrom<E extends any[], R>(source: CachedEventSource<E, R>): EventProducer<E, R> {
  return EventProducer.of(consumer => source[afterEventKey](consumer));
}
