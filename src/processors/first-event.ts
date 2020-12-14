/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent } from '../after-event';
import { eventOnce } from '../impl';
import { OnEvent } from '../on-event';

/**
 * A processor of the first event incoming from {@link AfterEvent} keeper.
 *
 * Cuts off the outgoing event supply after sending the first event.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event keeper to receive an event from.
 *
 * @returns New keeper of the first event.
 */
export function firstEvent<TEvent extends any[]>(
    supplier: AfterEvent<TEvent>,
): AfterEvent<TEvent>;

/**
 * A processor of the first event incoming from {@link OnEvent} sender.
 *
 * Cuts off the outgoing event supply after sending the first event.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event sender to receive an event from.
 *
 * @returns New sender of the first event.
 */
export function firstEvent<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): OnEvent<TEvent>;

export function firstEvent<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): OnEvent<TEvent> | AfterEvent<TEvent> {
  return supplier.by(eventOnce(supplier));
}
