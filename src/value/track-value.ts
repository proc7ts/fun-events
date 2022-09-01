import { Supply } from '@proc7ts/supply';
import { EventKeeper } from '../base';
import { OnEvent } from '../on-event';
import { EventEmitter } from '../senders';
import { ValueTracker } from './value-tracker';

/**
 * @internal
 */
class TrackedValue<T> extends ValueTracker<T> {

  private readonly _on = new EventEmitter<[T, T]>();

  constructor(private _it: T) {
    super();
  }

  get supply(): Supply {
    return this._on.supply;
  }

  get on(): OnEvent<[T, T]> {
    return this._on.on;
  }

  get it(): T {
    return this._it;
  }

  set it(value: T) {
    const oldValue = this._it;

    if (oldValue !== value) {
      this._it = value;
      this._on.send(value, oldValue);
    }
  }

}

/**
 * Constructs a value which changes can be tracked.
 *
 * @category Value Tracking
 * @param initial - Initial value.
 *
 * @returns Value tracker instance.
 */
export function trackValue<T>(initial: T): ValueTracker<T>;

/**
 * Constructs an optional value which changes can be tracked.
 *
 * @param initial - Initial value.
 *
 * @returns Value tracker instance.
 */
export function trackValue<T>(initial?: T): ValueTracker<T | undefined>;

export function trackValue<T>(initial: T): ValueTracker<T> {
  return new TrackedValue<T>(initial);
}

/**
 * Constructs a tracked value updated by the given value `supplier`.
 *
 * If the value is already updated by another supplier, then unbinds from the old one first.
 *
 * Call the {@link ValueTracker.byNone} method to unbind the tracked value from the `source`.
 *
 * Note that explicitly updating the value would override the value received from the `source`.
 *
 * @category Value Tracking
 * @param supplier - The source value keeper.
 *
 * @returns `this` instance.
 */
export function trackValueBy<T>(supplier: EventKeeper<[T]>): ValueTracker<T>;

/**
 * Constructs a tracked value updated by value keepers extracted from events sent by the given `supplier`.
 *
 * If the value is already updated by another value supplier, then unbinds from the old one first.
 *
 * Call the {@link ValueTracker.byNone} method to unbind the tracked value from the `source`.
 *
 * Note that explicitly updating the value would override the value received from the `source`.
 *
 * @typeParam TSrc - Source value type.
 * @param supplier - The event keeper to extract value keepers from.
 * @param extract - A function extracting value keeper from event received from `supplier`.
 *
 * @returns `this` instance.
 */
export function trackValueBy<T, TSrc extends any[]>(
  supplier: EventKeeper<TSrc>,
  extract: (this: void, ...event: TSrc) => EventKeeper<[T]>,
): ValueTracker<T>;

export function trackValueBy<T, TSrc extends any[]>(
  supplier: EventKeeper<TSrc> | EventKeeper<[T]>,
  extract?: (this: void, ...event: TSrc) => EventKeeper<[T]>,
): ValueTracker<T> {
  return (trackValue() as ValueTracker<T>).by(
    supplier as EventKeeper<TSrc>,
    extract as (this: void, ...event: TSrc) => EventKeeper<[T]>,
  );
}
