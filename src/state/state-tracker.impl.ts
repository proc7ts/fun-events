import { EventEmitter } from '../event-emitter';
import { EventInterest, EventProducer } from '../event-producer';
import { noop } from '../noop';
import { StatePath, StateUpdater } from './state-events';
import { StateTracker as StateTracker_ } from './state-tracker';

class PathEntry {

  readonly emitter = new EventEmitter<StateUpdater>();
  private readonly _nested = new Map<PropertyKey, PathEntry>();

  constructor(private readonly _drop: () => void) {
    this.emitter.on((path, newValue, oldValue) => {
      path = StatePath.of(path);

      const key = path[0];
      const nested = this._nested.get(key);

      if (nested) {
        nested.emitter.notify(path.slice(1), newValue, oldValue);
      }
    });
  }

  on(consumer: StateUpdater): EventInterest {

    const entry = this;
    const interest = this.emitter.on(consumer);

    return {
      off() {
        interest.off();
        entry._dropIfEmpty();
      },
    };
  }

  nest(key: PropertyKey): PathEntry {

    const found = this._nested.get(key);

    if (found) {
      return found;
    }

    const created = new PathEntry(() => this._remove(key));

    this._nested.set(key, created);

    return created;
  }

  private _remove(key: PropertyKey) {
    this._nested.delete(key);
    this._dropIfEmpty();
  }

  private _dropIfEmpty() {
    if (!this._nested.size && this.emitter.consumers <= 1) {
      this._drop();
    }
  }

}

class Trackers {

  private readonly _root = new PathEntry(noop);

  on(path: StatePath.Normalized, consumer: StateUpdater): EventInterest {
    return this._entry(path).on(consumer);
  }

  notify<V>(path: StatePath.Normalized, newValue: V, oldValue: V) {
    this._root.emitter.notify(path, newValue, oldValue);
  }

  private _entry(path: StatePath.Normalized): PathEntry {

    let entry = this._root;

    for (const key of path) {
      entry = entry.nest(key);
    }

    return entry;
  }

}

class SubStateTracker implements StateTracker_ {

  readonly update: StateUpdater = (<V>(path: StatePath, newValue: V, oldValue: V) => {
    this._trackers.notify([...this._path, ...StatePath.of(path)], newValue, oldValue);
  });

  readonly onUpdate = EventProducer.of<StateUpdater>(consumer => this._trackers.on(this._path, consumer));

  constructor(
      private readonly _trackers: Trackers = new Trackers(),
      private readonly _path: StatePath.Normalized = []) {
  }

  track(path: StatePath): SubStateTracker {
    path = StatePath.of(path);
    if (!path.length) {
      return this; // Path to itself.
    }
    return new SubStateTracker(this._trackers, [...this._path, ...path]);
  }

}

/**
 * @internal
 */
export class StateTracker extends SubStateTracker {
  constructor() {
    super();
  }
}
