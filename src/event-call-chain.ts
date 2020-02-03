/**
 * @packageDocumentation
 * @module fun-events
 */
import { CallChain, NextCall, NextSkip } from 'call-thru';
import { EventSender } from './event-sender';

/**
 * @category Core
 */
export interface EventCallChain extends CallChain {

  onEvent<E extends any[], S extends EventSender<E>>(
      pass: (this: void, ...event: E) => void,
      supplier: S,
  ): void;

}

export namespace EventCallChain {

  export type Args<Return> = Return extends NextSkip<any>
      ? never
      : (Return extends (NextCall<EventCallChain, infer A, any>)
          ? A
          : [Return]);

  export type Out<Return> = Return extends NextSkip<any>
      ? never
      : (Return extends NextCall<EventCallChain, infer E, any>
          ? E
          : [Return]);

}
