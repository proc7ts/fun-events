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
 * an `AfterEvent` keeper.
 */
export function afterValue<T>(value: T | AfterEvent<[T]>): AfterEvent<[T]>;

/**
 * Builds an {@link AfterEvent} keeper of the optional `value`.
 *
 * @category Core
 * @typeParam T - Value type.
 * @param value - Either `undefined`, a value that will be sent to all receivers upon registration, or an
 * {@link AfterEvent} keeper of optional values.
 *
 * @returns An {@link AfterEvent} keeper that always sends the given `value`, or the `value` itself, when it is already
 * an `AfterEvent` keeper.
 */
export function afterValue<T>(value: T | AfterEvent<[T?]> | undefined): AfterEvent<[T?]>;

export function afterValue<T>(value: T | AfterEvent<[T]>): AfterEvent<[T]> {
  return isAfterEvent(value) ? value : afterThe(value);
}
