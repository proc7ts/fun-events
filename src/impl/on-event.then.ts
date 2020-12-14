import { Supply } from '@proc7ts/primitives';
import { EventReceiver } from '../base';
import { OnEvent } from '../on-event';
import { eventFirst } from './event-first';

/**
 * @internal
 */
export function OnEvent$then<TEvent extends any[], TResult1 = TEvent[0], TResult2 = never>(
    this: OnEvent<TEvent>,
    onEvent?: ((...value: TEvent) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onCutOff?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
): Promise<TResult1 | TResult2> {
  return new Promise((resolve, reject) => {
    eventFirst(this)({
      supply: onCutOff
          ? new Supply(reason => {
            try {
              resolve(onCutOff(reason));
            } catch (e) {
              reject(e);
            }
          })
          : new Supply(reject),
      receive: onEvent
          ? (_ctx, ...event): void => {
            try {
              resolve(onEvent(...event));
            } catch (e) {
              reject(e);
            }
          }
          : ((_ctx, event: TEvent[0]) => resolve(event)) as (
              _ctx: EventReceiver.Context<TEvent>,
              ...event: TEvent[]
          ) => void,
    });
  });
}
