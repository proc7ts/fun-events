import { NextCall, nextCall } from '@proc7ts/call-thru';
import { EventKeeper } from '../base';
import { afterSupplied } from '../keepers';
import { OnEventCallChain } from './on-event-call-chain';

/**
 * Builds a next chained call of {@link OnEventCallChain} that calls the next pass with every event supplied by
 * the given keeper.
 *
 * The event supply from the given keeper will be cut off each time the call is applied.
 *
 * This differs from {@link nextOnEvent} when passing supplier implementing both {@link EventSender}
 * and {@link EventKeeper} interfaces such as {@link ValueTracker}. {@link nextOnEvent} would prefer the former,
 * while this one would prefer the latter.
 *
 * @typeParam TEvent - An event type. This is a tuple of argument types of the next pass.
 * @param keeper - A keeper of events to pass down the chain.
 *
 * @returns Next call passing events from the given `keeper`.
 */
export function nextAfterEvent<TEvent extends any[]>(
    keeper: EventKeeper<TEvent>,
): NextCall<OnEventCallChain, TEvent> {
  return nextCall((chain, pass) => chain.onEvent(pass, afterSupplied(keeper)));
}
