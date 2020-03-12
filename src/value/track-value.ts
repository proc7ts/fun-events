/**
 * @packageDocumentation
 * @module fun-events
 */
import { EventKeeper, EventReceiver, EventSupply, EventSupply__symbol, eventSupplyOf } from '../base';
import { OnEvent, receiveOnEvent } from '../on-event';
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

  get [EventSupply__symbol](): EventSupply {
    return eventSupplyOf(this._on);
  }

  on(): OnEvent<[T, T]>;
  on(receiver: EventReceiver<[T, T]>): EventSupply;
  on(receiver?: EventReceiver<[T, T]>): OnEvent<[T, T]> | EventSupply {
    return (this.on = /*#__INLINE__*/ receiveOnEvent(this._on.on()))(receiver);
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
