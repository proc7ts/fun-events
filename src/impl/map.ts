import { EventReceiver, sendEventsTo } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function map<TEvent extends any[], TResult>(
    supplier: OnEvent<TEvent>,
    convert: (...event: TEvent) => TResult,
): (receiver: EventReceiver.Generic<[TResult]>) => void {
  return receiver => {

    const dispatch = sendEventsTo(receiver);

    supplier.to({
      supply: receiver.supply,
      receive: (_ctx, ...event) => {
        dispatch(convert(...event));
      },
    });
  };
}
