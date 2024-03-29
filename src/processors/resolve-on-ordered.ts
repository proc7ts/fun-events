import { Supply } from '@proc7ts/supply';
import { sendEventsTo } from '../base';
import { OnEvent, onEventBy } from '../on-event';
import { mapOn } from './map-on';
import { resolveOn } from './resolve-on';
import { supplyOn } from './supply-on';

/**
 * A processor that asynchronously resolves incoming events and sends them in the order they are received.
 *
 * Receives events or their promises from the given event sender, and sends them once they are resolved in the same
 * order as they have been received. Mat send events in batches, e.g. when events resolved out of order.
 *
 * The resulting events supply is cut off if some of incoming event promises rejected. In this case the rejection reason
 * is used as a reason to cut off. If incoming events supply is cut off, then the resulting event supply will be cut off
 * too, but only after all incoming events resolved and sent.
 *
 * @category Event Processing
 * @typeParam TEvent - Resolved event type.
 * @param from - A sender of events or promise-like instances resolved to ones.
 *
 * @returns New `OnEvent` sender of resolved events.
 */
export function resolveOnOrdered<TEvent>(
  from: OnEvent<[PromiseLike<TEvent> | TEvent]>,
): OnEvent<[TEvent, ...TEvent[]]> {
  return onEventBy(receiver => {
    const { supply } = receiver;
    const dispatch = sendEventsTo(receiver);

    const sourceSupply = new Supply();
    let numInProcess = 0;
    const source = from.do(
      supplyOn(supply, sourceSupply),
      mapOn(event => {
        ++numInProcess;

        return event;
      }),
    );
    let received: TEvent[] = [];
    let numSent = 1;
    let numReceived = 0;

    sourceSupply.whenOff(reason => {
      if (!numInProcess) {
        supply.off(reason);
      }
    });

    resolveOn(source)({
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
            supply.needs(sourceSupply);
          }
        }
      },
    });
  });
}
