/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { EventSupplier } from '../base';
import { eventDig } from '../impl';
import { OnEvent, onEventBy } from '../on-event';
import { onSupplied } from '../senders';
import { shareOn } from './share-on';

/**
 * Creates an event processor that extracts event senders from incoming events.
 *
 * The outgoing events supply is cut off once the incoming events supply do.
 *
 * @typeParam TInEvent - Incoming events type.
 * @typeParam TOutEvent - Extracted events type.
 * @param extract - A function extracting outgoing event supplier from incoming event. May return `undefined` when
 * nothing extracted.
 *
 * @returns New event processor.
 */
export function digOn<
    TInEvent extends any[],
    TOutEvent extends any[],
    >(
    extract: (this: void, ...event: TInEvent) => EventSupplier<TOutEvent> | void | undefined,
): (this: void, input: OnEvent<TInEvent>) => OnEvent<TOutEvent> {

  const processor = digOn_(extract);

  return input => shareOn(processor(input));
}

/**
 * Creates an event processor that extracts event senders from incoming events, and does not share the outgoing events
 * supply.
 *
 * The outgoing events supply is cut off once the incoming events supply do.
 *
 * @typeParam TInEvent - Incoming events type.
 * @typeParam TOutEvent - Extracted events type.
 * @param extract - A function extracting outgoing event supplier from incoming event. May return `undefined` when
 * nothing extracted.
 *
 * @returns New event processor.
 */
export function digOn_<// eslint-disable-line @typescript-eslint/naming-convention
    TInEvent extends any[],
    TOutEvent extends any[],
    >(
    extract: (this: void, ...event: TInEvent) => EventSupplier<TOutEvent> | void | undefined,
): (this: void, input: OnEvent<TInEvent>) => OnEvent<TOutEvent> {

  const extractSender = (...event: TInEvent): OnEvent<TOutEvent> | void => {

    const extracted = extract(...event);

    return extracted && onSupplied(extracted);
  };

  return input => onEventBy(eventDig(input, extractSender));
}
