import { neverSupply, Supply } from '@proc7ts/primitives';
import { EventReceiver } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function digEvents<
    TInEvent extends any[],
    TOutEvent extends any[],
    >(
    input: OnEvent<TInEvent>,
    extract: (this: void, ...event: TInEvent) => OnEvent<TOutEvent> | void | undefined,
): (receiver: EventReceiver.Generic<TOutEvent>) => void {
  return ({ supply, receive }: EventReceiver.Generic<TOutEvent>) => {

    let nestedSupply = neverSupply();

    input({

      supply,

      receive: (_context, ...event: TInEvent) => {

        const prevSupply = nestedSupply;
        const extracted = extract(...event);

        nestedSupply = extracted
            ? extracted({

              supply: new Supply(reason => {
                if (reason !== digEvents) {
                  supply.off(reason);
                }
              }).needs(supply),

              receive,

            })
            : neverSupply();
        prevSupply.off(digEvents);
      },
    });
  };
}
