import { EventSource } from './event-source';
import { EventNotifier } from './event-notifier';
import Mock = jest.Mock;

describe('EventNotifier', () => {

  let notifier: EventNotifier<[string], string>;
  let consumerSpy: Mock<(event: string) => string>;

  beforeEach(() => {
    notifier = new EventNotifier();
  });
  beforeEach(() => {
    consumerSpy = jest.fn();
  });

  describe('[EventSource.on]', () => {
    it('registers event consumers using `on()`', () => {

      const spy = jest.spyOn(notifier, 'on');

      notifier[EventSource.on](consumerSpy);
      expect(spy).toHaveBeenCalledWith(consumerSpy);
      expect(spy.mock.instances[0]).toBe(notifier);
    });
  });
});
