import { EventReceiver, eventSupply } from '../base';
import { once } from './once';

export function then<E extends any[], TResult1 = E, TResult2 = never>(
    register: (receiver: EventReceiver.Generic<E>) => void,
    onEvent?: ((value: E) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onCutOff?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
): Promise<TResult1 | TResult2> {
  return new Promise((resolve, reject) => {
    once(register)({
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
          ? (_ctx, ...event) => {
            try {
              resolve(onEvent(event));
            } catch (e) {
              reject(e);
            }
          }
          : (_ctx, ...event) => resolve(event as unknown as TResult1),
    });
  });
}
