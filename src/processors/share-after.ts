import { AfterEvent, afterEventBy } from '../after-event';
import { shareEvents } from '../impl';

/**
 * A processor of events incoming from {@link AfterEvent} keeper that shares outgoing events supply among all registered
 * receivers.
 *
 * The created keeper receives events from this one and sends to registered receivers. The shared keeper registers
 * a receiver in this one only once, when first receiver registered. And cuts off original events supply once all
 * event supplies do.
 *
 * @category Event Processing
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event keeper to share events from.
 *
 * @returns An {@link AfterEvent} keeper sharing a common supply of events.
 */
export function shareAfter<TEvent extends any[]>(supplier: AfterEvent<TEvent>): AfterEvent<TEvent> {
  return afterEventBy(shareEvents(supplier));
}
