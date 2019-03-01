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
   * @param tracker A value tracker to keep in sync.
   *
   * @returns An event interest instance. Call its `off()` method to break the tracked value synchronization.
   */
  sync(tracker: ValueTracker<T, any>): EventInterest;

  /**
   * Synchronizes the tracked value with the ones nested inside the given `source`.
   *
   * Once next value tracker extracted the previous one becomes out of sync.
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

  sync<U extends any[]>(
      sourceOrTracker: ValueTracker<T, any> | EventSource<U>,
      extract?: (this: void, ...event: U) => ValueTracker<T, any> | undefined): EventInterest {

    const self = this;

    function syncWithTracker(tracker: ValueTracker<T, any>): EventInterest {

      const interest1 = tracker.on(value => self.it = value);
      const interest2 = self.each(value => tracker.it = value);

      return eventInterest(() => {
        interest2.off();
        interest1.off();
      });
    }

    if (!extract) {
      return syncWithTracker(sourceOrTracker as ValueTracker<T, any>);
    }

    const source = sourceOrTracker as EventSource<U>;

    return consumeNestedEvents(source)((...event) => {

      const tracker = extract(...event);

      return tracker && syncWithTracker(tracker);
    });
  }

}
