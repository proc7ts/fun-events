import { EventProducer } from '../event-producer';
import { StatePath, StateUpdater } from './state-events';
import { StateTracker as StateTrackerImpl } from './state-tracker.impl';

/**
 * State changes tracker.
 *
 * A state is a tree-like structure of sub-states (nodes) available under `StatePath`.
 *
 * When node modified an `update` function should be called. Then all update event consumers registered in `onUpdate`
 * event producer will receive a notification.
 */
export interface StateTracker {

  /**
   * Registers component state updates listener.
   *
   * This listener will be notified when `update()` is called.
   *
   * @param listener A listener to notify on state updates.
   *
   * @return An event interest instance.
   */
  readonly onUpdate: EventProducer<StateUpdater>;

  /**
   * Updates the component state.
   *
   * All listeners registered with `onUpdate()` will be notified on this update.
   *
   * This method is also called by the function available under `[StateUpdater.key]` key.
   * The latter is preferred way to call it, as the caller won't depend on `StateSupport` feature then.
   *
   * @param <V> A type of changed value.
   * @param key Changed value key.
   * @param newValue New value.
   * @param oldValue Previous value.
   */
  readonly update: StateUpdater;

  /**
   * Starts tracking of partial state under the given path.
   *
   * @param path A path to state part.
   *
   * @return New partial state tracker.
   */
  track(path: StatePath): StateTracker;

}

export interface StateTrackerConstructor extends Function {
  prototype: StateTracker;
  new(): StateTracker;
}

export const StateTracker: StateTrackerConstructor = StateTrackerImpl;
