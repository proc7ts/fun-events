import { AfterEvent } from '../after-event';

/**
 * A key of {@link EventKeeper} method returning its {@link AfterEvent} instance.
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
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 */
export interface EventKeeper<TEvent extends any[]> {
  /**
   * Returns an {@link AfterEvent} instance of this event keeper.
   *
   * @returns {@link AfterEvent} instance registering event receivers sent by this keeper.
   */
  [AfterEvent__symbol](): AfterEvent<TEvent>;
}

/**
 * @category Core
 */
export namespace EventKeeper {
  /**
   * A type of events sent by the given event keeper.
   *
   * @typeParam TKeeper - Target event keeper.
   */
  export type Event<TKeeper extends EventKeeper<any>> = TKeeper extends EventKeeper<infer TEvent>
    ? TEvent
    : never;
}

/**
 * Checks whether the given value implements an {@link EventKeeper} interface.
 *
 * @category Core
 * @typeParam TEvent - Expected event type.
 * @typeParam TOther - Another type the value may have.
 * @param value - A value to check.
 *
 * @returns `true` if the `value` contains an {@link AfterEvent__symbol} method, or `false` otherwise.
 */
export function isEventKeeper<TEvent extends any[], TOther = unknown>(
  value: EventKeeper<TEvent> | TOther,
): value is EventKeeper<TEvent> {
  return (
    !!value
    && (typeof value === 'object' || typeof value === 'function')
    && typeof (value as Partial<EventKeeper<TEvent>>)[AfterEvent__symbol] === 'function'
  );
}
