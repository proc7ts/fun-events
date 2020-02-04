/**
 * @packageDocumentation
 * @module fun-events
 */
import { nextCall, NextCall } from 'call-thru';
import { EventSupplier } from '../event-supplier';
import { OnEventCallChain } from './on-event-call-chain';

/**
 * Builds a next chained call of {@link OnEventCallChain} that calls next passes with every event supplied by the given
 * supplier.
 *
 * The events supply from the given supplier will be cut off each time this method is called.
 *
 * @category Core
 * @param supplier
 */
export function nextOnEvent<E extends any[]>(
    supplier: EventSupplier<E>,
): NextCall<OnEventCallChain, E> {
  return nextCall((chain, pass) => chain.onEvent(pass, supplier));
}
