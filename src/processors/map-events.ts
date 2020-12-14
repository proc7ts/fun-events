/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { eventTranslate } from '../impl/event-translate';
import { OnEvent } from '../on-event';
import { EventMapper } from './event-mapper';
import { shareEvents } from './share-events';

/**
 * Creates an event processor that converts incoming events with the given converter function.
 *
 * @category Core
 * @typeParam TEvent - Incoming events type.
 * @typeParam TResult - Outgoing events type.
 * @param convert - A converter function that accepts incoming event as parameters and returns converted outgoing event.
 *
 * @returns New event mapper.
 */
export function mapEvents<TEvent extends any[], TResult>(
    convert: (this: void, ...event: TEvent) => TResult,
): EventMapper<TEvent, [TResult]> {

  const mapper = mapEvents_(convert);

  return (
      (input: OnEvent<TEvent>) => shareEvents(mapper(input))
  ) as EventMapper<TEvent, [TResult]>;
}

/**
 * Creates an event processor that converts incoming events with the given converter function, and does not share the
 * outgoing events supply.
 *
 * @category Core
 * @typeParam TEvent - Incoming events type.
 * @typeParam TResult - Outgoing events type.
 * @param convert - A converter function that accepts incoming event as parameters and returns outgoing event value.
 *
 * @returns New event mapper.
 */
export function mapEvents_<TEvent extends any[], TResult>(// eslint-disable-line @typescript-eslint/naming-convention
    convert: (this: void, ...event: TEvent) => TResult,
): EventMapper<TEvent, [TResult]> {
  return (
      (input: OnEvent<TEvent>) => input.by(eventTranslate<TEvent, [TResult]>(
          input,
          (send, ...event) => send(convert(...event)),
      ))
  ) as EventMapper<TEvent, [TResult]>;
}
