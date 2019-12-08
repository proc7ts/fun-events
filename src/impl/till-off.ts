import { EventReceiver } from '../event-receiver';
import { EventSupply } from '../event-supply';

/**
 * @internal
 */
export function tillOff<E extends any[]>(
    register: (receiver: EventReceiver.Generic<E>) => void,
    supply: EventSupply,
): (receiver: EventReceiver.Generic<E>) => void {
  return receiver => {
    receiver.supply.needs(supply);
    register(receiver);
  };
}
