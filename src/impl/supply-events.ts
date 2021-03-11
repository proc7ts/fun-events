import { Supply, SupplyPeer } from '@proc7ts/supply';
import { EventReceiver } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function supplyEvents<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
    required: SupplyPeer,
    dependentSupply?: Supply,
): (receiver: EventReceiver.Generic<TEvent>) => void {
  return (receiver: EventReceiver.Generic<TEvent>): void => {
    if (dependentSupply) {
      supplier({
        supply: new Supply().needs(required).cuts(dependentSupply),
        receive: receiver.receive,
      });
    } else {
      receiver.supply.needs(required);
      supplier(receiver);
    }
  };
}
