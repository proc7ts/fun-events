/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { filter } from '../impl';
import { OnEvent, onEventBy } from '../on-event';
import { shareEvents } from './share-events';

/**
 * Creates a mapper that passes incoming events matching the given condition.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of the test function parameter types.
 * @param test - Test function accepting incoming event as its parameters, and returning truthy value for matching
 * events, or falsy one otherwise.
 *
 * @returns {@link OnEvent} sender mapper function.
 */
export function filterEvents<TEvent extends any[]>(
    test: (this: void, ...event: TEvent) => boolean,
): (this: void, supplier: OnEvent<TEvent>) => OnEvent<TEvent> {

  const map = filterEvents_(test);

  return supplier => shareEvents(map(supplier));
}

/**
 * Creates a mapper that passes incoming events matching the given condition and does not share the outgoing events
 * supply.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of the test function parameter types.
 * @param test - Test function accepting incoming event as its parameters, and returning truthy value for matching
 * events, or falsy one otherwise.
 *
 * @returns {@link OnEvent} sender mapper function.
 */
export function filterEvents_<TEvent extends any[]>(// eslint-disable-line @typescript-eslint/naming-convention
    test: (this: void, ...event: TEvent) => boolean,
): (this: void, supplier: OnEvent<TEvent>) => OnEvent<TEvent> {
  return supplier => onEventBy(filter(supplier, test));
}
