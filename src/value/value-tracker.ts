import { neverSupply, Supply, SupplyPeer } from '@proc7ts/supply';
import { AfterEvent, afterEventBy } from '../after-event';
import {
  AfterEvent__symbol,
  EventKeeper,
  EventReceiver,
  EventSender,
  EventSupplier,
  isEventKeeper,
  OnEvent__symbol,
} from '../base';
import { OnEvent } from '../on-event';
import { consumeEvents } from '../processors';
import { onSupplied } from '../senders';

/**
 * Value accessor and changes tracker.
 *
 * Implements an {@link EventSender} interface by sending value changes to registered receivers as a pair of new and old
 * values.
 *
 * Implements an {@link EventKeeper} interface by sending current value and its updates.
 *
 * @category Value Tracking
 * @typeParam T - Tracked value type.
 */
export abstract class ValueTracker<T> implements EventSender<[T, T]>, EventKeeper<[T]>, SupplyPeer {

  /**
   * @internal
   */
  private _by = neverSupply();

  /**
   * {@link OnEvent} sender of value changes.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   *
   * @returns Value changes sender.
   */
  abstract readonly on: OnEvent<[T, T]>;

  /**
   * {@link AfterEvent} keeper of current value.
   *
   * The `[AfterEvent__symbol]` property is an alias of this one.
   *
   * @returns Current value keeper.
   */
  readonly read: AfterEvent<[T]> = afterEventBy(
      receiver => this.on(receiveNewValue(receiver)),
      () => [this.it],
  );

  [OnEvent__symbol](): OnEvent<[T, T]> {
    return this.on;
  }

  [AfterEvent__symbol](): AfterEvent<[T]> {
    return this.read;
  }

  /**
   * An event supply of this value tracker.
   */
  abstract readonly supply: Supply;

  /**
   * The tracked value.
   */
  abstract it: T;

  /**
   * Updates the tracked value by the given value `supplier`.
   *
   * If the value is already updated by another supplier, then unbinds from the old one first.
   *
   * Call the {@link ValueTracker.byNone} method to unbind the tracked value from the `source`.
   *
   * Note that explicitly updating the value would override the value received from the `source`.
   *
   * @param supplier - The source value sender or keeper.
   *
   * @returns `this` instance.
   */
  by(supplier: EventSupplier<[T]>): this;

  /**
   * Updates the tracked value by value suppliers extracted from events sent by the given `supplier`.
   *
   * If the value is already updated by another value supplier, then unbinds from the old one first.
   *
   * Call the {@link ValueTracker.byNone} method to unbind the tracked value from the `source`.
   *
   * Note that explicitly updating the value would override the value received from the `source`.
   *
   * @typeParam TSrcEvent - Source event type.
   * @param supplier - The event supplier to extract value suppliers from.
   * @param extract - A function extracting value supplier from event received from `supplier`.
   * May return `undefined` to suspend receiving values.
   *
   * @returns `this` instance.
   */
  by<TSrcEvent extends any[]>(
      supplier: EventSupplier<TSrcEvent>,
      extract: (this: void, ...event: TSrcEvent) => EventSupplier<[T]> | undefined,
  ): this;

  by<TSrcEvent extends any[]>(
      supplier: EventSupplier<TSrcEvent> | EventSupplier<[T]>,
      extract?: (this: void, ...event: TSrcEvent) => EventSupplier<[T]> | undefined,
  ): this {

    const acceptValuesFrom = (sender: EventSupplier<[T]>): Supply => {

      const onValue = isEventKeeper(sender) ? sender[AfterEvent__symbol]() : sender[OnEvent__symbol]();

      return onValue(value => this.it = value);
    };

    this.byNone();
    if (!extract) {

      const sender = supplier as EventSupplier<[T]>;

      this._by = acceptValuesFrom(sender);
    } else {

      const container = supplier as EventSupplier<TSrcEvent>;

      this._by = onSupplied(container).do(consumeEvents((...event) => {

        const sender = extract(...event);

        if (sender) {
          return acceptValuesFrom(sender);
        }

        return;
      }));
    }

    this._by.whenOff(() => this._by = neverSupply());

    return this;
  }

  /**
   * Unbinds the tracked value from any value supplier this tracker is {@link ValueTracker.by updated by}.
   *
   * If the tracker is not bound then does nothing.
   *
   * @param reason - Arbitrary reason of unbinding the value.
   *
   * @returns `this` instance.
   */
  byNone(reason?: any): this {
    this._by.off(reason);

    return this;
  }

}

/**
 * @internal
 */
function receiveNewValue<T>(
    valueReceiver: EventReceiver.Generic<[T]>,
): EventReceiver.Generic<[T, T]> {
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
