/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent, afterEventBy } from '../after-event';
import { EventKeeper } from '../base';
import { eventDig } from '../impl';
import { afterSupplied } from '../keepers';
import { shareAfter } from './share-after';

/**
 * Creates an event processor that extracts event keepers from events incoming from `{@link AfterEvent} keeper.
 *
 * The outgoing events supply is cut off once the incoming events supply do.
 *
 * @category Event Processing
 * @typeParam TInEvent - Incoming events type.
 * @typeParam TOutEvent - Extracted events type.
 * @param extract - A function extracting outgoing event keeper from incoming event. May return `undefined` when
 * nothing extracted.
 *
 * @returns New processor of events incoming from {@link @AfterEvent} keeper.
 */
export function digAfter<
    TInEvent extends any[],
    TOutEvent extends any[],
    >(
    extract: (this: void, ...event: TInEvent) => EventKeeper<TOutEvent> | void | undefined,
): (this: void, input: AfterEvent<TInEvent>) => AfterEvent<TOutEvent> {

  const processor = digAfter_(extract);

  return input => shareAfter(processor(input));
}

/**
 * Creates an event processor that extracts event keepers from events incoming from `{@link AfterEvent} keeper,
 * and does not share the outgoing events supply.
 *
 * The outgoing events supply is cut off once the incoming events supply do.
 *
 * @category Event Processing
 * @typeParam TInEvent - Incoming events type.
 * @typeParam TOutEvent - Extracted events type.
 * @param extract - A function extracting outgoing event keeper from incoming event. May return `undefined` when
 * nothing extracted.
 *
 * @returns New processor of events incoming from {@link @AfterEvent} keeper.
 */
export function digAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TInEvent extends any[],
    TOutEvent extends any[],
    >(
    extract: (this: void, ...event: TInEvent) => EventKeeper<TOutEvent> | void | undefined,
): (this: void, input: AfterEvent<TInEvent>) => AfterEvent<TOutEvent> {

  const extractKeeper = (...events: TInEvent): AfterEvent<TOutEvent> | void => {

    const extracted = extract(...events);

    return extracted && afterSupplied(extracted);
  };

  return input => afterEventBy(eventDig(input, extractKeeper));
}
