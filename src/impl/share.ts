import { EventNotifier } from '../event-notifier';
import { EventReceiver } from '../event-receiver';
import { eventSupply, EventSupply } from '../event-supply';

/**
 * @internal
 */
export function share<E extends any[]>(
    register: (receiver: EventReceiver.Generic<E>) => EventSupply,
): (receiver: EventReceiver.Generic<E>) => void {

  const shared = new EventNotifier<E>();
  let sharedSupply: EventSupply;
  let initialEvents: E[] | undefined;

  return receiver => {
    if (!shared.size) {
      initialEvents = [];
      sharedSupply = eventSupply(() => initialEvents = undefined);

      register({
        supply: sharedSupply,
        receive(_ctx, ...event) {
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
        },
      });
    }

    receiver.supply.needs(sharedSupply);
    shared.on(receiver).whenOff((reason?: any) => {
      if (!shared.size) {
        sharedSupply.off(reason);
      }
    });

    if (initialEvents) {
      // Send initial events to just registered receiver

      const dispatcher = new EventNotifier<E>();

      dispatcher.on(receiver);
      initialEvents.forEach(event => dispatcher.send(...event));
    }
  };
}
