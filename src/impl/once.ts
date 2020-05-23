import { EventReceiver } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function once<E extends any[]>(
    onSource: OnEvent<E>,
): (receiver: EventReceiver.Generic<E>) => void {
  return (receiver: EventReceiver.Generic<E>): void => {
    onSource.to({
      supply: receiver.supply,
      receive: (context, ...event) => {
        receiver.receive(context, ...event);
        receiver.supply.off();
      },
    });
  };
}
