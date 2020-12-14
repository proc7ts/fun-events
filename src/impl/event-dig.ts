import { neverSupply, Supply } from '@proc7ts/primitives';
import { EventReceiver } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function eventDig<
    TInEvent extends any[],
    TOutEvent extends any[],
    >(
    input: OnEvent<TInEvent>,
    extract: (this: void, ...event: TInEvent) => OnEvent<TOutEvent> | void | undefined,
): (receiver: EventReceiver.Generic<TOutEvent>) => void {
  return (receiver: EventReceiver.Generic<TOutEvent>) => {

    let nestedSupply = neverSupply();

    input({

      supply: receiver.supply,

      receive: (_context, ...event: TInEvent) => {

        const prevSupply = nestedSupply;
        const extracted = extract(...event);

        try {
          nestedSupply = extracted
              ? extracted({

                supply: new Supply().needs(receiver.supply),

                receive(context, ...event: TOutEvent) {
                  receiver.receive(context, ...event);
                },

              })
              : neverSupply();
        } finally {
          prevSupply.off();
        }
      },
    });
  };
}
