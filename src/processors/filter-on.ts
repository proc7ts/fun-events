import { OnEvent } from '../on-event';
import { shareOn } from './share-on';
import { translateOn_ } from './translate-on';

/**
 * Creates an event processor that passes incoming events implementing the given type only.
 *
 * @category Event Processing
 * @typeParam TValue - Incoming value type. This is a list of the test function parameter types.
 * @typeParam TMatch - Required value type.
 * @param test - Test function accepting incoming event as its only parameter, and returning truthy value if the value
 * implements the given type, or falsy one otherwise.
 *
 * @returns {@link OnEvent} sender mapper function.
 */
export function filterOn<TValue, TMatch extends TValue>(
    test: (this: void, event: TValue) => event is TMatch,
): (this: void, supplier: OnEvent<[TValue]>) => OnEvent<[TMatch]>;

/**
 * Creates an event processor that passes incoming events matching the given condition only.
 *
 * @category Event Processing
 * @typeParam TEvent - An event type. This is a list of the test function parameter types.
 * @param test - Test function accepting incoming event as its parameters, and returning truthy value for matching
 * events, or falsy one otherwise.
 *
 * @returns {@link OnEvent} sender mapper function.
 */
export function filterOn<TEvent extends any[]>(
    test: (this: void, ...event: TEvent) => boolean,
): (this: void, supplier: OnEvent<TEvent>) => OnEvent<TEvent>;

export function filterOn<TEvent extends any[]>(
    test: (this: void, ...event: TEvent) => boolean,
): (this: void, supplier: OnEvent<TEvent>) => OnEvent<TEvent> {

  const map = filterOn_(test);

  return supplier => shareOn(map(supplier));
}

/**
 * Creates an event processor that passes incoming events implementing the given type only, and does not share
 * the outgoing events supply.
 *
 * @category Event Processing
 * @typeParam TValue - Incoming value type. This is a list of the test function parameter types.
 * @typeParam TMatch - Required value type.
 * @param test - Test function accepting incoming event as its only parameter, and returning truthy value if the value
 * implements the given type, or falsy one otherwise.
 *
 * @returns {@link OnEvent} sender mapper function.
 */
export function filterOn_<TValue, TMatch extends TValue>(// eslint-disable-line @typescript-eslint/naming-convention
    test: (this: void, event: TValue) => event is TMatch,
): (this: void, supplier: OnEvent<[TValue]>) => OnEvent<[TMatch]>;

/**
 * Creates an event processor that passes incoming events matching the given condition only, and does not share
 * the outgoing events supply.
 *
 * @category Event Processing
 * @typeParam TEvent - An event type. This is a list of the test function parameter types.
 * @param test - Test function accepting incoming event as its parameters, and returning truthy value for matching
 * events, or falsy one otherwise.
 *
 * @returns {@link OnEvent} sender mapper function.
 */
export function filterOn_<TEvent extends any[]>(// eslint-disable-line @typescript-eslint/naming-convention
    test: (this: void, ...event: TEvent) => boolean,
): (this: void, supplier: OnEvent<TEvent>) => OnEvent<TEvent>;

export function filterOn_<TEvent extends any[]>(// eslint-disable-line @typescript-eslint/naming-convention
    test: (this: void, ...event: TEvent) => boolean,
): (this: void, supplier: OnEvent<TEvent>) => OnEvent<TEvent> {
  return translateOn_((send, ...event) => test(...event) && send(...event));
}
