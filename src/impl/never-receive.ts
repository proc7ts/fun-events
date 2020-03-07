import { EventReceiver } from '../base';

export function neverReceiveBecause(reason?: any): (receiver: EventReceiver.Generic<any>) => void {
  return ({ supply }) => supply.off(reason);
}

export function neverReceive({ supply }: EventReceiver.Generic<any>): void {
  supply.off();
}
