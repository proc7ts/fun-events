/**
 * @module fun-events
 */
import { EventEmitter } from '../event-emitter';
import { EventKeeper } from '../event-keeper';
import { ValueTracker } from './value-tracker';

class TrackedValue<T> extends ValueTracker<T> {

  private readonly _on = new EventEmitter<[T, T]>();

  constructor(private _it: T) {
    super();
  }

  get on() {
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

  done(reason?: any): this {
    this._on.done(reason);
    return this;
  }

}

/**
 * Constructs a value which changes can be tracked.
 *
 * @category Value Tracking
 * @param initial  Initial value.
 *
 * @returns Value tracker instance.
 */
export function trackValue<T>(initial: T): ValueTracker<T>;

/**
 * Constructs an optional value which changes can be tracked.
 *
 * @param initial  Initial value.
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
 * Call the [[ValueTracker.byNone]] method to unbind the tracked value from the `source`.
 *
 * Note that explicitly updating the value would override the value received from the `source`.
 *
 * @category Value Tracking
 * @param supplier  The source value keeper.
 *
 * @returns `this` instance.
 */
export function trackValueBy<T>(supplier: EventKeeper<[T]>): ValueTracker<T>;

/**
 * Constructs a tracked value updated by value keepers extracted from events sent by the given `supplier`.
 *
 * If the value is already updated by another value supplier, then unbinds from the old one first.
 *
 * Call the [[ValueTracker.byNone]] method to unbind the tracked value from the `source`.
 *
 * Note that explicitly updating the value would override the value received from the `source`.
 *
 * @typeparam S  Source value type.
 * @param supplier  The event keeper to extract value keepers from.
 * @param extract  A function extracting value keeper from event received from `supplier`.
 *
 * @returns `this` instance.
 */
export function trackValueBy<T, S extends any[]>(
    supplier: EventKeeper<S>,
    extract: (this: void, ...event: S) => EventKeeper<[T]>,
): ValueTracker<T>;

export function trackValueBy<T, S extends any[]>(
    supplier: EventKeeper<S> | EventKeeper<[T]>,
    extract?: (this: void, ...event: S) => EventKeeper<[T]>,
): ValueTracker<T> {
  return (trackValue() as any).by(supplier, extract);
}
