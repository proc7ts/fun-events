import { EventNotifier, EventReceiver, eventSupply, EventSupply, sendEventsTo } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function share<E extends any[]>(
    onSource: OnEvent<E>,
): (receiver: EventReceiver.Generic<E>) => void {

  const shared = new EventNotifier<E>();
  let sharedSupply: EventSupply;
  let initialEvents: E[] | undefined;

  return (receiver: EventReceiver.Generic<E>): void => {
    if (!shared.size) {
      initialEvents = [];
      sharedSupply = eventSupply(() => initialEvents = undefined);

      onSource.to({
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

      const dispatch = sendEventsTo(receiver);

      initialEvents.forEach(event => dispatch(...event));
    }
  };
}
