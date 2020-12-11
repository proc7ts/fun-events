/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { map } from '../impl';
import { OnEvent } from '../on-event';
import { EventSupplierMapper } from './event-supplier-mapper';
import { shareEvents } from './share-events';

/**
 * Creates an event supplier mapper function that converts incoming events with the given converter function.
 *
 * @category Core
 * @typeParam TEvent - Incoming event type.
 * @typeParam TResult - Outgoing event value type.
 * @param convert - A converter function that accepts incoming event as parameters and returns outgoing event value.
 *
 * @returns A mapping function of incoming event supplier.
 */
export function mapEvents<TEvent extends any[], TResult>(
    convert: (this: void, ...event: TEvent) => TResult,
): EventSupplierMapper<TEvent, [TResult]> {

  const mapper = mapEvents_(convert);

  return (
      (input: OnEvent<TEvent>) => shareEvents(mapper(input))
  ) as EventSupplierMapper<TEvent, [TResult]>;
}

/**
 * Creates an event supplier mapper function that converts incoming events with the given converter function, and does
 * not share the outgoing event supply.
 *
 * @category Core
 * @typeParam TEvent - Incoming event type.
 * @typeParam TResult - Outgoing event value type.
 * @param convert - A converter function that accepts incoming event as parameters and returns outgoing event value.
 *
 * @returns A mapping function of incoming event supplier.
 */
export function mapEvents_<TEvent extends any[], TResult>(// eslint-disable-line @typescript-eslint/naming-convention
    convert: (this: void, ...event: TEvent) => TResult,
): EventSupplierMapper<TEvent, [TResult]> {
  return (
      (input: OnEvent<TEvent>) => input.by(map(input, convert))
  ) as EventSupplierMapper<TEvent, [TResult]>;
}
