import { CallChain, NextCall, NextSkip } from '@proc7ts/call-thru';
import { EventSender } from '../base';

export interface OnEventCallChain extends CallChain {

  /**
   * Calls a pass in this chain with each event received from the given sender.
   *
   * @typeParam TEvent - An event type. This is a tuple of argument types of the next pass.
   * @param pass - A pass to call.
   * @param sender - A sender of events to pass down the chain.
   */
  onEvent<TEvent extends any[]>(
      pass: (this: void, ...event: TEvent) => any,
      sender: EventSender<TEvent>,
  ): void;

}

export namespace OnEventCallChain {

  export type Args<TReturn> = TReturn extends NextSkip<any>
      ? never
      : (TReturn extends (NextCall<OnEventCallChain, infer A, any>)
          ? A
          : [TReturn]);

  export type Out<TReturn> = TReturn extends NextSkip<any>
      ? never
      : (TReturn extends NextCall<OnEventCallChain, infer E, any> ? E : [TReturn]);

}
