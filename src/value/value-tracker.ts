import { AfterEvent, afterEventBy } from '../after-event';
import { EventInterest, noEventInterest } from '../event-interest';
import { AfterEvent__symbol, EventKeeper, isEventKeeper } from '../event-keeper';
import { EventSender, OnEvent__symbol } from '../event-sender';
import { OnEvent, onEventFrom } from '../on-event';

/**
 * Value accessor and changes tracker.
 *
 * Can be used as `EventSender` and `EventKeeper`. Events originated from them never exhaust.
 */
export abstract class ValueTracker<T = any, N extends T = T> implements EventSender<[N, T]>, EventKeeper<[T]> {

  /**
   * @internal
   */
  private _by = noEventInterest();

  /**
   * Registers value changes receiver. The new value is sent as first argument, and the old value as a second one.
   */
  abstract readonly on: OnEvent<[N, T]>;

  /**
   * Registers current and updated values receiver.
   */
  readonly read: AfterEvent<[T]> = afterEventBy<[T]>(receiver => this.on(value => receiver(value)), () => [this.it]);

  get [OnEvent__symbol](): OnEvent<[N, T]> {
    return this.on;
  }

  get [AfterEvent__symbol](): AfterEvent<[T]> {
    return this.read;
  }

  /**
   * The tracked value.
   */
  abstract it: T;

  /**
   * Binds the tracked value to the given `source` value sender or keeper.
   *
   * Updates the value when the `source` sends another value.
   *
   * If the value is already bound to another value source, then unbinds from the old one first.
   *
   * Call the `off()` method to unbind the tracked value from the `source`.
   *
   * Note that explicitly updating the value would override the value received from the `source`.
   *
   * @param source The source value sender or keeper.
   *
   * @returns `this` instance.
   */
  by(source: EventKeeper<[T]> | EventSender<[T]>): this;

  /**
   * Binds the tracked value to the value sender or keeper extracted from the events sent by the given `source`.
   *
   * Updates the value when extracted sender or keeper sends another value.
   *
   * If the value is already bound to another value source, then unbinds from the old one first.
   *
   * Call the `off()` method to unbind the tracked value from the `source`.
   *
   * Note that explicitly updating the value would override the value received from the `source`.
   *
   * @param source The event sender or keeper to extract value senders or keepers from.
   * @param extract A function extracting value senders or keepers from events received from the `source`.
   * May return `undefined` to suspend receiving values.
   *
   * @returns `this` instance.
   */
  by<U extends any[]>(
      source: EventKeeper<U> | EventSender<U>,
      extract: (this: void, ...event: U) => EventKeeper<[T]> | EventSender<[T]> | undefined): this;

  by<U extends any[]>(
      source: EventKeeper<U> | EventSender<U> | EventKeeper<[T]> | EventSender<[T]>,
      extract?: (this: void, ...event: U) => EventKeeper<[T]> | EventSender<[T]> | undefined): this {

    const self = this;

    this.off();

    if (!extract) {

      const sender = source as EventKeeper<[T]> | EventSender<[T]>;

      this._by = acceptValuesFrom(sender);
    } else {

      const container = source as EventKeeper<U> | EventSender<U>;

      this._by = onEventFrom(container).consume((...event: U) => {

        const sender = extract(...event);

        if (sender) {
          return acceptValuesFrom(sender);
        }

        return;
      });
    }
    this._by.whenDone(() => this._by = noEventInterest());

    return this;

    function acceptValuesFrom(sender: EventSender<[T]> | EventKeeper<[T]>): EventInterest {

      const registrar = isEventKeeper(sender) ? sender[AfterEvent__symbol] : sender[OnEvent__symbol];

      return registrar(value => self.it = value);
    }
  }

  /**
   * Unbinds the tracked value from the value sender or keeper this tracker is bound to with `by()` method.
   *
   * If the tracker is not bound then does nothing.
   *
   * @param reason Arbitrary reason of unbinding the value.
   *
   * @returns `this` instance.
   */
  off(reason?: any): this {
    this._by.off(reason);
    return this;
  }

  /**
   * Removes all registered event receivers.
   *
   * After this method call they won't receive events. Informs all corresponding event interests on that by calling
   * the callbacks registered with `whenDone()`.

   * @param reason A reason to stop sending events to receivers.
   *
   * @returns `this` instance.
   */
  abstract done(reason?: any): this;

}
