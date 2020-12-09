/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { EventReceiver, sendEventsTo } from '../base';
import { OnEvent, onEventBy } from '../on-event';
import { shareEvents } from './share-events';

/**
 * Creates a mapper that sends values of incoming events.
 *
 * Events are valued by provided `value` function. The `null`, `undefined`, and `false` values are dropped.
 *
 * @category Core
 * @typeParam TEvent - Incoming event type.
 * @typeParam TValue - Event value type.
 * @param value - A converter function that accepts incoming event as parameters and returns either its value,
 * or `false`/`null`/`undefined` to ignore it.
 *
 * @returns A mapping function of incoming event supplier.
 */
export function valueEvents<TEvent extends any[], TValue>(// eslint-disable-line @typescript-eslint/naming-convention
    value: (this: void, ...event: TEvent) => TValue | false | null | undefined,
): (this: void, input: OnEvent<TEvent>) => OnEvent<[TValue]> {

  const mapper = valueEvents_(value);

  return input => shareEvents(mapper(input));
}

/**
 * Creates a mapper that sends values of incoming events, and does not share the outgoing event supply.
 *
 * @category Core
 * @typeParam TEvent - Incoming event type.
 * @typeParam TValue - Event value type.
 * @param value - A converter function that accepts incoming event as parameters and returns either its value,
 * or `false`/`null`/`undefined` to ignore it.
 *
 * @returns A mapping function of incoming event supplier.
 */
export function valueEvents_<TEvent extends any[], TValue>(// eslint-disable-line @typescript-eslint/naming-convention
    value: (this: void, ...event: TEvent) => TValue | false | null | undefined,
): (this: void, input: OnEvent<TEvent>) => OnEvent<[TValue]> {
  return input => onEventBy(eventValue(input, value));
}

/**
 * @internal
 */
export function eventValue<TEvent extends any[], TValue>(
    supplier: OnEvent<TEvent>,
    value: (...event: TEvent) => TValue | false | null | undefined,
): (receiver: EventReceiver.Generic<[TValue]>) => void {
  return receiver => {

    const dispatch = sendEventsTo(receiver);

    supplier({
      supply: receiver.supply,
      receive: (_ctx, ...event: TEvent) => {

        const val = value(...event);

        if (val != null && val !== false) {
          dispatch(val);
        }
      },
    });
  };
}
