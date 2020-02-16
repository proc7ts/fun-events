import { EventReceiver, eventSupply, EventSupply, eventSupplyOf, EventSupplyPeer } from '../base';

/**
 * @internal
 */
export function tillOff<E extends any[]>(
    register: (receiver: EventReceiver.Generic<E>) => void,
    required: EventSupplyPeer,
    dependentSupply?: EventSupply,
): (receiver: EventReceiver.Generic<E>) => void {
  const requiredSupply = eventSupplyOf(required);
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
