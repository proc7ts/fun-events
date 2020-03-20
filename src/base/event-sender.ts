/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { OnEvent } from '../on-event';

/**
 * A key of [[EventSender]] method returning its [[OnEvent]] instance.
 *
 * @category Core
 */
export const OnEvent__symbol = (/*#__PURE__*/ Symbol('on-event'));

/**
 * A sender of events.
 *
 * Contains an [[OnEvent]] instance registering event receivers.
 *
 * @category Core
 * @typeparam E  An event type. This is a tuple of event receiver parameter types.
 */
export interface EventSender<E extends any[]> {

  /**
   * Returns an [[OnEvent]] instance of this event sender.
   *
   * @returns [[OnEvent]] instance registering event receivers sent by this sender.
   */
  [OnEvent__symbol](): OnEvent<E>;

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
 * @returns `true` if `value` contains [[OnEvent__symbol]] property, or `false` otherwise.
 */
export function isEventSender<E extends any[]>(value: object): value is EventSender<E> {
  return OnEvent__symbol in value;
}
