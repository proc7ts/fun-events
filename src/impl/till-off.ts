import { EventReceiver } from '../event-receiver';
import { eventSupply, EventSupply } from '../event-supply';

/**
 * @internal
 */
export function tillOff<E extends any[]>(
    register: (receiver: EventReceiver.Generic<E>) => void,
    requiredSupply: EventSupply,
    dependentSupply?: EventSupply,
): (receiver: EventReceiver.Generic<E>) => void {
  return receiver => {
    if (dependentSupply) {

      const supply = eventSupply().needs(requiredSupply);

      dependentSupply.needs(supply);

      register({
        supply,
        receive: (receiver.receive as Function).bind(receiver),
      });
    } else {
      receiver.supply.needs(requiredSupply);
      register(receiver);
    }
  };
}
