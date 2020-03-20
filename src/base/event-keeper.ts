/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent } from '../after-event';

/**
 * A key of [[EventKeeper]] method returning its [[AfterEvent]] instance..
 *
 * @category Core
 */
export const AfterEvent__symbol = (/*#__PURE__*/ Symbol('after-event'));

/**
 * An event supplier that keeps the last event sent.
 *
 * The registered event receiver would receive the kept event immediately upon registration, and all upcoming events
 * after that.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 */
export interface EventKeeper<E extends any[]> {

  /**
   * Returns an [[AfterEvent]] instance of this event keeper.
   *
   * @returns [[AfterEvent]] instance registering event receivers sent by this keeper.
   */
  [AfterEvent__symbol](): AfterEvent<E>;

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
 * @returns `true` if `value` contains an [[AfterEvent__symbol]] property, or `false` otherwise.
 */
export function isEventKeeper<E extends any[]>(value: object): value is EventKeeper<E> {
  return AfterEvent__symbol in value;
}
