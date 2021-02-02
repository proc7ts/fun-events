import { asis } from '@proc7ts/primitives';
import { AfterEvent, afterEventBy } from '../after-event';
import { shareAfter } from './share-after';

let deduplicateAfter$default:// eslint-disable-line @typescript-eslint/naming-convention
    | ((this: void, input: AfterEvent<any>) => AfterEvent<any>)
    | undefined;

/**
 * Creates an event processor that ensures the same event incoming from `{@link AfterEvent} keeper is not reported
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
    isDuplicate?: (this: void, prior: TEvent, next: TEvent) => boolean,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent>;

/**
 * Creates an event processor that similar events incoming from `{@link AfterEvent} keeper are not reported more than
 * once.
 *
 * The outgoing events supply is cut off once the incoming events supply do.
 *
 * @category Event Processing
 * @typeParam TEvent - An event type.
 * @typeParam TCue - An event cue type.
 * @param isSimilar - A function that checks whether the next incoming event is similar to previously reported one.
 * Accepts the prior and next event cues as parameters, and returns a truthy value if those are cues of similar events.
 * @param getCue - A function that accepts an event tuple and returns its cue.
 *
 * @returns Deduplicating processor of events incoming from {@link @AfterEvent} keeper.
 */
export function deduplicateAfter<TEvent extends any[], TCue>(
    isSimilar: (this: void, prior: TCue, next: TCue) => boolean,
    getCue: (this: void, value: TEvent) => TCue,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent>;

export function deduplicateAfter<TEvent extends any[], TCue>(
    isSimilar?: (this: void, prior: TCue, next: TCue) => boolean,
    getCue?: (this: void, value: TEvent) => TCue,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent> {
  return isSimilar || getCue
      ? deduplicateAfter$create(isSimilar, getCue)
      : (deduplicateAfter$default || (deduplicateAfter$default = deduplicateAfter$create()));
}

function deduplicateAfter$create<TEvent extends any[], TCue>(
    isSimilar?: (this: void, prior: TCue, next: TCue) => boolean,
    getCue?: (this: void, value: TEvent) => TCue,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent> {

  const processor = deduplicateAfter_(isSimilar!, getCue!);

  return input => shareAfter(processor(input));
}

let deduplicateAfter_$default:// eslint-disable-line @typescript-eslint/naming-convention
    | ((this: void, input: AfterEvent<any>) => AfterEvent<any>)
    | undefined;

/**
 * Creates an event processor that ensures the same event incoming from `{@link AfterEvent} keeper is not reported
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
 *
 * @returns Deduplicating processor of events incoming from {@link @AfterEvent} keeper.
 */
export function deduplicateAfter_<TEvent extends any[]>(// eslint-disable-line @typescript-eslint/naming-convention
    isDuplicate?: (this: void, prior: TEvent, next: TEvent) => boolean,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent>;

/**
 * Creates an event processor that similar events incoming from `{@link AfterEvent} keeper are not reported more than
 * once, and does not share the outgoing events supply.
 *
 * The outgoing events supply is cut off once the incoming events supply do.
 *
 * @category Event Processing
 * @typeParam TEvent - An event type.
 * @typeParam TCue - An event cue type.
 * @param isSimilar - A function that checks whether the next incoming event is similar to previously reported one.
 * Accepts the prior and next event cues as parameters, and returns a truthy value if those are cues of similar events.
 * @param getCue - A function that accepts an event tuple and returns its cue.
 *
 * @returns Deduplicating processor of events incoming from {@link @AfterEvent} keeper.
 */
export function deduplicateAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TCue>(
    isSimilar: (this: void, prior: TCue, next: TCue) => boolean,
    getCue: (this: void, value: TEvent) => TCue,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent>;

export function deduplicateAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TCue>(
    isSimilar?: (this: void, prior: TCue, next: TCue) => boolean,
    getCue?: (this: void, value: TEvent) => TCue,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent> {
  return isSimilar || getCue
      ? deduplicateAfter_$create(isSimilar, getCue)
      : (deduplicateAfter_$default || (deduplicateAfter_$default = deduplicateAfter_$create())
  );
}

const deduplicateAfter$noPrior = {/* magic value meaning there is no cue */};

function deduplicateAfter_$create<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TCue
    >(
    isSimilar = deduplicateAfter$isDuplicate as (this: void, prior: TCue, next: TCue) => boolean,
    getCue = asis as (this: void, value: TEvent) => TCue,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<TEvent> {
  return input => {

    let prior: TCue | typeof deduplicateAfter$noPrior = deduplicateAfter$noPrior;

    return afterEventBy(
        receiver => {
          input({
            supply: receiver.supply,
            receive(ctx, ...nextEvent) {

              const next = getCue(nextEvent);

              if (prior === deduplicateAfter$noPrior || !isSimilar(prior as TCue, next)) {
                prior = next;
                receiver.receive(ctx, ...nextEvent);
              }
            },
          });
        },
        undefined,
        _ => prior = deduplicateAfter$noPrior,
    );
  };
}

function deduplicateAfter$isDuplicate<TEvent extends any[]>(prior: TEvent, next: TEvent): boolean {
  return prior.length === next.length && prior.every((e, i) => e === next[i]);
}
