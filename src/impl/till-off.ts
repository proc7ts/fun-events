import { Supply, SupplyPeer } from '@proc7ts/primitives';
import { EventReceiver } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function tillOff<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
    required: SupplyPeer,
    dependentSupply?: Supply,
): (receiver: EventReceiver.Generic<TEvent>) => void {
  return (receiver: EventReceiver.Generic<TEvent>): void => {
    if (dependentSupply) {
      supplier.to({
        supply: new Supply().needs(required).cuts(dependentSupply),
        receive: (receiver.receive as (...args: any[]) => void).bind(receiver),
      });
    } else {
      receiver.supply.needs(required);
      supplier.to(receiver);
    }
  };
}
