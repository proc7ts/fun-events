import { AfterEvent, afterEventBy } from '../after-event';

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
 *
 * @returns Deduplicating processor of events incoming from {@link @AfterEvent} keeper.
 */
export function deduplicateAfter<TEvent extends any[]>(
    isDuplicate: (this: void, prior: TEvent, next: TEvent) => boolean = deduplicateAfter$isDuplicate,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent> {
  return input => {

    let prior: TEvent | null = null;

    return afterEventBy(
        receiver => {
          input({
            supply: receiver.supply,
            receive(ctx, ...next) {
              if (!prior || !isDuplicate(prior, next)) {
                prior = next;
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
