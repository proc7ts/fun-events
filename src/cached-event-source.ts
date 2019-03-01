import { EventConsumer } from './event-consumer';
import { EventInterest } from './event-interest';

/**
 * A key of `CachedEventSource` event consumer registration method.
 */
export const afterEventKey = /*#__PURE__*/ Symbol('after-event');

/**
 * A source of events that caches the last emitted event.
 *
 * It is guaranteed that event consumer registered in this source will receive an event immediately upon registration.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 */
export interface CachedEventSource<E extends any[], R = void> {

  /**
   * Registers event consumer that will be notified on cached event immediately upon registration, and on every
   * upcoming event.
   *
   * @param consumer A consumer to notify on events.
   *
   * @return An event interest. The event source will notify the consumer on events, until the `off()` method
   * of returned event interest instance is called.
   */
  [afterEventKey](consumer: EventConsumer<E, R>): EventInterest;

}
