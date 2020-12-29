/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { AfterEvent } from '../after-event';
import { OnEvent } from '../on-event';
import { shareAfter } from './share-after';
import { translateAfter_ } from './translate-after';

/**
 * Creates an event processor that sends the values of events incoming from {@link AfterEvent} keeper.
 *
 * Events are valued by provided `value` function. The `null`, `undefined`, and `false` values are dropped.
 *
 * @category Event Processing
 * @typeParam TEvent - Incoming event type.
 * @typeParam TValue - Event value type.
 * @param valueOf - Event value detector function. Accepts incoming event as parameters and returns either its value,
 * or `false`/`null`/`undefined` to ignore it.
 *
 * @returns New event processor.
 */
export function valueAfter<TEvent extends any[], TValue>(
    valueOf: (this: void, ...event: TEvent) => TValue | false | null | undefined,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<[TValue]>;

/**
 * Creates an event processor that sends the values of events incoming from {@link OnEvent} sender or a fallback value.
 *
 * Events are valued by provided `value` function. The `null`, `undefined`, and `false` values are dropped.
 *
 * @category Event Processing
 * @typeParam TEvent - Incoming event type.
 * @typeParam TValue - Event value type.
 * @param valueOf - Event value detector function. Accepts incoming event as parameters and returns either its value,
 * or `false`/`null`/`undefined` to ignore it.
 * @param fallback - A function creating a fallback value.
 *
 * @returns New event processor.
 */
export function valueAfter<TEvent extends any[], TValue>(
    valueOf: (this: void, ...event: TEvent) => TValue | false | null | undefined,
    fallback: (this: void) => TValue,
): (this: void, input: OnEvent<TEvent>) => AfterEvent<[TValue]>;

export function valueAfter<TEvent extends any[], TValue>(
    valueOf: (this: void, ...event: TEvent) => TValue | false | null | undefined,
    fallback?: (this: void) => TValue,
): (this: void, input: OnEvent<TEvent>) => AfterEvent<[TValue]> {

  const mapper = valueAfter_(valueOf, fallback!);

  return input => shareAfter(mapper(input));
}

/**
 * Creates an event processor that sends the values of events incoming from {@link AfterEvent} keeper, and does not
 * share the outgoing events supply.
 *
 * @category Event Processing
 * @typeParam TEvent - Incoming event type.
 * @typeParam TValue - Event value type.
 * @param valueOf - Event value detector function. Accepts incoming event as parameters and returns either its value,
 * or `false`/`null`/`undefined` to ignore it.
 *
 * @returns New event processor.
 */
export function valueAfter_<TEvent extends any[], TValue>(// eslint-disable-line @typescript-eslint/naming-convention
    valueOf: (this: void, ...event: TEvent) => TValue | false | null | undefined,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<[TValue]>;

/**
 * Creates an event processor that sends the values of events incoming from {@link OnEvent} sender or a fallback value,
 * and does not share the outgoing events supply.
 *
 * @category Event Processing
 * @typeParam TEvent - Incoming event type.
 * @typeParam TValue - Event value type.
 * @param valueOf - Event value detector function. Accepts incoming event as parameters and returns either its value,
 * or `false`/`null`/`undefined` to ignore it.
 * @param fallback - A function creating a fallback value.
 *
 * @returns New event processor.
 */
export function valueAfter_<TEvent extends any[], TValue>(// eslint-disable-line @typescript-eslint/naming-convention
    valueOf: (this: void, ...event: TEvent) => TValue | false | null | undefined,
    fallback: (this: void) => TValue,
): (this: void, input: OnEvent<TEvent>) => AfterEvent<[TValue]>;

export function valueAfter_<TEvent extends any[], TValue>(// eslint-disable-line @typescript-eslint/naming-convention
    valueOf: (this: void, ...event: TEvent) => TValue | false | null | undefined,
    fallback?: (this: void) => TValue,
): (this: void, input: OnEvent<TEvent>) => AfterEvent<[TValue]> {
  return translateAfter_(
      (send, ...event) => {

        const value = valueOf(...event);

        if (value != null && value !== false) {
          send(value);
        }
      },
      (fallback && (() => [fallback()]))!,
  );
}
