/**
 * @packageDocumentation
 * @module fun-events
 */
import { NextCall, nextCall } from 'call-thru';
import { afterSupplied } from '../after-event';
import { EventKeeper } from '../event-keeper';
import { OnEventCallChain } from './on-event-call-chain';

/**
 * Builds a next chained call of {@link OnEventCallChain} that calls the next pass with every event supplied by
 * the given keeper.
 *
 * The event supply from the given keeper will be cut off each time the call is applied.
 *
 * This differs from [[nextOnEvent]] when passing supplier implementing both [[EventSender]] and [[EventKeeper]]
 * interfaces such as [[ValueTracker]]. [[nextOnEvent]] would prefer the former, while this one would prefer the latter.
 *
 * @category Core
 * @typeparam E  An event type. This is a tuple of argument types of the next pass.
 * @param keeper  A keeper of events to pass down the chain.
 *
 * @returns Next call passing events from the given `keeper`.
 */
export function nextAfterEvent<E extends any[]>(
    keeper: EventKeeper<E>,
): NextCall<OnEventCallChain, E> {
  return nextCall((chain, pass) => chain.onEvent(pass, afterSupplied(keeper)));
}
