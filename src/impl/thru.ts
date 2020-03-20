import { isNextCall, NextCall__symbol, noop } from '@proc7ts/call-thru';
import { EventReceiver, EventSender, eventSupply, EventSupply, noEventSupply, OnEvent__symbol } from '../base';
import { OnEvent } from '../on-event';
import { OnEventCallChain } from '../passes';

/**
 * @internal
 */
export function thru<E extends any[]>(
    onSource: OnEvent<E>,
    passes: ((...args: any[]) => any)[],
): (receiver: EventReceiver.Generic<E>) => void {

  interface ChainEntry {
    readonly chain: OnEventCallChain;
    supply: EventSupply;
  }

  return (receiver: EventReceiver.Generic<any>) => {

    const chains: ChainEntry[] = [];

    onSource.to({
      supply: receiver.supply,
      receive(context, ...event) {

        const chain = (index: number, chainSupply: EventSupply): [OnEventCallChain, EventSupply] => {

          const lastPass = index >= passes.length;

          ++index;

          const existing = chains[index];

          if (existing) {

            const prevSupply = existing.supply;

            existing.supply = chainSupply;

            return [existing.chain, prevSupply];
          }

          const pass = index < passes.length ? passes[index] : noop;

          const entry: ChainEntry = {
            chain: {
              call<A extends any[]>(fn: (...args: A) => any, args: A): void {
                handleResult(fn(...args), args);
              },
              pass<A>(fn: (arg: A) => any, arg: A): void {
                handleResult(fn(arg), [arg]);
              },
              skip(): void {
                entry.supply.off();
              },
              onEvent<E extends any[]>(
                  pass: (this: void, ...event: E) => void,
                  sender: EventSender<E>,
              ): void {

                const supply = eventSupply().needs(entry.supply);

                sender[OnEvent__symbol]().to({
                  supply,
                  receive(_context, ...event): void {
                    handleResult(pass(...event), event, supply);
                  },
                });
              },
            },
            supply: chainSupply,
          };

          chains[index] = entry;

          return [entry.chain, noEventSupply()];

          function handleResult(
              callResult: any,
              args: any[],
              parentSupply = entry.supply,
          ): void {

            const [nextChain, prevSupply] = chain(index, eventSupply().needs(parentSupply));

            try {
              if (isNextCall(callResult)) {
                callResult[NextCall__symbol](nextChain, pass);
              } else if (lastPass) {
                receiver.receive(context, ...args);
              } else {
                nextChain.pass(pass, callResult);
              }
            } finally {
              prevSupply.off();
            }
          }
        };

        const [firstChain, prevSupply] = chain(0, eventSupply().needs(receiver.supply));

        try {
          firstChain.call(passes[0], event);
        } finally {
          prevSupply.off();
        }
      },
    });
  };
}
