/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { sendEventsTo } from '../base';
import { OnEvent, onEventBy } from '../on-event';

/**
 * Creates an {@link OnEvent} sender of asynchronously resolved incoming events in the order of their resolution.
 *
 * Receives events or their promises from the given event sender, and sends them once they are resolved. The original
 * order of events is not preserved. Instead each resolved event is sent along with its index in original order.
 *
 * The resulting events supply is cut off immediately once unresolved events supply is cut off, or some of incoming
 * event promises rejected. In the latter case the rejection reason is used as a reason to cut off.
 *
 * @category Core
 * @typeParam T - A type of values the promises resolve to.
 * @param from - A sender of events or promise-like instances resolved to ones.
 *
 * @returns New `OnEvent` sender of resolved events and their indices in original order starting from `1`.
 */
export function resolveEvents<T>(from: OnEvent<[PromiseLike<T> | T]>): OnEvent<[T, number]> {
  return onEventBy(receiver => {

    const { supply } = receiver;
    const dispatch = sendEventsTo(receiver);

    let lastIndex = 0;

    from({
      supply,
      receive(_ctx, promise) {

        const index = ++lastIndex;

        Promise.resolve()
            .then(() => promise)
            .then(
                event => dispatch(event, index),
                reason => supply.off(reason),
            );
      },
    });
  });
}
