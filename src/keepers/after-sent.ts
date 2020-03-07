/**
 * @packageDocumentation
 * @module fun-events
 */
import { AfterEvent, afterEventBy } from '../after-event';
import { EventSender, OnEvent__symbol } from '../base';

/**
 * Builds an [[AfterEvent]] keeper of events sent by the given `sender`.
 *
 * The event generated by `fallback` will be sent to the registered first receiver, unless `register` function sends
 * one.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param sender  An event sender.
 * @param fallback  A function creating fallback event. When omitted, the initial event is expected to be sent by
 * `register` function. A receiver registration would lead to an error otherwise.
 *
 * @returns An [[AfterEvent]] keeper of events either originated from the given `sender`, or `initial` one.
 */
export function afterSent<E extends any[]>(
    sender: EventSender<E>,
    fallback?: (this: void) => E,
): AfterEvent<E> {
  return afterEventBy(receiver => sender[OnEvent__symbol](receiver), fallback);
}
