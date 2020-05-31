/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop, valueProvider } from '@proc7ts/primitives';
import { AfterEvent, afterEventBy } from '../after-event';

/**
 * Builds an [[AfterEvent]] keeper of the given `event`.
 *
 * @category Core
 * @param event  An event that will be sent to all receivers upon registration.
 *
 * @returns An [[AfterEvent]] keeper that always sends the given `event`.
 */
export function afterThe<E extends any[]>(...event: E): AfterEvent<E> {
  return afterEventBy(noop, valueProvider(event));
}
