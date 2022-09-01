import { EventReceiver } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function onceEvent<TEvent extends any[]>(
  supplier: OnEvent<TEvent>,
): (receiver: EventReceiver.Generic<TEvent>) => void {
  return ({ supply, receive }: EventReceiver.Generic<TEvent>): void => {
    supplier({
      supply,
      receive: (context, ...event) => {
        receive(context, ...event);
        supply.off();
      },
    });
  };
}
