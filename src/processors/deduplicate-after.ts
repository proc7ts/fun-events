import { asis } from '@proc7ts/primitives';
import { AfterEvent, afterEventBy } from '../after-event';
import { shareAfter } from './share-after';

let deduplicateAfter$default:// eslint-disable-line @typescript-eslint/naming-convention
    | ((this: void, input: AfterEvent<any>) => AfterEvent<any>)
    | undefined;

/**
 * Creates an event processor that ensures the same event incoming from `{@link AfterEvent} keeper are not reported
 * twice.
 *
 * The outgoing events supply is cut off once the incoming events supply do.
 *
 * @category Event Processing
 * @typeParam TEvent - An event type.
 * @param isDuplicate - A function that checks whether the next incoming event is a duplicate of a previously reported
 * one. Accepts a prior and next event tuples as parameters, and returns a truthy value if they are duplicates.
 * By default, treats event tuples as duplicates if they have the same number of elements, and each element is
 * strictly equals to corresponding one.
 * @param preserve - A function that constructs a preserved event tuple. Accepts an event tuple and returns one to
 * preserve and compare next time. By default, returns an event as is.
 *
 * @returns Deduplicating processor of events incoming from {@link @AfterEvent} keeper.
 */
export function deduplicateAfter<TEvent extends any[]>(
    isDuplicate?: (this: void, prior: TEvent, next: TEvent) => boolean,
    preserve?: (this: void, value: TEvent) => TEvent,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent> {
  return isDuplicate || preserve
      ? deduplicateAfter$create(isDuplicate, preserve)
      : (deduplicateAfter$default || (deduplicateAfter$default = deduplicateAfter$create()));
}

function deduplicateAfter$create<TEvent extends any[]>(
    isDuplicate?: (this: void, prior: TEvent, next: TEvent) => boolean,
    preserve?: (this: void, value: TEvent) => TEvent,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent> {

  const processor = deduplicateAfter_(isDuplicate, preserve);

  return input => shareAfter(processor(input));
}

let deduplicateAfter_$default:// eslint-disable-line @typescript-eslint/naming-convention
    | ((this: void, input: AfterEvent<any>) => AfterEvent<any>)
    | undefined;

/**
 * Creates an event processor that ensures the same event incoming from `{@link AfterEvent} keeper are not reported
 * twice, and does not share the outgoing events supply.
 *
 * The outgoing events supply is cut off once the incoming events supply do.
 *
 * @category Event Processing
 * @typeParam TEvent - An event type.
 * @param isDuplicate - A function that checks whether the next incoming event is a duplicate of a previously reported
 * one. Accepts a prior and next event tuples as parameters, and returns a truthy value if they are duplicates.
 * By default, treats event tuples as duplicates if they have the same number of elements, and each element is
 * strictly equals to corresponding one.
 * @param preserve - A function that constructs a preserved event tuple. Accepts an event tuple and returns one to
 * preserve and compare next time. By default, returns an event as is.
 *
 * @returns Deduplicating processor of events incoming from {@link @AfterEvent} keeper.
 */
export function deduplicateAfter_<TEvent extends any[]>(// eslint-disable-line @typescript-eslint/naming-convention
    isDuplicate?: (this: void, prior: TEvent, next: TEvent) => boolean,
    preserve?: (this: void, value: TEvent) => TEvent,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent> {
  return isDuplicate || preserve
      ? deduplicateAfter_$create(isDuplicate, preserve)
      : (deduplicateAfter_$default || (deduplicateAfter_$default = deduplicateAfter_$create())
  );
}

function deduplicateAfter_$create<TEvent extends any[]>(// eslint-disable-line @typescript-eslint/naming-convention
    isDuplicate: (this: void, prior: TEvent, next: TEvent) => boolean = deduplicateAfter$isDuplicate,
    preserve: (this: void, value: TEvent) => TEvent = asis,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent> {
  return input => {

    let prior: TEvent | null = null;

    return afterEventBy(
        receiver => {
          input({
            supply: receiver.supply,
            receive(ctx, ...next) {
              if (!prior || !isDuplicate(prior, next)) {
                prior = preserve(next);
                receiver.receive(ctx, ...next);
              }
            },
          });
        },
        undefined,
        _ => prior = null,
    );
  };
}

function deduplicateAfter$isDuplicate<TEvent extends any[]>(prior: TEvent, next: TEvent): boolean {
  return prior.length === next.length && prior.every((e, i) => e === next[i]);
}
