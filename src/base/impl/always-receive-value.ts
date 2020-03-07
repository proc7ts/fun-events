import { EventNotifier } from '../event-notifier';
import { EventReceiver } from '../event-receiver';

/**
 * @internal
 */
export function alwaysReceiveValue<T>(value: T): (receiver: EventReceiver.Generic<[T]>) => void {
  return receive => {
    try {

      const dispatcher = new EventNotifier<[T]>();

      dispatcher.on(receive);
      dispatcher.send(value);
    } finally {
      receive.supply.off();
    }
  };
}
