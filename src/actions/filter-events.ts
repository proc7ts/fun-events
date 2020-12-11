/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { OnEvent } from '../on-event';
import { shareEvents } from './share-events';
import { translateOn_ } from './translate-on';

/**
 * Creates an event supplier mapper function that passes incoming values implementing the given type.
 *
 * @category Core
 * @typeParam TValue - Incoming value type.
 * @typeParam TMatch - Matching value type.
 * @param test - Test function accepting incoming value as its only parameter, and returning truthy value if the value
 * implements the given type, or falsy one otherwise.
 *
 * @returns {@link OnEvent} sender mapper function.
 */
export function filterEvents<TValue, TMatch extends TValue>(
    test: (this: void, event: TValue) => event is TMatch,
): (this: void, supplier: OnEvent<[TValue]>) => OnEvent<[TMatch]>;

/**
 * Creates an event supplier mapper function that passes incoming events matching the given condition.
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
): (this: void, supplier: OnEvent<TEvent>) => OnEvent<TEvent>;

export function filterEvents<TEvent extends any[]>(
    test: (this: void, ...event: TEvent) => boolean,
): (this: void, supplier: OnEvent<TEvent>) => OnEvent<TEvent> {

  const map = filterEvents_(test);

  return supplier => shareEvents(map(supplier));
}

/**
 * Creates an event supplier mapper function that passes incoming values implementing the given type and does not share
 * the outgoing events supply.
 *
 * @category Core
 * @typeParam TValue - Incoming value type.
 * @typeParam TMatch - Matching value type.
 * @param test - Test function accepting incoming value as its only parameter, and returning truthy value if the value
 * implements the given type, or falsy one otherwise.
 *
 * @returns {@link OnEvent} sender mapper function.
 */
export function filterEvents_<TValue, TMatch extends TValue>(// eslint-disable-line @typescript-eslint/naming-convention
    test: (this: void, event: TValue) => event is TMatch,
): (this: void, supplier: OnEvent<[TValue]>) => OnEvent<[TMatch]>;

/**
 * Creates an event supplier mapper function that passes incoming events matching the given condition and does not share
 * the outgoing events supply.
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
): (this: void, supplier: OnEvent<TEvent>) => OnEvent<TEvent>;

export function filterEvents_<TEvent extends any[]>(// eslint-disable-line @typescript-eslint/naming-convention
    test: (this: void, ...event: TEvent) => boolean,
): (this: void, supplier: OnEvent<TEvent>) => OnEvent<TEvent> {
  return translateOn_((send, ...event) => test(...event) && send(...event));
}
