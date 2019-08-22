/**
 * @module fun-events
 */
import { EventInterest } from './event-interest';
import { EventReceiver } from './event-receiver';

/**
 * A key of event receiver registration method of [[EventSender]].
 *
 * @category Core
 */
export const OnEvent__symbol = /*#__PURE__*/ Symbol('on-event');

/**
 * A sender of events.
 *
 * It is able to register event receivers.
 *
 * @category Core
 * @typeparam E  An event type. This is a tuple of event receiver parameter types.
 */
export interface EventSender<E extends any[]> {

  /**
   * Registers a receiver of events sent by this sender.
   *
   * @param receiver  A receiver of events.
   *
   * @returns An event interest. The events will be sent to `receiver` until the [[EventInterest.off]] method
   * of the returned event interest is called.
   */
  [OnEvent__symbol](receiver: EventReceiver<E>): EventInterest;

}

export namespace EventSender {

  /**
   * A type of events sent by the given event sender.
   *
   * @typeparam T  Target event sender.
   */
  export type Event<T extends EventSender<any>> = T extends EventSender<infer E> ? E : never;

}

/**
 * Checks whether the given object implements an [[EventSender]] interface.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param value  An object to check.
 *
 * @returns `true` if `value` contains `[OnEvent__symbol]` property, or `false` otherwise.
 */
export function isEventSender<E extends any[]>(value: object): value is EventSender<E> {
  return OnEvent__symbol in value;
}
