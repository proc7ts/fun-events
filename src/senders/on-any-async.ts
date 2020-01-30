/**
 * @packageDocumentation
 * @module fun-events
 */
import { EventNotifier } from '../event-notifier';
import { EventSender, OnEvent__symbol } from '../event-sender';
import { OnEvent, onEventBy } from '../on-event';

/**
 * Builds an [[OnEvent]] sender of any of asynchronously resolved events originated from the given sender of
 * unresolved events.
 *
 * Receives events or their promises from the given event sender, and sends them once they are resolved. The original
 * order of events is not preserved. Instead each resolved event is sent along with its index in original order.
 *
 * The resulting events supply is cut off immediately once unresolved events supply is cut off, or some of incoming
 * event promises rejected. In the latter case the rejection reason is used as a reason to cut off.
 *
 * @category Core
 * @typeparam E  Resolved event type.
 * @param from  Unresolved events sender containing either events or their promises.
 *
 * @returns New `OnEvent` sender of resolved events and their indices in original order starting from `1`.
 */
export function onAnyAsync<E>(from: EventSender<[PromiseLike<E> | E]>): OnEvent<[E, number]> {
  return onEventBy(receiver => {

    const { supply } = receiver;
    const sender = new EventNotifier<[E, number]>();

    sender.on(receiver);

    let lastIndex = 0;

    from[OnEvent__symbol]({
      supply,
      receive(_ctx, promise) {

        const index = ++lastIndex;

        Promise.resolve()
            .then(() => promise)
            .then(
                event => sender.send(event, index),
                reason => supply.off(reason),
            );
      },
    });
  });
}
