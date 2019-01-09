import { EventEmitter } from '../event-emitter';
import { EventInterest } from '../event-interest';
import { ValueTracker } from './value-tracker';
import { EventProducer } from '../event-producer';

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
  sync(tracker: ValueTracker<T, any>): EventInterest {

    const interest1 = tracker.on(value => this.it = value);
    const interest2 = this.each(value => tracker.it = value);

    return {
      off() {
        interest2.off();
        interest1.off();
      }
    };
  }

}
