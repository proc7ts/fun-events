/**
 * @module fun-events
 */
import { AfterEvent, afterEventOr } from '../after-event';
import { EventSupply, noEventSupply } from '../event-supply';
import { AfterEvent__symbol, EventKeeper, isEventKeeper } from '../event-keeper';
import { EventReceiver } from '../event-receiver';
import { EventSender, OnEvent__symbol } from '../event-sender';
import { OnEvent, onSupplied } from '../on-event';

/**
 * Value accessor and changes tracker.
 *
 * Can be used as [[EventSender]] or [[EventKeeper]].
 *
 * @category Value Tracking
 * @typeparam T  Tracked value type.
 * @typeparam N  New (updated) value type.
 */
export abstract class ValueTracker<T = any, N extends T = T> implements EventSender<[N, T]>, EventKeeper<[T]> {

  /**
   * @internal
   */
  private _by = noEventSupply();

  /**
   * Registers value changes receiver. The new value is sent as first argument, and the old value as a second one.
   */
  abstract readonly on: OnEvent<[N, T]>;

  /**
   * Registers current and updated values receiver.
   */
  readonly read: AfterEvent<[T]> = afterEventOr<[T]>(
      receiver => this.on(receiveNewValue(receiver)),
      () => [this.it],
  );

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
   * Call the [[ValueTracker.off]] method to unbind the tracked value from the `source`.
   *
   * Note that explicitly updating the value would override the value received from the `source`.
   *
   * @param source  The source value sender or keeper.
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
   * Call the [[ValueTracker.off]] method to unbind the tracked value from the `source`.
   *
   * Note that explicitly updating the value would override the value received from the `source`.
   *
   * @typeparam S  Source value type.
   * @param source  The event sender or keeper to extract value senders or keepers from.
   * @param extract  A function extracting value senders or keepers from events received from the `source`.
   * May return `undefined` to suspend receiving values.
   *
   * @returns `this` instance.
   */
  by<S extends any[]>(
      source: EventKeeper<S> | EventSender<S>,
      extract: (this: void, ...event: S) => EventKeeper<[T]> | EventSender<[T]> | undefined,
  ): this;

  by<S extends any[]>(
      source: EventKeeper<S> | EventSender<S> | EventKeeper<[T]> | EventSender<[T]>,
      extract?: (this: void, ...event: S) => EventKeeper<[T]> | EventSender<[T]> | undefined,
  ): this {

    const self = this;

    this.byNone();

    if (!extract) {

      const sender = source as EventKeeper<[T]> | EventSender<[T]>;

      this._by = acceptValuesFrom(sender);
    } else {

      const container = source as EventKeeper<S> | EventSender<S>;

      this._by = onSupplied(container).consume((...event: S) => {

        const sender = extract(...event);

        if (sender) {
          return acceptValuesFrom(sender);
        }

        return;
      });
    }
    this._by.whenOff(() => this._by = noEventSupply());

    return this;

    function acceptValuesFrom(sender: EventSender<[T]> | EventKeeper<[T]>): EventSupply {

      const registrar = isEventKeeper(sender) ? sender[AfterEvent__symbol] : sender[OnEvent__symbol];

      return registrar(value => self.it = value);
    }
  }

  /**
   * Unbinds the tracked value from the value sender or keeper this tracker is {@link ValueTracker.by bound to}.
   *
   * If the tracker is not bound then does nothing.
   *
   * @param reason  Arbitrary reason of unbinding the value.
   *
   * @returns `this` instance.
   */
  byNone(reason?: any): this {
    this._by.off(reason);
    return this;
  }

  /**
   * Removes all registered event receivers and cuts off corresponding event supplies.
   *
   * After this method call they won't receive events.

   * @param reason  A reason to stop sending events.
   *
   * @returns `this` instance.
   */
  abstract done(reason?: any): this;

}

function receiveNewValue<T, N extends T>(valueReceiver: EventReceiver<[T]>): EventReceiver<[N, T]> {
  return function(newValue) {

    const context = this;

    valueReceiver.call(
        {
          afterRecurrent(recurrentReceiver) {
            context.afterRecurrent(receiveNewValue(recurrentReceiver));
          },
        },
        newValue,
    );
  };
}
