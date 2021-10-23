import { describe, expect, it, jest } from '@jest/globals';
import { afterThe } from './after-the';

describe('afterThe', () => {
  it('always sends the same event', () => {

    const event = ['foo', 'bar'];
    const mockReceiver1 = jest.fn();
    const mockReceiver2 = jest.fn();
    const afterEvent = afterThe(...event);

    afterEvent(mockReceiver1);
    afterEvent(mockReceiver2);

    expect(mockReceiver1).toHaveBeenCalledWith(...event as [unknown, ...unknown[]]);
    expect(mockReceiver2).toHaveBeenCalledWith(...event as [unknown, ...unknown[]]);
  });
});
