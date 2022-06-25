import { EventReceiver } from '../event-receiver';

/**
 * @internal
 */
export function neverReceiveBecause(reason?: unknown): (receiver: EventReceiver.Generic<any>) => void {
  return ({ supply }) => supply.off(reason);
}

/**
 * @internal
 */
export function neverReceive({ supply }: EventReceiver.Generic<any>): void {
  supply.off();
}
