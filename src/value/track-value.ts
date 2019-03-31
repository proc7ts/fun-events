import { EventEmitter } from '../event-emitter';
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
 * @param initial Initial value.
 *
 * @returns Value tracker instance.
 */
export function trackValue<T>(initial: T): ValueTracker<T>;

/**
 * Constructs an optional value which changes can be tracked.
 *
 * @param initial Initial value.
 *
 * @returns Value tracker instance.
 */
export function trackValue<T>(initial?: T): ValueTracker<T | undefined>;

export function trackValue<T>(initial: T): ValueTracker<T> {
  return new TrackedValue<T>(initial);
}
