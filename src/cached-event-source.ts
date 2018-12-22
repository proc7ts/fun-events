import { EventConsumer } from './event-consumer';
import { EventProducer } from './event-producer';

/**
 * A source of events that caches the last emitted event.
 *
 * Contains an event producer that notifies the consumer on the cached event immediately upon registration.
 *
 * @param <C> A type of event consumer.
 */
export interface CachedEventSource<C extends EventConsumer<any, any, any>> {

  /**
   * A reference to event producer.
   */
  readonly [CachedEventSource.each]: EventProducer<C>;

}

export namespace CachedEventSource {

  /**
   * A key of `CachedEventSource` property containing an event producer.
   */
  export const each = Symbol('each-event');

}
