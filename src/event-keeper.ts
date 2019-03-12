import { EventReceiver } from './event-receiver';
import { EventInterest } from './event-interest';

/**
 * A key of event receiver registration method of `EventKeeper`.
 */
export const AfterEvent__symbol = /*#__PURE__*/ Symbol('after-event');

/**
 * A sender of events that keeps the last event sent.
 *
 * The registered event receiver would receive the kept event immediately upon registration, and all upcoming events
 * after that.
 *
 * @param <E> An event type. This is a list of event receiver parameter types.
 */
export interface EventKeeper<E extends any[]> {

  /**
   * Registers a receiver of events kept and sent by this keeper.
   *
   * @param receiver A receiver of events.
   *
   * @returns An event interest. The events will be sent to `receiver` until the `off()` method of returned event
   * interest is called.
   */
  [AfterEvent__symbol](receiver: EventReceiver<E>): EventInterest;

}