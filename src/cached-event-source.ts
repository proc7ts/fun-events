import { EventProducer } from './event-producer';

/**
 * A source of events that caches the last emitted event.
 *
 * Contains an event producer that notifies the consumer on the cached event immediately upon registration.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 */
export interface CachedEventSource<E extends any[], R = void> {

  /**
   * A reference to event producer.
   */
  readonly [CachedEventSource.each]: EventProducer<E, R>;

}

export namespace CachedEventSource {

  /**
   * A key of `CachedEventSource` property containing an event producer.
   */
  export const each = Symbol('each-event');

}
