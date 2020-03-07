import { EventReceiver } from '../index';

/**
 * @internal
 */
export function neverReceiveBecause(reason?: any): (receiver: EventReceiver.Generic<any>) => void {
  return ({ supply }) => supply.off(reason);
}

/**
 * @internal
 */
export function neverReceive({ supply }: EventReceiver.Generic<any>): void {
  supply.off();
}
