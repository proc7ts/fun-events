import { EventInterest, EventProducer } from './event-producer';
import { noop } from './noop';
import { StateUpdater } from './state';
import Mock = jest.Mock;
import Mocked = jest.Mocked;

describe('EventProducer', () => {
  describe('never', () => {

    let producer: EventProducer<(value: string) => number>;
    let consumerSpy: Mock<StateUpdater>;
    let interest: EventInterest;

    beforeEach(() => {
      producer = EventProducer.never;
      consumerSpy = jest.fn();
      interest = producer(consumerSpy);
    });

    it('returns no event interest', () => {
      expect(interest).toBe(EventInterest.none);
    });
  });

  describe('once', () => {

    let registerSpy: Mock;
    let producer: EventProducer<(value: string) => string>;
    let interestSpy: Mocked<EventInterest>;
    let registeredConsumer: (event: string) => string;
    let consumerSpy: Mock<StateUpdater>;

    beforeEach(() => {
      interestSpy = {
        off: jest.fn()
      };
      registerSpy = jest.fn((c: (event: string) => string) => {
        registeredConsumer = c;
        return interestSpy;
      });
      producer = EventProducer.of(c => registerSpy(c));
      consumerSpy = jest.fn();
    });

    it('registers event consumer', () => {
      expect(producer.once(consumerSpy)).toBe(interestSpy);
      expect(registerSpy).toHaveBeenCalled();
    });
    it('unregisters notified event consumer', () => {
      consumerSpy.mockReturnValue('result');

      producer.once(consumerSpy);

      expect(interestSpy.off).not.toHaveBeenCalled();

      expect(registeredConsumer('event')).toBe('result');
      expect(consumerSpy).toHaveBeenCalledWith('event');
      expect(interestSpy.off).toHaveBeenCalled();
    });
    it('unregisters immediately notified event consumer', () => {
      consumerSpy.mockReturnValue('result');

      registerSpy = jest.fn((c: (event: string) => string) => {
        registeredConsumer = c;
        c('event');
        return interestSpy;
      });

      producer.once(consumerSpy);

      expect(interestSpy.off).toHaveBeenCalled();
      expect(consumerSpy).toHaveBeenCalledWith('event');
    });
  });
});

describe('EventInterest', () => {
  describe('none', () => {
    it('is no-op', () => {
      expect(EventInterest.none.off).toBe(noop);
    });
  });
});
