/**
 * @module fun-events
 */
import { EventReceiver } from './event-receiver';
import { EventSupply } from './event-supply';

/**
 * A key of event receiver registration method of [[EventKeeper]].
 *
 * @category Core
 */
export const AfterEvent__symbol = /*#__PURE__*/ Symbol('after-event');

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
   * Registers a receiver of events kept and sent by this keeper.
   *
   * @param receiver  A receiver of events to register.
   *
   * @returns A supply of events from this keeper to the given `receiver`.
   */
  [AfterEvent__symbol](receiver: EventReceiver<E>): EventSupply;

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
