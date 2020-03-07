import { EventReceiver } from '../base';

export function neverReceive(reason?: any): (receiver: EventReceiver.Generic<any>) => void {
  return ({ supply }) => supply.off(reason);
}
