import { translateEvents } from '../impl';
import { OnEvent, onEventBy } from '../on-event';
import { shareOn } from './share-on';

/**
 * Creates an event processor that converts events incoming from {@link OnEvent} sender with the given converter
 * function.
 *
 * @category Event Processing
 * @typeParam TEvent - Incoming events type.
 * @typeParam TResult - Outgoing events type.
 * @param convert - A converter function that accepts incoming event as parameters and returns converted outgoing event.
 *
 * @returns New event mapper.
 */
export function mapOn<TEvent extends any[], TResult>(
    convert: (this: void, ...event: TEvent) => TResult,
): (this: void, input: OnEvent<TEvent>) => OnEvent<[TResult]> {

  const mapper = mapOn_(convert);

  return input => shareOn(mapper(input));
}

/**
 * Creates an event processor that converts events incoming from {@link OnEvent} sender with the given converter
 * function, and does not share the outgoing events supply.
 *
 * @category Event Processing
 * @typeParam TEvent - Incoming events type.
 * @typeParam TResult - Outgoing events type.
 * @param convert - A converter function that accepts incoming event as parameters and returns outgoing event value.
 *
 * @returns New event mapper.
 */
export function mapOn_<TEvent extends any[], TResult>(// eslint-disable-line @typescript-eslint/naming-convention
    convert: (this: void, ...event: TEvent) => TResult,
): (this: void, input: OnEvent<TEvent>) => OnEvent<[TResult]> {
  return input => onEventBy(translateEvents(
      input,
      (send, ...event) => send(convert(...event)),
  ));
}
