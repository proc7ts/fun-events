/**
 * @packageDocumentation
 * @module fun-events
 */
import { AfterEvent__symbol, EventSupplier, isEventSender, OnEvent__symbol } from '../base';
import { OnEvent, onEventBy } from '../on-event';

/**
 * Builds an [[OnEvent]] sender of events supplied by the given `supplier`.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param supplier  An event supplier.
 *
 * @returns An [[OnEvent]] sender of events originated from the given `supplier`.
 */
export function onSupplied<E extends any[]>(supplier: EventSupplier<E>): OnEvent<E> {

  const onEvent = isEventSender(supplier) ? supplier[OnEvent__symbol] : supplier[AfterEvent__symbol];

  if (onEvent instanceof OnEvent) {
    return onEvent;
  }

  return onEventBy(onEvent.bind(supplier));
}
