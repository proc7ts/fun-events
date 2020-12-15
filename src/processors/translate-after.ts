/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent, afterEventBy } from '../after-event';
import { translateEvents } from '../impl';
import { shareAfter } from './share-after';

/**
 * Creates an event processor that translates events incoming from {@link AfterEvent} keeper.
 *
 * The translated events expected to be sent by the given `translate` function.
 *
 * The returned mapper does the same as the one created by {@link translateOn} one, but returns an {@link AfterEvent}
 * keeper instead of {@link OnEvent} sender. This can not be always done without a `fallback`, as not every
 * transformation results to valid {@link EventKeeper}. E.g. when some events filtered out.
 *
 * @category Core
 * @typeParam TInEvent - Incoming event type.
 * @typeParam TOutEvent - Outgoing translated event type.
 * @param translate - Event translation function. Accepts an outgoing event sender function as first parameter,
 * and incoming event as the rest of them.
 * @param fallback - A function creating fallback event. When omitted, the initial event is expected to be sent by
 * `translate` function. A receiver registration would lead to an error otherwise.
 *
 * @returns A mapping function of incoming event keeper to another one.
 */
export function translateAfter<
    TInEvent extends any[],
    TOutEvent extends any[],
    >(
    translate: (this: void, send: (...event: TOutEvent) => void, ...event: TInEvent) => void,
    fallback?: (this: void) => TOutEvent,
): (this: void, input: AfterEvent<TInEvent>) => AfterEvent<TOutEvent> {

  const mapper = translateAfter_(translate, fallback);

  return input => shareAfter(mapper(input));
}

/**
 * Creates an event processor that translates events incoming from {@link AfterEvent} keeper, and does not share the
 * outgoing events supply.
 *
 * The translated events expected to be sent by the given `translate` function.
 *
 * The returned mapper does the same as the one created by {@link translateOn_} one, but returns an {@link AfterEvent}
 * keeper instead of {@link OnEvent} sender. This can not be always done without a `fallback`, as not every
 * transformation results to valid {@link EventKeeper}. E.g. when some events filtered out.
 *
 * @category Core
 * @typeParam TInEvent - Incoming event type.
 * @typeParam TOutEvent - Outgoing translated event type.
 * @param translate - Event translation function. Accepts an outgoing event sender function as first parameter,
 * and incoming event as the rest of them.
 * @param fallback - A function creating fallback event. When omitted, the initial event is expected to be sent by
 * `translate` function. A receiver registration would lead to an error otherwise.
 *
 * @returns A mapping function of incoming event keeper to another one.
 */
export function translateAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TInEvent extends any[],
    TOutEvent extends any[],
    >(
    translate: (this: void, send: (...event: TOutEvent) => void, ...event: TInEvent) => void,
    fallback?: (this: void) => TOutEvent,
): (this: void, input: AfterEvent<TInEvent>) => AfterEvent<TOutEvent> {
  return input => afterEventBy(translateEvents(input, translate), fallback);
}
