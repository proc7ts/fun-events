import { translateEvents } from '../impl';
import { OnEvent, onEventBy } from '../on-event';
import { shareOn } from './share-on';

/**
 * Creates an event processor that translates events incoming from {@link OnEvent} sender.
 *
 * The translated events expected to be sent by the given `translate` function.
 *
 * @category Event Processing
 * @typeParam TInEvent - Incoming event type.
 * @typeParam TOutEvent - Outgoing translated event type.
 * @param translate - Event translation function. Accepts an outgoing event sender function as first parameter,
 * and incoming event as the rest of them.
 *
 * @returns A mapping function of incoming event sender to another one.
 */
export function translateOn<TInEvent extends any[], TOutEvent extends any[]>(
  translate: (this: void, send: (...event: TOutEvent) => void, ...event: TInEvent) => void,
): (this: void, input: OnEvent<TInEvent>) => OnEvent<TOutEvent> {
  const mapper = translateOn_(translate);

  return input => shareOn(mapper(input));
}

/**
 * Creates an event processor that translates events incoming from {@link OnEvent} sender, and does not share the
 * outgoing events supply.
 *
 * The translated events expected to be sent by the given `translate` function.
 *
 * @category Event Processing
 * @typeParam TInEvent - Incoming event type.
 * @typeParam TOutEvent - Outgoing translated event type.
 * @param translate - Event translation function. Accepts an outgoing event sender function as first parameter,
 * and incoming event as the rest of them.
 *
 * @returns A mapping function of incoming event sender to another one.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function translateOn_<TInEvent extends any[], TOutEvent extends any[]>(
  translate: (this: void, send: (...event: TOutEvent) => void, ...event: TInEvent) => void,
): (this: void, input: OnEvent<TInEvent>) => OnEvent<TOutEvent> {
  return input => onEventBy(translateEvents(input, translate));
}
