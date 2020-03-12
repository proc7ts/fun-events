import { afterThe } from './after-the';

describe('afterThe', () => {
  it('always sends the same event', () => {

    const event = ['foo', 'bar'];
    const mockReceiver1 = jest.fn();
    const mockReceiver2 = jest.fn();
    const afterEvent = afterThe(...event);

    afterEvent.to(mockReceiver1);
    afterEvent.to(mockReceiver2);

    expect(mockReceiver1).toHaveBeenCalledWith(...event);
    expect(mockReceiver2).toHaveBeenCalledWith(...event);
  });
});
