import { isNextCall, NextCall__symbol, noop } from 'call-thru';
import { EventReceiver } from '../event-receiver';
import { EventSupplier } from '../event-supplier';
import { eventSupply, EventSupply, noEventSupply } from '../event-supply';
import { OnEvent } from '../on-event';
import { OnEventCallChain } from '../passes';

export function thru<E extends any[]>(
    register: (receiver: EventReceiver.Generic<any[]>) => void,
    onEvent: <F extends any[]>(register: (receiver: EventReceiver.Generic<F>) => void) => OnEvent<F>,
    toSupplier: <F extends any[]>(supplier: EventSupplier<F>) => OnEvent<F>,
    passes: ((...args: any[]) => any)[],
): OnEvent<E> {

  interface ChainEntry {
    readonly chain: OnEventCallChain;
    supply: EventSupply;
  }

  return onEvent<any>(receiver => {

    const chains: ChainEntry[] = [];

    register({
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
                  fn: (this: void, ...event: E) => void,
                  supplier: EventSupplier<E>,
              ): void {

                const supply = eventSupply().needs(entry.supply);

                toSupplier(supplier)({
                  supply,
                  receive(_context, ...event): void {
                    handleResult(fn(...event), event, supply);
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
              newSupply = eventSupply().needs(entry.supply),
          ): void {

            const [nextChain, prevSupply] = chain(index, newSupply);

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
  });
}
