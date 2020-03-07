/**
 * @packageDocumentation
 * @module fun-events
 */
import { NextCall, nextCall } from 'call-thru';
import { EventSupplier } from '../base';
import { onSupplied } from '../on-event';
import { OnEventCallChain } from './on-event-call-chain';

/**
 * Builds a next chained call of {@link OnEventCallChain} that calls the next pass with every event supplied by
 * the given supplier.
 *
 * The event supply from the given supplier will be cut off each time the call is applied.
 *
 * @category Core
 * @typeparam E  An event type. This is a tuple of argument types of the next pass.
 * @param supplier  A supplier of events to pass down the chain.
 *
 * @returns Next call passing events from the given `supplier`.
 */
export function nextOnEvent<E extends any[]>(
    supplier: EventSupplier<E>,
): NextCall<OnEventCallChain, E> {
  return nextCall((chain, pass) => chain.onEvent(pass, onSupplied(supplier)));
}
