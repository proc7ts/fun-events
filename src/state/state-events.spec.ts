import { statePath } from './state-events';

describe('statePath', () => {
  it('normalizes non-compound state value key', () => {
    expect(statePath('key')).toEqual(['key']);
    expect(statePath(0)).toEqual([0]);

    const key = Symbol('key');

    expect(statePath(key)).toEqual([key]);
  });
  it('does not alter normalized value keys', () => {

    const path1 = ['key'];
    const path2 = ['key', 2];

    expect(statePath(path1)).toEqual(path1);
    expect(statePath(path2)).toEqual(path2);
  });
});
