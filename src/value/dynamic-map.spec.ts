import { afterEventFrom } from '../after-event';
import { onEventFrom } from '../on-event';
import { dynamicMap, DynamicMap } from './dynamic-map';
import Mock = jest.Mock;

describe('DynamicMap', () => {

  class TestEditor implements DynamicMap.Editor<string, string, { [key: string]: string }> {

    readonly map: { [key: string]: string } = {};

    readonly set = jest.fn((key: string, value?: string) => {

      const replaced = this.map[key];

      if (value != null) {
        this.map[key] = value;
      } else {
        delete this.map[key];
      }

      return replaced;
    });

    readonly snapshot = jest.fn(() => ({ ...this.map }));

  }

  let map: DynamicMap<string, string, { [key: string]: string }>;

  beforeEach(() => {
    map = dynamicMap(new TestEditor());
  });

  let onUpdate: Mock<void, [[string, string][], [string, string][]]>;
  let readSnapshot: Mock<void, [{ [key: string]: string }]>;

  beforeEach(() => {
    map.on(onUpdate = jest.fn());
    map.read(readSnapshot = jest.fn());
    expect(readSnapshot).toHaveBeenCalledWith({});
    readSnapshot.mockClear();
  });

  describe('set', () => {
    it('associates a value with a key', () => {
      map.set('key', 'value');
      expect(onUpdate).toHaveBeenCalledWith([['key', 'value']], []);
      expect(readSnapshot).toHaveBeenCalledWith({ key: 'value' });
    });
    it('replaces associated value', () => {
      map.set('key', 'value');
      onUpdate.mockClear();
      readSnapshot.mockClear();
      map.set('key', 'other');
      expect(onUpdate).toHaveBeenCalledWith([['key', 'other']], [['key', 'value']]);
      expect(readSnapshot).toHaveBeenCalledWith({ key: 'other' });
    });
    it('does nothing with the same value', () => {
      map.set('key', 'value');
      onUpdate.mockClear();
      readSnapshot.mockClear();
      map.set('key', 'value');
      expect(onUpdate).not.toHaveBeenCalled();
      expect(readSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('removes key/value association', () => {
      map.set('key', 'value');
      onUpdate.mockClear();
      readSnapshot.mockClear();
      map.delete('key');
      expect(onUpdate).toHaveBeenCalledWith([], [['key', 'value']]);
      expect(readSnapshot).toHaveBeenCalledWith({});
    });
  });

  describe('from', () => {
    it('associates values with keys', () => {
      map.from([['key', 'value'], ['key2', 'value2']]);
      expect(onUpdate).toHaveBeenCalledWith([['key', 'value'], ['key2', 'value2']], []);
      expect(readSnapshot).toHaveBeenCalledWith({ key: 'value', key2: 'value2' });
    });
    it('replaces associated values', () => {
      map.set('key', 'value');
      onUpdate.mockClear();
      readSnapshot.mockClear();
      map.from([['key', 'other'], ['key2', 'value2']]);
      expect(onUpdate).toHaveBeenCalledWith([['key', 'other'], ['key2', 'value2']], [['key', 'value']]);
      expect(readSnapshot).toHaveBeenCalledWith({ key: 'other', key2: 'value2' });
    });
    it('removes key/value associations', () => {
      map.set('key', 'value');
      onUpdate.mockClear();
      readSnapshot.mockClear();
      map.from([['key', undefined], ['key2', 'value2']]);
      expect(onUpdate).toHaveBeenCalledWith([['key2', 'value2']], [['key', 'value']]);
      expect(readSnapshot).toHaveBeenCalledWith({ key2: 'value2' });
    });
    it('does nothing with the same values', () => {
      map.set('key', 'value');
      onUpdate.mockClear();
      readSnapshot.mockClear();
      map.from([['key', 'value']]);
      expect(onUpdate).not.toHaveBeenCalled();
      expect(readSnapshot).not.toHaveBeenCalled();
    });
    it('does nothing with empty source', () => {
      map.set('key', 'value');
      onUpdate.mockClear();
      readSnapshot.mockClear();
      map.from([]);
      expect(onUpdate).not.toHaveBeenCalled();
      expect(readSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('[OnEvent__symbol]', () => {
    it('is the same as `on`', () => {
      expect(onEventFrom(map)).toBe(map.on);
    });
  });

  describe('[AfterEvent__symbol]', () => {
    it('is the same as `read`', () => {
      expect(afterEventFrom(map)).toBe(map.read);
    });
  });
});

describe('dynamicMap() without editor', () => {

  let map: DynamicMap<string, string>;

  beforeEach(() => {
    map = dynamicMap();
  });

  let onUpdate: Mock<void, [[string, string][], [string, string][]]>;
  let readSnapshot: Mock<void, [DynamicMap.IterableSnapshot<string, string>]>;
  let lastSnapshot: DynamicMap.IterableSnapshot<string, string>;

  beforeEach(() => {
    map.on(onUpdate = jest.fn());
    map.read(readSnapshot = jest.fn(snapshot => {
      lastSnapshot = snapshot;
    }));
    expect([...lastSnapshot]).toHaveLength(0);
    readSnapshot.mockClear();
  });

  describe('set', () => {
    it('associates a value with a key', () => {
      map.set('key', 'value');
      expect(onUpdate).toHaveBeenCalledWith([['key', 'value']], []);
      expect([...lastSnapshot]).toEqual([['key', 'value']]);
      expect(lastSnapshot.get('key')).toBe('value');
    });
    it('replaces associated value', () => {
      map.set('key', 'value');
      onUpdate.mockClear();
      map.set('key', 'other');
      expect(onUpdate).toHaveBeenCalledWith([['key', 'other']], [['key', 'value']]);
      expect([...lastSnapshot]).toEqual([['key', 'other']]);
      expect(lastSnapshot.get('key')).toBe('other');
    });
    it('does nothing with the same value', () => {
      map.set('key', 'value');
      onUpdate.mockClear();
      readSnapshot.mockClear();
      map.set('key', 'value');
      expect(onUpdate).not.toHaveBeenCalled();
      expect(readSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('removes key/value association', () => {
      map.set('key', 'value');
      onUpdate.mockClear();
      map.delete('key');
      expect(onUpdate).toHaveBeenCalledWith([], [['key', 'value']]);
      expect(lastSnapshot.get('key')).toBeUndefined();
    });
  });

});
