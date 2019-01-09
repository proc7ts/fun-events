import { EventProducer } from './event-producer';

/**
 * A source of events.
 *
 * Contains an event producer.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 */
export interface EventSource<E extends any[], R = void> {

  /**
   * A reference to event producer.
   */
  readonly [EventSource.on]: EventProducer<E, R>;

}

export namespace EventSource {

  /**
   * A key of `EventSource` property containing an event producer.
   */
  export const on = Symbol('on-event');

}
