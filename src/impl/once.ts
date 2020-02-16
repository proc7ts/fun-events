import { EventReceiver } from '../base';

/**
 * @internal
 */
export function once<E extends any[]>(
    register: (receiver: EventReceiver.Generic<E>) => void,
): (receiver: EventReceiver.Generic<E>) => void {
  return receiver => register({
    supply: receiver.supply,
    receive: (context, ...event) => {
      receiver.receive(context, ...event);
      receiver.supply.off();
    },
  });
}
