import { StatePath } from './state-events';

describe('StatePath', () => {
  describe('of', () => {
    it('normalizes non-compound state value key', () => {
      expect(StatePath.of('key')).toEqual(['key']);
      expect(StatePath.of(0)).toEqual([0]);

      const key = Symbol('key');

      expect(StatePath.of(key)).toEqual([key]);
    });
    it('does not alter normalized value keys', () => {

      const path1 = ['key'];
      const path2 = ['key', 2];

      expect(StatePath.of(path1)).toEqual(path1);
      expect(StatePath.of(path2)).toEqual(path2);
    });
  });
});
