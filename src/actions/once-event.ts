/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent } from '../after-event';
import { once } from '../impl';
import { OnEvent } from '../on-event';

/**
 * Creates an {@link AfterEvent} keeper of the first incoming event.
 *
 * Cuts off the outgoing event supply after sending the first event.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event keeper to receive an event from.
 *
 * @returns Event keeper.
 */
export function onceEvent<TEvent extends any[]>(
    supplier: AfterEvent<TEvent>,
): AfterEvent<TEvent>;

/**
 * Creates an {@link OnEvent} sender of the first incoming event.
 *
 * Cuts off the outgoing event supply after sending the first event.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event sender to receive an event from.
 *
 * @returns Event sender.
 */
export function onceEvent<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): OnEvent<TEvent>;

export function onceEvent<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): OnEvent<TEvent> | AfterEvent<TEvent> {
  return supplier.by(once(supplier));
}
