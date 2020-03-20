/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { EventSupply, eventSupplyOf, EventSupplyPeer } from './event-supply';

/**
 * @internal
 */
class NoSupply extends EventSupply {

  get isOff(): true {
    return true;
  }

  off(): this {
    return this;
  }

  whenOff(callback: (reason?: any) => void): this {
    callback();
    return this;
  }

  cuts(another: EventSupplyPeer): this {
    eventSupplyOf(another).off();
    return this;
  }

  needs(): this {
    return this;
  }

}

/**
 * @internal
 */
const noSupply = (/*#__PURE__*/ new NoSupply());

/**
 * Returns a no-event supply.
 *
 * @category Core
 *
 * @returns An event supply that is already cut off without any particular reason.
 */
export function noEventSupply(): EventSupply {
  return noSupply;
}
