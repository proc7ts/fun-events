import { EventInterest } from '../event-interest';
import { EventProducer } from '../event-producer';
import { EventSource } from '../event-source';
import { CachedEventSource } from '../cached-event-source';

/**
 * Value accessor and changes tracker.
 */
export abstract class ValueTracker<T = any, N extends T = T>
    implements EventSource<(this: void, newValue: N, oldValue: T) => void>,
        CachedEventSource<(this: void, value: T) => void> {

  /**
   * @internal
   */
  private _by = EventInterest.none;

  /**
   * Value changes event producer.
   *
   * The registered event consumers receive new and old values as arguments.
   */
  abstract readonly on: EventProducer<(this: void, newValue: N, oldValue: T) => void>;

  /**
   * An event producer notifying on each value, including initial one.
   *
   * The registered event consumer will be notified an original value immediately on registration.
   */
  readonly each: EventProducer<(this: void, value: T) => void> = EventProducer.of(consumer => {
    consumer(this.it);
    return this.on(value => consumer(value));
  });

  get [EventSource.on](): EventProducer<(this: void, newValue: N, oldValue: T) => void> {
    return this.on;
  }

  get [CachedEventSource.each](): EventProducer<(this: void, value: T) => void> {
    return this.each;
  }

  /**
   * Reads the tracked value.
   *
   * @returns The value.
   */
  abstract get it(): T;

  /**
   * Updates the tracked value.
   *
   * @param value New value.
   */
  abstract set it(value: T);

  /**
   * Binds the tracked value to the `source`.
   *
   * Updates the value when the `source` changes.
   *
   * If the value is already bound to another source, then unbinds from the old source first.
   *
   * Call the `off()` method to unbind the tracked value from the source.
   *
   * Note that explicitly updating the value would override the value received from the source.
   *
   * @param source The cached event source used as a value source.
   */
  by(source: CachedEventSource<(this: void, value: T) => void>): this {
    this.off();
    this._by = source[CachedEventSource.each](value => this.it = value);
    return this;
  }

  /**
   * Unbinds the tracked value from the source.
   *
   * After this call the tracked value won't be updated on the source modification.
   *
   * If the value is not bound then doe nothing.
   */
  off() {
    this._by.off();
    this._by = EventInterest.none;
  }

}
