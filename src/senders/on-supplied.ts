/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent__symbol, EventSupplier, isEventSender, OnEvent__symbol } from '../base';
import { OnEvent } from '../on-event';

/**
 * Builds an {@link OnEvent} sender of events supplied by the given `supplier`.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - An event supplier.
 *
 * @returns An {@link OnEvent} sender of events originated from the given `supplier`.
 */
export function onSupplied<TEvent extends any[]>(supplier: EventSupplier<TEvent>): OnEvent<TEvent> {
  return isEventSender(supplier) ? supplier[OnEvent__symbol]() : supplier[AfterEvent__symbol]();
}
