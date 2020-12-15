/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent, afterEventBy } from '../after-event';
import { onceEvent } from '../impl';

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
export function onceAfter<TEvent extends any[]>(supplier: AfterEvent<TEvent>): AfterEvent<TEvent> {
  return afterEventBy(onceEvent(supplier));
}
