/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop } from '@proc7ts/primitives';

/**
 * A key of [[EventSupplyPeer]] property containing [[EventSupply]] instance.
 *
 * @category Core
 */
export const EventSupply__symbol = (/*#__PURE__*/ Symbol('events-supply'));

/**
 * A supply of events from {@link EventSupplier event supplier} to {@link EventReceiver event receiver}.
 *
 * When no longer needed the supply may be {@link off cut off}.
 *
 * May be constructed using [[eventSupply]] function.
 *
 * @category Core
 */
export class EventSupply implements EventSupplyPeer {

  /**
   * @internal
   */
  private _off: (reason?: any) => void;

  /**
   * @internal
   */
  private _whenOff: (callback: (reason?: any) => void) => void;

  constructor(off: (this: void, reason?: any) => void = noop) {
    this._off = reason => {
      this._whenOff = callback => callback(reason);
      this._off = noop;
      off(reason);
    };
    this._whenOff = callback => {

      const prev = this._off;

      this._off = reason => {
        prev(reason);
        callback(reason);
      };
    };
  }

  /**
   * Whether this supply is {@link off cut off} already.
   *
   * `true` means the events will no longer be supplied.
   */
  get isOff(): boolean {
    return this._off === noop;
  }

  /**
   * `this` event supply.
   */
  get [EventSupply__symbol](): this {
    return this;
  }

  /**
   * Cuts off the supply of events.
   *
   * After this method call the receiver will no longer receive events.
   *
   * Calling this method for the second time has no effect.
   *
   * @param reason  An optional reason why supply is cut off. It will be reported to [[whenOff]] callbacks.
   * By convenience, an absent reason means the supply is done successfully.
   *
   * @returns A cut off event supply instance.
   */
  off(reason?: any): EventSupply {
    this._off(reason);
    return this;
  }

  /**
   * Registers a callback function that will be called as soon as this supply is {@link off cut off}. This callback
   * will be called immediately if [[isOff]] is `true`.
   *
   * @param callback  A callback function accepting optional cut off reason as its only parameter.
   * By convenience an `undefined` reason means the supply is done successfully.
   *
   * @returns `this` instance.
   */
  whenOff(callback: (this: void, reason?: any) => void): this {
    this._whenOff(callback);
    return this;
  }

  /**
   * Builds a promise that will be resolved once this supply is {@link off done}.
   *
   * @returns A promise that will be successfully resolved once this supply is cut off without reason, or rejected
   * once this supply is cut off with any reason except `undefined`.
   */
  whenDone(): Promise<void> {
    return new Promise(
        (resolve, reject) => this.whenOff(
            reason => reason === undefined ? resolve() : reject(reason),
        ),
    );
  }

  /**
   * Makes another event supply depend on this one.
   *
   * Once this supply is {@link off cut off}, `another` one is cut off with the same reason.
   *
   * Calling this method has the same effect as calling {@link needs eventSupplyOf(another).need(this)}.
   *
   * @param another  A peer of event supply to make depend on this one.
   *
   * @returns `this` instance.
   */
  cuts(another: EventSupplyPeer): this {
    eventSupplyOf(another).needs(this);
    return this;
  }

  /**
   * Declares this event supply depends on another one.
   *
   * Once `another` supply is {@link off cut off}, this one is will be cut off with the same reason.
   *
   * @param another  A peer of event supply this one depends on.
   *
   * @returns `this` instance.
   */
  needs(another: EventSupplyPeer): this {
    eventSupplyOf(another).whenOff(reason => this._off(reason));
    return this;
  }

}

/**
 * A peer of event supply.
 *
 * Contains an [[EventSupply]] that can be extracted by [[eventSupplyOf]] function.
 *
 * To be implemented by objects that controls event supply. An [[EventSupply]] is a peer of itself.
 *
 * @category Core
 */
export interface EventSupplyPeer {

  /**
   * An event supply of this peer.
   */
  readonly [EventSupply__symbol]: EventSupply;

}

/**
 * Extracts an event supply from its peer.
 *
 * @category Core
 * @param peer  A peer of event supply.
 *
 * @returns Extracted event supply contained in [[EventSupply__symbol]] property.
 */
export function eventSupplyOf(peer: EventSupplyPeer): EventSupply {
  return peer[EventSupply__symbol];
}

/**
 * Constructs new {@link EventSupply event supply}.
 *
 * @category Core
 * @param off  A function to call when supply will supply is {@link EventSupply.off cut off}. Accepts optional
 * cut off reason as its only parameter. No-op by default.
 */
export function eventSupply(off?: (this: void, reason?: any) => void): EventSupply {
  return new EventSupply(off);
}
