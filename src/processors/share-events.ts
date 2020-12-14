/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent } from '../after-event';
import { eventShare } from '../impl';
import { OnEvent } from '../on-event';

/**
 * A processor of events incoming from {@link AfterEvent} keeper that shares outgoing events supply among all registered
 * receivers.
 *
 * The created keeper receives events from this one and sends to registered receivers. The shared keeper registers
 * a receiver in this one only once, when first receiver registered. And cuts off original events supply once all
 * event supplies do.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event keeper to share events from.
 *
 * @returns An {@link AfterEvent} keeper sharing a common supply of events.
 */
export function shareEvents<TEvent extends any[]>(supplier: AfterEvent<TEvent>): AfterEvent<TEvent>;

/**
 * A processor of events incoming from {@link OnEvent} sender that shares outgoing events supply among all registered
 * receivers.
 *
 * The created sender receives events from this one and sends to registered receivers. The shared sender registers
 * a receiver in this one only once, when first receiver registered. And cuts off original events supply once all
 * supplies do.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event sender to share events from.
 *
 * @returns An {@link OnEvent} sender sharing a common supply of events.
 */
export function shareEvents<TEvent extends any[]>(supplier: OnEvent<TEvent>): OnEvent<TEvent>;

export function shareEvents<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): OnEvent<TEvent> | AfterEvent<TEvent> {
  return supplier.by(eventShare(supplier));
}
