import { Supply } from '@proc7ts/primitives';
import { EventNotifier, EventReceiver, sendEventsTo } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function shareEvents<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): (receiver: EventReceiver.Generic<TEvent>) => void {

  const shared = new EventNotifier<TEvent>();
  let sharedSupply: Supply;
  let initialEvents: TEvent[] | undefined;

  return (receiver: EventReceiver.Generic<TEvent>): void => {
    if (!shared.size) {
      initialEvents = [];
      sharedSupply = new Supply(() => initialEvents = undefined);

      supplier({
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
