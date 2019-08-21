import { EventInterest } from './event-interest';
import { EventReceiver } from './event-receiver';

/**
 * A key of event receiver registration method of [[EventKeeper]].
 *
 * @category Core
 */
export const AfterEvent__symbol = /*#__PURE__*/ Symbol('after-event');

/**
 * A sender of events that keeps the last event sent.
 *
 * The registered event receiver would receive the kept event immediately upon registration, and all upcoming events
 * after that.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 */
export interface EventKeeper<E extends any[]> {

  /**
   * Registers a receiver of events kept and sent by this keeper.
   *
   * @param receiver  A receiver of events.
   *
   * @returns An event interest. The events will be sent to `receiver` until the [[EventInterest.off]] method
   * of the returned event interest is called.
   */
  [AfterEvent__symbol](receiver: EventReceiver<E>): EventInterest;

}

export namespace EventKeeper {

  /**
   * A type of events sent by the given event keeper.
   *
   * @typeparam T  Target event keeper.
   */
  export type Event<T extends EventKeeper<any>> = T extends EventKeeper<infer E> ? E : never;

}

/**
 * Checks whether the given object implements an [[EventKeeper]] interface.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param value  An object to check.
 *
 * @returns `true` if `value` contains an `[AfterEvent__symbol]` property, or `false` otherwise.
 */
export function isEventKeeper<E extends any[]>(value: object): value is EventKeeper<E> {
  return AfterEvent__symbol in value;
}
