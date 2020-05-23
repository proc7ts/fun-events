import { EventReceiver, eventSupply } from '../base';
import { OnEvent } from '../on-event';
import { once } from './once';

export function then<E extends any[], TResult1 = E[0], TResult2 = never>(
    onSource: OnEvent<E>,
    onEvent?: ((...value: E) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onCutOff?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
): Promise<TResult1 | TResult2> {
  return new Promise((resolve, reject) => {
    once(onSource)({
      supply: onCutOff
          ? eventSupply(reason => {
            try {
              resolve(onCutOff(reason));
            } catch (e) {
              reject(e);
            }
          })
          : eventSupply(reject),
      receive: onEvent
          ? (_ctx, ...event): void => {
            try {
              resolve(onEvent(...event));
            } catch (e) {
              reject(e);
            }
          }
          : ((_ctx, event: E[0]) => resolve(event)) as (
              _ctx: EventReceiver.Context<E>,
              ...event: E[]
          ) => void,
    });
  });
}
