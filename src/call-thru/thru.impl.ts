import { isNextCall, NextCall__symbol } from '@proc7ts/call-thru';
import { noop } from '@proc7ts/primitives';
import { neverSupply, Supply } from '@proc7ts/supply';
import { EventReceiver, EventSender, OnEvent__symbol } from '../base';
import { OnEvent } from '../on-event';
import { OnEventCallChain } from './index';

/**
 * @internal
 */
export function thru<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
    passes: ((...args: any[]) => any)[],
): (receiver: EventReceiver.Generic<TEvent>) => void {

  interface ChainEntry {
    readonly chain: OnEventCallChain;
    supply: Supply;
  }

  return (receiver: EventReceiver.Generic<any>): void => {

    const chains: ChainEntry[] = [];

    supplier({
      supply: receiver.supply,
      receive(context, ...event) {

        const chain = (index: number, chainSupply: Supply): [OnEventCallChain, Supply] => {

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
              call<TArgs extends any[]>(fn: (...args: TArgs) => any, args: TArgs): void {
                handleResult(fn(...args), args);
              },
              pass<TArgs>(fn: (arg: TArgs) => any, arg: TArgs): void {
                handleResult(fn(arg), [arg]);
              },
              skip(): void {
                entry.supply.off();
              },
              onEvent<TEvent extends any[]>(
                  pass: (this: void, ...event: TEvent) => void,
                  sender: EventSender<TEvent>,
              ): void {

                const supply = new Supply().needs(entry.supply);

                sender[OnEvent__symbol]()({
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

          return [entry.chain, neverSupply()];

          function handleResult(
              callResult: any,
              args: any[],
              parentSupply = entry.supply,
          ): void {

            const [nextChain, prevSupply] = chain(index, new Supply(noop).needs(parentSupply));

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

        const [firstChain, prevSupply] = chain(0, new Supply(noop).needs(receiver.supply));

        try {
          firstChain.call(passes[0], event);
        } finally {
          prevSupply.off();
        }
      },
    });
  };
}
