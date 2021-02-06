import { OnEvent } from '../on-event';

/**
 * A key of {@link EventSender} method returning its {@link OnEvent} instance.
 *
 * @category Core
 */
export const OnEvent__symbol = (/*#__PURE__*/ Symbol('on-event'));

/**
 * A sender of events.
 *
 * Contains an {@link OnEvent} instance registering event receivers.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
 */
export interface EventSender<TEvent extends any[]> {

  /**
   * Returns an {@link OnEvent} instance of this event sender.
   *
   * @returns {@link OnEvent} instance registering event receivers sent by this sender.
   */
  [OnEvent__symbol](): OnEvent<TEvent>;

}

/**
 * @category Core
 */
export namespace EventSender {

  /**
   * A type of events sent by the given event sender.
   *
   * @typeParam TSender - Target event sender.
   */
  export type Event<TSender extends EventSender<any>> = TSender extends EventSender<infer TEvent> ? TEvent : never;

}

/**
 * Checks whether the given value implements an {@link EventSender} interface.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param value - A value to check.
 *
 * @returns `true` if the `value` contains an {@link OnEvent__symbol} method, or `false` otherwise.
 */
export function isEventSender<TEvent extends any[]>(value: unknown): value is EventSender<TEvent> {
  return !!value
      && (typeof value === 'object' || typeof value === 'function')
      && typeof (value as Partial<EventSender<TEvent>>)[OnEvent__symbol] === 'function';
}
