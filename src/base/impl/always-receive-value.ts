import { EventReceiver } from '../event-receiver';
import { sendEventsTo } from '../send-events-to';

/**
 * @internal
 */
export function alwaysReceiveValue<T>(value: T): (receiver: EventReceiver.Generic<[T]>) => void {
  return receiver => {
    try {
      sendEventsTo(receiver)(value);
    } finally {
      receiver.supply.off();
    }
  };
}
