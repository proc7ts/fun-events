/**
 * @module fun-events
 */
import { EventReceiver } from './event-receiver';
import { EventSupply } from './event-supply';

/**
 * A key of event receiver registration method of [[EventSender]].
 *
 * @category Core
 */
export const OnEvent__symbol = (/*#__PURE__*/ Symbol('on-event'));

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
   * @param receiver  A receiver of events to register.
   *
   * @returns A supply of events from this sender to the given `receiver`.
   */
  [OnEvent__symbol](receiver: EventReceiver<E>): EventSupply;

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
