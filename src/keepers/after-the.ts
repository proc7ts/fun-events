/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop, valueProvider } from '@proc7ts/primitives';
import { AfterEvent, afterEventBy } from '../after-event';

/**
 * Builds an {@link AfterEvent} keeper of the given `event`.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param event - An event that will be sent to all receivers upon registration.
 *
 * @returns An {@link AfterEvent} keeper that always sends the given `event`.
 */
export function afterThe<TEvent extends any[]>(...event: TEvent): AfterEvent<TEvent> {
  return afterEventBy(noop, valueProvider(event));
}
