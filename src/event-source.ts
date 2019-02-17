import { EventConsumer } from './event-consumer';
import { EventInterest } from './event-interest';

/**
 * A key of `EventSource` event consumer registration method.
 */
export const onEventKey = /*#__PURE__*/ Symbol('on-event');

/**
 * A source of events.
 *
 * It is able to register event consumers for receiving events.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 */
export interface EventSource<E extends any[], R = void> {

  /**
   * Registers event consumer that will be notified on events.
   *
   * @param consumer A consumer to notify on events.
   *
   * @return An event interest. The event source will notify the consumer on events, until the `off()` method
   * of returned event interest instance is called.
   */
  [onEventKey](consumer: EventConsumer<E, R>): EventInterest;

}
