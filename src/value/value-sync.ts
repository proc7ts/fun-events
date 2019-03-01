import { EventEmitter } from '../event-emitter';
import { eventInterest, EventInterest } from '../event-interest';
import { ValueTracker } from './value-tracker';
import { EventProducer } from '../event-producer';
import { EventSource } from '../event-source';
import { consumeNestedEvents } from '../nested-events';

/**
 * Synchronizes tracked values with each other.
 *
 * Any change to any of the added tracked values would update all the others.
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

  get on(): EventProducer<[T, T]> {
    return this._on.on;
  }

  get it(): T {
    return this._it;
  }

  set it(value: T) {

    const old = this.it;

    if (old !== value) {
      this._it = value;
      this._on.notify(value, old);
    }
  }

  /**
   * Synchronizes the tracked value with the others.
   *
   * Applies the value from this sync to the given tracker first.
   *
   * @param tracker A value tracker to keep in sync.
   *
   * @returns An event interest instance. Call its `off()` method to break the tracked value synchronization.
   */
  sync(tracker: ValueTracker<T, any>): EventInterest;

  /**
   * Synchronizes the tracked value with the others in the given direction.
   *
   * @param direction If set to `"in"` the value from the given tracker takes precedence over the one in `ValueSync`.
   * Otherwise the value from the sync is applied to the given tracker first.
   * @param tracker A value tracker to keep in sync.
   *
   * @returns An event interest instance. Call its `off()` method to break the tracked value synchronization.
   */
  sync(direction: 'in' | 'out', tracker: ValueTracker<T, any>): EventInterest;

  /**
   * Synchronizes the tracked value with the ones nested inside the given `source`.
   *
   * Once next value tracker extracted the previous one becomes out of sync.
   *
   * Applies the value from this sync to extracted trackers.
   *
   * @param source The event source to extract value trackers from.
   * @param extract A function extracting the value tracker to keep in sync from the event received from `source`.
   * May return `undefined` to just break the sync with previous tracker.
   *
   * @returns An event interest instance. Call its `off()` method to break the tracked value synchronization.
   */
  sync<U extends any[]>(
      source: EventSource<U>,
      extract: (this: void, ...event: U) => ValueTracker<T, any> | undefined): EventInterest;

  /**
   * Synchronizes the tracked value with the ones nested inside the given `source`.
   *
   * Once next value tracker extracted the previous one becomes out of sync.
   *
   * @param direction If set to `"in"` the value from extracted trackers takes precedence over the one in `ValueSync`.
   * Otherwise the value from the sync is applied to extracted trackers first.
   * @param source The event source to extract value trackers from.
   * @param extract A function extracting the value tracker to keep in sync from the event received from `source`.
   * May return `undefined` to just break the sync with previous tracker.
   *
   * @returns An event interest instance. Call its `off()` method to break the tracked value synchronization.
   */
  sync<U extends any[]>(
      direction: 'in' | 'out',
      source: EventSource<U>,
      extract: (this: void, ...event: U) => ValueTracker<T, any> | undefined): EventInterest;

  sync<U extends any[]>(
      first: 'in' | 'out' | ValueTracker<T, any> | EventSource<U>,
      second?: ValueTracker<T, any> | EventSource<U> | ((this: void, ...event: U) => ValueTracker<T, any> | undefined),
      third?: (this: void, ...event: U) => ValueTracker<T, any> | undefined): EventInterest {

    let syncWithTracker = (tracker: ValueTracker<T, any>) => syncTrackers(this, tracker);
    let sourceOrTracker: ValueTracker<T, any> | EventSource<U>;
    let extract: ((this: void, ...event: U) => ValueTracker<T, any> | undefined) | undefined;

    if (typeof first === 'string') {
      if (first === 'in') {
        syncWithTracker = tracker => syncTrackers(tracker, this);
      }
      sourceOrTracker = second as ValueTracker<T, any> | EventSource<U>;
      extract = third;
    } else {
      sourceOrTracker = first;
      extract = second as (this: void, ...event: U) => ValueTracker<T, any> | undefined;
    }

    const extractTracker = extract;

    if (!extractTracker) {
      return syncWithTracker(sourceOrTracker as ValueTracker<T, any>);
    }

    const source = sourceOrTracker as EventSource<U>;

    return consumeNestedEvents(source)((...event) => {

      const tracker = extractTracker(...event);

      return tracker && syncWithTracker(tracker);
    });

    function syncTrackers(tracker1: ValueTracker<T, any>, tracker2: ValueTracker<T, any>) {

      const interest1 = tracker1.each(value => tracker2.it = value);
      const interest2 = tracker2.on(value => tracker1.it = value);

      return eventInterest(() => {
        interest2.off();
        interest1.off();
      });
    }
  }

}
