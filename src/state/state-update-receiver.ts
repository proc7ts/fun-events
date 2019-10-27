/**
 * @module fun-events
 */
import { EventReceiver } from '../event-receiver';
import { StatePath } from './state-path';

/**
 * A state updates receiver.
 *
 * It is called whenever the value with at given `path` changes.
 *
 * @category State Tracking
 */
export type StateUpdateReceiver = StateUpdateReceiver.Function | StateUpdateReceiver.Object;

export namespace StateUpdateReceiver {

  /**
   * State update processing context.
   */
  export interface Context extends EventReceiver.Context<[StatePath, any, any]> {

    onRecurrent(receiver: Function): void;

  }

  /**
   * State updates receiver function signature.
   *
   * @typeparam V  A type of changed value.
   * @param path  A path to changed state part.
   * @param newValue  New value.
   * @param oldValue  Previous value.
   */
  export type Function =
      <V>(
          this: void,
          path: StatePath,
          newValue: V,
          oldValue: V,
      ) => void;

  /**
   * State updates receiver object.
   */
  export interface Object extends EventReceiver.Object<[StatePath, any, any]> {

    /**
     * Receives a state update.
     *
     * @typeparam V  A type of changed value.
     * @param context  State update processing context.
     * @param path  A path to changed state part.
     * @param newValue  New value.
     * @param oldValue  Previous value.
     */
    receive<V>(context: Context, path: StatePath, newValue: V, oldValue: V): void;

  }

}
