/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { eventTranslate } from '../impl/event-translate';
import { OnEvent, onEventBy } from '../on-event';
import { shareEvents } from './share-events';

/**
 * Creates an event supplier mapper function that translates incoming events.
 *
 * The translated events expected to be sent by the given `translate` function.
 *
 * @category Core
 * @typeParam TInEvent - Incoming event type.
 * @typeParam TOutEvent - Outgoing translated event type.
 * @param translate - Event translation function. Accepts an outgoing event sender function as first parameter,
 * and incoming event as the rest of them.
 *
 * @returns A mapping function of incoming event supplier to `OnEvent` sender.
 */
export function translateEvents<
    TInEvent extends any[],
    TOutEvent extends any[],
    >(
    translate: (this: void, send: (...event: TOutEvent) => void, ...event: TInEvent) => void,
): (this: void, input: OnEvent<TInEvent>) => OnEvent<TOutEvent> {

  const mapper = translateEvents_(translate);

  return input => shareEvents(mapper(input));
}

/**
 * Creates an event supplier mapper function that translates incoming events, and does not share the outgoing event
 * supply.
 *
 * The translated events expected to be sent by the given `translate` function.
 *
 * @category Core
 * @typeParam TInEvent - Incoming event type.
 * @typeParam TOutEvent - Outgoing translated event type.
 * @param translate - Event translation function. Accepts an outgoing event sender function as first parameter,
 * and incoming event as the rest of them.
 *
 * @returns A mapping function of incoming event supplier to `OnEvent` sender.
 */
export function translateEvents_<// eslint-disable-line @typescript-eslint/naming-convention
    TInEvent extends any[],
    TOutEvent extends any[],
    >(
    translate: (this: void, send: (...event: TOutEvent) => void, ...event: TInEvent) => void,
): (this: void, input: OnEvent<TInEvent>) => OnEvent<TOutEvent> {
  return input => onEventBy(eventTranslate(input, translate));
}
