import { EventReceiver, sendEventsTo } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function translateEvents<TInEvent extends any[], TOutEvent extends any[]>(
    supplier: OnEvent<TInEvent>,
    translate: (this: void, send: (...event: TOutEvent) => void, ...event: TInEvent) => void,
): (receiver: EventReceiver.Generic<TOutEvent>) => void {
  return receiver => {

    const dispatch = sendEventsTo(receiver);

    supplier({
      supply: receiver.supply,
      receive: (_ctx, ...event: TInEvent) => {
        translate(dispatch, ...event);
      },
    });
  };
}
