/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent, afterEventBy } from '../after-event';
import { translateEvents } from '../impl';
import { OnEvent } from '../on-event';
import { shareAfter } from './share-after';

/**
 * Creates an event processor that converts events incoming from {@link AfterEvent} keeper with the given converter
 * function.
 *
 * @category Event Processing
 * @typeParam TEvent - Incoming events type.
 * @typeParam TResult - Outgoing events type.
 * @param convert - A converter function that accepts incoming event as parameters and returns converted outgoing event.
 *
 * @returns New event mapper.
 */
export function mapAfter<TEvent extends any[], TResult>(
    convert: (this: void, ...event: TEvent) => TResult,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<[TResult]>;

/**
 * Creates an event processor that converts events incoming from {@link OnEvent} sender with the given converter
 * function and fallback.
 *
 * @category Event Processing
 * @typeParam TEvent - Incoming events type.
 * @typeParam TResult - Outgoing events type.
 * @param convert - A converter function that accepts incoming event as parameters and returns converted outgoing event.
 * @param fallback - A function creating a fallback of outgoing event.
 *
 * @returns New event mapper.
 */
export function mapAfter<TEvent extends any[], TResult>(
    convert: (this: void, ...event: TEvent) => TResult,
    fallback: () => TResult,
): (this: void, input: OnEvent<TEvent>) => AfterEvent<[TResult]>;

export function mapAfter<TEvent extends any[], TResult>(
    convert: (this: void, ...event: TEvent) => TResult,
    fallback?: () => TResult,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<[TResult]> {

  const mapper = mapAfter_(convert, fallback!);

  return input => shareAfter(mapper(input));
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
export function mapAfter_<TEvent extends any[], TResult>(// eslint-disable-line @typescript-eslint/naming-convention
    convert: (this: void, ...event: TEvent) => TResult,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<[TResult]>;

/**
 * Creates an event processor that converts events incoming from {@link OnEvent} sender with the given converter
 * function and fallback, and does not share the outgoing events supply.
 *
 * @category Event Processing
 * @typeParam TEvent - Incoming events type.
 * @typeParam TResult - Outgoing events type.
 * @param convert - A converter function that accepts incoming event as parameters and returns outgoing event value.
 * @param fallback - A function creating a fallback of outgoing event.
 *
 * @returns New event mapper.
 */
export function mapAfter_<TEvent extends any[], TResult>(// eslint-disable-line @typescript-eslint/naming-convention
    convert: (this: void, ...event: TEvent) => TResult,
    fallback: () => TResult,
): (this: void, input: OnEvent<TEvent>) => AfterEvent<[TResult]>;

export function mapAfter_<TEvent extends any[], TResult>(// eslint-disable-line @typescript-eslint/naming-convention
    convert: (this: void, ...event: TEvent) => TResult,
    fallback?: () => TResult,
): (this: void, input: OnEvent<TEvent>) => AfterEvent<[TResult]> {
  return input => afterEventBy(
      translateEvents(
          input,
          (send, ...event) => send(convert(...event)),
      ),
      fallback && (() => [fallback()]),
  );
}
