/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent } from '../after-event';
import { share } from '../impl';
import { OnEvent } from '../on-event';

/**
 * Constructs an {@link AfterEvent} keeper that shares events supply among all registered receivers.
 *
 * The created keeper receives events from this one and sends to registered receivers. The shared keeper registers
 * a receiver in this one only once, when first receiver registered. And cuts off original events supply once all
 * event supplies do.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event keeper to share events from.
 *
 * @returns An {@link AfterEvent} keeper sharing a common supply of events originating from this keeper.
 */
export function shareEvents<TEvent extends any[]>(supplier: AfterEvent<TEvent>): AfterEvent<TEvent>;

/**
 * Constructs an {@link OnEvent} sender that shares events supply among all registered receivers.
 *
 * The created sender receives events from this one and sends to registered receivers. The shared sender registers
 * a receiver in this one only once, when first receiver registered. And cuts off original events supply once all
 * supplies do.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event sender to share events from.
 *
 * @returns An {@link OnEvent} sender sharing a common supply of events originated from this sender.
 */
export function shareEvents<TEvent extends any[]>(supplier: OnEvent<TEvent>): OnEvent<TEvent>;

export function shareEvents<TEvent extends any[]>(
    supplier: OnEvent<TEvent> | AfterEvent<TEvent>,
): OnEvent<TEvent> | AfterEvent<TEvent> {
  return (supplier as OnEvent<TEvent>).by(share(supplier));
}
