import { EventNotifier } from '../event-notifier';
import { EventReceiver } from '../event-receiver';
import { EventSupply, noEventSupply } from '../event-supply';

/**
 * @internal
 */
export function share<E extends any[]>(
    register: (receiver: EventReceiver<E>) => EventSupply,
): (receiver: EventReceiver.Generic<E>) => void {

  const shared = new EventNotifier<E>();
  let sharedSupply = noEventSupply();
  let initialEvents: E[] | undefined = [];
  const removeReceiver = (reason?: any) => {
    if (!shared.size) {
      sharedSupply.off(reason);
      initialEvents = [];
    }
  };

  return receiver => {
    if (!shared.size) {
      sharedSupply = register((...event) => {
        if (initialEvents) {
          if (shared.size) {
            // More events received
            // Stop sending initial ones
            initialEvents = undefined;
          } else {
            // Record events received during first receiver registration
            // to send them to all receivers until more event received
            initialEvents.push(event);
          }
        }
        shared.send(...event);
      });
    }

    shared.on(receiver).whenOff(removeReceiver).needs(sharedSupply);

    if (initialEvents) {
      // Send initial events to just registered receiver

      const dispatcher = new EventNotifier<E>();

      dispatcher.on(receiver);
      initialEvents.forEach(event => dispatcher.send(...event));
    }
  };
}
