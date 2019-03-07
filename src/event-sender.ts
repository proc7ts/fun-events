import { EventReceiver } from './event-receiver';
import { EventInterest } from './event-interest';

/**
 * A key of event receiver registration method of `EventSender`.
 */
export const OnEvent__symbol = /*#__PURE__*/ Symbol('on-event');

/**
 * A sender of events.
 *
 * It is able to register event receivers.
 *
 * @param <E> An event type. This is a tuple of event receiver parameter types.
 */
export interface EventSender<E extends any[]> {

  /**
   * Registers a receiver of events sent by this sender.
   *
   * @param receiver A receiver of events.
   *
   * @returns An event interest. The events will be sent to `receiver` until the `off()` method of returned event
   * interest is called.
   */
  [OnEvent__symbol](receiver: EventReceiver<E>): EventInterest;

}
