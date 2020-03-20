/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import {
  EventKeeper,
  EventReceiver,
  EventSender,
  EventSupplier,
  eventSupply,
  EventSupply,
  EventSupply__symbol,
  eventSupplyOf,
  isEventKeeper,
} from '../base';
import { afterSupplied } from '../keepers';
import { OnEvent } from '../on-event';
import { EventEmitter, onSupplied } from '../senders';
import { ValueTracker } from './value-tracker';

/**
 * Synchronizes tracked values with each other.
 *
 * Any change to any of the added tracked values would update all the others.
 *
 * @category Value Tracking
 */
export class ValueSync<T> extends ValueTracker<T> {

  /**
   * @internal
   */
  private readonly _on = new EventEmitter<[T, T]>();

  /**
   * @internal
   */
  private _it: T;

  constructor(initial: T) {
    super();
    this._it = initial;
  }

  on(): OnEvent<[T, T]>;
  on(receiver: EventReceiver<[T, T]>): EventSupply;
  on(receiver?: EventReceiver<[T, T]>): OnEvent<[T, T]> | EventSupply {
    return (this.on = this._on.on().F)(receiver);
  }

  get [EventSupply__symbol](): EventSupply {
    return eventSupplyOf(this._on);
  }

  get it(): T {
    return this._it;
  }

  set it(value: T) {

    const old = this.it;

    if (old !== value) {
      this._it = value;
      this._on.send(value, old);
    }
  }

  /**
   * Synchronizes the tracked value with the others.
   *
   * Applies the value from this sync to the given tracker first.
   *
   * @param tracker  A value tracker to keep in sync.
   *
   * @returns An event supply. {@link EventSupply.off Cut it off} to break synchronization.
   */
  sync(tracker: ValueTracker<T>): EventSupply;

  /**
   * Synchronizes the tracked value with the others in the given direction.
   *
   * @param direction  If set to `"in"` the value from the given tracker takes precedence over the one in [[ValueSync]].
   * Otherwise the value from the sync is applied to the given tracker first.
   * @param tracker  A value tracker to keep in sync.
   *
   * @returns An event supply. {@link EventSupply.off Cut it off} to break synchronization.
   */
  sync(direction: 'in' | 'out', tracker: ValueTracker<T>): EventSupply;

  /**
   * Synchronizes the tracked value with the ones extracted from the events sent by the given `supplier`.
   *
   * Once next value tracker extracted the previous one becomes out of sync.
   *
   * Applies the value from this sync to extracted trackers.
   *
   * @param supplier  The event supplier to extract value trackers from.
   * @param extract  A function extracting the value tracker to keep in sync from the event received from `supplier`.
   * May return `undefined` to just break the sync with previous tracker.
   *
   * @returns An event supply. {@link EventSupply.off Cut it off} to break synchronization.
   */
  sync<U extends any[]>(
      supplier: EventSupplier<U>,
      extract: (this: void, ...event: U) => ValueTracker<T> | undefined,
  ): EventSupply;

  /**
   * Synchronizes the tracked value with the ones extracted from the events sent by the given `supplier`
   * in the given direction.
   *
   * Once next value tracker extracted the previous one becomes out of sync.
   *
   * @param direction  If set to `"in"` the value from extracted tracker takes precedence over the one in
   * [[ValueSync]]. Otherwise the value from the sync is applied to extracted trackers first.
   * @param supplier  The event supplier to extract value trackers from.
   * @param extract  A function extracting the value tracker to keep in sync from the event received from `supplier`.
   * May return `undefined` to just break the sync with previous tracker.
   *
   * @returns An event supply. {@link EventSupply.off Cut it off} to break synchronization.
   */
  sync<U extends any[]>(
      direction: 'in' | 'out',
      supplier: EventSupplier<U>,
      extract: (this: void, ...event: U) => ValueTracker<T> | undefined,
  ): EventSupply;

  sync<U extends any[]>(
      first: 'in' | 'out' | ValueTracker<T> | EventSupplier<U>,
      second?: ValueTracker<T>
          | EventSender<U>
          | EventKeeper<U>
          | ((this: void, ...event: U) => ValueTracker<T> | undefined),
      third?: (this: void, ...event: U) => ValueTracker<T> | undefined,
  ): EventSupply {

    let syncWithTracker = (tracker: ValueTracker<T>): EventSupply => syncTrackers(this, tracker);
    let source: ValueTracker<T> | EventSupplier<U>;
    let extract: ((this: void, ...event: U) => ValueTracker<T> | undefined) | undefined;

    if (typeof first === 'string') {
      if (first === 'in') {
        syncWithTracker = tracker => syncTrackers(tracker, this);
      }
      source = second as ValueTracker<T> | EventSender<U> | EventKeeper<U>;
      extract = third;
    } else {
      source = first;
      extract = second as (this: void, ...event: U) => ValueTracker<T> | undefined;
    }

    const extractTracker = extract;

    if (!extractTracker) {
      return syncWithTracker(source as ValueTracker<T>);
    }

    const supplier = source as EventSupplier<U>;

    return (isEventKeeper(supplier) ? afterSupplied(supplier) : onSupplied(supplier)).consume((...event) => {

      const tracker = extractTracker(...event);

      return tracker && syncWithTracker(tracker);
    });

    function syncTrackers(tracker1: ValueTracker<T>, tracker2: ValueTracker<T>): EventSupply {

      const supply1 = tracker1.read(value => {
        tracker2.it = value;
      });
      const supply2 = tracker2.on(value => {
        tracker1.it = value;
      });

      return eventSupply(reason => {
        supply2.off(reason);
        supply1.off(reason);
      }).needs(supply1).needs(supply2);
    }
  }

}
