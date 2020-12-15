import { EventReceiver } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function onceEvent<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): (receiver: EventReceiver.Generic<TEvent>) => void {
  return (receiver: EventReceiver.Generic<TEvent>): void => {
    supplier({
      supply: receiver.supply,
      receive: (context, ...event) => {
        receiver.receive(context, ...event);
        receiver.supply.off();
      },
    });
  };
}
