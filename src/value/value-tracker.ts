/**
 * @module fun-events
 */
import { AfterEvent, afterEventBy } from '../after-event';
import { AfterEvent__symbol, EventKeeper, isEventKeeper } from '../event-keeper';
import { EventReceiver } from '../event-receiver';
import { EventSender, OnEvent__symbol } from '../event-sender';
import { EventSupplier } from '../event-supplier';
import { EventSupply, noEventSupply } from '../event-supply';
import { OnEvent, onSupplied } from '../on-event';

/**
 * Value accessor and changes tracker.
 *
 * Implements an [[EventSender]] interface by sending value changes to registered receivers as a pair of new and old
 * values.
 *
 * Implements an [[EventKeeper]] interface by sending current value and its updates.
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
   * An [[OnEvent]] sender of value changes. The new value is sent as first argument, and the old value as a second one.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   */
  abstract readonly on: OnEvent<[N, T]>;

  /**
   * An [[AfterEvent]] keeper of current value.
   *
   * The `[AfterEvent__symbol]` property is an alias of this one.
   */
  readonly read: AfterEvent<[T]> = afterEventBy<[T]>(
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
   * Updates the tracked value by the given value `supplier`.
   *
   * If the value is already updated by another supplier, then unbinds from the old one first.
   *
   * Call the [[ValueTracker.byNone]] method to unbind the tracked value from the `source`.
   *
   * Note that explicitly updating the value would override the value received from the `source`.
   *
   * @param supplier  The source value sender or keeper.
   *
   * @returns `this` instance.
   */
  by(supplier: EventSupplier<[T]>): this;

  /**
   * Updates the tracked value by value suppliers extracted from events sent by the given `supplier`.
   *
   * If the value is already updated by another value supplier, then unbinds from the old one first.
   *
   * Call the [[ValueTracker.byNone]] method to unbind the tracked value from the `source`.
   *
   * Note that explicitly updating the value would override the value received from the `source`.
   *
   * @typeparam S  Source value type.
   * @param supplier  The event supplier to extract value suppliers from.
   * @param extract  A function extracting value supplier from event received from `supplier`.
   * May return `undefined` to suspend receiving values.
   *
   * @returns `this` instance.
   */
  by<S extends any[]>(
      supplier: EventSupplier<S>,
      extract: (this: void, ...event: S) => EventSupplier<[T]> | undefined,
  ): this;

  by<S extends any[]>(
      supplier: EventSupplier<S> | EventSupplier<[T]>,
      extract?: (this: void, ...event: S) => EventSupplier<[T]> | undefined,
  ): this {

    const self = this;

    this.byNone();

    if (!extract) {

      const sender = supplier as EventSupplier<[T]>;

      this._by = acceptValuesFrom(sender);
    } else {

      const container = supplier as EventSupplier<S>;

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

    function acceptValuesFrom(sender: EventSupplier<[T]>): EventSupply {

      const registrar = isEventKeeper(sender) ? sender[AfterEvent__symbol] : sender[OnEvent__symbol];

      return registrar(value => self.it = value);
    }
  }

  /**
   * Unbinds the tracked value from any value supplier this tracker is {@link ValueTracker.by updated by}.
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

function receiveNewValue<T, N extends T>(
    valueReceiver: EventReceiver.Generic<[T]>,
): EventReceiver.Generic<[N, T]> {
  return {
    supply: valueReceiver.supply,
    receive(context, newValue) {
      valueReceiver.receive(
          {
            onRecurrent(recurrentReceiver) {
              context.onRecurrent(recurrentValue => recurrentReceiver(recurrentValue));
            },
          },
          newValue,
      );
    },
  };
}
