import { EventConsumer } from './event-consumer';
import { EventProducer } from './event-producer';

/**
 * A source of events.
 *
 * Contains an event producer.
 *
 * @param <C> A type of event consumer.
 */
export interface EventSource<C extends EventConsumer<any, any, any>> {

  /**
   * A reference to event producer.
   */
  readonly [EventSource.on]: EventProducer<C>;

}

export namespace EventSource {

  /**
   * A key of `EventSource` property containing an event producer.
   */
  export const on = Symbol('on-event');

}
