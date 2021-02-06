import { Supply } from '@proc7ts/primitives';
import { EventKeeper, EventSender, EventSupplier, isEventKeeper } from '../base';
import { afterSupplied } from '../keepers';
import { OnEvent } from '../on-event';
import { consumeEvents } from '../processors';
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

  get on(): OnEvent<[T, T]> {
    return this._on.on;
  }

  get supply(): Supply {
    return this._on.supply;
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
   * @param tracker - A value tracker to keep in sync.
   *
   * @returns An event supply. {@link Supply.off Cut it off} to break synchronization.
   */
  sync(tracker: ValueTracker<T>): Supply;

  /**
   * Synchronizes the tracked value with the others in the given direction.
   *
   * @param direction - If set to `"in"` the value from the given tracker takes precedence over the one in
   * {@link ValueSync}. Otherwise the value from the sync is applied to the given tracker first.
   * @param tracker - A value tracker to keep in sync.
   *
   * @returns An event supply. {@link Supply.off Cut it off} to break synchronization.
   */
  sync(direction: 'in' | 'out', tracker: ValueTracker<T>): Supply;

  /**
   * Synchronizes the tracked value with the ones extracted from the events sent by the given `supplier`.
   *
   * Once next value tracker extracted the previous one becomes out of sync.
   *
   * Applies the value from this sync to extracted trackers.
   *
   * @typeParam TSrcEvent - A type of supplied events to extract value trackers from.
   * @param supplier - The event supplier to extract value trackers from.
   * @param extract - A function extracting the value tracker to keep in sync from the event received from `supplier`.
   * May return `undefined` to just break the sync with previous tracker.
   *
   * @returns An event supply. {@link Supply.off Cut it off} to break synchronization.
   */
  sync<TSrcEvent extends any[]>(
      supplier: EventSupplier<TSrcEvent>,
      extract: (this: void, ...event: TSrcEvent) => ValueTracker<T> | undefined,
  ): Supply;

  /**
   * Synchronizes the tracked value with the ones extracted from the events sent by the given `supplier`
   * in the given direction.
   *
   * Once next value tracker extracted the previous one becomes out of sync.
   *
   * @typeParam TSrcEvent - A type of supplied events to extract value trackers from.
   * @param direction - If set to `"in"` the value from extracted tracker takes precedence over the one in
   * {@link ValueSync}. Otherwise the value from the sync is applied to extracted trackers first.
   * @param supplier - The event supplier to extract value trackers from.
   * @param extract - A function extracting the value tracker to keep in sync from the event received from `supplier`.
   * May return `undefined` to just break the sync with previous tracker.
   *
   * @returns An event supply. {@link Supply.off Cut it off} to break synchronization.
   */
  sync<TSrcEvent extends any[]>(
      direction: 'in' | 'out',
      supplier: EventSupplier<TSrcEvent>,
      extract: (this: void, ...event: TSrcEvent) => ValueTracker<T> | undefined,
  ): Supply;

  sync<TSrcEvent extends any[]>(
      first: 'in' | 'out' | ValueTracker<T> | EventSupplier<TSrcEvent>,
      second?: ValueTracker<T>
          | EventSender<TSrcEvent>
          | EventKeeper<TSrcEvent>
          | ((this: void, ...event: TSrcEvent) => ValueTracker<T> | undefined),
      third?: (this: void, ...event: TSrcEvent) => ValueTracker<T> | undefined,
  ): Supply {

    let syncWithTracker = (tracker: ValueTracker<T>): Supply => syncTrackers(this, tracker);
    let source: ValueTracker<T> | EventSupplier<TSrcEvent>;
    let extract: ((this: void, ...event: TSrcEvent) => ValueTracker<T> | undefined) | undefined;

    if (typeof first === 'string') {
      if (first === 'in') {
        syncWithTracker = tracker => syncTrackers(tracker, this);
      }
      source = second as ValueTracker<T> | EventSender<TSrcEvent> | EventKeeper<TSrcEvent>;
      extract = third;
    } else {
      source = first;
      extract = second as (this: void, ...event: TSrcEvent) => ValueTracker<T> | undefined;
    }

    const extractTracker = extract;

    if (!extractTracker) {
      return syncWithTracker(source as ValueTracker<T>);
    }

    const supplier = source as EventSupplier<TSrcEvent>;

    return (isEventKeeper(supplier) ? afterSupplied(supplier) : onSupplied(supplier)).do(consumeEvents(
        (...event) => {

          const tracker = extractTracker(...event);

          return tracker && syncWithTracker(tracker);
        },
    ));

    function syncTrackers(tracker1: ValueTracker<T>, tracker2: ValueTracker<T>): Supply {

      const supply1 = tracker1.read(value => {
        tracker2.it = value;
      });
      const supply2 = tracker2.on(value => {
        tracker1.it = value;
      });

      return new Supply(reason => {
        supply2.off(reason);
        supply1.off(reason);
      }).needs(supply1).needs(supply2);
    }
  }

}
