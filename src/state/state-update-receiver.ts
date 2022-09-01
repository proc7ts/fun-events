import { EventReceiver } from '../base';
import { StatePath } from './state-path';

/**
 * A state updates receiver.
 *
 * It is called whenever the value with at given `path` changes.
 *
 * @category State Tracking
 */
export type StateUpdateReceiver = StateUpdateReceiver.Function | StateUpdateReceiver.Object;

/**
 * @category State Tracking
 */
export namespace StateUpdateReceiver {
  /**
   * State update processing context.
   */
  export interface Context extends EventReceiver.Context<[StatePath.Normalized, any, any]> {
    onRecurrent(receiver: StateUpdateReceiver.Function): void;
  }

  /**
   * State updates receiver function signature.
   *
   * @typeParam T - A type of changed value.
   * @param path - Normalized path to changed state part.
   * @param newValue - New value.
   * @param oldValue - Previous value.
   */
  export type Function = <T>(
    this: void,
    path: StatePath.Normalized,
    newValue: T,
    oldValue: T,
  ) => void;

  /**
   * State updates receiver object.
   */
  export interface Object extends EventReceiver.Object<[StatePath.Normalized, any, any]> {
    /**
     * Receives a state update.
     *
     * @typeParam T - A type of changed value.
     * @param context - State update processing context.
     * @param path - Normalized path to changed state part.
     * @param newValue - New value.
     * @param oldValue - Previous value.
     */
    receive<T>(context: Context, path: StatePath.Normalized, newValue: T, oldValue: T): void;
  }
}
