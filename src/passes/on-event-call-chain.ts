/**
 * @packageDocumentation
 * @module fun-events
 */
import { CallChain, NextCall, NextSkip } from 'call-thru';
import { EventSupplier } from '../event-supplier';

/**
 * @category Core
 */
export interface OnEventCallChain extends CallChain {

  /**
   * Calls a pass in this chain with each event received from the given supplier.
   *
   * @typeparam Args  Pass arguments tuple type.
   * @param pass  A pass to call.
   * @param supplier  A supplier of events to pass down the chain.
   */
  onEvent<E extends any[]>(
      pass: (this: void, ...event: E) => any,
      supplier: EventSupplier<E>,
  ): void;

}

export namespace OnEventCallChain {

  export type Args<Return> = Return extends NextSkip<any>
      ? never
      : (Return extends (NextCall<OnEventCallChain, infer A, any>)
          ? A
          : [Return]);

  export type Out<Return> = Return extends NextSkip<any>
      ? never
      : (Return extends NextCall<OnEventCallChain, infer E, any> ? E : [Return]);

}
