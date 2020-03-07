/**
 * @packageDocumentation
 * @module fun-events
 */
import { valueProvider } from 'call-thru';
import { AfterEvent, afterEventBy } from '../after-event';
import { eventSupply } from '../base';

/**
 * Builds an [[AfterEvent]] keeper of the given `event`.
 *
 * @category Core
 * @param event  An event that will be sent to all receivers upon registration.
 *
 * @returns An [[AfterEvent]] keeper that always sends the given `event`.
 */
export function afterThe<E extends any[]>(...event: E): AfterEvent<E> {
  return afterEventBy(() => eventSupply(), valueProvider(event));
}
