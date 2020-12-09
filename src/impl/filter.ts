import { EventReceiver, sendEventsTo } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function filter<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
    test: (...event: TEvent) => boolean,
): (receiver: EventReceiver.Generic<TEvent>) => void {
  return receiver => {

    const dispatch = sendEventsTo(receiver);

    supplier({
      supply: receiver.supply,
      receive: (_ctx, ...event: TEvent) => test(...event) && dispatch(...event),
    });
  };
}
