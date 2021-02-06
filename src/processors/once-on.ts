import { AfterEvent } from '../after-event';
import { onceEvent } from '../impl';
import { OnEvent, onEventBy } from '../on-event';

/**
 * A processor of the first event incoming from {@link OnEvent} sender.
 *
 * Cuts off the outgoing event supply after sending the first event.
 *
 * @category Event Processing
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event sender to receive an event from.
 *
 * @returns New sender of the first event.
 */
export function onceOn<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): OnEvent<TEvent> | AfterEvent<TEvent> {
  return onEventBy(onceEvent(supplier));
}
