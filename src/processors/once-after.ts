/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent, afterEventBy } from '../after-event';
import { onceEvent } from '../impl';
import { OnEvent } from '../on-event';

/**
 * A processor of the first event incoming from {@link AfterEvent} keeper.
 *
 * Cuts off the outgoing events supply after sending the first event.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event keeper to receive an event from.
 *
 * @returns New keeper of the first event.
 */
export function onceAfter<TEvent extends any[]>(
    supplier: AfterEvent<TEvent>,
): AfterEvent<TEvent>;

/**
 * A processor of the first event incoming from {@link OnEvent} sender.
 *
 * Cuts off the outgoing events supply after sending the first event.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event sender to receive an event from.
 * @param fallback - A function creating fallback event. When omitted, the initial event is expected to be sent by
 * `register` function. A receiver registration would lead to an error otherwise.
 *
 * @returns New keeper of the first event.
 */
export function onceAfter<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
    fallback: (this: void) => TEvent,
): AfterEvent<TEvent>;

export function onceAfter<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
    fallback?: () => TEvent,
): AfterEvent<TEvent> {
  return afterEventBy(onceEvent(supplier), fallback);
}
