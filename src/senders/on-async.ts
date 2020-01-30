/**
 * @packageDocumentation
 * @module fun-events
 */
import { EventNotifier } from '../event-notifier';
import { EventSender } from '../event-sender';
import { eventSupply } from '../event-supply';
import { OnEvent, onEventBy, onSupplied } from '../on-event';
import { onAnyAsync } from './on-any-async';

/**
 * Builds an [[OnEvent]] sender of asynchronously resolved events originated from the given sender of unresolved events.
 *
 * Receives events or their promises from the given event sender, and sends them once they are resolved in the same
 * order as they have been received. Possibly in batches, e.g. when events resolved out of order.
 *
 * The resulting events supply is cut if some of incoming event promises rejected. In this case the rejection reason
 * is used as a reason to cut off. If incoming events supply is cut off, then the resulting event supply will be cut off
 * too, but only after all incoming events resolved and sent.
 *
 * @category Core
 * @typeparam E  Resolved event type.
 * @param from  Unresolved events sender containing either events or their promises.
 *
 * @returns New `OnEvent` sender of resolved events.
 */
export function onAsync<E>(from: EventSender<[PromiseLike<E> | E]>): OnEvent<[E, ...E[]]> {
  return onEventBy(receiver => {

    const { supply } = receiver;
    const sender = new EventNotifier<[E, ...E[]]>();

    sender.on(receiver);

    const sourceSupply = eventSupply();
    let numInProcess = 0;
    const source = onSupplied(from)
        .tillOff(supply, sourceSupply)
        .thru_(event => {
          ++numInProcess;
          return event;
        });
    let received: E[] = [];
    let numSent = 1;
    let numReceived = 0;

    sourceSupply.whenOff(reason => {
      if (!numInProcess) {
        receiver.supply.off(reason);
      }
    });

    onAnyAsync(source)({
      supply,
      receive(_ctx, event, index) {

        const i = index - numSent;

        received[i] = event;
        ++numReceived;
        if (numReceived > i) {

          let toSend: E[];

          if (numReceived === received.length) {
            // Can send all received events
            toSend = received;
            received = [];
          } else {
            // Can send events up to `i`
            toSend = received.splice(0, i + 1);
          }
          numSent += toSend.length;
          numReceived -= toSend.length;
          numInProcess -= toSend.length;

          sender.send(...(toSend as [E, ...E[]]));
          if (!numInProcess && sourceSupply.isOff) {
            receiver.supply.needs(sourceSupply);
          }
        }
      },
    });
  });
}
