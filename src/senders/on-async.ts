/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { Supply } from '@proc7ts/primitives';
import { mapEvents, passEventsTillOff } from '../actions';
import { EventSender, sendEventsTo } from '../base';
import { OnEvent, onEventBy } from '../on-event';
import { onAnyAsync } from './on-any-async';
import { onSupplied } from './on-supplied';

/**
 * Builds an {@link OnEvent} sender of asynchronously resolved events originated from the given sender of unresolved
 * events.
 *
 * Receives events or their promises from the given event sender, and sends them once they are resolved in the same
 * order as they have been received. Possibly in batches, e.g. when events resolved out of order.
 *
 * The resulting events supply is cut if some of incoming event promises rejected. In this case the rejection reason
 * is used as a reason to cut off. If incoming events supply is cut off, then the resulting event supply will be cut off
 * too, but only after all incoming events resolved and sent.
 *
 * @category Core
 * @typeParam TEvent - Resolved event type.
 * @param from - Unresolved events sender containing either events or their promises.
 *
 * @returns New `OnEvent` sender of resolved events.
 */
export function onAsync<TEvent>(from: EventSender<[PromiseLike<TEvent> | TEvent]>): OnEvent<[TEvent, ...TEvent[]]> {
  return onEventBy(receiver => {

    const { supply } = receiver;
    const dispatch = sendEventsTo(receiver);

    const sourceSupply = new Supply();
    let numInProcess = 0;
    const source = onSupplied(from)
        .do(passEventsTillOff, supply, sourceSupply)
        .do(mapEvents(event => {
          ++numInProcess;
          return event;
        }));
    let received: TEvent[] = [];
    let numSent = 1;
    let numReceived = 0;

    sourceSupply.whenOff(reason => {
      if (!numInProcess) {
        supply.off(reason);
      }
    });

    onAnyAsync(source).to({
      supply,
      receive(_ctx, event, index) {

        const i = index - numSent;

        received[i] = event;
        ++numReceived;
        if (numReceived > i) {

          let toSend: TEvent[];

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

          dispatch(...(toSend as [TEvent, ...TEvent[]]));
          if (!numInProcess && sourceSupply.isOff) {
            receiver.supply.needs(sourceSupply);
          }
        }
      },
    });
  });
}
