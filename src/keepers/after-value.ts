import { AfterEvent, isAfterEvent } from '../after-event';
import { afterThe } from './after-the';

/**
 * Builds an {@link AfterEvent} keeper of the given `value`.
 *
 * @category Core
 * @typeParam T - Value type.
 * @param value - Either a value that will be sent to all receivers upon registration, or an {@link AfterEvent} keeper
 * of such values.
 *
 * @returns An {@link AfterEvent} keeper that always sends the given `value`, or the `value` itself, when it is already
 * and `AfterEvent` keeper.
 */
export function afterValue<T>(value: T | AfterEvent<[T]>): AfterEvent<[T]> {
  return isAfterEvent(value) ? value : afterThe(value);
}
