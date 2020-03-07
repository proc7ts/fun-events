import { noop } from 'call-thru';
import { OnEvent__symbol } from '../base';
import { onSupplied } from '../senders';
import { StateTracker } from './state-tracker';
import { StateUpdateReceiver } from './state-update-receiver';
import Mock = jest.Mock;

describe('StateTracker', () => {

  let tracker: StateTracker;
  let mockReceiver: Mock<StateUpdateReceiver>;

  beforeEach(() => {
    tracker = new StateTracker();
    mockReceiver = jest.fn();
  });

  describe('[onEventKey]', () => {
    it('refers `onUpdate`', () => {
      expect(tracker[OnEvent__symbol]).toBe(tracker.onUpdate);
    });
  });
  it('notifies on state update', () => {

    const supply = tracker.onUpdate(mockReceiver);

    const path = ['some', 'path'];
    const newValue = 'new';
    const oldValue = 'old';

    tracker.update(path, newValue, oldValue);
    expect(mockReceiver).toHaveBeenCalledWith(path, newValue, oldValue);

    mockReceiver.mockClear();
    supply.off();

    tracker.update(path, newValue, oldValue);
    expect(mockReceiver).not.toHaveBeenCalled();
  });

  describe('done', () => {
    it('cuts off update supplies', () => {

      const mockOff = jest.fn();
      const reason = 'some reason';

      tracker.onUpdate(mockReceiver).whenOff(mockOff);

      tracker.done(reason);
      expect(mockOff).toHaveBeenCalledWith(reason);
    });
    it('does not cut off the supplies already cut off', () => {

      const mockOff = jest.fn();
      const reason1 = 'first reason';
      const reason2 = 'second reason';

      tracker.onUpdate(mockReceiver).whenOff(mockOff).off(reason1);

      tracker.done(reason2);
      expect(mockOff).toHaveBeenCalledWith(reason1);
      expect(mockOff).not.toHaveBeenCalledWith(reason2);
    });
    it('stops nested state tracking', () => {

      const nested = tracker.track('some');
      const mockOff = jest.fn();
      const reason = 'some reason';

      nested.onUpdate(noop).whenOff(mockOff);
      tracker.done(reason);
      expect(mockOff).toHaveBeenCalledWith(reason);
    });
  });

  describe('part', () => {

    const partPath = ['path', 2, 'part'];
    let part: StateTracker;
    let mockPartReceiver: Mock<StateUpdateReceiver>;

    beforeEach(() => {
      part = tracker.track(partPath);
      mockPartReceiver = jest.fn();
    });

    describe('[OnEvent__symbol]', () => {
      it('refers `onUpdate`', () => {
        expect(onSupplied(part)).toBe(part.onUpdate);
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
      tracker.onUpdate(mockReceiver);

      const supply = part.onUpdate(mockPartReceiver);

      const path = ['some', 'path'];
      const fullPath = [...partPath, ...path];
      const newValue = 'new';
      const oldValue = 'old';

      part.update(path, newValue, oldValue);
      expect(mockReceiver).toHaveBeenCalledWith(fullPath, newValue, oldValue);
      expect(mockPartReceiver).toHaveBeenCalledWith(path, newValue, oldValue);

      mockReceiver.mockClear();
      mockPartReceiver.mockClear();
      supply.off();

      part.update(path, newValue, oldValue);
      expect(mockReceiver).toHaveBeenCalledWith(fullPath, newValue, oldValue);
      expect(mockPartReceiver).not.toHaveBeenCalled();
    });
    it('is notified on partial state update', () => {
      tracker.onUpdate(mockReceiver);

      const supply = part.onUpdate(mockPartReceiver);

      const subPath = ['some'];
      const path = [...partPath, ...subPath];
      const newValue = 'new';
      const oldValue = 'old';

      tracker.update(path, newValue, oldValue);
      expect(mockReceiver).toHaveBeenCalledWith(path, newValue, oldValue);
      expect(mockPartReceiver).toHaveBeenCalledWith(subPath, newValue, oldValue);

      mockReceiver.mockClear();
      mockPartReceiver.mockClear();
      supply.off();

      tracker.update(path, newValue, oldValue);
      expect(mockReceiver).toHaveBeenCalledWith(path, newValue, oldValue);
      expect(mockPartReceiver).not.toHaveBeenCalled();
    });
    it('is not notified on other state update', () => {
      tracker.onUpdate(mockReceiver);
      part.onUpdate(mockPartReceiver);

      const path = [...partPath.slice(0, partPath.length - 1), 'other'];
      const newValue = 'new';
      const oldValue = 'old';

      tracker.update(path, newValue, oldValue);
      expect(mockReceiver).toHaveBeenCalledWith(path, newValue, oldValue);
      expect(mockPartReceiver).not.toHaveBeenCalled();
    });
    it('is notified on parent state update', () => {
      tracker.onUpdate(mockReceiver);
      part.onUpdate(mockPartReceiver);

      const parent = tracker.track(partPath[0]);
      const parentSpy = jest.fn();

      const parentSupply = parent.onUpdate(parentSpy);

      const subPath = ['some'];
      const fullPath = [...partPath, ...subPath];
      const parentPath = fullPath.slice(1);
      const newValue = 'new';
      const oldValue = 'old';

      parent.update(parentPath, newValue, oldValue);
      expect(mockReceiver).toHaveBeenCalledWith(fullPath, newValue, oldValue);
      expect(parentSpy).toHaveBeenCalledWith(parentPath, newValue, oldValue);
      expect(mockPartReceiver).toHaveBeenCalledWith(subPath, newValue, oldValue);

      mockReceiver.mockClear();
      parentSpy.mockClear();
      mockPartReceiver.mockClear();
      parentSupply.off();

      parent.update(parentPath, newValue, oldValue);
      expect(mockReceiver).toHaveBeenCalledWith(fullPath, newValue, oldValue);
      expect(parentSpy).not.toHaveBeenCalled();
      expect(mockPartReceiver).toHaveBeenCalledWith(subPath, newValue, oldValue);
    });

    describe('done', () => {
      it('cuts off update supplies', () => {

        const mockOff = jest.fn();
        const reason = 'some reason';

        part.onUpdate(mockPartReceiver).whenOff(mockOff);

        part.done(reason);
        expect(mockOff).toHaveBeenCalledWith(reason);
      });
      it('does not cut off the supplies already cut off', () => {

        const mockOff = jest.fn();
        const reason1 = 'first reason';
        const reason2 = 'second reason';

        part.onUpdate(mockPartReceiver).whenOff(mockOff).off(reason1);

        part.done(reason2);
        expect(mockOff).toHaveBeenCalledWith(reason1);
        expect(mockOff).not.toHaveBeenCalledWith(reason2);
      });
    });
  });
});
