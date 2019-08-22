/**
 * @module fun-events
 */
import { afterEventFrom } from '../after-event';
import { EventEmitter } from '../event-emitter';
import { eventInterest, EventInterest } from '../event-interest';
import { EventKeeper, isEventKeeper } from '../event-keeper';
import { EventSender } from '../event-sender';
import { OnEvent, onEventFrom } from '../on-event';
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
   * @returns An event interest instance. Call its [[EventInterest.off]] method to break the synchronization.
   */
  sync(tracker: ValueTracker<T, any>): EventInterest;

  /**
   * Synchronizes the tracked value with the others in the given direction.
   *
   * @param direction  If set to `"in"` the value from the given tracker takes precedence over the one in [[ValueSync]].
   * Otherwise the value from the sync is applied to the given tracker first.
   * @param tracker  A value tracker to keep in sync.
   *
   * @returns An event interest instance. Call its [[EventInterest.off]] method to break the synchronization.
   */
  sync(direction: 'in' | 'out', tracker: ValueTracker<T, any>): EventInterest;

  /**
   * Synchronizes the tracked value with the ones extracted from the events sent by the given `source` sender or keeper.
   *
   * Once next value tracker extracted the previous one becomes out of sync.
   *
   * Applies the value from this sync to extracted trackers.
   *
   * @param source  The event sender or keeper to extract value trackers from.
   * @param extract  A function extracting the value tracker to keep in sync from the event received from `sender`.
   * May return `undefined` to just break the sync with previous tracker.
   *
   * @returns An event interest instance. Call its [[EventInterest.off]] method to break the synchronization.
   */
  sync<U extends any[]>(
      source: EventSender<U> | EventKeeper<U>,
      extract: (this: void, ...event: U) => ValueTracker<T, any> | undefined,
  ): EventInterest;

  /**
   * Synchronizes the tracked value with the ones extracted from the events sent by the given `source` sender or keeper
   * in the given direction.
   *
   * Once next value tracker extracted the previous one becomes out of sync.
   *
   * @param direction  If set to `"in"` the value from extracted tracker takes precedence over the one in
   * [[ValueSync]]. Otherwise the value from the sync is applied to extracted trackers first.
   * @param source  The event sender or keeper to extract value trackers from.
   * @param extract  A function extracting the value tracker to keep in sync from the event received from `sender`.
   * May return `undefined` to just break the sync with previous tracker.
   *
   * @returns An event interest instance. Call its [[EventInterest.off]] method to break the synchronization.
   */
  sync<U extends any[]>(
      direction: 'in' | 'out',
      source: EventSender<U> | EventKeeper<U>,
      extract: (this: void, ...event: U) => ValueTracker<T, any> | undefined,
  ): EventInterest;

  sync<U extends any[]>(
      first: 'in' | 'out' | ValueTracker<T, any> | EventSender<U> | EventKeeper<U>,
      second?: ValueTracker<T, any>
          | EventSender<U>
          | EventKeeper<U>
          | ((this: void, ...event: U) => ValueTracker<T, any> | undefined),
      third?: (this: void, ...event: U) => ValueTracker<T, any> | undefined,
  ): EventInterest {

    let syncWithTracker = (tracker: ValueTracker<T, any>) => syncTrackers(this, tracker);
    let source: ValueTracker<T, any> | EventSender<U> | EventKeeper<U>;
    let extract: ((this: void, ...event: U) => ValueTracker<T, any> | undefined) | undefined;

    if (typeof first === 'string') {
      if (first === 'in') {
        syncWithTracker = tracker => syncTrackers(tracker, this);
      }
      source = second as ValueTracker<T, any> | EventSender<U> | EventKeeper<U>;
      extract = third;
    } else {
      source = first;
      extract = second as (this: void, ...event: U) => ValueTracker<T, any> | undefined;
    }

    const extractTracker = extract;

    if (!extractTracker) {
      return syncWithTracker(source as ValueTracker<T, any>);
    }

    const sender = source as EventSender<U> | EventKeeper<U>;

    return (isEventKeeper(sender) ? afterEventFrom(sender) : onEventFrom(sender)).consume((...event) => {

      const tracker = extractTracker(...event);

      return tracker && syncWithTracker(tracker);
    });

    function syncTrackers(tracker1: ValueTracker<T, any>, tracker2: ValueTracker<T, any>) {

      const interest1 = tracker1.read(value => {
        tracker2.it = value;
      });
      const interest2 = tracker2.on(value => {
        tracker1.it = value;
      });

      return eventInterest(reason => {
        interest2.off(reason);
        interest1.off(reason);
      }).needs(interest1).needs(interest2);
    }
  }

  done(reason?: any): this {
    this._on.done(reason);
    return this;
  }

}
