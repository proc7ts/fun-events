import { StateUpdater } from './state-events';
import { StateTracker } from './state-tracker';
import Mock = jest.Mock;
import { EventSource } from '../event-source';

describe('StateTracker', () => {

  let tracker: StateTracker;
  let consumerSpy: Mock<StateUpdater>;

  beforeEach(() => {
    tracker = new StateTracker();
    consumerSpy = jest.fn();
  });

  describe('[EventSource.on]', () => {
    it('refers `onUpdate`', () => {
      expect(tracker[EventSource.on]).toBe(tracker.onUpdate);
    });
  });
  it('notifies on state update', () => {

    const interest = tracker.onUpdate(consumerSpy);

    const path = ['some', 'path'];
    const newValue = 'new';
    const oldValue = 'old';

    tracker.update(path, newValue, oldValue);
    expect(consumerSpy).toHaveBeenCalledWith(path, newValue, oldValue);

    consumerSpy.mockClear();
    interest.off();

    tracker.update(path, newValue, oldValue);
    expect(consumerSpy).not.toHaveBeenCalled();
  });
  describe('part', () => {

    const partPath = ['path', 2, 'part'];
    let part: StateTracker;
    let partSpy: Mock<StateUpdater>;

    beforeEach(() => {
      part = tracker.track(partPath);
      partSpy = jest.fn();
    });

    describe('[EventSource.on]', () => {
      it('refers `onUpdate`', () => {
        expect(part[EventSource.on]).toBe(part.onUpdate);
      });
    });
    it('refers itself', () => {
      expect(part._tracker).toBe(part);
    });
    it('returns the tracker itself for empty path', () => {
      expect(tracker.track([])).toBe(tracker);
      expect(part.track([])).toBe(part);
    });
    it('notifies on partial state update', () => {
      tracker.onUpdate(consumerSpy);

      const interest = part.onUpdate(partSpy);

      const path = ['some', 'path'];
      const fullPath = [...partPath, ...path];
      const newValue = 'new';
      const oldValue = 'old';

      part.update(path, newValue, oldValue);
      expect(consumerSpy).toHaveBeenCalledWith(fullPath, newValue, oldValue);
      expect(partSpy).toHaveBeenCalledWith(path, newValue, oldValue);

      consumerSpy.mockClear();
      partSpy.mockClear();
      interest.off();

      part.update(path, newValue, oldValue);
      expect(consumerSpy).toHaveBeenCalledWith(fullPath, newValue, oldValue);
      expect(partSpy).not.toHaveBeenCalled();
    });
    it('is notified on partial state update', () => {
      tracker.onUpdate(consumerSpy);

      const interest = part.onUpdate(partSpy);

      const subPath = ['some'];
      const path = [...partPath, ...subPath];
      const newValue = 'new';
      const oldValue = 'old';

      tracker.update(path, newValue, oldValue);
      expect(consumerSpy).toHaveBeenCalledWith(path, newValue, oldValue);
      expect(partSpy).toHaveBeenCalledWith(subPath, newValue, oldValue);

      consumerSpy.mockClear();
      partSpy.mockClear();
      interest.off();

      tracker.update(path, newValue, oldValue);
      expect(consumerSpy).toHaveBeenCalledWith(path, newValue, oldValue);
      expect(partSpy).not.toHaveBeenCalled();
    });
    it('is not notified on other state update', () => {
      tracker.onUpdate(consumerSpy);
      part.onUpdate(partSpy);

      const path = [...partPath.slice(0, partPath.length - 1), 'other'];
      const newValue = 'new';
      const oldValue = 'old';

      tracker.update(path, newValue, oldValue);
      expect(consumerSpy).toHaveBeenCalledWith(path, newValue, oldValue);
      expect(partSpy).not.toHaveBeenCalled();
    });
    it('is notified on parent state update', () => {
      tracker.onUpdate(consumerSpy);
      part.onUpdate(partSpy);

      const parent = tracker.track(partPath[0]);
      const parentSpy = jest.fn();

      const parentInterest = parent.onUpdate(parentSpy);

      const subPath = ['some'];
      const fullPath = [...partPath, ...subPath];
      const parentPath = fullPath.slice(1);
      const newValue = 'new';
      const oldValue = 'old';

      parent.update(parentPath, newValue, oldValue);
      expect(consumerSpy).toHaveBeenCalledWith(fullPath, newValue, oldValue);
      expect(parentSpy).toHaveBeenCalledWith(parentPath, newValue, oldValue);
      expect(partSpy).toHaveBeenCalledWith(subPath, newValue, oldValue);

      consumerSpy.mockClear();
      parentSpy.mockClear();
      partSpy.mockClear();
      parentInterest.off();

      parent.update(parentPath, newValue, oldValue);
      expect(consumerSpy).toHaveBeenCalledWith(fullPath, newValue, oldValue);
      expect(parentSpy).not.toHaveBeenCalled();
      expect(partSpy).toHaveBeenCalledWith(subPath, newValue, oldValue);
    });
  });
});
